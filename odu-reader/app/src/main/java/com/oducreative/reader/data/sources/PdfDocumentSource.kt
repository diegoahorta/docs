package com.oducreative.reader.data.sources

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.util.LruCache
import android.util.Size
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.Closeable
import java.io.File

/**
 * Renderização de PDF sob demanda com android.graphics.pdf.PdfRenderer.
 * - Apenas uma página aberta por vez (exigência do PdfRenderer) — protegido por Mutex.
 * - Cache LRU limitado em bytes para bitmaps renderizados.
 * - Toda renderização ocorre fora da thread principal.
 */
class PdfDocumentSource private constructor(
    private val fd: ParcelFileDescriptor,
    private val renderer: PdfRenderer,
    val pageSizes: List<Size>,
) : Closeable {

    val pageCount: Int get() = pageSizes.size
    private val mutex = Mutex()
    @Volatile private var closed = false

    private val cache = object : LruCache<String, Bitmap>(cacheBytes()) {
        override fun sizeOf(key: String, value: Bitmap): Int = value.allocationByteCount
    }

    /** Renderiza a página [index] com largura [targetWidth] px (altura proporcional). */
    suspend fun renderPage(index: Int, targetWidth: Int): Bitmap? = withContext(Dispatchers.IO) {
        if (closed || index !in pageSizes.indices || targetWidth <= 0) return@withContext null
        val width = targetWidth.coerceAtMost(MAX_BITMAP_WIDTH)
        val key = "$index@$width"
        cache.get(key)?.let { return@withContext it }
        mutex.withLock {
            if (closed) return@withLock null
            cache.get(key)?.let { return@withLock it }
            runCatching {
                renderer.openPage(index).use { page ->
                    val height = (width.toFloat() * page.height / page.width).toInt().coerceAtLeast(1)
                    val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    bmp.eraseColor(Color.WHITE)
                    page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    cache.put(key, bmp)
                    bmp
                }
            }.getOrNull()
        }
    }

    fun trimCache() = cache.evictAll()

    override fun close() {
        closed = true
        // Aguarda a renderização em andamento terminar antes de liberar recursos nativos.
        kotlinx.coroutines.runBlocking {
            mutex.withLock {
                runCatching { renderer.close() }
                runCatching { fd.close() }
            }
        }
        cache.evictAll()
    }

    companion object {
        private const val MAX_BITMAP_WIDTH = 2400

        private fun cacheBytes(): Int {
            val max = Runtime.getRuntime().maxMemory()
            return (max / 6).coerceAtMost(96L * 1024 * 1024).toInt()
        }

        class PdfOpenException(message: String, cause: Throwable? = null) : Exception(message, cause)

        suspend fun open(file: File): PdfDocumentSource = withContext(Dispatchers.IO) {
            val fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
            val renderer = try {
                PdfRenderer(fd)
            } catch (e: SecurityException) {
                fd.close()
                throw PdfOpenException("Este PDF é protegido por senha e não pode ser aberto.", e)
            } catch (e: Exception) {
                fd.close()
                throw PdfOpenException("PDF inválido ou corrompido.", e)
            }
            val sizes = ArrayList<Size>(renderer.pageCount)
            try {
                for (i in 0 until renderer.pageCount) {
                    renderer.openPage(i).use { sizes += Size(it.width, it.height) }
                }
            } catch (e: Exception) {
                renderer.close(); fd.close()
                throw PdfOpenException("Falha ao ler as páginas do PDF.", e)
            }
            if (sizes.isEmpty()) {
                renderer.close(); fd.close()
                throw PdfOpenException("O PDF não contém páginas.")
            }
            PdfDocumentSource(fd, renderer, sizes)
        }
    }
}
