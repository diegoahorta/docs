package com.oducreative.reader.features.pdfreader

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.oducreative.reader.app.AppContainer
import com.oducreative.reader.core.datastore.AppSettings
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookmarkEntity
import com.oducreative.reader.data.models.ReadingSessionEntity
import com.oducreative.reader.data.sources.PdfDocumentSource
import com.oducreative.reader.data.sources.PdfSearchHit
import com.oducreative.reader.data.sources.PdfTextSource
import com.oducreative.reader.features.reader.ReadingSessionTracker
import com.oducreative.reader.features.texttospeech.PdfTtsSource
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

data class PdfUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val book: BookEntity? = null,
    val pageCount: Int = 0,
    /** Proporções altura/largura de cada página. */
    val pageRatios: List<Float> = emptyList(),
    val currentPage: Int = 0,
    val initialPage: Int = 0,
    val hasTextLayer: Boolean? = null,
    val searchQuery: String = "",
    val searching: Boolean = false,
    val searchHits: List<PdfSearchHit> = emptyList(),
)

data class PageText(val page: Int, val text: String, val fromOcr: Boolean)

class PdfReaderViewModel(private val c: AppContainer, private val bookId: Long) : ViewModel() {
    private val _state = MutableStateFlow(PdfUiState())
    val state: StateFlow<PdfUiState> = _state.asStateFlow()

    val settings: StateFlow<AppSettings> = c.settings.settings.stateIn(viewModelScope, SharingStarted.Eagerly, AppSettings())
    val bookmarks: StateFlow<List<BookmarkEntity>> = c.annotations.bookmarksFor(bookId).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val annotations: StateFlow<List<AnnotationEntity>> = c.annotations.annotationsFor(bookId).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val tts = c.tts

    private var document: PdfDocumentSource? = null
    private var text: PdfTextSource? = null
    private var file: File? = null
    private val tracker = ReadingSessionTracker()
    private var saveJob: Job? = null
    private var searchJob: Job? = null

    private val _pageText = MutableStateFlow<PageText?>(null)
    val pageText: StateFlow<PageText?> = _pageText.asStateFlow()
    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    init {
        viewModelScope.launch {
            val book = c.books.getBook(bookId)
            if (book == null) {
                _state.update { it.copy(loading = false, error = "Livro não encontrado.") }
                return@launch
            }
            val f = File(book.filePath)
            if (!f.exists()) {
                _state.update { it.copy(loading = false, error = "O arquivo deste livro não está mais disponível. Remova-o e importe novamente.") }
                return@launch
            }
            try {
                val doc = PdfDocumentSource.open(f)
                document = doc
                file = f
                text = PdfTextSource(f)
                val start = book.position?.toIntOrNull()?.coerceIn(0, doc.pageCount - 1) ?: 0
                _state.update {
                    it.copy(
                        loading = false, book = book, pageCount = doc.pageCount,
                        pageRatios = doc.pageSizes.map { s -> s.height.toFloat() / s.width.coerceAtLeast(1) },
                        currentPage = start, initialPage = start,
                    )
                }
                c.books.markOpened(bookId)
                tracker.start(book.progress)
                launch { _state.update { it.copy(hasTextLayer = text?.hasTextLayer() ?: false) } }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = e.message ?: "Não foi possível abrir o PDF.") }
            }
        }
    }

    suspend fun render(page: Int, widthPx: Int): Bitmap? = document?.renderPage(page, widthPx)

    fun onPageChanged(page: Int) {
        val s = _state.value
        if (page == s.currentPage || s.pageCount == 0) return
        _state.update { it.copy(currentPage = page) }
        tracker.onInteraction()
        saveJob?.cancel()
        saveJob = viewModelScope.launch {
            delay(600)
            persistPosition(page)
        }
    }

    fun onInteraction() = tracker.onInteraction()

    private suspend fun persistPosition(page: Int) {
        val count = _state.value.pageCount
        if (count == 0) return
        val progress = if (count <= 1) 1f else page.toFloat() / (count - 1)
        c.books.savePosition(bookId, page.toString(), progress)
    }

    fun onPauseLifecycle() {
        tracker.pause()
        viewModelScope.launch { persistPosition(_state.value.currentPage); flushSession() }
    }

    fun onResumeLifecycle() {
        tracker.start(progress())
    }

    private fun progress(): Float {
        val s = _state.value
        return if (s.pageCount <= 1) 0f else s.currentPage.toFloat() / (s.pageCount - 1)
    }

    private suspend fun flushSession() {
        if (tracker.activeMillis <= 0) return
        c.stats.record(
            ReadingSessionEntity(
                bookId = bookId, startedAt = tracker.startedAt, endedAt = System.currentTimeMillis(),
                activeMillis = tracker.activeMillis, startProgress = tracker.startProgress, endProgress = progress(),
            )
        )
        tracker.reset()
    }

    // ---- Marcadores ----
    fun toggleBookmark() = viewModelScope.launch {
        val page = _state.value.currentPage
        val existing = bookmarks.value.firstOrNull { it.page == page }
        if (existing != null) c.annotations.deleteBookmark(existing.id)
        else c.annotations.addBookmark(
            BookmarkEntity(bookId = bookId, locator = page.toString(), page = page, label = "Página ${page + 1}", progress = progress())
        )
    }

    fun deleteBookmark(id: Long) = viewModelScope.launch { c.annotations.deleteBookmark(id) }
    fun deleteAnnotation(id: Long) = viewModelScope.launch { c.annotations.delete(id) }

    // ---- Busca ----
    fun search(query: String) {
        searchJob?.cancel()
        val count = _state.value.pageCount
        _state.update { it.copy(searchQuery = query, searchHits = emptyList(), searching = query.isNotBlank()) }
        if (query.isBlank()) return
        val src = text ?: return
        searchJob = viewModelScope.launch {
            val hits = mutableListOf<PdfSearchHit>()
            src.search(query, count).collect { hit ->
                hits += hit
                if (hits.size % 5 == 1) _state.update { it.copy(searchHits = hits.toList()) }
                if (hits.size >= 500) return@collect
            }
            _state.update { it.copy(searchHits = hits.toList(), searching = false) }
        }
    }

    fun clearSearch() {
        searchJob?.cancel()
        _state.update { it.copy(searchQuery = "", searchHits = emptyList(), searching = false) }
    }

    // ---- Texto da página / OCR ----
    fun loadPageText(page: Int) = viewModelScope.launch {
        _busy.value = true
        val t = text?.pageText(page).orEmpty()
        _pageText.value = PageText(page, t, fromOcr = false)
        _busy.value = false
    }

    /** OCR opcional (ML Kit on-device, alfabeto latino). Resultado é marcado como texto reconhecido. */
    fun runOcr(page: Int) = viewModelScope.launch {
        _busy.value = true
        try {
            val bmp = document?.renderPage(page, 1800) ?: error("Falha ao renderizar a página.")
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            val result = try {
                suspendCancellableCoroutine<String> { cont ->
                    recognizer.process(InputImage.fromBitmap(bmp, 0))
                        .addOnSuccessListener { cont.resume(it.text) }
                        .addOnFailureListener { cont.resumeWithException(it) }
                }
            } finally {
                recognizer.close()
            }
            _pageText.value = PageText(page, result.ifBlank { "" }, fromOcr = true)
        } catch (e: Exception) {
            _pageText.value = PageText(page, "", fromOcr = true)
        } finally {
            _busy.value = false
        }
    }

    fun closePageText() { _pageText.value = null }

    // ---- TTS ----
    fun startTts(fromPage: Int = _state.value.currentPage) {
        val s = _state.value
        val f = file ?: return
        val book = s.book ?: return
        tts.play(PdfTtsSource(f, fromPage, s.pageCount, bookId, book.displayTitle, book.language))
    }

    override fun onCleared() {
        super.onCleared()
        val page = _state.value.currentPage
        val loaded = _state.value.pageCount > 0
        tracker.pause()
        c.appScope.launch {
            withContext(NonCancellable) {
                if (loaded) persistPosition(page)
                flushSession()
            }
        }
        searchJob?.cancel()
        runCatching { text?.close() }
        runCatching { document?.close() }
    }

}
