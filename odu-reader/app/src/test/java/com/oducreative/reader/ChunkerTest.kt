package com.oducreative.reader

import com.oducreative.reader.features.studytools.Chunker
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ChunkerTest {
    @Test fun manualSeparatorsAreRespected() {
        assertEquals(listOf("I want", "to go", "home"), Chunker.chunk("I want / to go / home"))
    }

    @Test fun englishSplitsBeforeConnectors() {
        val chunks = Chunker.chunk("She went to the market because she needed some fresh bread", "en")
        assertTrue(chunks.size >= 3)
        assertTrue(chunks.any { it.startsWith("because") })
        assertEquals("She went to the market because she needed some fresh bread", chunks.joinToString(" "))
    }

    @Test fun portugueseKeepsAllWords() {
        val s = "Eu gosto de ler livros quando chove no fim de semana"
        val chunks = Chunker.chunk(s, "pt")
        assertEquals(s, chunks.joinToString(" "))
        assertTrue(chunks.size > 1)
    }

    @Test fun japaneseSplitsAfterParticles() {
        val chunks = Chunker.chunk("私は毎日図書館で本を読みます。", "ja")
        assertEquals("私は", chunks.first())
        assertTrue(chunks.contains("毎日図書館で"))
        assertTrue(chunks.contains("本を"))
        assertEquals("私は毎日図書館で本を読みます。", chunks.joinToString(""))
    }

    @Test fun emptyInput() {
        assertTrue(Chunker.chunk("   ").isEmpty())
    }
}
