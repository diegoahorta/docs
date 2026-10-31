package com.oducreative.reader

import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import java.io.File
import java.util.zip.CRC32
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/** Gera arquivos PDF e EPUB reais para os testes instrumentados. */
object TestFixtures {

    fun createPdf(dir: File, pages: Int = 3, name: String = "amostra.pdf"): File {
        val file = File(dir, name)
        val doc = PdfDocument()
        val paint = Paint().apply { color = Color.BLACK; textSize = 18f }
        for (i in 0 until pages) {
            val page = doc.startPage(PdfDocument.PageInfo.Builder(595, 842, i + 1).create())
            page.canvas.drawText("ODU Reader pagina ${i + 1}. The quick brown fox jumps over the lazy dog.", 40f, 80f, paint)
            doc.finishPage(page)
        }
        file.outputStream().use { doc.writeTo(it) }
        doc.close()
        return file
    }

    fun createEpub(dir: File, name: String = "amostra.epub", title: String = "Livro de Teste ODU"): File {
        val file = File(dir, name)
        ZipOutputStream(file.outputStream()).use { zip ->
            // mimetype deve ser a primeira entrada, sem compressão
            val mime = "application/epub+zip".toByteArray()
            val entry = ZipEntry("mimetype").apply {
                method = ZipEntry.STORED; size = mime.size.toLong(); compressedSize = mime.size.toLong()
                crc = CRC32().apply { update(mime) }.value
            }
            zip.putNextEntry(entry); zip.write(mime); zip.closeEntry()
            fun put(path: String, content: String) {
                zip.putNextEntry(ZipEntry(path)); zip.write(content.toByteArray()); zip.closeEntry()
            }
            put(
                "META-INF/container.xml",
                """<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>"""
            )
            put(
                "OEBPS/content.opf",
                """<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:odu-test-0001</dc:identifier>
    <dc:title>$title</dc:title>
    <dc:creator>ODU Creative</dc:creator>
    <dc:language>pt-BR</dc:language>
    <meta property="dcterms:modified">2024-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>
    <item id="c2" href="c2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="c1"/><itemref idref="c2"/></spine>
</package>"""
            )
            put(
                "OEBPS/nav.xhtml",
                """<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Sumário</title></head><body><nav epub:type="toc"><ol><li><a href="c1.xhtml">Capítulo 1</a></li><li><a href="c2.xhtml">Capítulo 2</a></li></ol></nav></body></html>"""
            )
            put("OEBPS/c1.xhtml", chapter("Capítulo 1", "Era uma vez um leitor curioso que adorava aprender idiomas."))
            put("OEBPS/c2.xhtml", chapter("Capítulo 2", "日本語の文章もあります。The end."))
        }
        return file
    }

    private fun chapter(h: String, p: String) =
        """<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>$h</title></head><body><h1>$h</h1><p>$p</p></body></html>"""
}
