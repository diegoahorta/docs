package com.oducreative.reader.app

import android.app.Application
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class OduReaderApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        PDFBoxResourceLoader.init(applicationContext)
        container.appScope.launch {
            container.settings.settings.collectLatest { container.tts.updateSettings(it) }
        }
    }
}
