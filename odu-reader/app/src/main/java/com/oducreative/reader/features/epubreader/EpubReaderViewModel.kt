package com.oducreative.reader.features.epubreader

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oducreative.reader.app.AppContainer
import com.oducreative.reader.core.datastore.AppSettings
import com.oducreative.reader.core.datastore.ReaderFont
import com.oducreative.reader.core.datastore.ReaderTextAlign
import com.oducreative.reader.core.designsystem.EffectiveTheme
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookmarkEntity
import com.oducreative.reader.data.models.ReadingSessionEntity
import com.oducreative.reader.features.reader.ReadingSessionTracker
import com.oducreative.reader.features.texttospeech.EpubTtsSource
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
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.readium.r2.navigator.epub.EpubPreferences
import org.readium.r2.navigator.preferences.FontFamily
import org.readium.r2.navigator.preferences.TextAlign
import org.readium.r2.navigator.preferences.Theme
import org.readium.r2.shared.publication.Link
import org.readium.r2.shared.publication.Locator
import org.readium.r2.shared.publication.Publication
import org.readium.r2.shared.publication.epub.EpubLayout
import org.readium.r2.shared.publication.presentation.presentation
import org.readium.r2.shared.publication.services.search.search
import java.io.File

data class TocEntry(val link: Link, val title: String, val depth: Int)
data class EpubSearchHit(val locator: Locator, val before: String, val match: String, val after: String, val chapter: String?)

data class EpubUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val book: BookEntity? = null,
    val publication: Publication? = null,
    val initialLocator: Locator? = null,
    val currentLocator: Locator? = null,
    val progress: Float = 0f,
    val fixedLayout: Boolean = false,
    val toc: List<TocEntry> = emptyList(),
    val searching: Boolean = false,
    val searchQuery: String = "",
    val searchHits: List<EpubSearchHit> = emptyList(),
)

class EpubReaderViewModel(private val c: AppContainer, private val bookId: Long) : ViewModel() {
    private val _state = MutableStateFlow(EpubUiState())
    val state: StateFlow<EpubUiState> = _state.asStateFlow()
    val settings: StateFlow<AppSettings> = c.settings.settings.stateIn(viewModelScope, SharingStarted.Eagerly, AppSettings())
    val annotations: StateFlow<List<AnnotationEntity>> = c.annotations.annotationsFor(bookId).stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val bookmarks: StateFlow<List<BookmarkEntity>> = c.annotations.bookmarksFor(bookId).stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val tts = c.tts

    private val tracker = ReadingSessionTracker()
    private var saveJob: Job? = null
    private var searchJob: Job? = null
    private var file: File? = null

    init {
        viewModelScope.launch {
            val book = c.books.getBook(bookId)
            if (book == null) {
                _state.update { it.copy(loading = false, error = "Livro não encontrado.") }; return@launch
            }
            val f = File(book.filePath)
            if (!f.exists()) {
                _state.update { it.copy(loading = false, error = "O arquivo deste livro não está mais disponível. Remova-o e importe novamente.") }; return@launch
            }
            file = f
            try {
                val pub = c.readium.open(f)
                val initial = book.position?.let { runCatching { Locator.fromJSON(JSONObject(it)) }.getOrNull() }
                _state.update {
                    it.copy(
                        loading = false, book = book, publication = pub, initialLocator = initial, currentLocator = initial,
                        progress = book.progress,
                        fixedLayout = pub.metadata.presentation.layout == EpubLayout.FIXED,
                        toc = flatten(pub.tableOfContents.ifEmpty { pub.readingOrder }, 0),
                    )
                }
                c.books.markOpened(bookId)
                tracker.start(book.progress)
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = e.message ?: "Não foi possível abrir o EPUB.") }
            }
        }
    }

    private fun flatten(links: List<Link>, depth: Int): List<TocEntry> = links.flatMap { l ->
        listOf(TocEntry(l, l.title ?: l.href.toString(), depth)) + flatten(l.children, depth + 1)
    }

    fun onLocatorChanged(locator: Locator) {
        val progress = (locator.locations.totalProgression ?: 0.0).toFloat()
        _state.update { it.copy(currentLocator = locator, progress = progress) }
        tracker.onInteraction()
        saveJob?.cancel()
        saveJob = viewModelScope.launch {
            delay(500)
            c.books.savePosition(bookId, locator.toJSON().toString(), progress)
        }
    }

    fun onInteraction() = tracker.onInteraction()

    fun onPauseLifecycle() {
        tracker.pause()
        val loc = _state.value.currentLocator
        viewModelScope.launch {
            if (loc != null) c.books.savePosition(bookId, loc.toJSON().toString(), _state.value.progress)
            flushSession()
        }
    }

    fun onResumeLifecycle() = tracker.start(_state.value.progress)

    private suspend fun flushSession() {
        if (tracker.activeMillis <= 0) return
        c.stats.record(
            ReadingSessionEntity(
                bookId = bookId, startedAt = tracker.startedAt, endedAt = System.currentTimeMillis(),
                activeMillis = tracker.activeMillis, startProgress = tracker.startProgress, endProgress = _state.value.progress,
            )
        )
        tracker.reset()
    }

    /** Converte as preferências do app em preferências do navegador Readium. */
    fun preferencesFor(s: AppSettings, theme: EffectiveTheme): EpubPreferences {
        val customTypography = s.font != ReaderFont.ORIGINAL || s.lineHeight != 1.5f ||
            s.textAlign != ReaderTextAlign.START || s.letterSpacing != 0f
        return EpubPreferences(
            fontSize = s.fontScale.toDouble(),
            fontFamily = if (s.font == ReaderFont.ORIGINAL) null else FontFamily(s.font.cssName),
            lineHeight = if (customTypography) s.lineHeight.toDouble() else null,
            letterSpacing = if (customTypography && s.letterSpacing > 0f) s.letterSpacing.toDouble() else null,
            pageMargins = s.pageMargins.toDouble(),
            textAlign = if (!customTypography) null else if (s.textAlign == ReaderTextAlign.JUSTIFY) TextAlign.JUSTIFY else TextAlign.START,
            publisherStyles = !customTypography,
            scroll = s.epubScroll,
            theme = when (theme) {
                EffectiveTheme.LIGHT -> Theme.LIGHT
                EffectiveTheme.DARK -> Theme.DARK
                EffectiveTheme.SEPIA -> Theme.SEPIA
            },
        )
    }

    // ---- Marcadores ----
    fun toggleBookmark() = viewModelScope.launch {
        val loc = _state.value.currentLocator ?: return@launch
        val existing = currentBookmark()
        if (existing != null) c.annotations.deleteBookmark(existing.id)
        else {
            val pct = ((loc.locations.totalProgression ?: 0.0) * 100).toInt()
            c.annotations.addBookmark(
                BookmarkEntity(
                    bookId = bookId, locator = loc.toJSON().toString(),
                    label = listOfNotNull(loc.title, "$pct%").joinToString(" · "),
                    progress = (loc.locations.totalProgression ?: 0.0).toFloat(),
                )
            )
        }
    }

    fun currentBookmark(): BookmarkEntity? {
        val loc = _state.value.currentLocator ?: return null
        return bookmarks.value.firstOrNull { b ->
            val bl = runCatching { Locator.fromJSON(JSONObject(b.locator)) }.getOrNull() ?: return@firstOrNull false
            bl.href == loc.href && kotlin.math.abs((bl.locations.progression ?: 0.0) - (loc.locations.progression ?: 0.0)) < 0.01
        }
    }

    fun deleteBookmark(id: Long) = viewModelScope.launch { c.annotations.deleteBookmark(id) }
    fun deleteAnnotation(id: Long) = viewModelScope.launch { c.annotations.delete(id) }
    fun updateAnnotation(a: AnnotationEntity) = viewModelScope.launch { c.annotations.update(a) }

    // ---- Busca ----
    fun search(query: String) {
        searchJob?.cancel()
        val pub = _state.value.publication ?: return
        _state.update { it.copy(searchQuery = query, searchHits = emptyList(), searching = query.isNotBlank()) }
        if (query.isBlank()) return
        searchJob = viewModelScope.launch {
            val iterator = pub.search(query)
            if (iterator == null) {
                _state.update { it.copy(searching = false) }; return@launch
            }
            val hits = mutableListOf<EpubSearchHit>()
            try {
                while (hits.size < 500) {
                    val page = iterator.next().getOrNull() ?: break
                    page.locators.forEach { l ->
                        hits += EpubSearchHit(l, l.text.before.orEmpty(), l.text.highlight.orEmpty(), l.text.after.orEmpty(), l.title)
                    }
                    _state.update { it.copy(searchHits = hits.toList()) }
                }
            } finally {
                iterator.close()
                _state.update { it.copy(searching = false, searchHits = hits.toList()) }
            }
        }
    }

    fun clearSearch() {
        searchJob?.cancel()
        _state.update { it.copy(searchQuery = "", searchHits = emptyList(), searching = false) }
    }

    // ---- TTS ----
    /** Abre uma instância própria da publicação para que a leitura continue mesmo fora do leitor. */
    fun startTts() = viewModelScope.launch {
        val f = file ?: return@launch
        val book = _state.value.book ?: return@launch
        val start = _state.value.currentLocator
        val lang = _state.value.publication?.metadata?.languages?.firstOrNull() ?: book.language
        val pub = runCatching { c.readium.open(f) }.getOrNull() ?: return@launch
        tts.play(EpubTtsSource(pub, start, bookId, book.displayTitle, lang))
    }

    override fun onCleared() {
        super.onCleared()
        tracker.pause()
        val loc = _state.value.currentLocator
        val progress = _state.value.progress
        c.appScope.launch {
            withContext(NonCancellable) {
                if (loc != null) c.books.savePosition(bookId, loc.toJSON().toString(), progress)
                flushSession()
            }
        }
        searchJob?.cancel()
        _state.value.publication?.close()
    }
}
