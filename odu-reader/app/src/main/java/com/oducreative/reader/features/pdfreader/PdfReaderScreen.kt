package com.oducreative.reader.features.pdfreader

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.calculatePan
import androidx.compose.foundation.gestures.calculateZoom
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.VolumeUp
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.DocumentScanner
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.TextSnippet
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.datastore.PdfFitMode
import com.oducreative.reader.core.datastore.PdfScrollDirection
import com.oducreative.reader.core.designsystem.LocalEffectiveTheme
import com.oducreative.reader.core.designsystem.ProgressLine
import com.oducreative.reader.core.utilities.Formatters
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.features.studytools.SelectionActionsSheet
import com.oducreative.reader.features.studytools.SelectionContext
import com.oducreative.reader.features.texttospeech.TtsMiniPlayer
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.roundToInt

private enum class PdfSheet { NONE, THUMBNAILS, NOTES, SEARCH, APPEARANCE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PdfReaderScreen(bookId: Long, onBack: () -> Unit) {
    val container = appContainer()
    val vm: PdfReaderViewModel = viewModel(key = "pdf-$bookId") { PdfReaderViewModel(container, bookId) }
    val state by vm.state.collectAsState()
    val settings by vm.settings.collectAsState()
    val bookmarks by vm.bookmarks.collectAsState()
    val annotations by vm.annotations.collectAsState()
    val pageText by vm.pageText.collectAsState()
    val busy by vm.busy.collectAsState()
    val ttsState by vm.tts.state.collectAsState()
    val theme = LocalEffectiveTheme.current
    val scope = rememberCoroutineScope()

    var chrome by rememberSaveable { mutableStateOf(true) }
    var sheet by rememberSaveable { mutableStateOf(PdfSheet.NONE) }
    var menu by remember { mutableStateOf(false) }
    var goToDialog by remember { mutableStateOf(false) }
    var selection by remember { mutableStateOf<SelectionContext?>(null) }

    // Mantém a tela ligada durante a leitura, se configurado
    val view = LocalView.current
    DisposableEffect(settings.keepScreenOn) {
        view.keepScreenOn = settings.keepScreenOn
        onDispose { view.keepScreenOn = false }
    }
    // Pausa a contagem de tempo e salva o progresso ao sair do primeiro plano
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val obs = LifecycleEventObserver { _, e ->
            when (e) {
                Lifecycle.Event.ON_PAUSE -> vm.onPauseLifecycle()
                Lifecycle.Event.ON_RESUME -> vm.onResumeLifecycle()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(obs)
        onDispose { lifecycleOwner.lifecycle.removeObserver(obs) }
    }

    BackHandler(enabled = sheet != PdfSheet.NONE) { sheet = PdfSheet.NONE }

    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surfaceContainerLow)) {
        when {
            state.loading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
            state.error != null -> Column(Modifier.align(Alignment.Center).padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(state.error!!, style = MaterialTheme.typography.bodyLarge)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onBack) { Text("Voltar") }
            }
            else -> {
                // Estado de navegação compartilhado entre os modos vertical e horizontal
                val listState = rememberLazyListState(initialFirstVisibleItemIndex = state.initialPage)
                val pagerState = rememberPagerState(initialPage = state.initialPage) { state.pageCount }
                val horizontal = settings.pdfDirection == PdfScrollDirection.HORIZONTAL

                fun goTo(page: Int) {
                    val p = page.coerceIn(0, state.pageCount - 1)
                    scope.launch { if (horizontal) pagerState.scrollToPage(p) else listState.scrollToItem(p) }
                    vm.onPageChanged(p)
                }

                LaunchedEffect(horizontal) {
                    if (horizontal) pagerState.scrollToPage(state.currentPage) else listState.scrollToItem(state.currentPage)
                }
                LaunchedEffect(listState, horizontal) {
                    if (!horizontal) snapshotFlow { listState.firstVisibleItemIndex + if (listState.firstVisibleItemScrollOffset > 400) 1 else 0 }
                        .distinctUntilChanged().collect { vm.onPageChanged(it.coerceAtMost(state.pageCount - 1)) }
                }
                LaunchedEffect(pagerState, horizontal) {
                    if (horizontal) snapshotFlow { pagerState.currentPage }.distinctUntilChanged().collect { vm.onPageChanged(it) }
                }
                // Acompanha a leitura em voz alta
                LaunchedEffect(ttsState.segment?.page, ttsState.bookId) {
                    val p = ttsState.segment?.page
                    if (ttsState.bookId == bookId && p != null && p != state.currentPage) goTo(p)
                }

                PdfViewport(
                    pageCount = state.pageCount,
                    ratios = state.pageRatios,
                    horizontal = horizontal,
                    fit = settings.pdfFit,
                    theme = theme,
                    listState = listState,
                    pagerState = pagerState,
                    annotatedPages = annotations.mapNotNull { it.page }.toSet(),
                    render = vm::render,
                    onTap = { chrome = !chrome },
                    onLongPress = { page -> vm.loadPageText(page) },
                    onInteraction = vm::onInteraction,
                )

                // Barra superior
                AnimatedVisibility(chrome, enter = fadeIn(), exit = fadeOut(), modifier = Modifier.align(Alignment.TopCenter)) {
                    TopAppBar(
                        title = {
                            Column {
                                Text(state.book?.displayTitle.orEmpty(), maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleMedium)
                                Text("Página ${state.currentPage + 1} de ${state.pageCount}", style = MaterialTheme.typography.labelMedium)
                            }
                        },
                        navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } },
                        actions = {
                            IconButton(onClick = { sheet = PdfSheet.SEARCH }) { Icon(Icons.Outlined.Search, "Buscar no documento") }
                            val marked = bookmarks.any { it.page == state.currentPage }
                            IconButton(onClick = { vm.toggleBookmark() }) {
                                Icon(if (marked) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder, if (marked) "Remover marcador" else "Adicionar marcador")
                            }
                            IconButton(onClick = { sheet = PdfSheet.THUMBNAILS }) { Icon(Icons.Outlined.GridView, "Miniaturas") }
                            Box {
                                IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, "Mais opções") }
                                DropdownMenu(menu, { menu = false }) {
                                    DropdownMenuItem(text = { Text("Ouvir a partir desta página") }, leadingIcon = { Icon(Icons.AutoMirrored.Outlined.VolumeUp, null) }, onClick = { vm.startTts(); menu = false })
                                    DropdownMenuItem(text = { Text("Texto da página (selecionar)") }, leadingIcon = { Icon(Icons.Outlined.TextSnippet, null) }, onClick = { vm.loadPageText(state.currentPage); menu = false })
                                    if (settings.ocrEnabled) {
                                        DropdownMenuItem(text = { Text("Reconhecer texto (OCR)") }, leadingIcon = { Icon(Icons.Outlined.DocumentScanner, null) }, onClick = { vm.runOcr(state.currentPage); menu = false })
                                    }
                                    DropdownMenuItem(text = { Text("Marcadores e notas") }, onClick = { sheet = PdfSheet.NOTES; menu = false })
                                    DropdownMenuItem(text = { Text("Ir para página…") }, onClick = { goToDialog = true; menu = false })
                                    DropdownMenuItem(text = { Text("Modo de exibição") }, onClick = { sheet = PdfSheet.APPEARANCE; menu = false })
                                }
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f)),
                        modifier = Modifier.statusBarsPadding(),
                    )
                }

                // Barra inferior com progresso e navegação rápida
                Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth()) {
                    TtsMiniPlayer()
                    AnimatedVisibility(chrome, enter = fadeIn(), exit = fadeOut()) {
                        Surface(color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f)) {
                            Column(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp)) {
                                var dragging by remember { mutableStateOf<Float?>(null) }
                                Slider(
                                    value = dragging ?: state.currentPage.toFloat(),
                                    onValueChange = { dragging = it },
                                    onValueChangeFinished = { dragging?.let { goTo(it.roundToInt()) }; dragging = null },
                                    valueRange = 0f..(state.pageCount - 1).coerceAtLeast(1).toFloat(),
                                )
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("${((dragging ?: state.currentPage.toFloat()).roundToInt()) + 1} / ${state.pageCount}", style = MaterialTheme.typography.labelMedium)
                                    Spacer(Modifier.weight(1f))
                                    val p = if (state.pageCount <= 1) 1f else state.currentPage.toFloat() / (state.pageCount - 1)
                                    Text(Formatters.percent(p), style = MaterialTheme.typography.labelMedium)
                                }
                                if (state.hasTextLayer == false) {
                                    Text(
                                        "PDF sem camada de texto (digitalizado): busca, seleção e leitura em voz alta não estão disponíveis. Use o OCR opcional no menu.",
                                        style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.tertiary,
                                    )
                                }
                            }
                        }
                    }
                }

                when (sheet) {
                    PdfSheet.THUMBNAILS -> ThumbnailsSheet(state.pageCount, state.pageRatios, state.currentPage, theme, vm::render, onDismiss = { sheet = PdfSheet.NONE }) { goTo(it); sheet = PdfSheet.NONE }
                    PdfSheet.SEARCH -> SearchSheet(vm, onDismiss = { sheet = PdfSheet.NONE }) { goTo(it); sheet = PdfSheet.NONE }
                    PdfSheet.NOTES -> NotesSheet(vm, onDismiss = { sheet = PdfSheet.NONE }) { goTo(it); sheet = PdfSheet.NONE }
                    PdfSheet.APPEARANCE -> AppearanceSheet(container, settings.pdfDirection, settings.pdfFit, settings.keepScreenOn, onDismiss = { sheet = PdfSheet.NONE })
                    PdfSheet.NONE -> {}
                }

                if (goToDialog) {
                    var input by remember { mutableStateOf("") }
                    AlertDialog(
                        onDismissRequest = { goToDialog = false },
                        title = { Text("Ir para página") },
                        text = {
                            OutlinedTextField(input, { input = it.filter(Char::isDigit) }, singleLine = true,
                                label = { Text("1 – ${state.pageCount}") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Go),
                                keyboardActions = KeyboardActions(onGo = { input.toIntOrNull()?.let { goTo(it - 1) }; goToDialog = false }))
                        },
                        confirmButton = { TextButton(onClick = { input.toIntOrNull()?.let { goTo(it - 1) }; goToDialog = false }) { Text("Ir") } },
                        dismissButton = { TextButton(onClick = { goToDialog = false }) { Text("Cancelar") } },
                    )
                }
            }
        }

        if (busy) CircularProgressIndicator(Modifier.align(Alignment.Center))
    }

    pageText?.let { pt ->
        PageTextSheet(
            pageText = pt,
            onDismiss = vm::closePageText,
            onRunOcr = if (settings.ocrEnabled && !pt.fromOcr) ({ vm.runOcr(pt.page) }) else null,
            onSpeak = { container.tts.speakText(it, state.book?.language, state.book?.displayTitle ?: "PDF") },
            onUse = { text ->
                val b = state.book ?: return@PageTextSheet
                selection = SelectionContext(
                    text = text, bookId = b.id, bookTitle = b.displayTitle, locator = pt.page.toString(), page = pt.page,
                    language = b.language, fromOcr = pt.fromOcr,
                )
                vm.closePageText()
            },
        )
    }

    selection?.let { sel -> SelectionActionsSheet(selection = sel, onDismiss = { selection = null }) }
}

/** Área de leitura com zoom por pinça, duplo toque e rolagem vertical ou paginação horizontal. */
@Composable
private fun PdfViewport(
    pageCount: Int,
    ratios: List<Float>,
    horizontal: Boolean,
    fit: PdfFitMode,
    theme: com.oducreative.reader.core.designsystem.EffectiveTheme,
    listState: androidx.compose.foundation.lazy.LazyListState,
    pagerState: androidx.compose.foundation.pager.PagerState,
    annotatedPages: Set<Int>,
    render: suspend (Int, Int) -> android.graphics.Bitmap?,
    onTap: () -> Unit,
    onLongPress: (Int) -> Unit,
    onInteraction: () -> Unit,
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }
    BoxWithConstraints(Modifier.fillMaxSize().clipToBounds()) {
        val density = LocalDensity.current
        val widthPx = with(density) { maxWidth.toPx() }
        val heightPx = with(density) { maxHeight.toPx() }
        // Re-renderiza com mais resolução quando há zoom (em degraus, para aproveitar o cache)
        val quality = when { scale > 2.5f -> 2.5f; scale > 1.4f -> 1.8f; else -> 1f }
        fun clamp() {
            val maxX = (widthPx * (scale - 1f)) / 2f
            val maxY = (heightPx * (scale - 1f)) / 2f
            offsetX = offsetX.coerceIn(-maxX, maxX)
            offsetY = offsetY.coerceIn(-maxY, maxY)
        }
        val gestures = Modifier
            .pointerInput(Unit) {
                awaitEachGesture {
                    awaitFirstDown(requireUnconsumed = false)
                    do {
                        val event = awaitPointerEvent(PointerEventPass.Initial)
                        val pressed = event.changes.count { it.pressed }
                        if (pressed >= 2) {
                            val zoom = event.calculateZoom()
                            val pan = event.calculatePan()
                            scale = (scale * zoom).coerceIn(1f, 5f)
                            offsetX += pan.x; offsetY += pan.y
                            clamp()
                            event.changes.forEach { it.consume() }
                            onInteraction()
                        } else if (scale > 1.01f) {
                            val pan = event.calculatePan()
                            if (abs(pan.x) > 0f) { offsetX += pan.x; clamp() }
                        }
                    } while (event.changes.any { it.pressed })
                    if (scale < 1.02f) { scale = 1f; offsetX = 0f; offsetY = 0f }
                }
            }
            .graphicsLayer {
                scaleX = scale; scaleY = scale
                translationX = offsetX; translationY = offsetY
            }

        fun pageModifier(index: Int): Modifier = Modifier.pointerInput(index) {
            detectTapGestures(
                onTap = { onTap() },
                onDoubleTap = {
                    if (scale > 1.2f) { scale = 1f; offsetX = 0f; offsetY = 0f } else { scale = 2.5f }
                    onInteraction()
                },
                onLongPress = { onLongPress(index) },
            )
        }

        if (!horizontal) {
            LazyColumn(
                state = listState,
                modifier = Modifier.fillMaxSize().then(gestures),
                contentPadding = PaddingValues(vertical = 72.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                items(count = pageCount, key = { it }) { index ->
                    val ratio = ratios.getOrElse(index) { 1.414f }
                    val pageWidthPx = when (fit) {
                        PdfFitMode.WIDTH -> widthPx
                        PdfFitMode.PAGE -> minOf(widthPx, (heightPx - with(density) { 144.dp.toPx() }) / ratio)
                    }
                    val pageWidthDp = with(density) { pageWidthPx.toDp() }
                    Box {
                        PdfPage(
                            page = index, ratio = ratio,
                            renderWidthPx = (pageWidthPx * quality).roundToInt().coerceAtLeast(1),
                            theme = theme, render = render,
                            modifier = Modifier.width(pageWidthDp).then(pageModifier(index)),
                        )
                        if (index in annotatedPages) AnnotationTab(Modifier.align(Alignment.TopEnd))
                    }
                }
            }
        } else {
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize().then(gestures),
                beyondViewportPageCount = 1,
                userScrollEnabled = scale <= 1.01f,
            ) { index ->
                val ratio = ratios.getOrElse(index) { 1.414f }
                val availH = heightPx - with(density) { 144.dp.toPx() }
                val pageWidthPx = when (fit) {
                    PdfFitMode.WIDTH -> widthPx
                    PdfFitMode.PAGE -> minOf(widthPx, availH / ratio)
                }
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    val content = @Composable {
                        Box {
                            PdfPage(
                                page = index, ratio = ratio,
                                renderWidthPx = (pageWidthPx * quality).roundToInt().coerceAtLeast(1),
                                theme = theme, render = render,
                                modifier = Modifier.width(with(density) { pageWidthPx.toDp() }).then(pageModifier(index)),
                            )
                            if (index in annotatedPages) AnnotationTab(Modifier.align(Alignment.TopEnd))
                        }
                    }
                    if (fit == PdfFitMode.WIDTH && pageWidthPx * ratio > availH) {
                        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(vertical = 72.dp)) { item { content() } }
                    } else content()
                }
            }
        }
    }
}

@Composable
private fun AnnotationTab(modifier: Modifier) {
    Box(modifier.padding(end = 6.dp).width(10.dp).height(28.dp).background(MaterialTheme.colorScheme.secondary))
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ThumbnailsSheet(
    pageCount: Int, ratios: List<Float>, current: Int, theme: com.oducreative.reader.core.designsystem.EffectiveTheme,
    render: suspend (Int, Int) -> android.graphics.Bitmap?, onDismiss: () -> Unit, onSelect: (Int) -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Text("Miniaturas", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(horizontal = 20.dp))
        val gridState = androidx.compose.foundation.lazy.grid.rememberLazyGridState(initialFirstVisibleItemIndex = current)
        LazyVerticalGrid(
            columns = GridCells.Adaptive(96.dp),
            state = gridState,
            modifier = Modifier.fillMaxWidth().height(480.dp),
            contentPadding = PaddingValues(16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(pageCount, key = { it }) { i ->
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { onSelect(i) }) {
                    PdfPage(i, ratios.getOrElse(i) { 1.414f }, 200, theme, render, Modifier.fillMaxWidth()
                        .then(if (i == current) Modifier.background(MaterialTheme.colorScheme.primary).padding(3.dp) else Modifier))
                    Text("${i + 1}", style = MaterialTheme.typography.labelSmall, fontWeight = if (i == current) FontWeight.Bold else null)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchSheet(vm: PdfReaderViewModel, onDismiss: () -> Unit, onSelect: (Int) -> Unit) {
    val state by vm.state.collectAsState()
    var query by rememberSaveable { mutableStateOf(state.searchQuery) }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(horizontal = 16.dp)) {
            OutlinedTextField(
                query, { query = it }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                placeholder = { Text("Buscar no documento") },
                leadingIcon = { Icon(Icons.Outlined.Search, null) },
                trailingIcon = { if (query.isNotEmpty()) IconButton(onClick = { query = ""; vm.clearSearch() }) { Icon(Icons.Outlined.Close, "Limpar") } },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { vm.search(query) }),
            )
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 6.dp)) {
                if (state.searching) { CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp); Spacer(Modifier.width(8.dp)) }
                Text(
                    when {
                        state.hasTextLayer == false -> "Este PDF não possui camada de texto; a busca não encontrará resultados."
                        state.searchQuery.isBlank() -> "Busca na camada de texto do PDF."
                        else -> "${state.searchHits.size} resultado(s)" + if (state.searching) " até agora…" else ""
                    },
                    style = MaterialTheme.typography.labelMedium,
                )
            }
        }
        LazyColumn(Modifier.fillMaxWidth().height(420.dp)) {
            itemsIndexed(state.searchHits) { _, hit ->
                ListItem(
                    headlineContent = {
                        Text(buildAnnotatedString {
                            val s = hit.snippet
                            val a = hit.matchStart.coerceIn(0, s.length)
                            val b = (hit.matchStart + hit.matchLength).coerceIn(a, s.length)
                            append(s.substring(0, a))
                            withStyle(SpanStyle(fontWeight = FontWeight.Bold, background = Color(0x66FFE066))) { append(s.substring(a, b)) }
                            append(s.substring(b))
                        }, maxLines = 3, overflow = TextOverflow.Ellipsis)
                    },
                    supportingContent = { Text("Página ${hit.page + 1}") },
                    modifier = Modifier.clickable { onSelect(hit.page) },
                )
                HorizontalDivider()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotesSheet(vm: PdfReaderViewModel, onDismiss: () -> Unit, onSelect: (Int) -> Unit) {
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
                if (bookmarks.isEmpty()) item { Text("Toque no ícone de marcador para salvar a página atual.", Modifier.padding(20.dp)) }
                items(bookmarks, key = { it.id }) { b ->
                    ListItem(
                        headlineContent = { Text(b.label) },
                        supportingContent = { Text(Formatters.dateTime(b.createdAt)) },
                        trailingContent = { IconButton(onClick = { vm.deleteBookmark(b.id) }) { Icon(Icons.Outlined.Close, "Excluir") } },
                        modifier = Modifier.clickable { b.page?.let(onSelect) },
                    )
                }
            } else {
                if (annotations.isEmpty()) item { Text("Pressione e segure uma página (ou use “Texto da página”) para selecionar trechos, destacar e anotar.", Modifier.padding(20.dp)) }
                items(annotations, key = { it.id }) { a ->
                    ListItem(
                        overlineContent = { Text("${if (a.type == AnnotationType.HIGHLIGHT) "Destaque" else "Nota"} · p. ${(a.page ?: 0) + 1}${if (a.fromOcr) " · OCR" else ""}") },
                        headlineContent = { Text(a.selectedText, maxLines = 3, overflow = TextOverflow.Ellipsis) },
                        supportingContent = { if (a.note.isNotBlank()) Text(a.note, maxLines = 3, overflow = TextOverflow.Ellipsis) },
                        leadingContent = { Box(Modifier.size(14.dp).background(Color(a.color))) },
                        trailingContent = { IconButton(onClick = { vm.deleteAnnotation(a.id) }) { Icon(Icons.Outlined.Close, "Excluir") } },
                        modifier = Modifier.clickable { a.page?.let(onSelect) },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppearanceSheet(
    container: com.oducreative.reader.app.AppContainer,
    direction: PdfScrollDirection, fit: PdfFitMode, keepOn: Boolean, onDismiss: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(20.dp).navigationBarsPadding()) {
            Text("Rolagem", style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                androidx.compose.material3.FilterChip(direction == PdfScrollDirection.VERTICAL, { scope.launch { container.settings.setPdfDirection(PdfScrollDirection.VERTICAL) } }, { Text("Vertical contínua") })
                androidx.compose.material3.FilterChip(direction == PdfScrollDirection.HORIZONTAL, { scope.launch { container.settings.setPdfDirection(PdfScrollDirection.HORIZONTAL) } }, { Text("Horizontal (páginas)") })
            }
            Spacer(Modifier.height(12.dp))
            Text("Ajuste", style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                androidx.compose.material3.FilterChip(fit == PdfFitMode.WIDTH, { scope.launch { container.settings.setPdfFit(PdfFitMode.WIDTH) } }, { Text("Ajustar à largura") })
                androidx.compose.material3.FilterChip(fit == PdfFitMode.PAGE, { scope.launch { container.settings.setPdfFit(PdfFitMode.PAGE) } }, { Text("Página inteira") })
            }
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Manter tela ligada", Modifier.weight(1f))
                androidx.compose.material3.Switch(keepOn, { v -> scope.launch { container.settings.setKeepScreenOn(v) } })
            }
            Text("Modo escuro e sépia aplicam um filtro de cor às páginas (altere o tema em Configurações).", style = MaterialTheme.typography.labelSmall)
            Text("Dica: pinça para zoom, toque duplo para ampliar, toque para mostrar/ocultar controles, toque longo para selecionar texto.", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 6.dp))
        }
    }
}

/**
 * Texto da página em um campo somente-leitura, que permite seleção real de trechos.
 * O PdfRenderer do Android não oferece seleção sobre a imagem da página — por isso a seleção é
 * feita sobre o texto extraído (camada de texto do PDF ou OCR, sempre identificado).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PageTextSheet(
    pageText: PageText,
    onDismiss: () -> Unit,
    onRunOcr: (() -> Unit)?,
    onSpeak: (String) -> Unit,
    onUse: (String) -> Unit,
) {
    var value by remember(pageText) { mutableStateOf(TextFieldValue(pageText.text)) }
    val selected = value.selection.let { if (it.collapsed) "" else value.text.substring(it.min, it.max) }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.padding(horizontal = 20.dp).navigationBarsPadding()) {
            Text(
                if (pageText.fromOcr) "Texto reconhecido por OCR — página ${pageText.page + 1}" else "Texto da página ${pageText.page + 1}",
                style = MaterialTheme.typography.titleMedium,
            )
            if (pageText.fromOcr) Text("Gerado por reconhecimento óptico no aparelho; não é o texto original do PDF e pode conter erros.", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.tertiary)
            Spacer(Modifier.height(8.dp))
            if (pageText.text.isBlank()) {
                Text(
                    if (pageText.fromOcr) "Nenhum texto reconhecido nesta página." else "Esta página não possui camada de texto (provavelmente digitalizada).",
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (onRunOcr != null) Button(onClick = onRunOcr, modifier = Modifier.padding(top = 8.dp)) { Text("Reconhecer texto (OCR)") }
            } else {
                Text("Selecione um trecho (toque longo e arraste) e escolha uma ação.", style = MaterialTheme.typography.labelMedium)
                OutlinedTextField(
                    value = value,
                    onValueChange = { v -> value = v.copy(text = pageText.text, selection = TextRange(v.selection.start.coerceIn(0, pageText.text.length), v.selection.end.coerceIn(0, pageText.text.length))) },
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth().height(320.dp),
                    textStyle = MaterialTheme.typography.bodyLarge,
                )
                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = { onSpeak(selected.ifBlank { pageText.text }) }) { Text(if (selected.isBlank()) "Ouvir página" else "Ouvir seleção") }
                    Spacer(Modifier.width(8.dp))
                    Button(onClick = { onUse(selected.trim()) }, enabled = selected.isNotBlank()) { Text("Destacar / estudar") }
                }
            }
            Spacer(Modifier.height(12.dp))
        }
    }
}
