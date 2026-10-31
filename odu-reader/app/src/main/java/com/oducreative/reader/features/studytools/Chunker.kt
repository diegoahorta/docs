package com.oducreative.reader.features.studytools

import com.oducreative.reader.core.utilities.LanguageDetector
import java.util.Locale

/**
 * Chunking: divide frases em blocos linguísticos (sintagmas aproximados) para facilitar a
 * compreensão e a memorização. Regras heurísticas e 100% offline; o estudante pode ajustar os
 * blocos manualmente usando "/" como separador.
 */
object Chunker {

    private val breakBefore = mapOf(
        "en" to setOf("and", "but", "or", "because", "that", "which", "who", "when", "while", "if", "although", "to", "in", "on", "at", "with", "for", "from", "of", "about", "into", "after", "before", "so"),
        "pt" to setOf("e", "mas", "ou", "porque", "que", "quando", "enquanto", "se", "embora", "para", "em", "no", "na", "nos", "nas", "com", "por", "pelo", "pela", "de", "do", "da", "sobre", "depois", "antes"),
        "es" to setOf("y", "pero", "o", "porque", "que", "cuando", "mientras", "si", "aunque", "para", "en", "con", "por", "de", "del", "sobre", "después", "antes"),
        "fr" to setOf("et", "mais", "ou", "parce", "que", "qui", "quand", "pendant", "si", "bien", "pour", "dans", "avec", "par", "de", "du", "des", "sur", "après", "avant"),
        "de" to setOf("und", "aber", "oder", "weil", "dass", "wenn", "während", "obwohl", "um", "in", "im", "mit", "für", "von", "vom", "zu", "zum", "zur", "auf", "nach", "vor"),
    )

    private val japaneseParticles = listOf("から", "まで", "より", "には", "では", "とは", "は", "が", "を", "に", "で", "へ", "と", "も", "の")

    fun chunk(sentence: String, languageTag: String? = null): List<String> {
        val text = sentence.trim()
        if (text.isEmpty()) return emptyList()
        if (text.contains('/')) return text.split('/').map { it.trim() }.filter { it.isNotEmpty() }
        val lang = (languageTag?.substringBefore('-') ?: LanguageDetector.detect(text) ?: "en").lowercase(Locale.ROOT)
        return when (lang) {
            "ja" -> chunkJapanese(text)
            "zh" -> text.split(Regex("(?<=[，。；：！？、])")).map { it.trim() }.filter { it.isNotEmpty() }
            "ko" -> chunkBySpaces(text, maxWords = 2)
            else -> chunkWestern(text, breakBefore[lang] ?: breakBefore.getValue("en"))
        }
    }

    private fun chunkWestern(text: String, starters: Set<String>): List<String> {
        val tokens = text.split(Regex("\\s+")).filter { it.isNotEmpty() }
        val chunks = mutableListOf<MutableList<String>>()
        var currentChunk = mutableListOf<String>()
        for (tok in tokens) {
            val bare = tok.lowercase(Locale.ROOT).trim { !it.isLetter() }
            if (currentChunk.size >= 2 && bare in starters) {
                chunks += currentChunk; currentChunk = mutableListOf()
            }
            currentChunk += tok
            if (tok.last() in ",;:—" || currentChunk.size >= 6) {
                chunks += currentChunk; currentChunk = mutableListOf()
            }
        }
        if (currentChunk.isNotEmpty()) chunks += currentChunk
        // Une blocos de uma palavra ao seguinte para evitar fragmentação excessiva
        val merged = mutableListOf<String>()
        var carry = ""
        for (c in chunks) {
            val s = (if (carry.isNotEmpty()) "$carry " else "") + c.joinToString(" ")
            if (c.size == 1 && carry.isEmpty() && c !== chunks.last()) carry = s else { merged += s; carry = "" }
        }
        if (carry.isNotEmpty()) merged += carry
        return merged
    }

    private fun chunkJapanese(text: String): List<String> {
        val out = mutableListOf<String>()
        val sb = StringBuilder()
        var i = 0
        while (i < text.length) {
            val particle = japaneseParticles.firstOrNull { text.startsWith(it, i) }
            if (particle != null && sb.isNotEmpty()) {
                sb.append(particle); i += particle.length
                out += sb.toString(); sb.clear()
                continue
            }
            val ch = text[i]
            sb.append(ch)
            if (ch in "、。！？") { out += sb.toString(); sb.clear() }
            i++
        }
        if (sb.isNotEmpty()) out += sb.toString()
        return out.map { it.trim() }.filter { it.isNotEmpty() }
    }

    private fun chunkBySpaces(text: String, maxWords: Int): List<String> =
        text.split(Regex("\\s+")).filter { it.isNotEmpty() }.chunked(maxWords) { it.joinToString(" ") }
}
