package com.oducreative.reader.core.utilities

import java.io.File
import java.io.InputStream
import java.security.MessageDigest
import java.text.DateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

object Formatters {
    fun percent(p: Float): String = "${(p.coerceIn(0f, 1f) * 100).roundToInt()}%"

    fun duration(millis: Long): String {
        val totalMin = millis / 60_000
        val h = totalMin / 60
        val m = totalMin % 60
        return when {
            h > 0 -> "${h}h ${m}min"
            totalMin > 0 -> "${m} min"
            millis > 0 -> "< 1 min"
            else -> "0 min"
        }
    }

    fun date(millis: Long): String =
        DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.getDefault()).format(Date(millis))

    fun dateTime(millis: Long): String =
        DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT, Locale.getDefault()).format(Date(millis))

    fun fileSize(bytes: Long): String = when {
        bytes >= 1L shl 30 -> String.format(Locale.getDefault(), "%.1f GB", bytes / (1L shl 30).toDouble())
        bytes >= 1L shl 20 -> String.format(Locale.getDefault(), "%.1f MB", bytes / (1L shl 20).toDouble())
        bytes >= 1L shl 10 -> String.format(Locale.getDefault(), "%.0f KB", bytes / (1L shl 10).toDouble())
        else -> "$bytes B"
    }
}

object Hashing {
    fun sha256(file: File): String = file.inputStream().use { sha256(it) }

    fun sha256(input: InputStream): String {
        val md = MessageDigest.getInstance("SHA-256")
        val buf = ByteArray(64 * 1024)
        while (true) {
            val n = input.read(buf)
            if (n < 0) break
            md.update(buf, 0, n)
        }
        return md.digest().joinToString("") { "%02x".format(it) }
    }
}

/** Divide um texto longo em sentenças/trechos adequados ao TTS e à leitura. */
object TextSegmenter {
    private val sentenceEnd = Regex("(?<=[.!?。！？…])\\s+|(?<=[。！？])")

    fun sentences(text: String, maxLen: Int = 400): List<String> {
        val normalized = text.replace(Regex("[ \\t\\x0B\\f\\r]+"), " ")
            .replace(Regex("-\\n(?=\\p{Ll})"), "") // hifenização de fim de linha em PDFs
            .replace(Regex("(?<![.!?:。！？])\\n(?!\\n)"), " ")
            .trim()
        if (normalized.isEmpty()) return emptyList()
        val out = mutableListOf<String>()
        for (paragraph in normalized.split(Regex("\\n{1,}"))) {
            for (s in paragraph.split(sentenceEnd)) {
                val t = s.trim()
                if (t.isEmpty()) continue
                if (t.length <= maxLen) out += t
                else t.chunked(maxLen).forEach { out += it }
            }
        }
        return out
    }
}
