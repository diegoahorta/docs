package com.oducreative.reader.core.database

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.AnnotationWithBook
import com.oducreative.reader.data.models.BookCollectionCrossRef
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookmarkEntity
import com.oducreative.reader.data.models.BookmarkWithBook
import com.oducreative.reader.data.models.CollectionEntity
import com.oducreative.reader.data.models.CollectionWithBooks
import com.oducreative.reader.data.models.DailyReading
import com.oducreative.reader.data.models.FlashcardEntity
import com.oducreative.reader.data.models.GrammarPatternEntity
import com.oducreative.reader.data.models.ReadingSessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BookDao {
    @Query("SELECT * FROM books ORDER BY COALESCE(lastOpenedAt, addedAt) DESC")
    fun observeAll(): Flow<List<BookEntity>>

    @Query("SELECT * FROM books WHERE id = :id")
    fun observe(id: Long): Flow<BookEntity?>

    @Query("SELECT * FROM books WHERE id = :id")
    suspend fun get(id: Long): BookEntity?

    @Query("SELECT * FROM books WHERE contentHash = :hash LIMIT 1")
    suspend fun findByHash(hash: String): BookEntity?

    @Query("SELECT * FROM books")
    suspend fun getAll(): List<BookEntity>

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(book: BookEntity): Long

    @Update
    suspend fun update(book: BookEntity)

    @Query("UPDATE books SET position = :position, progress = :progress, lastOpenedAt = :now, isCompleted = CASE WHEN :progress >= 0.995 THEN 1 ELSE isCompleted END, completedAt = CASE WHEN :progress >= 0.995 AND completedAt IS NULL THEN :now ELSE completedAt END WHERE id = :id")
    suspend fun updatePosition(id: Long, position: String, progress: Float, now: Long = System.currentTimeMillis())

    @Query("UPDATE books SET lastOpenedAt = :now WHERE id = :id")
    suspend fun touch(id: Long, now: Long = System.currentTimeMillis())

    @Query("UPDATE books SET isFavorite = :fav WHERE id = :id")
    suspend fun setFavorite(id: Long, fav: Boolean)

    @Query("UPDATE books SET isCompleted = :done, completedAt = CASE WHEN :done THEN :now ELSE NULL END WHERE id = :id")
    suspend fun setCompleted(id: Long, done: Boolean, now: Long = System.currentTimeMillis())

    @Query("UPDATE books SET customTitle = :title WHERE id = :id")
    suspend fun rename(id: Long, title: String?)

    @Delete
    suspend fun delete(book: BookEntity)

    @Query("DELETE FROM books")
    suspend fun deleteAll()
}

@Dao
interface CollectionDao {
    @Query("SELECT * FROM collections ORDER BY name COLLATE NOCASE")
    fun observeAll(): Flow<List<CollectionEntity>>

    @Transaction
    @Query("SELECT * FROM collections ORDER BY name COLLATE NOCASE")
    fun observeWithBooks(): Flow<List<CollectionWithBooks>>

    @Query("SELECT collectionId FROM book_collection WHERE bookId = :bookId")
    fun observeCollectionIdsForBook(bookId: Long): Flow<List<Long>>

    @Insert
    suspend fun insert(collection: CollectionEntity): Long

    @Query("UPDATE collections SET name = :name WHERE id = :id")
    suspend fun rename(id: Long, name: String)

    @Query("DELETE FROM collections WHERE id = :id")
    suspend fun delete(id: Long)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun addBook(ref: BookCollectionCrossRef)

    @Delete
    suspend fun removeBook(ref: BookCollectionCrossRef)
}

@Dao
interface BookmarkDao {
    @Query("SELECT * FROM bookmarks WHERE bookId = :bookId ORDER BY COALESCE(page, 0), progress")
    fun observeForBook(bookId: Long): Flow<List<BookmarkEntity>>

    @Transaction
    @Query("SELECT * FROM bookmarks ORDER BY createdAt DESC")
    fun observeAllWithBook(): Flow<List<BookmarkWithBook>>

    @Insert
    suspend fun insert(b: BookmarkEntity): Long

    @Query("DELETE FROM bookmarks WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("UPDATE bookmarks SET label = :label WHERE id = :id")
    suspend fun rename(id: Long, label: String)
}

@Dao
interface AnnotationDao {
    @Query("SELECT * FROM annotations WHERE bookId = :bookId ORDER BY COALESCE(page, 0), createdAt")
    fun observeForBook(bookId: Long): Flow<List<AnnotationEntity>>

    @Transaction
    @Query("SELECT * FROM annotations ORDER BY updatedAt DESC")
    fun observeAllWithBook(): Flow<List<AnnotationWithBook>>

    @Transaction
    @Query("SELECT * FROM annotations WHERE selectedText LIKE '%' || :q || '%' OR note LIKE '%' || :q || '%' ORDER BY updatedAt DESC")
    fun search(q: String): Flow<List<AnnotationWithBook>>

    @Transaction
    @Query("SELECT * FROM annotations WHERE (:bookId IS NULL OR bookId = :bookId) ORDER BY bookId, COALESCE(page, 0), createdAt")
    suspend fun getForExport(bookId: Long?): List<AnnotationWithBook>

    @Insert
    suspend fun insert(a: AnnotationEntity): Long

    @Update
    suspend fun update(a: AnnotationEntity)

    @Query("DELETE FROM annotations WHERE id = :id")
    suspend fun delete(id: Long)
}

@Dao
interface StudyDao {
    @Query("SELECT * FROM flashcards ORDER BY createdAt DESC")
    fun observeFlashcards(): Flow<List<FlashcardEntity>>

    @Query("SELECT * FROM flashcards WHERE markedForReview = 1 AND dueAt <= :now ORDER BY dueAt")
    fun observeDue(now: Long): Flow<List<FlashcardEntity>>

    @Query("SELECT COUNT(*) FROM flashcards WHERE markedForReview = 1 AND dueAt <= :now")
    fun observeDueCount(now: Long): Flow<Int>

    @Insert
    suspend fun insertFlashcard(f: FlashcardEntity): Long

    @Update
    suspend fun updateFlashcard(f: FlashcardEntity)

    @Query("DELETE FROM flashcards WHERE id = :id")
    suspend fun deleteFlashcard(id: Long)

    @Query("SELECT * FROM grammar_patterns ORDER BY updatedAt DESC")
    fun observePatterns(): Flow<List<GrammarPatternEntity>>

    @Insert
    suspend fun insertPattern(p: GrammarPatternEntity): Long

    @Update
    suspend fun updatePattern(p: GrammarPatternEntity)

    @Query("DELETE FROM grammar_patterns WHERE id = :id")
    suspend fun deletePattern(id: Long)

    @Query("DELETE FROM flashcards")
    suspend fun deleteAllFlashcards()

    @Query("DELETE FROM grammar_patterns")
    suspend fun deleteAllPatterns()
}

@Dao
interface SessionDao {
    @Insert
    suspend fun insert(s: ReadingSessionEntity): Long

    @Query("SELECT * FROM reading_sessions ORDER BY startedAt DESC LIMIT :limit")
    fun observeRecent(limit: Int = 50): Flow<List<ReadingSessionEntity>>

    @Query("SELECT COALESCE(SUM(activeMillis), 0) FROM reading_sessions WHERE startedAt >= :since")
    fun observeTotalSince(since: Long): Flow<Long>

    @Query("SELECT COALESCE(SUM(activeMillis), 0) FROM reading_sessions WHERE bookId = :bookId")
    fun observeTotalForBook(bookId: Long): Flow<Long>

    @Query("SELECT strftime('%Y-%m-%d', startedAt / 1000, 'unixepoch', 'localtime') AS day, SUM(activeMillis) AS totalMillis FROM reading_sessions WHERE startedAt >= :since GROUP BY day ORDER BY day")
    fun observeDaily(since: Long): Flow<List<DailyReading>>

    @Query("SELECT COALESCE(SUM(activeMillis), 0) FROM reading_sessions")
    fun observeTotal(): Flow<Long>

    @Query("DELETE FROM reading_sessions")
    suspend fun deleteAll()
}
