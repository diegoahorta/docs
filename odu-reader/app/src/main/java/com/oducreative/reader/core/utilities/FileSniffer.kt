package com.oducreative.reader.core.utilities

import com.oducreative.reader.data.models.BookFormat
import java.io.File
import java.util.zip.ZipFile

/**
 * Identifica o formato real do arquivo pelos bytes iniciais (não confia na extensão nem no MIME
 * informado por outros apps). Protege contra arquivos desconhecidos ou corrompidos.
 */
object FileSniffer {

    fun sniffHeader(header: ByteArray): BookFormat? {
        if (header.size >= 5 && header.copyOfRange(0, 5).contentEquals("%PDF-".toByteArray())) return BookFormat.PDF
        // PDFs às vezes têm lixo antes do cabeçalho (até 1024 bytes é tolerado pela especificação)
        val text = String(header, Charsets.ISO_8859_1)
        if (text.indexOf("%PDF-").let { it in 0..1024 }) return BookFormat.PDF
        if (header.size >= 4 && header[0] == 'P'.code.toByte() && header[1] == 'K'.code.toByte() &&
            header[2] == 3.toByte() && header[3] == 4.toByte()
        ) return BookFormat.EPUB // confirmado por [isValidEpub]
        return null
    }

    fun sniff(file: File): BookFormat? {
        val header = ByteArray(1100)
        val read = file.inputStream().use { it.read(header) }
        if (read <= 0) return null
        return when (sniffHeader(header.copyOf(read))) {
            BookFormat.PDF -> BookFormat.PDF
            BookFormat.EPUB -> if (isValidEpub(file)) BookFormat.EPUB else null
            null -> null
        }
    }

    /** Um EPUB é um ZIP com META-INF/container.xml (mimetype é recomendado, mas nem sempre presente). */
    fun isValidEpub(file: File): Boolean = runCatching {
        ZipFile(file).use { zip ->
            zip.getEntry("META-INF/container.xml") != null
        }
    }.getOrDefault(false)
}
