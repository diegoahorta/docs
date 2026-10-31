package com.oducreative.reader.features.studytools

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.VolumeUp
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.Extension
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.outlined.Psychology
import androidx.compose.material.icons.outlined.Style
import androidx.compose.material.icons.outlined.Translate
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.HighlightColors

private enum class Mode { MENU, NOTE, FLASHCARD, CHUNK, PATTERN, RESULT, AI_MENU }

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SelectionActionsSheet(
    selection: SelectionContext,
    onDismiss: () -> Unit,
    /** Quando o leitor suporta destaque visual (EPUB), informa a cor escolhida. */
    highlightSupported: Boolean = true,
) {
    val container = appContainer()
    val vm: StudyActionsViewModel = viewModel(key = "study-actions") { StudyActionsViewModel(container) }
    val settings by vm.settings.collectAsState()
    val result by vm.result.collectAsState()
    val toast by vm.toast.collectAsState()
    val context = LocalContext.current
    var mode by rememberSaveable { mutableStateOf(Mode.MENU) }
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    LaunchedEffect(Unit) { vm.reset() }
    LaunchedEffect(toast) {
        toast?.let { Toast.makeText(context, it, Toast.LENGTH_SHORT).show(); vm.consumeToast() }
    }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheet) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).navigationBarsPadding()
        ) {
            Box(
                Modifier.fillMaxWidth().clip(MaterialTheme.shapes.medium)
                    .background(MaterialTheme.colorScheme.surfaceContainerHigh).padding(12.dp)
            ) {
                SelectionContainer {
                    Text(
                        "“${selection.text}”",
                        style = MaterialTheme.typography.bodyMedium,
                        fontStyle = FontStyle.Italic,
                        maxLines = if (mode == Mode.MENU) 6 else 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            if (selection.fromOcr) {
                Text("Texto reconhecido por OCR — pode conter erros.", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.tertiary, modifier = Modifier.padding(top = 4.dp))
            }
            Spacer(Modifier.height(12.dp))

            when (mode) {
                Mode.MENU -> {
                    if (highlightSupported) {
                        Text("Destacar", style = MaterialTheme.typography.labelLarge)
                        Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            HighlightColors.all.forEach { color ->
                                Box(
                                    Modifier.size(36.dp).clip(CircleShape).background(Color(color))
                                        .border(1.dp, MaterialTheme.colorScheme.outline, CircleShape)
                                        .clickable {
                                            vm.saveAnnotation(selection, AnnotationType.HIGHLIGHT, color)
                                            onDismiss()
                                        }
                                )
                            }
                        }
                    }
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(onClick = { mode = Mode.NOTE }, label = { Text("Nota") }, leadingIcon = { Icon(Icons.Outlined.EditNote, null) })
                        AssistChip(onClick = { copy(context, selection.text); onDismiss() }, label = { Text("Copiar") }, leadingIcon = { Icon(Icons.Outlined.ContentCopy, null) })
                        AssistChip(onClick = { vm.speak(selection); onDismiss() }, label = { Text("Ouvir") }, leadingIcon = { Icon(Icons.AutoMirrored.Outlined.VolumeUp, null) })
                        AssistChip(onClick = { vm.lookup(selection.text.trim().split(Regex("\\s+")).first()); mode = Mode.RESULT }, label = { Text("Dicionário") }, leadingIcon = { Icon(Icons.AutoMirrored.Outlined.MenuBook, null) })
                        AssistChip(onClick = { vm.translate(selection.text, selection.language); mode = Mode.RESULT }, label = { Text("Traduzir") }, leadingIcon = { Icon(Icons.Outlined.Translate, null) })
                        AssistChip(onClick = { mode = Mode.FLASHCARD }, label = { Text("Flashcard") }, leadingIcon = { Icon(Icons.Outlined.Style, null) })
                        AssistChip(onClick = { mode = Mode.CHUNK }, label = { Text("Chunking") }, leadingIcon = { Icon(Icons.Outlined.Extension, null) })
                        AssistChip(onClick = { mode = Mode.PATTERN }, label = { Text("Discover the Pattern") }, leadingIcon = { Icon(Icons.Outlined.Psychology, null) })
                        if (settings.aiEnabled) {
                            AssistChip(onClick = { mode = Mode.AI_MENU }, label = { Text("IA") }, leadingIcon = { Icon(Icons.Outlined.AutoAwesome, null) })
                        }
                    }
                    val apps = remember { container.dictionary.localDictionaryApps() }
                    if (apps.isNotEmpty()) {
                        Spacer(Modifier.height(8.dp))
                        Text("Abrir em app instalado (offline)", style = MaterialTheme.typography.labelMedium)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            apps.take(6).forEach { info ->
                                AssistChip(
                                    onClick = {
                                        runCatching { context.startActivity(container.dictionary.processTextIntent(selection.text, info)) }
                                        onDismiss()
                                    },
                                    label = { Text(info.loadLabel(context.packageManager).toString(), maxLines = 1) },
                                )
                            }
                        }
                    }
                }

                Mode.NOTE -> {
                    var note by rememberSaveable { mutableStateOf("") }
                    var color by rememberSaveable { mutableStateOf(HighlightColors.YELLOW) }
                    OutlinedTextField(note, { note = it }, label = { Text("Sua nota") }, modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp))
                    if (highlightSupported) {
                        Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            HighlightColors.all.forEach { c ->
                                Box(
                                    Modifier.size(28.dp).clip(CircleShape).background(Color(c))
                                        .border(if (c == color) 3.dp else 1.dp, MaterialTheme.colorScheme.primary, CircleShape)
                                        .clickable { color = c }
                                )
                            }
                        }
                    }
                    ActionRow(onCancel = { mode = Mode.MENU }, confirmLabel = "Salvar", enabled = note.isNotBlank()) {
                        vm.saveAnnotation(selection, AnnotationType.NOTE, color, note); onDismiss()
                    }
                }

                Mode.FLASHCARD -> {
                    val short = selection.text.length <= 80
                    var front by rememberSaveable { mutableStateOf(if (short) selection.text.trim() else "") }
                    var back by rememberSaveable { mutableStateOf("") }
                    var ctxText by rememberSaveable { mutableStateOf(if (short) "" else selection.text.trim()) }
                    Text("Novo flashcard", style = MaterialTheme.typography.titleMedium)
                    OutlinedTextField(front, { front = it }, label = { Text("Palavra ou frase") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(back, { back = it }, label = { Text("Tradução ou definição") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(ctxText, { ctxText = it }, label = { Text("Contexto") }, modifier = Modifier.fillMaxWidth())
                    Text("Referência: ${selection.bookTitle}${selection.page?.let { " · p. ${it + 1}" } ?: ""}", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 4.dp))
                    if (settings.translationEnabled) {
                        TextButton(onClick = { vm.translate(front, selection.language) }) { Text("Sugerir tradução (on-device)") }
                        val r = result
                        if (r is ToolResult.Text && back.isBlank()) LaunchedEffect(r) { back = r.body }
                        if (r is ToolResult.Error) Text(r.message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    ActionRow(onCancel = { mode = Mode.MENU }, confirmLabel = "Criar", enabled = front.isNotBlank() && back.isNotBlank()) {
                        vm.saveFlashcard(selection, front, back, ctxText); onDismiss()
                    }
                }

                Mode.CHUNK -> {
                    var edited by rememberSaveable { mutableStateOf(Chunker.chunk(selection.text, selection.language).joinToString(" / ")) }
                    val chunks = Chunker.chunk(edited, selection.language)
                    Text("Blocos linguísticos", style = MaterialTheme.typography.titleMedium)
                    Text("Ajuste os blocos usando “/” como separador.", style = MaterialTheme.typography.bodySmall)
                    FlowRow(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        chunks.forEachIndexed { i, ch ->
                            val colors = listOf(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.secondaryContainer, MaterialTheme.colorScheme.tertiaryContainer)
                            Text(ch, modifier = Modifier.clip(MaterialTheme.shapes.small).background(colors[i % colors.size]).padding(horizontal = 10.dp, vertical = 6.dp))
                        }
                    }
                    OutlinedTextField(edited, { edited = it }, modifier = Modifier.fillMaxWidth())
                    ActionRow(onCancel = { mode = Mode.MENU }, confirmLabel = "Salvar como flashcards", enabled = chunks.isNotEmpty()) {
                        chunks.forEach { vm.saveFlashcard(selection, it, "", selection.text) }
                        onDismiss()
                    }
                    Text("Os cartões criados ficam com o verso em branco para você completar na área de estudo.", style = MaterialTheme.typography.labelSmall)
                }

                Mode.PATTERN -> {
                    var title by rememberSaveable { mutableStateOf("") }
                    var hypothesis by rememberSaveable { mutableStateOf("") }
                    Text("Discover the Pattern — Grammar Rule", style = MaterialTheme.typography.titleMedium)
                    Text("Observe a frase. Que construção se repete? Escreva sua hipótese antes de consultar qualquer explicação.", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(title, { title = it }, label = { Text("Nome do padrão (ex.: present perfect)") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(hypothesis, { hypothesis = it }, label = { Text("Minha hipótese") }, modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp))
                    ActionRow(onCancel = { mode = Mode.MENU }, confirmLabel = "Salvar observação", enabled = true) {
                        vm.savePattern(selection, title, hypothesis); onDismiss()
                    }
                }

                Mode.AI_MENU -> {
                    Text("Inteligência artificial (opcional)", style = MaterialTheme.typography.titleMedium)
                    Text("Ao tocar em uma ação, SOMENTE o trecho acima é enviado ao serviço de IA configurado (${settings.aiModel}). Requer internet.", style = MaterialTheme.typography.bodySmall)
                    FlowRow(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AiTask.entries.forEach { t ->
                            AssistChip(onClick = { vm.runAi(t, selection.text); mode = Mode.RESULT }, label = { Text(t.label) })
                        }
                    }
                    TextButton(onClick = { mode = Mode.MENU }) { Text("Voltar") }
                }

                Mode.RESULT -> {
                    ResultView(result)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        val r = result
                        if (r is ToolResult.Text) {
                            TextButton(onClick = { copy(context, r.body) }) { Text("Copiar") }
                            TextButton(onClick = {
                                vm.saveAnnotation(selection, AnnotationType.NOTE, HighlightColors.BLUE, "${r.title}:\n${r.body}")
                            }) { Text("Salvar como nota") }
                        }
                        TextButton(onClick = { vm.reset(); mode = Mode.MENU }) { Text("Voltar") }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun ResultView(result: ToolResult) {
    when (result) {
        ToolResult.Idle -> {}
        ToolResult.Loading -> Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        is ToolResult.Error -> Text(result.message, color = MaterialTheme.colorScheme.error)
        is ToolResult.Text -> Column {
            Text(result.title, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(6.dp))
            SelectionContainer { Text(result.body, style = MaterialTheme.typography.bodyLarge) }
            result.note?.let { Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp)) }
        }
        is ToolResult.Dictionary -> Column {
            Text(result.word, style = MaterialTheme.typography.titleLarge)
            if (result.entries.isEmpty()) Text("Nenhuma definição encontrada.")
            result.entries.forEach { e ->
                HorizontalDivider(Modifier.padding(vertical = 6.dp))
                Text("${e.language} · ${e.partOfSpeech}", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                e.definitions.forEachIndexed { i, d -> Text("${i + 1}. $d", style = MaterialTheme.typography.bodyMedium) }
            }
            Text("Fonte: Wiktionary (CC BY-SA)", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
private fun ActionRow(onCancel: () -> Unit, confirmLabel: String, enabled: Boolean, onConfirm: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.End) {
        TextButton(onClick = onCancel) { Text("Voltar") }
        Spacer(Modifier.size(8.dp))
        Button(onClick = onConfirm, enabled = enabled) { Text(confirmLabel) }
    }
}

fun copy(context: Context, text: String) {
    val cm = context.getSystemService(ClipboardManager::class.java)
    cm?.setPrimaryClip(ClipData.newPlainText("ODU Reader", text))
}
