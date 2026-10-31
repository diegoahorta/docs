package com.oducreative.reader.features.texttospeech

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import com.oducreative.reader.core.datastore.AppSettings
import com.oducreative.reader.core.utilities.LanguageDetector
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

enum class TtsStatus { IDLE, PREPARING, SPEAKING, PAUSED, ERROR }

data class TtsState(
    val status: TtsStatus = TtsStatus.IDLE,
    val title: String = "",
    val bookId: Long? = null,
    val segment: TtsSegment? = null,
    /** Intervalo da palavra sendo pronunciada dentro de [segment] (quando o mecanismo informa). */
    val rangeStart: Int = -1,
    val rangeEnd: Int = -1,
    val language: String? = null,
    val message: String? = null,
    val missingLanguage: String? = null,
) {
    val isActive: Boolean get() = status == TtsStatus.SPEAKING || status == TtsStatus.PAUSED || status == TtsStatus.PREPARING
}

/**
 * Leitura em voz alta com o TextToSpeech do Android, usando somente vozes instaladas no aparelho
 * (funciona offline com vozes locais). Instância única do app: a leitura continua enquanto o
 * usuário navega entre telas. O Android TTS não tem "pausa" nativa — pausar interrompe e
 * retomar repete o trecho atual desde o início.
 */
class TtsController(context: Context, private val scope: CoroutineScope) {
    private val appContext = context.applicationContext
    private val _state = MutableStateFlow(TtsState())
    val state: StateFlow<TtsState> = _state.asStateFlow()

    private var tts: TextToSpeech? = null
    private var ready: CompletableDeferred<Boolean>? = null
    private var source: TtsSource? = null
    private var current: TtsSegment? = null
    private var counter = 0L
    private var feedJob: Job? = null
    @Volatile private var settings = AppSettings()

    fun updateSettings(s: AppSettings) {
        val changed = s.ttsRate != settings.ttsRate || s.ttsPitch != settings.ttsPitch
        settings = s
        tts?.let {
            if (changed) { it.setSpeechRate(s.ttsRate); it.setPitch(s.ttsPitch) }
        }
    }

    private suspend fun ensureEngine(): Boolean {
        tts?.let { if (ready?.await() == true) return true }
        val deferred = CompletableDeferred<Boolean>()
        ready = deferred
        withContext(Dispatchers.Main) {
            tts = TextToSpeech(appContext) { status -> deferred.complete(status == TextToSpeech.SUCCESS) }
        }
        val ok = deferred.await()
        if (!ok) {
            tts?.shutdown(); tts = null
            return false
        }
        tts?.setOnUtteranceProgressListener(listener)
        tts?.setSpeechRate(settings.ttsRate)
        tts?.setPitch(settings.ttsPitch)
        return true
    }

    /** Começa a ler a partir de [newSource]. */
    fun play(newSource: TtsSource) {
        stopInternal(closeSource = true)
        source = newSource
        _state.value = TtsState(status = TtsStatus.PREPARING, title = newSource.title, bookId = newSource.bookId)
        feedJob = scope.launch {
            if (!ensureEngine()) {
                fail("Nenhum mecanismo de leitura em voz alta disponível. Instale ou ative um mecanismo TTS nas configurações do Android.")
                return@launch
            }
            advance()
        }
    }

    fun speakText(text: String, languageHint: String? = null, title: String = "Trecho selecionado") =
        play(TextTtsSource(text, title, languageHint))

    fun pause() {
        if (_state.value.status != TtsStatus.SPEAKING) return
        tts?.stop()
        _state.update { it.copy(status = TtsStatus.PAUSED, rangeStart = -1, rangeEnd = -1) }
    }

    fun resume() {
        val seg = current ?: return
        if (_state.value.status != TtsStatus.PAUSED) return
        scope.launch { speak(seg) }
    }

    fun togglePause() = if (_state.value.status == TtsStatus.SPEAKING) pause() else resume()

    fun skipNext() {
        if (!_state.value.isActive) return
        tts?.stop()
        scope.launch { advance() }
    }

    fun stop() {
        stopInternal(closeSource = true)
        _state.value = TtsState()
    }

    private fun stopInternal(closeSource: Boolean) {
        feedJob?.cancel()
        tts?.stop()
        current = null
        if (closeSource) {
            val s = source
            source = null
            if (s != null) scope.launch(Dispatchers.IO) { runCatching { s.close() } }
        }
    }

    private suspend fun advance() {
        val src = source ?: return
        val next = runCatching { src.next() }.getOrNull()
        if (next == null) {
            stopInternal(closeSource = true)
            _state.value = TtsState(message = "Leitura concluída.")
            return
        }
        speak(next)
    }

    private suspend fun speak(seg: TtsSegment) {
        val engine = tts ?: return
        val src = source
        val langTag = resolveLanguage(seg, src)
        val locale = LanguageDetector.toLocale(langTag) ?: Locale.getDefault()
        val result = withContext(Dispatchers.Main) { engine.setLanguage(locale) }
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            stopInternal(closeSource = true)
            _state.value = TtsState(
                status = TtsStatus.ERROR,
                title = src?.title.orEmpty(),
                message = "A voz para ${LanguageDetector.displayName(langTag ?: locale.toLanguageTag())} não está instalada. " +
                    "Instale os dados de voz nas configurações de TTS do Android ou escolha outro idioma.",
                missingLanguage = langTag ?: locale.toLanguageTag(),
            )
            return
        }
        applyPreferredVoice(engine, locale)
        current = seg
        val id = "odu-${++counter}"
        _state.update {
            it.copy(status = TtsStatus.SPEAKING, segment = seg, rangeStart = -1, rangeEnd = -1, language = langTag, message = null)
        }
        withContext(Dispatchers.Main) {
            engine.speak(seg.text, TextToSpeech.QUEUE_FLUSH, Bundle(), id)
        }
    }

    private fun resolveLanguage(seg: TtsSegment, src: TtsSource?): String? =
        settings.ttsLanguage.takeIf { it.isNotBlank() }
            ?: seg.language?.takeIf { it.isNotBlank() }
            ?: src?.languageHint?.takeIf { it.isNotBlank() }
            ?: LanguageDetector.detect(seg.text)

    private fun applyPreferredVoice(engine: TextToSpeech, locale: Locale) {
        val name = settings.ttsVoice
        if (name.isBlank()) return
        val voice = runCatching { engine.voices?.firstOrNull { it.name == name } }.getOrNull() ?: return
        if (voice.locale.language == locale.language) runCatching { engine.voice = voice }
    }

    /** Vozes instaladas para um idioma (para seleção manual nas configurações). */
    suspend fun voicesFor(languageTag: String?): List<Voice> {
        if (!ensureEngine()) return emptyList()
        val lang = LanguageDetector.toLocale(languageTag)?.language
        return runCatching {
            tts?.voices.orEmpty()
                .filter { lang == null || it.locale.language == lang }
                .filter { !it.features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) }
                .sortedWith(compareBy({ it.isNetworkConnectionRequired }, { it.name }))
        }.getOrDefault(emptyList())
    }

    /** Verifica disponibilidade dos idiomas prioritários. */
    suspend fun languageAvailability(): Map<String, Boolean> {
        if (!ensureEngine()) return emptyMap()
        val engine = tts ?: return emptyMap()
        return LanguageDetector.priorityLanguages.associate { (tag, _) ->
            val r = engine.isLanguageAvailable(Locale.forLanguageTag(tag))
            tag to (r >= TextToSpeech.LANG_AVAILABLE)
        }
    }

    fun openInstallVoiceData(context: Context) {
        val intents = listOf(
            Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA),
            Intent("com.android.settings.TTS_SETTINGS"),
        )
        for (i in intents) {
            try {
                context.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return
            } catch (_: ActivityNotFoundException) {
            }
        }
    }

    private fun fail(msg: String) {
        stopInternal(closeSource = true)
        _state.value = TtsState(status = TtsStatus.ERROR, message = msg)
    }

    fun clearMessage() = _state.update { if (it.isActive) it else TtsState() }

    private val listener = object : UtteranceProgressListener() {
        override fun onStart(utteranceId: String?) {}

        override fun onDone(utteranceId: String?) {
            if (utteranceId != "odu-$counter") return
            if (_state.value.status != TtsStatus.SPEAKING) return
            scope.launch { advance() }
        }

        @Deprecated("Deprecated in Java")
        override fun onError(utteranceId: String?) {
            onError(utteranceId, TextToSpeech.ERROR)
        }

        override fun onError(utteranceId: String?, errorCode: Int) {
            if (utteranceId != "odu-$counter") return
            // Pula trechos problemáticos em vez de interromper a leitura inteira.
            if (_state.value.status == TtsStatus.SPEAKING) scope.launch { advance() }
        }

        override fun onStop(utteranceId: String?, interrupted: Boolean) {}

        /** Sincronização palavra a palavra — só disponível em mecanismos que a reportam. */
        override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) {
            if (utteranceId != "odu-$counter") return
            _state.update { it.copy(rangeStart = start, rangeEnd = end) }
        }
    }

    fun shutdown() {
        stop()
        tts?.shutdown()
        tts = null
    }
}
