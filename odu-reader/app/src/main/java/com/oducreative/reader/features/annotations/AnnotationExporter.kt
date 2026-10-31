package com.oducreative.reader.features.annotations

import com.oducreative.reader.core.utilities.Formatters
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.AnnotationWithBook
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

enum class ExportFormat(val extension: String, val mime: String, val label: String) {
    MARKDOWN("md", "text/markdown", "Markdown (.md)"),
    TXT("txt", "text/plain", "Texto (.txt)"),
    DOCX("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word (.docx)"),
}

/** Exporta anotações agrupadas por livro. Funções puras, testáveis sem Android. */
object AnnotationExporter {

    private data class Group(val title: String, val author: String?, val items: List<AnnotationWithBook>)

    private fun groups(items: List<AnnotationWithBook>): List<Group> =
        items.groupBy { it.annotation.bookId }.map { (_, list) ->
            val b = list.first().book
            Group(b?.displayTitle ?: "Livro removido", b?.author, list)
        }

    private fun position(a: AnnotationWithBook): String = buildString {
        a.annotation.page?.let { append("p. ${it + 1}") }
        a.annotation.chapter?.takeIf { it.isNotBlank() }?.let { if (isNotEmpty()) append(" · "); append(it) }
    }

    fun toMarkdown(items: List<AnnotationWithBook>, now: Long = System.currentTimeMillis()): String = buildString {
        appendLine("# Anotações — ODU Reader")
        appendLine()
        appendLine("_Exportado em ${Formatters.dateTime(now)}_")
        for (g in groups(items)) {
            appendLine()
            appendLine("## ${g.title}")
            g.author?.let { appendLine("*$it*") }
            for (a in g.items) {
                val an = a.annotation
                appendLine()
                val kind = if (an.type == AnnotationType.HIGHLIGHT) "Destaque" else "Nota"
                val pos = position(a)
                appendLine("### $kind${if (pos.isNotEmpty()) " ($pos)" else ""}")
                if (an.selectedText.isNotBlank()) {
                    an.selectedText.lines().forEach { appendLine("> $it") }
                    if (an.fromOcr) appendLine("> _(texto reconhecido por OCR)_")
                }
                if (an.note.isNotBlank()) {
                    appendLine()
                    appendLine(an.note)
                }
            }
        }
    }

    fun toPlainText(items: List<AnnotationWithBook>, now: Long = System.currentTimeMillis()): String = buildString {
        appendLine("ANOTAÇÕES — ODU READER")
        appendLine("Exportado em ${Formatters.dateTime(now)}")
        for (g in groups(items)) {
            appendLine()
            appendLine("=".repeat(40))
            appendLine(g.title + (g.author?.let { " — $it" } ?: ""))
            appendLine("=".repeat(40))
            for (a in g.items) {
                val an = a.annotation
                appendLine()
                val pos = position(a)
                appendLine((if (an.type == AnnotationType.HIGHLIGHT) "[Destaque]" else "[Nota]") + if (pos.isNotEmpty()) " $pos" else "")
                if (an.selectedText.isNotBlank()) appendLine("\"${an.selectedText}\"" + if (an.fromOcr) " (OCR)" else "")
                if (an.note.isNotBlank()) appendLine("Nota: ${an.note}")
            }
        }
    }

    /** Gera um .docx mínimo e válido (Office Open XML) sem dependências externas. */
    fun toDocx(items: List<AnnotationWithBook>, now: Long = System.currentTimeMillis()): ByteArray {
        val body = StringBuilder()
        fun p(text: String, style: String? = null, italic: Boolean = false) {
            body.append("<w:p>")
            if (style != null) body.append("<w:pPr><w:pStyle w:val=\"$style\"/></w:pPr>")
            text.lines().forEachIndexed { i, line ->
                body.append("<w:r>")
                if (italic) body.append("<w:rPr><w:i/></w:rPr>")
                if (i > 0) body.append("<w:br/>")
                body.append("<w:t xml:space=\"preserve\">").append(xml(line)).append("</w:t></w:r>")
            }
            body.append("</w:p>")
        }
        p("Anotações — ODU Reader", "Title")
        p("Exportado em ${Formatters.dateTime(now)}", italic = true)
        for (g in groups(items)) {
            p(g.title, "Heading1")
            g.author?.let { p(it, italic = true) }
            for (a in g.items) {
                val an = a.annotation
                val pos = position(a)
                p((if (an.type == AnnotationType.HIGHLIGHT) "Destaque" else "Nota") + if (pos.isNotEmpty()) " ($pos)" else "", "Heading2")
                if (an.selectedText.isNotBlank()) p("“${an.selectedText}”" + if (an.fromOcr) " (OCR)" else "", "Quote", italic = true)
                if (an.note.isNotBlank()) p(an.note)
            }
        }
        val document = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>$body<w:sectPr/></w:body></w:document>"""
        val styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="360"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="567"/></w:pPr><w:rPr><w:i/><w:color w:val="555555"/></w:rPr></w:style>
</w:styles>"""
        val contentTypes = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>"""
        val rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>"""
        val docRels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>"""
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { zip ->
            fun put(name: String, content: String) {
                zip.putNextEntry(ZipEntry(name)); zip.write(content.toByteArray(Charsets.UTF_8)); zip.closeEntry()
            }
            put("[Content_Types].xml", contentTypes)
            put("_rels/.rels", rels)
            put("word/document.xml", document)
            put("word/_rels/document.xml.rels", docRels)
            put("word/styles.xml", styles)
        }
        return out.toByteArray()
    }

    fun export(items: List<AnnotationWithBook>, format: ExportFormat): ByteArray = when (format) {
        ExportFormat.MARKDOWN -> toMarkdown(items).toByteArray(Charsets.UTF_8)
        ExportFormat.TXT -> toPlainText(items).toByteArray(Charsets.UTF_8)
        ExportFormat.DOCX -> toDocx(items)
    }

    private fun xml(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")
        .filter { it == '\t' || it == '\n' || it == '\r' || it.code >= 0x20 }
}
