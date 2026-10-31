package com.oducreative.reader

import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.oducreative.reader.core.database.OduDatabase
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookFormat
import com.oducreative.reader.data.models.BookmarkEntity
import com.oducreative.reader.data.models.BookCollectionCrossRef
import com.oducreative.reader.data.models.CollectionEntity
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DatabaseTest {
    private lateinit var db: OduDatabase

    @Before fun setUp() {
        db = Room.inMemoryDatabaseBuilder(ApplicationProvider.getApplicationContext(), OduDatabase::class.java).build()
    }

    @After fun tearDown() = db.close()

    private fun book(hash: String) = BookEntity(title = "Livro $hash", format = BookFormat.EPUB, filePath = "/f/$hash", originalFileName = "$hash.epub", fileSize = 10, contentHash = hash)

    @Test fun bookmarksAnnotationsAndCascade() = runBlocking {
        val id = db.bookDao().insert(book("a"))
        db.bookmarkDao().insert(BookmarkEntity(bookId = id, locator = "{}", label = "Cap. 1"))
        db.annotationDao().insert(AnnotationEntity(bookId = id, type = AnnotationType.NOTE, locator = "{}", selectedText = "frase marcante", note = "comentário"))
        assertEquals(1, db.bookmarkDao().observeForBook(id).first().size)
        assertEquals(1, db.annotationDao().search("marcante").first().size)
        assertEquals(1, db.annotationDao().search("comentário").first().size)

        db.bookDao().delete(db.bookDao().get(id)!!)
        assertTrue(db.bookmarkDao().observeAllWithBook().first().isEmpty())
        assertTrue(db.annotationDao().observeAllWithBook().first().isEmpty())
    }

    @Test fun collectionsAndRename() = runBlocking {
        val b1 = db.bookDao().insert(book("x"))
        val b2 = db.bookDao().insert(book("y"))
        val col = db.collectionDao().insert(CollectionEntity(name = "Japonês"))
        db.collectionDao().addBook(BookCollectionCrossRef(b1, col))
        db.collectionDao().addBook(BookCollectionCrossRef(b2, col))
        assertEquals(2, db.collectionDao().observeWithBooks().first().single().books.size)

        db.bookDao().rename(b1, "Meu título")
        assertEquals("Meu título", db.bookDao().get(b1)!!.displayTitle)
        db.bookDao().rename(b1, null)
        assertEquals("Livro x", db.bookDao().get(b1)!!.displayTitle)
    }
}
