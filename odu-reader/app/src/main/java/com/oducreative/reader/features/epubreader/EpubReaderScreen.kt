package com.oducreative.reader.features.epubreader

import android.graphics.Color as AndroidColor
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.automirrored.outlined.VolumeUp
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.FormatSize
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.doOnAttach
import androidx.fragment.app.FragmentContainerView
import com.oducreative.reader.R
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.datastore.ReaderFont
import com.oducreative.reader.core.datastore.ReaderTextAlign
import com.oducreative.reader.core.datastore.ThemeMode
import com.oducreative.reader.core.designsystem.LocalEffectiveTheme
import com.oducreative.reader.core.designsystem.ProgressLine
import com.oducreative.reader.core.utilities.Formatters
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.HighlightColors
import com.oducreative.reader.features.studytools.SelectionActionsSheet
import com.oducreative.reader.features.texttospeech.TtsMiniPlayer
import kotlinx.coroutines.launch
import org.json.JSONObject
import org.readium.r2.navigator.DecorableNavigator
import org.readium.r2.navigator.Decoration
import org.readium.r2.navigator.input.InputListener
import org.readium.r2.navigator.input.TapEvent
import org.readium.r2.shared.publication.Locator

private enum class EpubSheet { NONE, TOC, SEARCH, APPEARANCE, NOTES }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EpubReaderScreen(activity: EpubReaderActivity, onBack: () -> Unit) {
    val vm = activity.vm
    val container = appContainer()
    val state by vm.state.collectAsState()
    val settings by vm.settings.collectAsState()
    val annotations by vm.annotations.collectAsState()
    val bookmarks by vm.bookmarks.collectAsState()
    val ttsState by vm.tts.state.collectAsState()
    val navigator by activity.navigatorState
    val selection by activity.selectionState
    val theme = LocalEffectiveTheme.current
    val scope = rememberCoroutineScope()

    var chrome by rememberSaveable { mutableStateOf(true) }
    var sheet by rememberSaveable { mutableStateOf(EpubSheet.NONE) }
    var menu by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<AnnotationEntity?>(null) }

    BackHandler(enabled = sheet != EpubSheet.NONE) { sheet = EpubSheet.NONE }

    // Preferências de leitura aplicadas em tempo real
    LaunchedEffect(navigator, settings, theme) {
        navigator?.submitPreferences(vm.preferencesFor(settings, theme))
    }
    // Destaques e notas como decorações do Readium
    LaunchedEffect(navigator, annotations) {
        val nav = navigator ?: return@LaunchedEffect
        val decorations = annotations.mapNotNull { a ->
            val loc = runCatching { Locator.fromJSON(JSONObject(a.locator)) }.getOrNull() ?: return@mapNotNull null
            Decoration(id = "ann-${a.id}", locator = loc, style = Decoration.Style.Highlight(tint = a.color))
        }
        nav.applyDecorations(decorations, "highlights")
    }
    // Trecho lido pelo TTS
    LaunchedEffect(navigator, ttsState.segment, ttsState.bookId) {
        val nav = navigator ?: return@LaunchedEffect
        val loc = ttsState.segment?.locator
        if (ttsState.bookId == state.book?.id && loc != null) {
            nav.applyDecorations(listOf(Decoration("tts", loc, Decoration.Style.Underline(tint = AndroidColor.rgb(91, 63, 217)))), "tts")
            nav.go(loc)
        } else {
            nav.applyDecorations(emptyList(), "tts")
        }
    }
    // Toque no conteúdo alterna os controles; toque em um destaque abre a edição
    LaunchedEffect(navigator) {
        val nav = navigator ?: return@LaunchedEffect
        nav.addInputListener(object : InputListener {
            override fun onTap(event: TapEvent): Boolean {
                chrome = !chrome
                vm.onInteraction()
                return true
            }
        })
        nav.addDecorationListener("highlights", object : DecorableNavigator.Listener {
            override fun onDecorationActivated(event: DecorableNavigator.OnActivatedEvent): Boolean {
                val id = event.decoration.id.removePrefix("ann-").toLongOrNull() ?: return false
                editing = vm.annotations.value.firstOrNull { it.id == id }
                return editing != null
            }
        })
    }

    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        when {
            state.loading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
            state.error != null -> Column(Modifier.align(Alignment.Center).padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(state.error!!, style = MaterialTheme.typography.bodyLarge)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onBack) { Text("Voltar") }
            }
            else -> {
                val publication = state.publication!!
                AndroidView(
                    modifier = Modifier.fillMaxSize().systemBarsPadding().padding(top = if (chrome) 56.dp else 0.dp),
                    factory = { ctx ->
                        FragmentContainerView(ctx).apply {
                            id = R.id.epub_navigator_container
                            doOnAttach {
                                activity.attachNavigator(this, publication, vm.preferencesFor(vm.settings.value, theme))
                            }
                        }
                    },
                )

                AnimatedVisibility(chrome, enter = fadeIn(), exit = fadeOut(), modifier = Modifier.align(Alignment.TopCenter)) {
                    TopAppBar(
                        title = {
                            Column {
                                Text(state.book?.displayTitle.orEmpty(), maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleMedium)
                                Text(state.currentLocator?.title ?: "", maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.labelMedium)
                            }
                        },
                        navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } },
                        actions = {
                            IconButton(onClick = { sheet = EpubSheet.TOC }) { Icon(Icons.AutoMirrored.Filled.List, "Sumário") }
                            IconButton(onClick = { sheet = EpubSheet.SEARCH }) { Icon(Icons.Outlined.Search, "Pesquisar no livro") }
                            val marked = remember(state.currentLocator, bookmarks) { vm.currentBookmark() != null }
                            IconButton(onClick = { vm.toggleBookmark() }) {
                                Icon(if (marked) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder, if (marked) "Remover marcador" else "Adicionar marcador")
                            }
                            IconButton(onClick = { sheet = EpubSheet.APPEARANCE }) { Icon(Icons.Outlined.FormatSize, "Aparência") }
                            Box {
                                IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, "Mais opções") }
                                DropdownMenu(menu, { menu = false }) {
                                    DropdownMenuItem(text = { Text("Ouvir a partir daqui") }, leadingIcon = { Icon(Icons.AutoMirrored.Outlined.VolumeUp, null) }, onClick = { vm.startTts(); menu = false })
                                    DropdownMenuItem(text = { Text("Marcadores e notas") }, onClick = { sheet = EpubSheet.NOTES; menu = false })
                                }
                            }
                        },
                        modifier = Modifier.statusBarsPadding(),
                    )
                }

                Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth()) {
                    TtsMiniPlayer()
                    AnimatedVisibility(chrome, enter = fadeIn(), exit = fadeOut()) {
                        Surface(color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f)) {
                            Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = { navigator?.goBackward(animated = true); vm.onInteraction() }) { Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, "Página anterior") }
                                Column(Modifier.weight(1f)) {
                                    ProgressLine(state.progress)
                                    Text("${Formatters.percent(state.progress)} lido" + if (state.fixedLayout) " · layout fixo" else "", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 4.dp))
                                }
                                IconButton(onClick = { navigator?.goForward(animated = true); vm.onInteraction() }) { Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, "Próxima página") }
                            }
                        }
                    }
                }
            }
        }
    }

    when (sheet) {
        EpubSheet.TOC -> TocSheet(state.toc, state.currentLocator?.href?.toString(), onDismiss = { sheet = EpubSheet.NONE }) { link ->
            navigator?.go(link); sheet = EpubSheet.NONE
        }
        EpubSheet.SEARCH -> EpubSearchSheet(vm, onDismiss = { sheet = EpubSheet.NONE }) { loc -> navigator?.go(loc); sheet = EpubSheet.NONE }
        EpubSheet.NOTES -> EpubNotesSheet(vm, onDismiss = { sheet = EpubSheet.NONE }) { json ->
            runCatching { Locator.fromJSON(JSONObject(json)) }.getOrNull()?.let { navigator?.go(it) }
            sheet = EpubSheet.NONE
        }
        EpubSheet.APPEARANCE -> EpubAppearanceSheet(container, state.fixedLayout, onDismiss = { sheet = EpubSheet.NONE })
        EpubSheet.NONE -> {}
    }

    selection?.let { sel -> SelectionActionsSheet(selection = sel, onDismiss = { activity.selectionState.value = null }) }

    editing?.let { a ->
        var note by remember(a.id) { mutableStateOf(a.note) }
        var color by remember(a.id) { mutableIntStateOf(a.color) }
        AlertDialog(
            onDismissRequest = { editing = null },
            title = { Text(if (a.type == AnnotationType.HIGHLIGHT) "Destaque" else "Nota") },
            text = {
                Column {
                    Text("“${a.selectedText}”", style = MaterialTheme.typography.bodyMedium, maxLines = 5, overflow = TextOverflow.Ellipsis)
                    Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        HighlightColors.all.forEach { c ->
                            Box(Modifier.size(if (c == color) 32.dp else 26.dp).background(Color(c)).clickable { color = c })
                        }
                    }
                    OutlinedTextField(note, { note = it }, label = { Text("Nota") }, modifier = Modifier.fillMaxWidth())
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    vm.updateAnnotation(a.copy(note = note, color = color, type = if (note.isBlank()) AnnotationType.HIGHLIGHT else AnnotationType.NOTE))
                    editing = null
                }) { Text("Salvar") }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = { vm.deleteAnnotation(a.id); editing = null }) { Text("Excluir") }
                    TextButton(onClick = { editing = null }) { Text("Cancelar") }
                }
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TocSheet(toc: List<TocEntry>, currentHref: String?, onDismiss: () -> Unit, onSelect: (org.readium.r2.shared.publication.Link) -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Text("Sumário", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp))
        LazyColumn(Modifier.fillMaxWidth().height(520.dp)) {
            if (toc.isEmpty()) item { Text("Este livro não possui sumário.", Modifier.padding(20.dp)) }
            items(toc) { e ->
                val current = currentHref != null && currentHref.substringBefore('#') == e.link.href.toString().substringBefore('#')
                ListItem(
                    headlineContent = { Text(e.title, fontWeight = if (current) FontWeight.Bold else null, maxLines = 2, overflow = TextOverflow.Ellipsis) },
                    modifier = Modifier.clickable { onSelect(e.link) }.padding(start = (e.depth * 16).dp),
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EpubSearchSheet(vm: EpubReaderViewModel, onDismiss: () -> Unit, onSelect: (Locator) -> Unit) {
    val state by vm.state.collectAsState()
    var query by rememberSaveable { mutableStateOf(state.searchQuery) }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(horizontal = 16.dp)) {
            OutlinedTextField(
                query, { query = it }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                placeholder = { Text("Pesquisar no livro") },
                leadingIcon = { Icon(Icons.Outlined.Search, null) },
                trailingIcon = { if (query.isNotEmpty()) IconButton(onClick = { query = ""; vm.clearSearch() }) { Icon(Icons.Outlined.Close, "Limpar") } },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { vm.search(query) }),
            )
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 6.dp)) {
                if (state.searching) { CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp); Spacer(Modifier.width(8.dp)) }
                Text(if (state.searchQuery.isBlank()) "Digite um termo e toque em pesquisar." else "${state.searchHits.size} resultado(s)", style = MaterialTheme.typography.labelMedium)
            }
        }
        LazyColumn(Modifier.fillMaxWidth().height(440.dp)) {
            items(state.searchHits) { hit ->
                ListItem(
                    overlineContent = { hit.chapter?.let { Text(it, maxLines = 1) } },
                    headlineContent = {
                        Text(buildAnnotatedString {
                            append(hit.before.takeLast(50))
                            withStyle(SpanStyle(fontWeight = FontWeight.Bold, background = Color(0x66FFE066))) { append(hit.match) }
                            append(hit.after.take(70))
                        }, maxLines = 3, overflow = TextOverflow.Ellipsis)
                    },
                    modifier = Modifier.clickable { onSelect(hit.locator) },
                )
                HorizontalDivider()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EpubNotesSheet(vm: EpubReaderViewModel, onDismiss: () -> Unit, onSelect: (String) -> Unit) {
    val bookmarks by vm.bookmarks.collectAsState()
    val annotations by vm.annotations.collectAsState()
    var tab by rememberSaveable { mutableIntStateOf(0) }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        TabRow(selectedTabIndex = tab) {
            Tab(tab == 0, { tab = 0 }, text = { Text("Marcadores (${bookmarks.size})") })
            Tab(tab == 1, { tab = 1 }, text = { Text("Destaques e notas (${annotations.size})") })
        }
        LazyColumn(Modifier.fillMaxWidth().height(440.dp)) {
            if (tab == 0) {
                if (bookmarks.isEmpty()) item { Text("Nenhum marcador ainda.", Modifier.padding(20.dp)) }
                items(bookmarks, key = { it.id }) { b ->
                    ListItem(
                        headlineContent = { Text(b.label) },
                        supportingContent = { Text(Formatters.dateTime(b.createdAt)) },
                        trailingContent = { IconButton(onClick = { vm.deleteBookmark(b.id) }) { Icon(Icons.Outlined.Close, "Excluir") } },
                        modifier = Modifier.clickable { onSelect(b.locator) },
                    )
                }
            } else {
                if (annotations.isEmpty()) item { Text("Selecione um trecho do livro e toque em “Destacar” ou “Estudar / anotar”.", Modifier.padding(20.dp)) }
                items(annotations, key = { it.id }) { a ->
                    ListItem(
                        overlineContent = { Text(listOfNotNull(if (a.type == AnnotationType.HIGHLIGHT) "Destaque" else "Nota", a.chapter).joinToString(" · ")) },
                        headlineContent = { Text(a.selectedText, maxLines = 3, overflow = TextOverflow.Ellipsis) },
                        supportingContent = { if (a.note.isNotBlank()) Text(a.note, maxLines = 3, overflow = TextOverflow.Ellipsis) },
                        leadingContent = { Box(Modifier.size(14.dp).background(Color(a.color))) },
                        trailingContent = { IconButton(onClick = { vm.deleteAnnotation(a.id) }) { Icon(Icons.Outlined.Close, "Excluir") } },
                        modifier = Modifier.clickable { onSelect(a.locator) },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EpubAppearanceSheet(container: com.oducreative.reader.app.AppContainer, fixedLayout: Boolean, onDismiss: () -> Unit) {
    val s by container.settings.settings.collectAsState(initial = com.oducreative.reader.core.datastore.AppSettings())
    val scope = rememberCoroutineScope()
    val st = container.settings
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(horizontal = 20.dp).navigationBarsPadding()) {
            if (fixedLayout) Text("Livro de layout fixo: ajustes de texto não se aplicam.", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.tertiary)
            Text("Tema", style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(ThemeMode.LIGHT to "Claro", ThemeMode.DARK to "Escuro", ThemeMode.SEPIA to "Sépia", ThemeMode.SYSTEM to "Sistema").forEach { (m, l) ->
                    FilterChip(s.themeMode == m, { scope.launch { st.setTheme(m) } }, { Text(l) })
                }
            }
            LabeledSlider("Tamanho da fonte: ${(s.fontScale * 100).toInt()}%", s.fontScale, 0.6f..2.5f) { v -> scope.launch { st.setFontScale(v) } }
            Text("Fonte", style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                ReaderFont.entries.forEach { f -> FilterChip(s.font == f, { scope.launch { st.setFont(f) } }, { Text(f.label, maxLines = 1) }) }
            }
            LabeledSlider("Espaçamento entre linhas: ${"%.1f".format(s.lineHeight)}", s.lineHeight, 1.0f..2.2f) { v -> scope.launch { st.setLineHeight(v) } }
            LabeledSlider("Espaçamento entre letras: ${"%.2f".format(s.letterSpacing)}", s.letterSpacing, 0f..0.3f) { v -> scope.launch { st.setLetterSpacing(v) } }
            LabeledSlider("Margens: ${"%.1f".format(s.pageMargins)}", s.pageMargins, 0.5f..2.5f) { v -> scope.launch { st.setPageMargins(v) } }
            Text("Alinhamento", style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(s.textAlign == ReaderTextAlign.START, { scope.launch { st.setTextAlign(ReaderTextAlign.START) } }, { Text("À esquerda") })
                FilterChip(s.textAlign == ReaderTextAlign.JUSTIFY, { scope.launch { st.setTextAlign(ReaderTextAlign.JUSTIFY) } }, { Text("Justificado") })
            }
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 8.dp)) {
                Column(Modifier.weight(1f)) {
                    Text("Rolagem contínua")
                    Text("Desligado = paginação", style = MaterialTheme.typography.labelSmall)
                }
                Switch(s.epubScroll, { v -> scope.launch { st.setEpubScroll(v) } })
            }
            Text("Fontes, entrelinha e alinhamento personalizados substituem os estilos da editora.", style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun LabeledSlider(label: String, value: Float, range: ClosedFloatingPointRange<Float>, onChange: (Float) -> Unit) {
    var local by remember(value) { mutableStateOf(value) }
    Text(label, style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(top = 8.dp))
    Slider(value = local, onValueChange = { local = it }, onValueChangeFinished = { onChange(local) }, valueRange = range)
}
