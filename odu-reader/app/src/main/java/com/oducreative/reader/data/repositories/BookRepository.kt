package com.oducreative.reader.data.repositories

import android.net.Uri
import com.oducreative.reader.core.database.BookDao
import com.oducreative.reader.core.database.CollectionDao
import com.oducreative.reader.data.models.BookCollectionCrossRef
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.CollectionEntity
import com.oducreative.reader.data.models.CollectionWithBooks
import com.oducreative.reader.data.sources.BookImporter
import com.oducreative.reader.data.sources.ImportResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class BookRepository(
    private val bookDao: BookDao,
    private val collectionDao: CollectionDao,
    private val importer: BookImporter,
) {
    private val importMutex = Mutex()

    val books: Flow<List<BookEntity>> = bookDao.observeAll()
    val collections: Flow<List<CollectionEntity>> = collectionDao.observeAll()
    val collectionsWithBooks: Flow<List<CollectionWithBooks>> = collectionDao.observeWithBooks()

    fun observeBook(id: Long): Flow<BookEntity?> = bookDao.observe(id)
    suspend fun getBook(id: Long): BookEntity? = bookDao.get(id)
    fun observeCollectionIds(bookId: Long): Flow<List<Long>> = collectionDao.observeCollectionIdsForBook(bookId)

    /** Importa um arquivo; importações são serializadas para evitar picos de memória. */
    suspend fun import(uri: Uri): ImportResult = importMutex.withLock {
        try {
            val prepared = importer.prepare(uri)
            bookDao.findByHash(prepared.hash)?.let { return@withLock ImportResult.Success(it, alreadyInLibrary = true) }
            val entity = importer.buildEntity(prepared)
            val id = bookDao.insert(entity)
            ImportResult.Success(entity.copy(id = id), alreadyInLibrary = false)
        } catch (e: BookImporter.ImportException) {
            ImportResult.Failure(e.fileName, e.message ?: "Erro desconhecido")
        } catch (e: Exception) {
            ImportResult.Failure(uri.lastPathSegment ?: "arquivo", e.message ?: "Erro desconhecido")
        }
    }

    suspend fun savePosition(bookId: Long, position: String, progress: Float) =
        bookDao.updatePosition(bookId, position, progress.coerceIn(0f, 1f))

    suspend fun markOpened(bookId: Long) = bookDao.touch(bookId)
    suspend fun setFavorite(bookId: Long, fav: Boolean) = bookDao.setFavorite(bookId, fav)
    suspend fun setCompleted(bookId: Long, done: Boolean) = bookDao.setCompleted(bookId, done)
    suspend fun rename(bookId: Long, title: String) = bookDao.rename(bookId, title.trim().ifBlank { null })

    /**
     * Remove o item da biblioteca. Apaga somente a cópia privada do app — o arquivo original
     * do usuário (em Downloads, Drive etc.) permanece intacto.
     */
    suspend fun remove(book: BookEntity) {
        bookDao.delete(book)
        importer.deleteFiles(book)
    }

    suspend fun createCollection(name: String): Long = collectionDao.insert(CollectionEntity(name = name.trim()))
    suspend fun renameCollection(id: Long, name: String) = collectionDao.rename(id, name.trim())
    suspend fun deleteCollection(id: Long) = collectionDao.delete(id)
    suspend fun addToCollection(bookId: Long, collectionId: Long) = collectionDao.addBook(BookCollectionCrossRef(bookId, collectionId))
    suspend fun removeFromCollection(bookId: Long, collectionId: Long) = collectionDao.removeBook(BookCollectionCrossRef(bookId, collectionId))

    suspend fun deleteEverything() {
        bookDao.deleteAll()
        importer.deleteAllFiles()
    }
}
