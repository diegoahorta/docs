package com.oducreative.reader.data.sources

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.provider.OpenableColumns
import com.oducreative.reader.core.utilities.FileSniffer
import com.oducreative.reader.core.utilities.LanguageDetector
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.readium.r2.shared.publication.services.cover
import java.io.File
import java.io.FileOutputStream
import java.security.DigestInputStream
import java.security.MessageDigest

sealed interface ImportResult {
    data class Success(val book: BookEntity, val alreadyInLibrary: Boolean) : ImportResult
    data class Failure(val fileName: String, val reason: String) : ImportResult
}

/**
 * Importa arquivos selecionados pelo Storage Access Framework ou recebidos de outros apps.
 * O conteúdo é copiado para o armazenamento privado (filesDir/books), o que garante leitura
 * offline e independe de permissões persistentes. O arquivo original nunca é modificado.
 */
class BookImporter(
    private val context: Context,
    private val readium: ReadiumServices,
) {
    private val booksDir = File(context.filesDir, "books").apply { mkdirs() }
    private val coversDir = File(context.filesDir, "covers").apply { mkdirs() }

    data class Prepared(val file: File, val hash: String, val format: BookFormat, val name: String, val size: Long)

    /** Copia e valida o arquivo. Lança [ImportException] com mensagem amigável em caso de erro. */
    suspend fun prepare(uri: Uri): Prepared = withContext(Dispatchers.IO) {
        val (name, declaredSize) = queryNameAndSize(uri)
        if (declaredSize != null && declaredSize > MAX_FILE_BYTES) {
            throw ImportException(name, "Arquivo muito grande (limite de 2 GB).")
        }
        val tmp = File.createTempFile("import_", ".tmp", context.cacheDir)
        val md = MessageDigest.getInstance("SHA-256")
        var copied = 0L
        try {
            val input = context.contentResolver.openInputStream(uri)
                ?: throw ImportException(name, "Não foi possível abrir o arquivo.")
            DigestInputStream(input.buffered(), md).use { din ->
                FileOutputStream(tmp).use { out ->
                    val buf = ByteArray(128 * 1024)
                    while (true) {
                        val n = din.read(buf)
                        if (n < 0) break
                        copied += n
                        if (copied > MAX_FILE_BYTES) throw ImportException(name, "Arquivo muito grande (limite de 2 GB).")
                        out.write(buf, 0, n)
                    }
                }
            }
            if (copied == 0L) throw ImportException(name, "O arquivo está vazio.")
            val format = FileSniffer.sniff(tmp)
                ?: throw ImportException(name, "Formato não suportado ou arquivo corrompido. Use PDF ou EPUB.")
            val hash = md.digest().joinToString("") { "%02x".format(it) }
            val ext = if (format == BookFormat.PDF) "pdf" else "epub"
            val dest = File(booksDir, "$hash.$ext")
            if (!dest.exists()) {
                if (!tmp.renameTo(dest)) {
                    tmp.copyTo(dest, overwrite = true)
                }
            }
            Prepared(dest, hash, format, name, copied)
        } catch (e: ImportException) {
            throw e
        } catch (e: SecurityException) {
            throw ImportException(name, "Sem permissão para ler este arquivo.")
        } catch (e: OutOfMemoryError) {
            throw ImportException(name, "Memória insuficiente para importar o arquivo.")
        } catch (e: Exception) {
            throw ImportException(name, "Falha ao copiar o arquivo: ${e.message ?: e.javaClass.simpleName}")
        } finally {
            if (tmp.exists()) tmp.delete()
        }
    }

    /** Extrai título, autor, idioma, número de páginas e capa. */
    suspend fun buildEntity(p: Prepared): BookEntity = withContext(Dispatchers.IO) {
        val baseTitle = p.name.substringBeforeLast('.').replace('_', ' ').ifBlank { "Sem título" }
        when (p.format) {
            BookFormat.PDF -> {
                val pdf = try {
                    PdfDocumentSource.open(p.file)
                } catch (e: Exception) {
                    p.file.delete()
                    throw ImportException(p.name, e.message ?: "PDF inválido.")
                }
                val coverPath = pdf.use { doc ->
                    doc.renderPage(0, 360)?.let { saveCover(it, p.hash) }
                }
                val pages = pdf.pageCount
                val text = PdfTextSource(p.file)
                val (title, author) = runCatching { text.metadata() }.getOrDefault(null to null)
                val sample = runCatching { text.pageText(0) + " " + text.pageText(1.coerceAtMost(pages - 1)) }.getOrDefault("")
                text.close()
                BookEntity(
                    title = title ?: baseTitle,
                    author = author,
                    format = BookFormat.PDF,
                    filePath = p.file.absolutePath,
                    originalFileName = p.name,
                    coverPath = coverPath,
                    fileSize = p.size,
                    contentHash = p.hash,
                    language = LanguageDetector.detect(sample),
                    totalPages = pages,
                )
            }
            BookFormat.EPUB -> {
                val publication = try {
                    readium.open(p.file)
                } catch (e: Exception) {
                    p.file.delete()
                    throw ImportException(p.name, e.message ?: "EPUB inválido.")
                }
                try {
                    val coverPath = runCatching { publication.cover() }.getOrNull()?.let { saveCover(it, p.hash) }
                    val md = publication.metadata
                    BookEntity(
                        title = md.title?.takeIf { it.isNotBlank() } ?: baseTitle,
                        author = md.authors.joinToString(", ") { it.name }.ifBlank { null },
                        format = BookFormat.EPUB,
                        filePath = p.file.absolutePath,
                        originalFileName = p.name,
                        coverPath = coverPath,
                        fileSize = p.size,
                        contentHash = p.hash,
                        language = md.languages.firstOrNull(),
                        totalPages = publication.readingOrder.size,
                    )
                } finally {
                    publication.close()
                }
            }
        }
    }

    private fun saveCover(bitmap: Bitmap, hash: String): String? = runCatching {
        val maxW = 360
        val scaled = if (bitmap.width > maxW) {
            Bitmap.createScaledBitmap(bitmap, maxW, (bitmap.height * maxW.toFloat() / bitmap.width).toInt().coerceAtLeast(1), true)
        } else bitmap
        val f = File(coversDir, "$hash.jpg")
        FileOutputStream(f).use { scaled.compress(Bitmap.CompressFormat.JPEG, 85, it) }
        f.absolutePath
    }.getOrNull()

    private fun queryNameAndSize(uri: Uri): Pair<String, Long?> {
        var name: String? = null
        var size: Long? = null
        runCatching {
            context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { c ->
                if (c.moveToFirst()) {
                    val ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    val si = c.getColumnIndex(OpenableColumns.SIZE)
                    if (ni >= 0 && !c.isNull(ni)) name = c.getString(ni)
                    if (si >= 0 && !c.isNull(si)) size = c.getLong(si)
                }
            }
        }
        return (name ?: uri.lastPathSegment?.substringAfterLast('/') ?: "documento") to size
    }

    fun deleteFiles(book: BookEntity) {
        runCatching { File(book.filePath).delete() }
        book.coverPath?.let { runCatching { File(it).delete() } }
    }

    fun deleteAllFiles() {
        booksDir.listFiles()?.forEach { it.delete() }
        coversDir.listFiles()?.forEach { it.delete() }
    }

    class ImportException(val fileName: String, message: String) : Exception(message)

    companion object {
        const val MAX_FILE_BYTES = 2L * 1024 * 1024 * 1024
    }
}
