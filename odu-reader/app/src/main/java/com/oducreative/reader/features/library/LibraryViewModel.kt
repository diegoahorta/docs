package com.oducreative.reader.features.library

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oducreative.reader.app.AppContainer
import com.oducreative.reader.core.datastore.LibrarySort
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.CollectionEntity
import com.oducreative.reader.data.models.CollectionWithBooks
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.Collator
import java.util.Locale

enum class LibraryFilter(val label: String) { ALL("Todos"), READING("Lendo"), RECENT("Recentes"), COMPLETED("Concluídos"), PDF("PDF"), EPUB("EPUB") }

data class LibraryUiState(
    val books: List<BookEntity> = emptyList(),
    val recent: List<BookEntity> = emptyList(),
    val totalCount: Int = 0,
    val collections: List<CollectionWithBooks> = emptyList(),
    val query: String = "",
    val filter: LibraryFilter = LibraryFilter.ALL,
    val sort: LibrarySort = LibrarySort.RECENT,
    val selectedCollection: Long? = null,
    val loaded: Boolean = false,
)

class LibraryViewModel(private val c: AppContainer, private val favoritesOnly: Boolean) : ViewModel() {
    private val query = MutableStateFlow("")
    private val filter = MutableStateFlow(LibraryFilter.ALL)
    private val selectedCollection = MutableStateFlow<Long?>(null)

    private val controls = combine(query, filter, selectedCollection) { q, f, col -> Triple(q, f, col) }

    val state: StateFlow<LibraryUiState> = combine(
        c.books.books, c.books.collectionsWithBooks, c.settings.settings.map { it.librarySort }, controls
    ) { all, cols, sort, (q, f, col) ->
        val base = if (favoritesOnly) all.filter { it.isFavorite } else all
        val inCollection = col?.let { id -> cols.firstOrNull { it.collection.id == id }?.books?.map { it.id }?.toSet() }
        val collator = Collator.getInstance(Locale.getDefault()).apply { strength = Collator.PRIMARY }
        val filtered = base
            .filter { inCollection == null || it.id in inCollection }
            .filter { b ->
                q.isBlank() || b.displayTitle.contains(q, true) || (b.author?.contains(q, true) == true) ||
                    b.originalFileName.contains(q, true)
            }
            .filter { b ->
                when (f) {
                    LibraryFilter.ALL -> true
                    LibraryFilter.READING -> b.progress > 0f && !b.isCompleted
                    LibraryFilter.RECENT -> b.lastOpenedAt != null
                    LibraryFilter.COMPLETED -> b.isCompleted
                    LibraryFilter.PDF -> b.format == com.oducreative.reader.data.models.BookFormat.PDF
                    LibraryFilter.EPUB -> b.format == com.oducreative.reader.data.models.BookFormat.EPUB
                }
            }
        val sorted = when {
            f == LibraryFilter.RECENT -> filtered.sortedByDescending { it.lastOpenedAt ?: 0 }
            sort == LibrarySort.NAME -> filtered.sortedWith { a, b -> collator.compare(a.displayTitle, b.displayTitle) }
            sort == LibrarySort.ADDED -> filtered.sortedByDescending { it.addedAt }
            sort == LibrarySort.PROGRESS -> filtered.sortedByDescending { it.progress }
            else -> filtered.sortedByDescending { it.lastOpenedAt ?: it.addedAt }
        }
        LibraryUiState(
            books = sorted,
            recent = base.filter { it.lastOpenedAt != null && !it.isCompleted }.sortedByDescending { it.lastOpenedAt }.take(8),
            totalCount = base.size,
            collections = cols,
            query = q, filter = f, sort = sort, selectedCollection = col, loaded = true,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), LibraryUiState())

    fun setQuery(q: String) { query.value = q }
    fun setFilter(f: LibraryFilter) { filter.value = f }
    fun selectCollection(id: Long?) { selectedCollection.value = id }
    fun setSort(s: LibrarySort) = viewModelScope.launch { c.settings.setLibrarySort(s) }

    fun toggleFavorite(b: BookEntity) = viewModelScope.launch { c.books.setFavorite(b.id, !b.isFavorite) }
    fun toggleCompleted(b: BookEntity) = viewModelScope.launch { c.books.setCompleted(b.id, !b.isCompleted) }
    fun rename(b: BookEntity, title: String) = viewModelScope.launch { c.books.rename(b.id, title) }
    fun remove(b: BookEntity) = viewModelScope.launch {
        if (c.tts.state.value.bookId == b.id) c.tts.stop()
        c.books.remove(b)
    }

    fun createCollection(name: String) = viewModelScope.launch { if (name.isNotBlank()) c.books.createCollection(name) }
    fun deleteCollection(id: Long) = viewModelScope.launch {
        c.books.deleteCollection(id)
        if (selectedCollection.value == id) selectedCollection.value = null
    }
    fun renameCollection(id: Long, name: String) = viewModelScope.launch { c.books.renameCollection(id, name) }
    fun setInCollection(bookId: Long, collectionId: Long, inside: Boolean) = viewModelScope.launch {
        if (inside) c.books.addToCollection(bookId, collectionId) else c.books.removeFromCollection(bookId, collectionId)
    }

    val allCollections: StateFlow<List<CollectionEntity>> = c.books.collections.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    fun collectionIdsFor(bookId: Long) = c.books.observeCollectionIds(bookId)
}
