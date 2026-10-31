package com.oducreative.reader.core.utilities

import java.util.Locale

/**
 * Detecção heurística e offline do idioma de um trecho, baseada em sistemas de escrita e
 * palavras funcionais frequentes. Serve para escolher a voz do TTS quando os metadados
 * do documento não informam o idioma. O usuário sempre pode escolher manualmente.
 */
object LanguageDetector {

    val priorityLanguages: List<Pair<String, String>> = listOf(
        "pt-BR" to "Português (Brasil)",
        "en-US" to "Inglês",
        "ja-JP" to "Japonês",
        "ko-KR" to "Coreano",
        "fr-FR" to "Francês",
        "zh-CN" to "Mandarim (chinês simplificado)",
        "es-ES" to "Espanhol",
        "de-DE" to "Alemão",
    )

    private val stopwords = mapOf(
        "pt" to setOf("de", "que", "não", "uma", "para", "com", "os", "as", "do", "da", "em", "é", "você", "mas", "também", "são", "isso", "pelo", "nós"),
        "en" to setOf("the", "and", "of", "to", "is", "in", "that", "it", "you", "with", "for", "was", "are", "this", "have", "be", "not", "they"),
        "es" to setOf("el", "la", "de", "que", "y", "en", "los", "las", "es", "por", "una", "con", "para", "del", "pero", "como", "muy", "está"),
        "fr" to setOf("le", "la", "les", "de", "et", "est", "un", "une", "des", "que", "dans", "pour", "pas", "qui", "sur", "avec", "vous", "nous", "ce"),
        "de" to setOf("der", "die", "das", "und", "ist", "nicht", "ein", "eine", "zu", "den", "mit", "von", "sie", "ich", "auf", "auch", "es", "sich", "dem"),
    )

    /** Retorna uma tag BCP-47 (ex.: "ja", "pt") ou null se não houver texto suficiente. */
    fun detect(text: String): String? {
        val sample = text.take(4000)
        if (sample.isBlank()) return null
        var kana = 0; var hangul = 0; var han = 0; var latin = 0
        for (ch in sample) {
            val block = Character.UnicodeBlock.of(ch)
            when (block) {
                Character.UnicodeBlock.HIRAGANA, Character.UnicodeBlock.KATAKANA,
                Character.UnicodeBlock.KATAKANA_PHONETIC_EXTENSIONS -> kana++
                Character.UnicodeBlock.HANGUL_SYLLABLES, Character.UnicodeBlock.HANGUL_JAMO,
                Character.UnicodeBlock.HANGUL_COMPATIBILITY_JAMO -> hangul++
                Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS,
                Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A -> han++
                else -> if (ch.isLetter()) latin++
            }
        }
        val cjk = kana + hangul + han
        if (cjk > latin / 2 && cjk > 5) {
            return when {
                kana > 0 && kana * 10 >= cjk -> "ja"
                hangul >= han -> "ko"
                else -> "zh"
            }
        }
        val words = sample.lowercase(Locale.ROOT).split(Regex("[^\\p{L}]+")).filter { it.isNotEmpty() }
        if (words.size < 3) return null
        val scores = stopwords.mapValues { (_, set) -> words.count { it in set } }
        val best = scores.maxByOrNull { it.value } ?: return null
        if (best.value == 0) return null
        // Desempate pt/es por caracteres típicos
        if (best.key == "es" || best.key == "pt") {
            val pt = sample.count { it in "ãõçê" } + words.count { it == "não" || it == "você" } * 3
            val es = sample.count { it in "ñ¿¡" } + words.count { it == "y" || it == "el" } * 2
            return if (pt >= es && scores["pt"]!! > 0) "pt" else if (es > pt) "es" else best.key
        }
        return best.key
    }

    fun toLocale(tag: String?): Locale? = tag?.takeIf { it.isNotBlank() }?.let { Locale.forLanguageTag(it) }

    fun displayName(tag: String): String =
        priorityLanguages.firstOrNull { it.first.equals(tag, true) || it.first.substringBefore('-').equals(tag, true) }?.second
            ?: Locale.forLanguageTag(tag).getDisplayName(Locale.forLanguageTag("pt-BR")).ifBlank { tag }
}
