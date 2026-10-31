package com.oducreative.reader

import com.oducreative.reader.core.utilities.TextSegmenter
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookFormat
import com.oducreative.reader.data.models.DailyReading
import com.oducreative.reader.data.models.ReadingSessionEntity
import com.oducreative.reader.features.dashboard.DashboardMath
import com.oducreative.reader.features.studytools.DictionaryService
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.Locale

class MiscLogicTest {
    @Test fun segmenterSplitsSentencesAndFixesHyphenation() {
        val s = TextSegmenter.sentences("Primeira frase. Segunda fra-\nse aqui! Terceira?\n\nNovo parágrafo")
        assertEquals(listOf("Primeira frase.", "Segunda frase aqui!", "Terceira?", "Novo parágrafo"), s)
    }

    @Test fun segmenterHandlesCjk() {
        val s = TextSegmenter.sentences("今日は晴れです。明日は雨です。")
        assertEquals(2, s.size)
    }

    @Test fun dashboardFillsDaysAndStreak() {
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val now = System.currentTimeMillis()
        val day = 24L * 3600 * 1000
        val daily = listOf(
            DailyReading(fmt.format(now), 5 * 60_000L),
            DailyReading(fmt.format(now - day), 10 * 60_000L),
            DailyReading(fmt.format(now - 3 * day), 10 * 60_000L),
        )
        val days = DashboardMath.fillDays(daily, 7, now)
        assertEquals(7, days.size)
        assertEquals(5 * 60_000L, days.last().second)
        assertEquals(2, DashboardMath.streak(days))
    }

    @Test fun remainingEstimate() {
        val book = BookEntity(id = 7, title = "t", format = BookFormat.EPUB, filePath = "", originalFileName = "", fileSize = 0, contentHash = "c", progress = 0.5f)
        val sessions = listOf(ReadingSessionEntity(bookId = 7, startedAt = 0, endedAt = 0, activeMillis = 600_000, startProgress = 0.4f, endProgress = 0.5f))
        val r = DashboardMath.remaining(book, sessions)
        assertNotNull(r)
        assertTrue(r!! in 2_900_000L..3_100_000L) // ~50 min
    }

    @Test fun parsesWiktionary() {
        val json = """{"en":[{"partOfSpeech":"Noun","language":"English","definitions":[{"definition":"A <b>written</b> work &amp; text."}]}]}"""
        val entries = DictionaryService.parseWiktionary(json)
        assertEquals(1, entries.size)
        assertEquals("A written work & text.", entries[0].definitions[0])
    }
}
