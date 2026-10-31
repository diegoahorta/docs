package com.oducreative.reader

import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.oducreative.reader.app.OduReaderApp
import com.oducreative.reader.data.models.BookFormat
import com.oducreative.reader.data.sources.ImportResult
import com.oducreative.reader.data.sources.PdfDocumentSource
import com.oducreative.reader.data.sources.PdfTextSource
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.readium.r2.shared.publication.services.content.content
import java.io.File

/**
 * Valida o fluxo real: gerar PDF/EPUB → importar pelo mesmo caminho usado pela UI →
 * abrir/renderizar → salvar e recuperar posição → remover sem tocar no arquivo original.
 */
@RunWith(AndroidJUnit4::class)
class ImportAndReadTest {
    private val app = ApplicationProvider.getApplicationContext<OduReaderApp>()
    private val container get() = app.container
    private lateinit var dir: File

    @Before fun setUp() = runBlocking {
        container.deleteAllPersonalData()
        dir = File(app.cacheDir, "fixtures").apply { mkdirs() }
    }

    @Test fun importsRendersAndResumesPdf() = runBlocking {
        val original = TestFixtures.createPdf(dir, pages = 3)
        val result = container.books.import(Uri.fromFile(original))
        assertTrue("import falhou: $result", result is ImportResult.Success)
        val book = (result as ImportResult.Success).book
        assertEquals(BookFormat.PDF, book.format)
        assertEquals(3, book.totalPages)

        PdfDocumentSource.open(File(book.filePath)).use { doc ->
            val bmp = doc.renderPage(1, 600)
            assertNotNull(bmp)
            assertEquals(600, bmp!!.width)
        }
        PdfTextSource(File(book.filePath)).use { text ->
            assertTrue(text.pageText(0).contains("ODU Reader"))
        }

        container.books.savePosition(book.id, "2", 1f)
        val reloaded = container.books.getBook(book.id)!!
        assertEquals("2", reloaded.position)
        assertTrue(reloaded.isCompleted)

        // Importar de novo não duplica
        val again = container.books.import(Uri.fromFile(original)) as ImportResult.Success
        assertTrue(again.alreadyInLibrary)

        container.books.remove(reloaded)
        assertTrue("o arquivo original deve permanecer", original.exists())
        assertTrue(!File(book.filePath).exists())
    }

    @Test fun importsAndOpensEpub() = runBlocking {
        val original = TestFixtures.createEpub(dir)
        val result = container.books.import(Uri.fromFile(original))
        assertTrue("import falhou: $result", result is ImportResult.Success)
        val book = (result as ImportResult.Success).book
        assertEquals(BookFormat.EPUB, book.format)
        assertEquals("Livro de Teste ODU", book.title)
        assertEquals("ODU Creative", book.author)

        val publication = container.readium.open(File(book.filePath))
        try {
            assertEquals(2, publication.readingOrder.size)
            assertEquals(2, publication.tableOfContents.size)
            val text = publication.content()?.text().orEmpty()
            assertTrue(text.contains("leitor curioso"))
            assertTrue(text.contains("日本語"))
        } finally {
            publication.close()
        }
    }

    @Test fun rejectsCorruptedFile() = runBlocking {
        val bad = File(dir, "corrompido.pdf").apply { writeBytes(ByteArray(4096) { 7 }) }
        val result = container.books.import(Uri.fromFile(bad))
        assertTrue(result is ImportResult.Failure)
    }
}
