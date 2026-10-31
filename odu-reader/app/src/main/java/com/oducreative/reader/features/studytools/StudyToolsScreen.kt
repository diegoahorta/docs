package com.oducreative.reader.features.studytools

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Psychology
import androidx.compose.material.icons.outlined.Style
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.oducreative.reader.app.AppContainer
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.designsystem.EmptyState
import com.oducreative.reader.core.utilities.Formatters
import com.oducreative.reader.data.models.FlashcardEntity
import com.oducreative.reader.data.models.GrammarPatternEntity
import com.oducreative.reader.data.repositories.ReviewGrade
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class StudyToolsViewModel(private val c: AppContainer) : ViewModel() {
    val flashcards = c.study.flashcards.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val patterns = c.study.patterns.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val settings = c.settings.settings.stateIn(viewModelScope, SharingStarted.Eagerly, com.oducreative.reader.core.datastore.AppSettings())

    fun due(cards: List<FlashcardEntity>, now: Long = System.currentTimeMillis()) = cards.filter { it.markedForReview && it.dueAt <= now }

    fun review(card: FlashcardEntity, grade: ReviewGrade) = viewModelScope.launch { c.study.review(card, grade) }
    fun save(card: FlashcardEntity) = viewModelScope.launch { if (card.id == 0L) c.study.addFlashcard(card) else c.study.updateFlashcard(card) }
    fun delete(card: FlashcardEntity) = viewModelScope.launch { c.study.deleteFlashcard(card.id) }
    fun toggleReview(card: FlashcardEntity) = viewModelScope.launch { c.study.updateFlashcard(card.copy(markedForReview = !card.markedForReview)) }
    fun savePattern(p: GrammarPatternEntity) = viewModelScope.launch { if (p.id == 0L) c.study.addPattern(p) else c.study.updatePattern(p) }
    fun deletePattern(p: GrammarPatternEntity) = viewModelScope.launch { c.study.deletePattern(p.id) }
    fun speak(text: String, lang: String?) = c.tts.speakText(text, lang, "Estudo")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudyToolsScreen() {
    val container = appContainer()
    val vm: StudyToolsViewModel = viewModel { StudyToolsViewModel(container) }
    val cards by vm.flashcards.collectAsState()
    val patterns by vm.patterns.collectAsState()
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var editingCard by remember { mutableStateOf<FlashcardEntity?>(null) }
    var editingPattern by remember { mutableStateOf<GrammarPatternEntity?>(null) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("ODU Study Tools") }) },
        floatingActionButton = {
            when (tab) {
                1 -> FloatingActionButton(onClick = { editingCard = FlashcardEntity(front = "", back = "") }) { Icon(Icons.Filled.Add, "Novo flashcard") }
                3 -> FloatingActionButton(onClick = { editingPattern = GrammarPatternEntity(title = "", examples = "") }) { Icon(Icons.Filled.Add, "Novo padrão") }
                else -> {}
            }
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            ScrollableTabRow(selectedTabIndex = tab, edgePadding = 12.dp) {
                listOf("Revisão (${vm.due(cards).size})", "Flashcards", "Chunking", "Discover the Pattern").forEachIndexed { i, t ->
                    Tab(tab == i, { tab = i }, text = { Text(t) })
                }
            }
            when (tab) {
                0 -> ReviewTab(vm.due(cards), onGrade = vm::review, onSpeak = vm::speak)
                1 -> FlashcardList(cards, onEdit = { editingCard = it }, onDelete = vm::delete, onToggle = vm::toggleReview)
                2 -> ChunkingTab(onSpeak = vm::speak)
                3 -> PatternsTab(patterns, onEdit = { editingPattern = it })
            }
        }
    }

    editingCard?.let { card ->
        var front by remember(card.id) { mutableStateOf(card.front) }
        var back by remember(card.id) { mutableStateOf(card.back) }
        var ctx by remember(card.id) { mutableStateOf(card.context) }
        AlertDialog(
            onDismissRequest = { editingCard = null },
            title = { Text(if (card.id == 0L) "Novo flashcard" else "Editar flashcard") },
            text = {
                Column {
                    OutlinedTextField(front, { front = it }, label = { Text("Palavra ou frase") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(back, { back = it }, label = { Text("Tradução ou definição") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(ctx, { ctx = it }, label = { Text("Contexto") }, modifier = Modifier.fillMaxWidth())
                    card.bookTitle?.let { Text("Referência: $it${card.page?.let { p -> " · p. ${p + 1}" } ?: ""}", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 6.dp)) }
                }
            },
            confirmButton = {
                TextButton(enabled = front.isNotBlank(), onClick = { vm.save(card.copy(front = front.trim(), back = back.trim(), context = ctx.trim())); editingCard = null }) { Text("Salvar") }
            },
            dismissButton = { TextButton(onClick = { editingCard = null }) { Text("Cancelar") } },
        )
    }

    editingPattern?.let { p ->
        PatternEditor(p, onDismiss = { editingPattern = null }, onSave = { vm.savePattern(it); editingPattern = null }, onDelete = { vm.deletePattern(p); editingPattern = null })
    }
}

@Composable
private fun ReviewTab(due: List<FlashcardEntity>, onGrade: (FlashcardEntity, ReviewGrade) -> Unit, onSpeak: (String, String?) -> Unit) {
    if (due.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            EmptyState(Icons.Outlined.CheckCircle, "Tudo revisado!", "Não há cartões para revisar agora. Crie flashcards a partir de trechos selecionados na leitura.")
        }
        return
    }
    val card = due.first()
    var revealed by remember(card.id) { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().padding(20.dp).verticalScroll(rememberScrollState()), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("${due.size} cartão(ões) para revisar", style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(16.dp))
        Card(
            Modifier.fillMaxWidth().heightIn(min = 240.dp).clickable { revealed = true },
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        ) {
            Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(card.front, style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
                TextButton(onClick = { onSpeak(card.front, card.language) }) { Text("Ouvir") }
                AnimatedContent(revealed, label = "reveal") { shown ->
                    if (shown) Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        HorizontalDivider(Modifier.padding(vertical = 12.dp))
                        Text(card.back.ifBlank { "(verso em branco — edite o cartão)" }, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
                        if (card.context.isNotBlank()) Text(card.context, style = MaterialTheme.typography.bodyMedium, fontStyle = FontStyle.Italic, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
                        card.bookTitle?.let { Text(it + (card.page?.let { p -> " · p. ${p + 1}" } ?: ""), style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 8.dp)) }
                    } else Text("Toque para ver a resposta", style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(top = 24.dp))
                }
            }
        }
        Spacer(Modifier.height(20.dp))
        if (revealed) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { onGrade(card, ReviewGrade.AGAIN) }) { Text("De novo") }
                OutlinedButton(onClick = { onGrade(card, ReviewGrade.HARD) }) { Text("Difícil") }
                FilledTonalButton(onClick = { onGrade(card, ReviewGrade.GOOD) }) { Text("Bom") }
                Button(onClick = { onGrade(card, ReviewGrade.EASY) }) { Text("Fácil") }
            }
        }
    }
}

@Composable
private fun FlashcardList(cards: List<FlashcardEntity>, onEdit: (FlashcardEntity) -> Unit, onDelete: (FlashcardEntity) -> Unit, onToggle: (FlashcardEntity) -> Unit) {
    if (cards.isEmpty()) {
        EmptyState(Icons.Outlined.Style, "Nenhum flashcard", "Selecione uma palavra ou frase no leitor e escolha “Flashcard”, ou toque em + para criar manualmente.")
        return
    }
    LazyColumn(contentPadding = PaddingValues(bottom = 88.dp)) {
        items(cards, key = { it.id }) { c ->
            ListItem(
                headlineContent = { Text(c.front, maxLines = 2, overflow = TextOverflow.Ellipsis) },
                supportingContent = {
                    Column {
                        Text(c.back.ifBlank { "(sem verso)" }, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text(
                            listOfNotNull(c.bookTitle, if (c.markedForReview) "revisão em ${Formatters.date(c.dueAt)}" else "fora da revisão").joinToString(" · "),
                            style = MaterialTheme.typography.labelSmall,
                        )
                    }
                },
                trailingContent = {
                    Row {
                        TextButton(onClick = { onToggle(c) }) { Text(if (c.markedForReview) "Pausar" else "Revisar") }
                        IconButton(onClick = { onDelete(c) }) { Icon(Icons.Outlined.Delete, "Excluir") }
                    }
                },
                modifier = Modifier.clickable { onEdit(c) },
            )
            HorizontalDivider()
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ChunkingTab(onSpeak: (String, String?) -> Unit) {
    var text by rememberSaveable { mutableStateOf("") }
    val chunks = remember(text) { Chunker.chunk(text) }
    Column(Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
        Text("Chunking", style = MaterialTheme.typography.titleLarge)
        Text(
            "Cole ou digite uma frase para dividi-la em blocos linguísticos. Use “/” para ajustar os blocos manualmente. Funciona offline para português, inglês, espanhol, francês, alemão, japonês, coreano e chinês.",
            style = MaterialTheme.typography.bodyMedium,
        )
        OutlinedTextField(text, { text = it }, modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp).heightIn(min = 100.dp), label = { Text("Frase") })
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            val colors = listOf(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.secondaryContainer, MaterialTheme.colorScheme.tertiaryContainer)
            chunks.forEachIndexed { i, ch ->
                Text(ch, style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.background(colors[i % colors.size], MaterialTheme.shapes.small).clickable { onSpeak(ch, null) }.padding(horizontal = 12.dp, vertical = 8.dp))
            }
        }
        if (chunks.isNotEmpty()) {
            Text("Toque em um bloco para ouvi-lo.", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 8.dp))
            TextButton(onClick = { text = chunks.joinToString(" / ") }) { Text("Editar blocos com “/”") }
        }
    }
}

@Composable
private fun PatternsTab(patterns: List<GrammarPatternEntity>, onEdit: (GrammarPatternEntity) -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Card(Modifier.fillMaxWidth().padding(16.dp)) {
            Column(Modifier.padding(16.dp)) {
                Text("Discover the Pattern — Grammar Rule", style = MaterialTheme.typography.titleMedium)
                Text(
                    "1. Reúna frases semelhantes da leitura.  2. Observe o que se repete.  3. Escreva sua hipótese.  4. Só então revele ou escreva a explicação e compare.",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
        if (patterns.isEmpty()) {
            EmptyState(Icons.Outlined.Psychology, "Nenhum padrão ainda", "No leitor, selecione uma frase e escolha “Discover the Pattern”, ou toque em +.")
            return
        }
        LazyColumn(contentPadding = PaddingValues(bottom = 88.dp)) {
            items(patterns, key = { it.id }) { p ->
                ListItem(
                    headlineContent = { Text(p.title) },
                    supportingContent = {
                        Column {
                            Text("${p.examples.lines().count { it.isNotBlank() }} frase(s) observada(s)", style = MaterialTheme.typography.labelSmall)
                            if (p.hypothesis.isNotBlank()) Text("Hipótese: ${p.hypothesis}", maxLines = 2, overflow = TextOverflow.Ellipsis)
                        }
                    },
                    trailingContent = { if (p.explanationRevealed) Icon(Icons.Outlined.CheckCircle, "Explicação revelada") },
                    modifier = Modifier.clickable { onEdit(p) },
                )
                HorizontalDivider()
            }
        }
    }
}

@Composable
private fun PatternEditor(p: GrammarPatternEntity, onDismiss: () -> Unit, onSave: (GrammarPatternEntity) -> Unit, onDelete: () -> Unit) {
    val container = appContainer()
    val actions: StudyActionsViewModel = viewModel(key = "study-actions") { StudyActionsViewModel(container) }
    val settings by actions.settings.collectAsState()
    val aiResult by actions.result.collectAsState()
    var title by remember(p.id) { mutableStateOf(p.title) }
    var examples by remember(p.id) { mutableStateOf(p.examples) }
    var hypothesis by remember(p.id) { mutableStateOf(p.hypothesis) }
    var explanation by remember(p.id) { mutableStateOf(p.explanation) }
    var revealed by remember(p.id) { mutableStateOf(p.explanationRevealed) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Discover the Pattern") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                OutlinedTextField(title, { title = it }, label = { Text("Padrão") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(examples, { examples = it }, label = { Text("Frases observadas (uma por linha)") }, modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp))
                OutlinedTextField(hypothesis, { hypothesis = it }, label = { Text("Minha hipótese") }, modifier = Modifier.fillMaxWidth().heightIn(min = 80.dp))
                Spacer(Modifier.height(8.dp))
                if (!revealed) {
                    Button(onClick = { revealed = true }, enabled = hypothesis.isNotBlank()) { Text("Escrevi minha hipótese — ver/escrever explicação") }
                    if (hypothesis.isBlank()) Text("Escreva sua hipótese primeiro.", style = MaterialTheme.typography.labelSmall)
                } else {
                    OutlinedTextField(explanation, { explanation = it }, label = { Text("Explicação (da aula, gramática ou IA)") }, modifier = Modifier.fillMaxWidth().heightIn(min = 80.dp))
                    if (settings.aiEnabled) {
                        TextButton(onClick = { actions.runAi(AiTask.EXPLAIN, "Padrão: $title\nFrases:\n$examples\nHipótese do estudante: $hypothesis\nAvalie a hipótese e explique a regra gramatical.") }) {
                            Text("Pedir explicação à IA (envia as frases acima)")
                        }
                        when (val r = aiResult) {
                            is ToolResult.Loading -> Text("Consultando IA…")
                            is ToolResult.Text -> TextButton(onClick = { explanation = r.body; actions.reset() }) { Text("Usar resposta da IA") }
                            is ToolResult.Error -> Text(r.message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            else -> {}
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                onSave(p.copy(title = title.ifBlank { "Padrão sem título" }, examples = examples, hypothesis = hypothesis, explanation = explanation, explanationRevealed = revealed))
            }) { Text("Salvar") }
        },
        dismissButton = {
            Row {
                if (p.id != 0L) TextButton(onClick = onDelete) { Text("Excluir") }
                TextButton(onClick = onDismiss) { Text("Cancelar") }
            }
        },
    )
}
