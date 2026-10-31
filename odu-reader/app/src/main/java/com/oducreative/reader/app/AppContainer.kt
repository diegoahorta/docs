package com.oducreative.reader.app

import android.content.Context
import com.oducreative.reader.core.database.OduDatabase
import com.oducreative.reader.core.datastore.SettingsRepository
import com.oducreative.reader.data.repositories.AnnotationRepository
import com.oducreative.reader.data.repositories.BookRepository
import com.oducreative.reader.data.repositories.ReadingStatsRepository
import com.oducreative.reader.data.repositories.StudyRepository
import com.oducreative.reader.data.sources.BookImporter
import com.oducreative.reader.data.sources.ReadiumServices
import com.oducreative.reader.features.studytools.AiAssistant
import com.oducreative.reader.features.studytools.DictionaryService
import com.oducreative.reader.features.studytools.TranslationService
import com.oducreative.reader.features.texttospeech.TtsController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

/** Injeção de dependências manual (simples, sem reflexão e sem geração de código extra). */
class AppContainer(context: Context) {
    private val appContext = context.applicationContext
    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database: OduDatabase by lazy { OduDatabase.build(appContext) }
    val settings: SettingsRepository by lazy { SettingsRepository(appContext) }
    val readium: ReadiumServices by lazy { ReadiumServices(appContext) }
    private val importer: BookImporter by lazy { BookImporter(appContext, readium) }

    val books: BookRepository by lazy { BookRepository(database.bookDao(), database.collectionDao(), importer) }
    val annotations: AnnotationRepository by lazy { AnnotationRepository(database.annotationDao(), database.bookmarkDao()) }
    val study: StudyRepository by lazy { StudyRepository(database.studyDao()) }
    val stats: ReadingStatsRepository by lazy { ReadingStatsRepository(database.sessionDao()) }

    val tts: TtsController by lazy { TtsController(appContext, appScope) }
    val dictionary: DictionaryService by lazy { DictionaryService(appContext) }
    val translation: TranslationService by lazy { TranslationService() }
    val ai: AiAssistant by lazy { AiAssistant() }

    /** Exclusão explícita de todos os dados pessoais (LGPD). */
    suspend fun deleteAllPersonalData() {
        tts.stop()
        books.deleteEverything() // cascata remove marcadores, anotações e sessões
        study.deleteAll()
        stats.deleteAll()
        settings.clearAll()
        appContext.cacheDir.listFiles()?.forEach { it.deleteRecursively() }
    }
}
