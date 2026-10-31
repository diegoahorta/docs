package com.oducreative.reader.features.studytools

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oducreative.reader.app.AppContainer
import com.oducreative.reader.core.datastore.AppSettings
import com.oducreative.reader.core.utilities.LanguageDetector
import com.oducreative.reader.data.models.AnnotationEntity
import com.oducreative.reader.data.models.AnnotationType
import com.oducreative.reader.data.models.FlashcardEntity
import com.oducreative.reader.data.models.GrammarPatternEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** Contexto de um trecho selecionado em qualquer leitor. */
data class SelectionContext(
    val text: String,
    val bookId: Long,
    val bookTitle: String,
    /** Página (PDF) ou Locator JSON (EPUB). */
    val locator: String,
    val page: Int? = null,
    val chapter: String? = null,
    val language: String? = null,
    val fromOcr: Boolean = false,
)

sealed interface ToolResult {
    data object Idle : ToolResult
    data object Loading : ToolResult
    data class Text(val title: String, val body: String, val note: String? = null) : ToolResult
    data class Dictionary(val word: String, val entries: List<DictionaryEntry>) : ToolResult
    data class Error(val message: String) : ToolResult
}

class StudyActionsViewModel(private val c: AppContainer) : ViewModel() {
    val settings: StateFlow<AppSettings> = c.settings.settings.stateIn(viewModelScope, SharingStarted.Eagerly, AppSettings())

    private val _result = MutableStateFlow<ToolResult>(ToolResult.Idle)
    val result: StateFlow<ToolResult> = _result.asStateFlow()

    private val _toast = MutableStateFlow<String?>(null)
    val toast: StateFlow<String?> = _toast.asStateFlow()
    fun consumeToast() { _toast.value = null }

    fun reset() { _result.value = ToolResult.Idle }

    fun saveAnnotation(ctx: SelectionContext, type: AnnotationType, color: Int, note: String = "") = viewModelScope.launch {
        c.annotations.add(
            AnnotationEntity(
                bookId = ctx.bookId, type = type, locator = ctx.locator, page = ctx.page, chapter = ctx.chapter,
                selectedText = ctx.text, note = note, color = color, fromOcr = ctx.fromOcr,
            )
        )
        _toast.value = if (type == AnnotationType.HIGHLIGHT && note.isBlank()) "Destaque salvo" else "Nota salva"
    }

    fun saveFlashcard(ctx: SelectionContext, front: String, back: String, context: String) = viewModelScope.launch {
        c.study.addFlashcard(
            FlashcardEntity(
                bookId = ctx.bookId, front = front.trim(), back = back.trim(), context = context.trim(),
                bookTitle = ctx.bookTitle, locator = ctx.locator, page = ctx.page,
                language = ctx.language ?: LanguageDetector.detect(ctx.text),
            )
        )
        _toast.value = "Flashcard criado"
    }

    fun savePattern(ctx: SelectionContext, title: String, hypothesis: String) = viewModelScope.launch {
        c.study.addPattern(GrammarPatternEntity(title = title.ifBlank { "Padrão sem título" }, examples = ctx.text.trim(), hypothesis = hypothesis, bookId = ctx.bookId))
        _toast.value = "Frase adicionada a “Discover the Pattern”"
    }

    fun speak(ctx: SelectionContext) = c.tts.speakText(ctx.text, ctx.language, "Trecho de ${ctx.bookTitle}")

    fun lookup(word: String) = viewModelScope.launch {
        val s = settings.first()
        if (!s.onlineDictionaryEnabled) {
            _result.value = ToolResult.Error("O dicionário online está desativado. Ative em Configurações › Ferramentas de estudo, ou use um app de dicionário instalado.")
            return@launch
        }
        _result.value = ToolResult.Loading
        _result.value = c.dictionary.lookupOnline(word).fold(
            onSuccess = { ToolResult.Dictionary(word, it) },
            onFailure = { ToolResult.Error(it.message ?: "Falha na consulta.") },
        )
    }

    fun translate(text: String, sourceLang: String?) = viewModelScope.launch {
        val s = settings.first()
        if (!s.translationEnabled) {
            _result.value = ToolResult.Error("A tradução está desativada. Ative em Configurações › Ferramentas de estudo (modelos on-device do ML Kit).")
            return@launch
        }
        val src = sourceLang?.takeIf { it.isNotBlank() } ?: LanguageDetector.detect(text)
        if (src == null) {
            _result.value = ToolResult.Error("Não foi possível identificar o idioma do trecho.")
            return@launch
        }
        _result.value = ToolResult.Loading
        _result.value = c.translation.translate(text, src, s.studyTargetLanguage).fold(
            onSuccess = { ToolResult.Text("Tradução (${LanguageDetector.displayName(src)} → ${LanguageDetector.displayName(s.studyTargetLanguage)})", it, "Traduzido no aparelho (ML Kit)") },
            onFailure = { ToolResult.Error(it.message ?: "Falha na tradução.") },
        )
    }

    fun runAi(task: AiTask, text: String) = viewModelScope.launch {
        val s = settings.first()
        if (!s.aiEnabled) {
            _result.value = ToolResult.Error("Os recursos de IA estão desativados. Ative em Configurações › Inteligência artificial.")
            return@launch
        }
        if (!c.dictionary.isOnline()) {
            _result.value = ToolResult.Error("Sem conexão. Os recursos de IA requerem internet.")
            return@launch
        }
        _result.value = ToolResult.Loading
        _result.value = c.ai.run(task, text, s.aiApiKey, s.aiModel).fold(
            onSuccess = { ToolResult.Text(task.label, it, "Gerado por IA (${s.aiModel}). Somente o trecho selecionado foi enviado. Verifique as informações.") },
            onFailure = { ToolResult.Error(it.message ?: "Falha no serviço de IA.") },
        )
    }
}
