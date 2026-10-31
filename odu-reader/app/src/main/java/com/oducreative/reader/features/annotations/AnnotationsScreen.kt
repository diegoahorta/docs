package com.oducreative.reader.features.annotations

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Bookmarks
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.FileDownload
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.oducreative.reader.app.AppContainer
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.designsystem.EmptyState
import com.oducreative.reader.core.utilities.Formatters
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.AnnotationWithBook
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookmarkWithBook
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AnnotationsViewModel(private val c: AppContainer) : ViewModel() {
    val query = MutableStateFlow("")

    @OptIn(ExperimentalCoroutinesApi::class)
    val annotations: StateFlow<List<AnnotationWithBook>> = query.flatMapLatest { q ->
        if (q.isBlank()) c.annotations.allAnnotations else c.annotations.search(q.trim())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val bookmarks: StateFlow<List<BookmarkWithBook>> = c.annotations.allBookmarks.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val books = c.books.books.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val message = MutableStateFlow<String?>(null)

    fun delete(a: AnnotationEntity) = viewModelScope.launch { c.annotations.delete(a.id) }
    fun update(a: AnnotationEntity) = viewModelScope.launch { c.annotations.update(a) }
    fun deleteBookmark(id: Long) = viewModelScope.launch { c.annotations.deleteBookmark(id) }

    fun export(uri: android.net.Uri, format: ExportFormat, bookId: Long?, context: android.content.Context) = viewModelScope.launch {
        val result = runCatching {
            val items = c.annotations.forExport(bookId)
            val bytes = AnnotationExporter.export(items, format)
            withContext(Dispatchers.IO) {
                context.contentResolver.openOutputStream(uri)?.use { it.write(bytes) } ?: error("Não foi possível criar o arquivo.")
            }
            items.size
        }
        message.value = result.fold({ "$it anotação(ões) exportada(s)." }, { "Falha na exportação: ${it.message}" })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnnotationsScreen(onOpenBook: (BookEntity) -> Unit) {
    val container = appContainer()
    val vm: AnnotationsViewModel = viewModel { AnnotationsViewModel(container) }
    val query by vm.query.collectAsState()
    val annotations by vm.annotations.collectAsState()
    val bookmarks by vm.bookmarks.collectAsState()
    val books by vm.books.collectAsState()
    val message by vm.message.collectAsState()
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var exportMenu by remember { mutableStateOf(false) }
    var pendingExport by remember { mutableStateOf<Pair<ExportFormat, Long?>?>(null) }
    var editing by remember { mutableStateOf<AnnotationEntity?>(null) }

    val createDoc = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("*/*")) { uri ->
        val p = pendingExport
        if (uri != null && p != null) vm.export(uri, p.first, p.second, context)
        pendingExport = null
    }
    LaunchedEffect(message) { message?.let { snackbar.showSnackbar(it); vm.message.value = null } }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text("Anotações e marcadores") },
                actions = {
                    Box {
                        IconButton(onClick = { exportMenu = true }) { Icon(Icons.Outlined.FileDownload, "Exportar") }
                        DropdownMenu(exportMenu, { exportMenu = false }) {
                            ExportFormat.entries.forEach { f ->
                                DropdownMenuItem(text = { Text("Tudo em ${f.label}") }, onClick = {
                                    exportMenu = false
                                    pendingExport = f to null
                                    createDoc.launch("odu-anotacoes.${f.extension}")
                                })
                            }
                            books.filter { b -> annotations.any { it.annotation.bookId == b.id } }.take(10).forEach { b ->
                                DropdownMenuItem(text = { Text("“${b.displayTitle}” em Markdown", maxLines = 1, overflow = TextOverflow.Ellipsis) }, onClick = {
                                    exportMenu = false
                                    pendingExport = ExportFormat.MARKDOWN to b.id
                                    createDoc.launch("${b.displayTitle.take(40)}-anotacoes.md")
                                })
                            }
                        }
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            TabRow(selectedTabIndex = tab) {
                Tab(tab == 0, { tab = 0 }, text = { Text("Destaques e notas") })
                Tab(tab == 1, { tab = 1 }, text = { Text("Marcadores") })
            }
            if (tab == 0) {
                OutlinedTextField(
                    value = query, onValueChange = { vm.query.value = it },
                    modifier = Modifier.fillMaxWidth().padding(16.dp), singleLine = true,
                    placeholder = { Text("Buscar nas anotações") }, leadingIcon = { Icon(Icons.Outlined.Search, null) },
                )
                if (annotations.isEmpty()) {
                    EmptyState(Icons.Outlined.EditNote, if (query.isBlank()) "Nenhuma anotação" else "Nada encontrado",
                        "Selecione trechos durante a leitura para destacar, anotar e estudar.")
                }
                LazyColumn(contentPadding = PaddingValues(bottom = 24.dp)) {
                    items(annotations, key = { it.annotation.id }) { item ->
                        val a = item.annotation
                        ListItem(
                            overlineContent = {
                                Text(listOfNotNull(
                                    item.book?.displayTitle,
                                    a.page?.let { "p. ${it + 1}" } ?: a.chapter,
                                    Formatters.date(a.updatedAt),
                                    if (a.fromOcr) "OCR" else null,
                                ).joinToString(" · "), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            },
                            headlineContent = { Text(a.selectedText.ifBlank { "(sem trecho)" }, maxLines = 4, overflow = TextOverflow.Ellipsis) },
                            supportingContent = { if (a.note.isNotBlank()) Text(a.note, maxLines = 4, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.primary) },
                            leadingContent = { Box(Modifier.size(width = 6.dp, height = 40.dp).background(Color(a.color))) },
                            trailingContent = { IconButton(onClick = { vm.delete(a) }) { Icon(Icons.Outlined.Delete, "Excluir anotação") } },
                            modifier = Modifier.clickable { editing = a },
                        )
                        HorizontalDivider()
                    }
                }
            } else {
                if (bookmarks.isEmpty()) {
                    EmptyState(Icons.Outlined.Bookmarks, "Nenhum marcador", "Use o ícone de marcador no leitor para salvar páginas e posições.")
                }
                LazyColumn(contentPadding = PaddingValues(bottom = 24.dp)) {
                    items(bookmarks, key = { it.bookmark.id }) { item ->
                        val b = item.bookmark
                        ListItem(
                            overlineContent = { Text(item.book?.displayTitle.orEmpty(), maxLines = 1) },
                            headlineContent = { Text(b.label) },
                            supportingContent = { Text(Formatters.dateTime(b.createdAt)) },
                            trailingContent = { IconButton(onClick = { vm.deleteBookmark(b.id) }) { Icon(Icons.Outlined.Delete, "Excluir marcador") } },
                            modifier = Modifier.clickable { item.book?.let(onOpenBook) },
                        )
                        HorizontalDivider()
                    }
                }
            }
        }
    }

    editing?.let { a ->
        var note by remember(a.id) { mutableStateOf(a.note) }
        AlertDialog(
            onDismissRequest = { editing = null },
            title = { Text("Editar nota") },
            text = {
                Column {
                    Text("“${a.selectedText}”", maxLines = 5, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium)
                    OutlinedTextField(note, { note = it }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp), label = { Text("Nota") })
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    vm.update(a.copy(note = note, type = if (note.isBlank()) AnnotationType.HIGHLIGHT else AnnotationType.NOTE)); editing = null
                }) { Text("Salvar") }
            },
            dismissButton = { TextButton(onClick = { editing = null }) { Text("Cancelar") } },
        )
    }
}
