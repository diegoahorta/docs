package com.oducreative.reader

import com.oducreative.reader.data.models.FlashcardEntity
import com.oducreative.reader.data.repositories.ReviewGrade
import com.oducreative.reader.data.repositories.SpacedRepetition
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SpacedRepetitionTest {
    private val now = 1_700_000_000_000L
    private val day = 24L * 60 * 60 * 1000

    @Test fun goodReviewsGrowInterval() {
        var c = FlashcardEntity(front = "a", back = "b")
        c = SpacedRepetition.review(c, ReviewGrade.GOOD, now)
        assertEquals(1, c.intervalDays)
        c = SpacedRepetition.review(c, ReviewGrade.GOOD, now)
        assertEquals(6, c.intervalDays)
        c = SpacedRepetition.review(c, ReviewGrade.GOOD, now)
        assertTrue(c.intervalDays > 6)
        assertEquals(now + c.intervalDays * day, c.dueAt)
    }

    @Test fun againResets() {
        var c = FlashcardEntity(front = "a", back = "b", repetitions = 4, intervalDays = 20)
        c = SpacedRepetition.review(c, ReviewGrade.AGAIN, now)
        assertEquals(0, c.repetitions)
        assertEquals(0, c.intervalDays)
        assertTrue(c.dueAt < now + day)
        assertTrue(c.ease >= 1.3f)
    }
}
