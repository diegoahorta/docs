package com.oducreative.reader.features.library

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.LibraryBooks
import androidx.compose.material.icons.automirrored.outlined.Sort
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Clear
import androidx.compose.material.icons.outlined.CreateNewFolder
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.oducreative.reader.R
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.datastore.LibrarySort
import com.oducreative.reader.core.designsystem.BookCover
import com.oducreative.reader.core.designsystem.EmptyState
import com.oducreative.reader.core.designsystem.ProgressLine
import com.oducreative.reader.core.utilities.Formatters
import com.oducreative.reader.data.models.BookEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(
    favoritesOnly: Boolean,
    onOpen: (BookEntity) -> Unit,
    onImport: () -> Unit,
    onSettings: () -> Unit,
) {
    val container = appContainer()
    val vm: LibraryViewModel = viewModel(key = "library-$favoritesOnly") { LibraryViewModel(container, favoritesOnly) }
    val state by vm.state.collectAsState()
    var sortMenu by remember { mutableStateOf(false) }
    var renameTarget by remember { mutableStateOf<BookEntity?>(null) }
    var removeTarget by remember { mutableStateOf<BookEntity?>(null) }
    var collectionsTarget by remember { mutableStateOf<BookEntity?>(null) }
    var newCollection by remember { mutableStateOf(false) }
    var searchOpen by rememberSaveable { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(if (favoritesOnly) stringResource(R.string.nav_favorites) else stringResource(R.string.app_name), style = MaterialTheme.typography.headlineSmall)
                        if (!favoritesOnly) Text(stringResource(R.string.tagline), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    }
                },
                actions = {
                    IconButton(onClick = { searchOpen = !searchOpen; if (!searchOpen) vm.setQuery("") }) {
                        Icon(Icons.Outlined.Search, stringResource(R.string.action_search))
                    }
                    Box {
                        IconButton(onClick = { sortMenu = true }) { Icon(Icons.AutoMirrored.Outlined.Sort, "Ordenar") }
                        DropdownMenu(sortMenu, { sortMenu = false }) {
                            listOf(LibrarySort.RECENT to "Leitura recente", LibrarySort.NAME to "Nome", LibrarySort.ADDED to "Data de importação", LibrarySort.PROGRESS to "Progresso").forEach { (s, label) ->
                                DropdownMenuItem(
                                    text = { Text(label, fontWeight = if (s == state.sort) FontWeight.Bold else null) },
                                    onClick = { vm.setSort(s); sortMenu = false },
                                )
                            }
                        }
                    }
                    IconButton(onClick = onSettings) { Icon(Icons.Outlined.Settings, stringResource(R.string.nav_settings)) }
                },
            )
        },
        floatingActionButton = {
            if (!favoritesOnly) {
                ExtendedFloatingActionButton(
                    onClick = onImport,
                    icon = { Icon(Icons.Filled.Add, null) },
                    text = { Text(stringResource(R.string.action_import)) },
                )
            }
        },
    ) { padding ->
        if (state.loaded && state.totalCount == 0) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                if (favoritesOnly) {
                    EmptyState(Icons.Outlined.FavoriteBorder, "Nenhum favorito", "Toque no coração de um livro para vê-lo aqui.")
                } else {
                    EmptyState(Icons.AutoMirrored.Outlined.LibraryBooks, stringResource(R.string.library_empty_title), stringResource(R.string.library_empty_message)) {
                        TextButton(onClick = onImport) { Text("Importar PDF ou EPUB") }
                    }
                }
            }
            return@Scaffold
        }
        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 150.dp),
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            if (searchOpen) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    OutlinedTextField(
                        value = state.query,
                        onValueChange = vm::setQuery,
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        placeholder = { Text(stringResource(R.string.search_hint)) },
                        leadingIcon = { Icon(Icons.Outlined.Search, null) },
                        trailingIcon = {
                            if (state.query.isNotEmpty()) IconButton(onClick = { vm.setQuery("") }) { Icon(Icons.Outlined.Clear, "Limpar") }
                        },
                    )
                }
            }
            if (!favoritesOnly && state.recent.isNotEmpty() && state.query.isBlank() && state.filter == LibraryFilter.ALL && state.selectedCollection == null) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    Column {
                        Text("Continuar lendo", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 8.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(state.recent, key = { it.id }) { b -> ContinueCard(b) { onOpen(b) } }
                        }
                    }
                }
            }
            item(span = { GridItemSpan(maxLineSpan) }) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(LibraryFilter.entries) { f ->
                        FilterChip(selected = state.filter == f, onClick = { vm.setFilter(f) }, label = { Text(f.label) })
                    }
                }
            }
            item(span = { GridItemSpan(maxLineSpan) }) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    items(state.collections, key = { it.collection.id }) { col ->
                        var menu by remember { mutableStateOf(false) }
                        Box {
                            FilterChip(
                                selected = state.selectedCollection == col.collection.id,
                                onClick = { vm.selectCollection(if (state.selectedCollection == col.collection.id) null else col.collection.id) },
                                label = { Text("${col.collection.name} (${col.books.size})") },
                                modifier = Modifier,
                                trailingIcon = {
                                    Icon(Icons.Filled.MoreVert, "Opções da coleção", Modifier.size(18.dp).clickable { menu = true })
                                },
                            )
                            DropdownMenu(menu, { menu = false }) {
                                DropdownMenuItem(text = { Text("Excluir coleção") }, onClick = { vm.deleteCollection(col.collection.id); menu = false })
                            }
                        }
                    }
                    item {
                        TextButton(onClick = { newCollection = true }) {
                            Icon(Icons.Outlined.CreateNewFolder, null); Spacer(Modifier.width(4.dp)); Text("Nova coleção")
                        }
                    }
                }
            }
            if (state.books.isEmpty()) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    Text("Nenhum resultado.", modifier = Modifier.padding(24.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            items(state.books, key = { it.id }) { book ->
                BookCard(
                    book = book,
                    onOpen = { onOpen(book) },
                    onFavorite = { vm.toggleFavorite(book) },
                    onCompleted = { vm.toggleCompleted(book) },
                    onRename = { renameTarget = book },
                    onCollections = { collectionsTarget = book },
                    onRemove = { removeTarget = book },
                )
            }
        }
    }

    renameTarget?.let { b ->
        var text by remember(b.id) { mutableStateOf(b.displayTitle) }
        AlertDialog(
            onDismissRequest = { renameTarget = null },
            title = { Text("Renomear título exibido") },
            text = {
                Column {
                    OutlinedTextField(text, { text = it }, singleLine = true)
                    Text("O arquivo original não é alterado. Título original: ${b.title}", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 8.dp))
                }
            },
            confirmButton = { TextButton(onClick = { vm.rename(b, text); renameTarget = null }) { Text(stringResource(R.string.action_save)) } },
            dismissButton = {
                Row {
                    TextButton(onClick = { vm.rename(b, ""); renameTarget = null }) { Text("Restaurar original") }
                    TextButton(onClick = { renameTarget = null }) { Text(stringResource(R.string.action_cancel)) }
                }
            },
        )
    }

    removeTarget?.let { b ->
        AlertDialog(
            onDismissRequest = { removeTarget = null },
            title = { Text("Remover da biblioteca?") },
            text = {
                Text("“${b.displayTitle}” será removido do ODU Reader, junto com marcadores, anotações e progresso deste livro. O arquivo original no seu aparelho NÃO será excluído.")
            },
            confirmButton = { TextButton(onClick = { vm.remove(b); removeTarget = null }) { Text(stringResource(R.string.action_remove)) } },
            dismissButton = { TextButton(onClick = { removeTarget = null }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }

    collectionsTarget?.let { b ->
        val all by vm.allCollections.collectAsState()
        val inside by vm.collectionIdsFor(b.id).collectAsState(initial = emptyList())
        AlertDialog(
            onDismissRequest = { collectionsTarget = null },
            title = { Text("Coleções") },
            text = {
                Column {
                    if (all.isEmpty()) Text("Crie uma coleção primeiro.")
                    all.forEach { col ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = col.id in inside, onCheckedChange = { vm.setInCollection(b.id, col.id, it) })
                            Text(col.name)
                        }
                    }
                    TextButton(onClick = { newCollection = true }) { Text("Nova coleção") }
                }
            },
            confirmButton = { TextButton(onClick = { collectionsTarget = null }) { Text(stringResource(R.string.action_ok)) } },
        )
    }

    if (newCollection) {
        var name by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { newCollection = false },
            title = { Text("Nova coleção") },
            text = { OutlinedTextField(name, { name = it }, singleLine = true, placeholder = { Text("Ex.: Japonês, Faculdade, Romances") }) },
            confirmButton = { TextButton(onClick = { vm.createCollection(name); newCollection = false }, enabled = name.isNotBlank()) { Text("Criar") } },
            dismissButton = { TextButton(onClick = { newCollection = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun BookCard(
    book: BookEntity,
    onOpen: () -> Unit,
    onFavorite: () -> Unit,
    onCompleted: () -> Unit,
    onRename: () -> Unit,
    onCollections: () -> Unit,
    onRemove: () -> Unit,
) {
    var menu by remember { mutableStateOf(false) }
    Column(Modifier.combinedClickable(onClick = onOpen, onLongClick = { menu = true })) {
        Box {
            BookCover(book, Modifier.fillMaxWidth().aspectRatio(0.68f))
            Row(Modifier.align(Alignment.TopEnd)) {
                IconButton(onClick = onFavorite) {
                    Icon(
                        if (book.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = if (book.isFavorite) "Remover dos favoritos" else "Favoritar",
                        tint = if (book.isFavorite) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                }
            }
            if (book.isCompleted) {
                Icon(Icons.Outlined.CheckCircle, "Concluído", tint = MaterialTheme.colorScheme.tertiary, modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp))
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(book.displayTitle, style = MaterialTheme.typography.titleSmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(book.author, book.format.name).joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
            }
            Box {
                IconButton(onClick = { menu = true }, modifier = Modifier.size(32.dp)) { Icon(Icons.Filled.MoreVert, "Mais opções") }
                DropdownMenu(menu, { menu = false }) {
                    DropdownMenuItem(text = { Text(if (book.isFavorite) "Remover dos favoritos" else "Favoritar") }, onClick = { onFavorite(); menu = false })
                    DropdownMenuItem(text = { Text(if (book.isCompleted) "Marcar como não concluído" else "Marcar como concluído") }, onClick = { onCompleted(); menu = false })
                    DropdownMenuItem(text = { Text("Renomear") }, onClick = { onRename(); menu = false })
                    DropdownMenuItem(text = { Text("Coleções…") }, onClick = { onCollections(); menu = false })
                    DropdownMenuItem(text = { Text("Remover da biblioteca") }, onClick = { onRemove(); menu = false })
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        ProgressLine(book.progress)
        Text(Formatters.percent(book.progress), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun ContinueCard(book: BookEntity, onClick: () -> Unit) {
    Row(
        Modifier.width(280.dp)
            .clip(MaterialTheme.shapes.medium)
            .clickable(onClick = onClick)
            .padding(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BookCover(book, Modifier.width(64.dp).aspectRatio(0.68f))
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(book.displayTitle, style = MaterialTheme.typography.titleSmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
            book.author?.let { Text(it, style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis) }
            Spacer(Modifier.height(6.dp))
            ProgressLine(book.progress)
            Text("${Formatters.percent(book.progress)} lido", style = MaterialTheme.typography.labelSmall)
        }
    }
}

