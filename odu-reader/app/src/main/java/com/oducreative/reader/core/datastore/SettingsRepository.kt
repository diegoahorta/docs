package com.oducreative.reader.core.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

enum class ThemeMode { SYSTEM, LIGHT, DARK, SEPIA }
enum class LibrarySort { RECENT, NAME, ADDED, PROGRESS }
enum class PdfScrollDirection { VERTICAL, HORIZONTAL }
enum class PdfFitMode { WIDTH, PAGE }
enum class ReaderFont(val label: String, val cssName: String) {
    SERIF("Serifada", "serif"),
    SANS("Sem serifa", "sans-serif"),
    MONO("Monoespaçada", "monospace"),
    ORIGINAL("Original do livro", "")
}
enum class ReaderTextAlign { START, JUSTIFY }

data class AppSettings(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val dynamicColor: Boolean = false,
    val librarySort: LibrarySort = LibrarySort.RECENT,
    // EPUB
    val fontScale: Float = 1.0f,
    val font: ReaderFont = ReaderFont.ORIGINAL,
    val lineHeight: Float = 1.5f,
    val pageMargins: Float = 1.0f,
    val letterSpacing: Float = 0f,
    val textAlign: ReaderTextAlign = ReaderTextAlign.START,
    val epubScroll: Boolean = false,
    // PDF
    val pdfDirection: PdfScrollDirection = PdfScrollDirection.VERTICAL,
    val pdfFit: PdfFitMode = PdfFitMode.WIDTH,
    val keepScreenOn: Boolean = true,
    // TTS
    val ttsRate: Float = 1.0f,
    val ttsPitch: Float = 1.0f,
    val ttsLanguage: String = "", // vazio = automático
    val ttsVoice: String = "",
    // Metas
    val dailyGoalMinutes: Int = 20,
    val weeklyGoalMinutes: Int = 140,
    // Ferramentas de estudo (todas desativadas por padrão quando dependem de rede)
    val studyTargetLanguage: String = "pt",
    val translationEnabled: Boolean = false,
    val onlineDictionaryEnabled: Boolean = false,
    val aiEnabled: Boolean = false,
    val aiApiKey: String = "",
    val aiModel: String = DEFAULT_AI_MODEL,
    val ocrEnabled: Boolean = true,
    val onboardingDone: Boolean = false,
) {
    companion object {
        const val DEFAULT_AI_MODEL = "claude-opus-5-5"
    }
}

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "odu_settings")

/** Preferências do usuário persistidas em DataStore (armazenamento privado do app). */
class SettingsRepository(private val context: Context) {

    private object K {
        val theme = stringPreferencesKey("theme")
        val dynamic = booleanPreferencesKey("dynamic_color")
        val sort = stringPreferencesKey("library_sort")
        val fontScale = floatPreferencesKey("font_scale")
        val font = stringPreferencesKey("font")
        val lineHeight = floatPreferencesKey("line_height")
        val margins = floatPreferencesKey("margins")
        val letterSpacing = floatPreferencesKey("letter_spacing")
        val align = stringPreferencesKey("align")
        val epubScroll = booleanPreferencesKey("epub_scroll")
        val pdfDir = stringPreferencesKey("pdf_dir")
        val pdfFit = stringPreferencesKey("pdf_fit")
        val keepOn = booleanPreferencesKey("keep_screen_on")
        val ttsRate = floatPreferencesKey("tts_rate")
        val ttsPitch = floatPreferencesKey("tts_pitch")
        val ttsLang = stringPreferencesKey("tts_lang")
        val ttsVoice = stringPreferencesKey("tts_voice")
        val dailyGoal = intPreferencesKey("daily_goal")
        val weeklyGoal = intPreferencesKey("weekly_goal")
        val targetLang = stringPreferencesKey("study_target_lang")
        val translation = booleanPreferencesKey("translation_enabled")
        val dictionary = booleanPreferencesKey("online_dictionary")
        val ai = booleanPreferencesKey("ai_enabled")
        val aiKey = stringPreferencesKey("ai_key")
        val aiModel = stringPreferencesKey("ai_model")
        val ocr = booleanPreferencesKey("ocr_enabled")
        val onboarding = booleanPreferencesKey("onboarding_done")
    }

    val settings: Flow<AppSettings> = context.dataStore.data
        .catch { emit(androidx.datastore.preferences.core.emptyPreferences()) }
        .map { p ->
            val d = AppSettings()
            AppSettings(
                themeMode = p[K.theme].toEnum(d.themeMode),
                dynamicColor = p[K.dynamic] ?: d.dynamicColor,
                librarySort = p[K.sort].toEnum(d.librarySort),
                fontScale = p[K.fontScale] ?: d.fontScale,
                font = p[K.font].toEnum(d.font),
                lineHeight = p[K.lineHeight] ?: d.lineHeight,
                pageMargins = p[K.margins] ?: d.pageMargins,
                letterSpacing = p[K.letterSpacing] ?: d.letterSpacing,
                textAlign = p[K.align].toEnum(d.textAlign),
                epubScroll = p[K.epubScroll] ?: d.epubScroll,
                pdfDirection = p[K.pdfDir].toEnum(d.pdfDirection),
                pdfFit = p[K.pdfFit].toEnum(d.pdfFit),
                keepScreenOn = p[K.keepOn] ?: d.keepScreenOn,
                ttsRate = p[K.ttsRate] ?: d.ttsRate,
                ttsPitch = p[K.ttsPitch] ?: d.ttsPitch,
                ttsLanguage = p[K.ttsLang] ?: d.ttsLanguage,
                ttsVoice = p[K.ttsVoice] ?: d.ttsVoice,
                dailyGoalMinutes = p[K.dailyGoal] ?: d.dailyGoalMinutes,
                weeklyGoalMinutes = p[K.weeklyGoal] ?: d.weeklyGoalMinutes,
                studyTargetLanguage = p[K.targetLang] ?: d.studyTargetLanguage,
                translationEnabled = p[K.translation] ?: d.translationEnabled,
                onlineDictionaryEnabled = p[K.dictionary] ?: d.onlineDictionaryEnabled,
                aiEnabled = p[K.ai] ?: d.aiEnabled,
                aiApiKey = p[K.aiKey] ?: d.aiApiKey,
                aiModel = p[K.aiModel] ?: d.aiModel,
                ocrEnabled = p[K.ocr] ?: d.ocrEnabled,
                onboardingDone = p[K.onboarding] ?: d.onboardingDone,
            )
        }

    suspend fun setTheme(v: ThemeMode) = put(K.theme, v.name)
    suspend fun setDynamicColor(v: Boolean) = put(K.dynamic, v)
    suspend fun setLibrarySort(v: LibrarySort) = put(K.sort, v.name)
    suspend fun setFontScale(v: Float) = put(K.fontScale, v.coerceIn(0.6f, 2.5f))
    suspend fun setFont(v: ReaderFont) = put(K.font, v.name)
    suspend fun setLineHeight(v: Float) = put(K.lineHeight, v.coerceIn(1.0f, 2.2f))
    suspend fun setPageMargins(v: Float) = put(K.margins, v.coerceIn(0.5f, 2.5f))
    suspend fun setLetterSpacing(v: Float) = put(K.letterSpacing, v.coerceIn(0f, 0.3f))
    suspend fun setTextAlign(v: ReaderTextAlign) = put(K.align, v.name)
    suspend fun setEpubScroll(v: Boolean) = put(K.epubScroll, v)
    suspend fun setPdfDirection(v: PdfScrollDirection) = put(K.pdfDir, v.name)
    suspend fun setPdfFit(v: PdfFitMode) = put(K.pdfFit, v.name)
    suspend fun setKeepScreenOn(v: Boolean) = put(K.keepOn, v)
    suspend fun setTtsRate(v: Float) = put(K.ttsRate, v.coerceIn(0.25f, 3f))
    suspend fun setTtsPitch(v: Float) = put(K.ttsPitch, v.coerceIn(0.5f, 2f))
    suspend fun setTtsLanguage(v: String) = put(K.ttsLang, v)
    suspend fun setTtsVoice(v: String) = put(K.ttsVoice, v)
    suspend fun setDailyGoal(v: Int) = put(K.dailyGoal, v.coerceIn(5, 600))
    suspend fun setWeeklyGoal(v: Int) = put(K.weeklyGoal, v.coerceIn(10, 4200))
    suspend fun setStudyTargetLanguage(v: String) = put(K.targetLang, v)
    suspend fun setTranslationEnabled(v: Boolean) = put(K.translation, v)
    suspend fun setOnlineDictionaryEnabled(v: Boolean) = put(K.dictionary, v)
    suspend fun setAiEnabled(v: Boolean) = put(K.ai, v)
    suspend fun setAiApiKey(v: String) = put(K.aiKey, v.trim())
    suspend fun setAiModel(v: String) = put(K.aiModel, v.trim().ifEmpty { AppSettings.DEFAULT_AI_MODEL })
    suspend fun setOcrEnabled(v: Boolean) = put(K.ocr, v)
    suspend fun setOnboardingDone(v: Boolean) = put(K.onboarding, v)

    /** Exclusão explícita de todas as preferências (LGPD). */
    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }

    private suspend fun <T> put(key: Preferences.Key<T>, value: T) {
        context.dataStore.edit { it[key] = value }
    }

    private inline fun <reified E : Enum<E>> String?.toEnum(default: E): E =
        this?.let { runCatching { enumValueOf<E>(it) }.getOrNull() } ?: default
}
