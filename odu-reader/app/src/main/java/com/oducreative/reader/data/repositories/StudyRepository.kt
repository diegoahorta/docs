package com.oducreative.reader.data.repositories

import com.oducreative.reader.core.database.StudyDao
import com.oducreative.reader.data.models.FlashcardEntity
import com.oducreative.reader.data.models.GrammarPatternEntity
import kotlinx.coroutines.flow.Flow
import kotlin.math.max
import kotlin.math.roundToInt

enum class ReviewGrade { AGAIN, HARD, GOOD, EASY }

/** Repetição espaçada baseada no SM-2 (simplificado), testável sem Android. */
object SpacedRepetition {
    private const val DAY = 24L * 60 * 60 * 1000

    fun review(card: FlashcardEntity, grade: ReviewGrade, now: Long = System.currentTimeMillis()): FlashcardEntity {
        val q = when (grade) { ReviewGrade.AGAIN -> 1; ReviewGrade.HARD -> 3; ReviewGrade.GOOD -> 4; ReviewGrade.EASY -> 5 }
        var ease = card.ease + (0.1f - (5 - q) * (0.08f + (5 - q) * 0.02f))
        ease = max(1.3f, ease)
        val (reps, interval) = if (q < 3) {
            0 to 0
        } else {
            val r = card.repetitions + 1
            val i = when (r) {
                1 -> if (grade == ReviewGrade.EASY) 3 else 1
                2 -> if (grade == ReviewGrade.HARD) 3 else 6
                else -> (card.intervalDays * ease * if (grade == ReviewGrade.HARD) 0.8f else 1f).roundToInt().coerceAtLeast(card.intervalDays + 1)
            }
            r to i
        }
        val due = if (interval == 0) now + 10 * 60 * 1000 else now + interval * DAY
        return card.copy(ease = ease, repetitions = reps, intervalDays = interval, dueAt = due)
    }
}

class StudyRepository(private val dao: StudyDao) {
    val flashcards: Flow<List<FlashcardEntity>> = dao.observeFlashcards()
    fun due(now: Long = System.currentTimeMillis()): Flow<List<FlashcardEntity>> = dao.observeDue(now)
    fun dueCount(now: Long = System.currentTimeMillis()): Flow<Int> = dao.observeDueCount(now)
    suspend fun addFlashcard(f: FlashcardEntity) = dao.insertFlashcard(f)
    suspend fun updateFlashcard(f: FlashcardEntity) = dao.updateFlashcard(f)
    suspend fun deleteFlashcard(id: Long) = dao.deleteFlashcard(id)
    suspend fun review(card: FlashcardEntity, grade: ReviewGrade) = dao.updateFlashcard(SpacedRepetition.review(card, grade))

    val patterns: Flow<List<GrammarPatternEntity>> = dao.observePatterns()
    suspend fun addPattern(p: GrammarPatternEntity) = dao.insertPattern(p)
    suspend fun updatePattern(p: GrammarPatternEntity) = dao.updatePattern(p.copy(updatedAt = System.currentTimeMillis()))
    suspend fun deletePattern(id: Long) = dao.deletePattern(id)

    suspend fun deleteAll() {
        dao.deleteAllFlashcards()
        dao.deleteAllPatterns()
    }
}
