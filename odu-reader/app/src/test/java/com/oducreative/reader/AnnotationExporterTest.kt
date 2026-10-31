package com.oducreative.reader

import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.AnnotationWithBook
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookFormat
import com.oducreative.reader.features.annotations.AnnotationExporter
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream
import java.util.zip.ZipInputStream

class AnnotationExporterTest {
    private val book = BookEntity(id = 1, title = "Dom Casmurro", author = "Machado de Assis", format = BookFormat.PDF,
        filePath = "/x", originalFileName = "x.pdf", fileSize = 1, contentHash = "h")
    private val items = listOf(
        AnnotationWithBook(AnnotationEntity(id = 1, bookId = 1, type = AnnotationType.HIGHLIGHT, locator = "4", page = 4, selectedText = "Uma noite destas"), book),
        AnnotationWithBook(AnnotationEntity(id = 2, bookId = 1, type = AnnotationType.NOTE, locator = "9", page = 9, selectedText = "olhos de ressaca", note = "Metáfora <importante> & central"), book),
    )

    @Test fun markdown() {
        val md = AnnotationExporter.toMarkdown(items)
        assertTrue(md.contains("## Dom Casmurro"))
        assertTrue(md.contains("> Uma noite destas"))
        assertTrue(md.contains("### Nota (p. 10)"))
        assertTrue(md.contains("Metáfora <importante> & central"))
    }

    @Test fun plainText() {
        val txt = AnnotationExporter.toPlainText(items)
        assertTrue(txt.contains("[Destaque] p. 5"))
        assertTrue(txt.contains("Nota: Metáfora"))
    }

    @Test fun docxIsValidZipWithEscapedXml() {
        val bytes = AnnotationExporter.toDocx(items)
        val names = mutableListOf<String>()
        var document = ""
        ZipInputStream(ByteArrayInputStream(bytes)).use { z ->
            while (true) {
                val e = z.nextEntry ?: break
                names += e.name
                if (e.name == "word/document.xml") document = z.readBytes().toString(Charsets.UTF_8)
            }
        }
        assertTrue(names.containsAll(listOf("[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/styles.xml")))
        assertTrue(document.contains("&lt;importante&gt; &amp; central"))
    }
}
