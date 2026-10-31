package com.oducreative.reader.data.repositories

import com.oducreative.reader.core.database.AnnotationDao
import com.oducreative.reader.core.database.BookmarkDao
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.AnnotationWithBook
import com.oducreative.reader.data.models.BookmarkEntity
import com.oducreative.reader.data.models.BookmarkWithBook
import kotlinx.coroutines.flow.Flow

class AnnotationRepository(
    private val annotationDao: AnnotationDao,
    private val bookmarkDao: BookmarkDao,
) {
    fun annotationsFor(bookId: Long): Flow<List<AnnotationEntity>> = annotationDao.observeForBook(bookId)
    val allAnnotations: Flow<List<AnnotationWithBook>> = annotationDao.observeAllWithBook()
    fun search(query: String): Flow<List<AnnotationWithBook>> = annotationDao.search(query)
    suspend fun forExport(bookId: Long?): List<AnnotationWithBook> = annotationDao.getForExport(bookId)

    suspend fun add(a: AnnotationEntity): Long = annotationDao.insert(a)
    suspend fun update(a: AnnotationEntity) = annotationDao.update(a.copy(updatedAt = System.currentTimeMillis()))
    suspend fun delete(id: Long) = annotationDao.delete(id)

    fun bookmarksFor(bookId: Long): Flow<List<BookmarkEntity>> = bookmarkDao.observeForBook(bookId)
    val allBookmarks: Flow<List<BookmarkWithBook>> = bookmarkDao.observeAllWithBook()
    suspend fun addBookmark(b: BookmarkEntity): Long = bookmarkDao.insert(b)
    suspend fun deleteBookmark(id: Long) = bookmarkDao.delete(id)
    suspend fun renameBookmark(id: Long, label: String) = bookmarkDao.rename(id, label)
}
