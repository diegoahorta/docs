package com.oducreative.reader.data.repositories

import com.oducreative.reader.core.database.SessionDao
import com.oducreative.reader.data.models.DailyReading
import com.oducreative.reader.data.models.ReadingSessionEntity
import kotlinx.coroutines.flow.Flow
import java.util.Calendar

class ReadingStatsRepository(private val dao: SessionDao) {
    suspend fun record(session: ReadingSessionEntity) {
        if (session.activeMillis >= MIN_SESSION_MILLIS) dao.insert(session)
    }

    val recentSessions: Flow<List<ReadingSessionEntity>> = dao.observeRecent()
    val totalTime: Flow<Long> = dao.observeTotal()
    fun totalSince(since: Long): Flow<Long> = dao.observeTotalSince(since)
    fun totalForBook(bookId: Long): Flow<Long> = dao.observeTotalForBook(bookId)
    fun daily(since: Long): Flow<List<DailyReading>> = dao.observeDaily(since)
    suspend fun deleteAll() = dao.deleteAll()

    companion object {
        /** Sessões menores que isso (aberturas acidentais) não são registradas. */
        const val MIN_SESSION_MILLIS = 15_000L

        fun startOfToday(now: Long = System.currentTimeMillis()): Long = Calendar.getInstance().apply {
            timeInMillis = now
            set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
        }.timeInMillis

        fun startOfWeek(now: Long = System.currentTimeMillis()): Long = Calendar.getInstance().apply {
            timeInMillis = startOfToday(now)
            set(Calendar.DAY_OF_WEEK, firstDayOfWeek)
            if (timeInMillis > now) add(Calendar.WEEK_OF_YEAR, -1)
        }.timeInMillis

        fun daysAgo(days: Int, now: Long = System.currentTimeMillis()): Long =
            startOfToday(now) - days * 24L * 60 * 60 * 1000
    }
}
