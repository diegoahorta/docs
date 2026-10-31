package com.oducreative.reader.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.lifecycle.lifecycleScope
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.oducreative.reader.core.datastore.AppSettings
import com.oducreative.reader.core.designsystem.OduTheme
import com.oducreative.reader.core.navigation.OduAppShell
import com.oducreative.reader.core.navigation.openBook
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.sources.ImportResult
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private val container get() = (application as OduReaderApp).container
    // Channels guardam eventos emitidos antes de a UI começar a coletar (ex.: arquivo compartilhado na abertura).
    private val openRequests = Channel<BookEntity>(Channel.BUFFERED)
    private val messages = Channel<String>(Channel.BUFFERED)

    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) handleIncoming(intent)

        setContent {
            val settings by container.settings.settings.collectAsState(initial = AppSettings())
            OduTheme(themeMode = settings.themeMode, dynamicColor = settings.dynamicColor) {
                val nav = rememberNavController()
                val snackbar = remember { SnackbarHostState() }
                val scope = rememberCoroutineScope()
                val windowSize = calculateWindowSizeClass(this)

                val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
                    if (uris.isNotEmpty()) scope.launch { importUris(uris, openSingle = uris.size == 1) }
                }

                LaunchedEffect(Unit) { openRequests.receiveAsFlow().collect { openBook(this@MainActivity, nav, it) } }
                LaunchedEffect(Unit) { messages.receiveAsFlow().collect { snackbar.showSnackbar(it) } }

                OduAppShell(
                    nav = nav,
                    widthClass = windowSize.widthSizeClass,
                    snackbar = snackbar,
                    onImportRequest = { picker.launch(arrayOf("application/pdf", "application/epub+zip", "application/octet-stream")) },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIncoming(intent)
    }

    /** Trata arquivos abertos/compartilhados a partir de outros aplicativos. */
    private fun handleIncoming(intent: Intent?) {
        intent ?: return
        val uri: Uri? = when (intent.action) {
            Intent.ACTION_VIEW -> intent.data
            Intent.ACTION_SEND -> if (Build.VERSION.SDK_INT >= 33) {
                intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
            } else {
                @Suppress("DEPRECATION") intent.getParcelableExtra(Intent.EXTRA_STREAM)
            }
            else -> null
        }
        if (uri != null) {
            lifecycleScope.launch { importUris(listOf(uri), openSingle = true) }
        }
    }

    private suspend fun importUris(uris: List<Uri>, openSingle: Boolean) {
        messages.trySend(if (uris.size == 1) "Importando…" else "Importando ${uris.size} arquivos…")
        var ok = 0
        val failures = mutableListOf<String>()
        for (uri in uris) {
            when (val r = container.books.import(uri)) {
                is ImportResult.Success -> {
                    ok++
                    if (openSingle) openRequests.trySend(r.book)
                    else if (r.alreadyInLibrary) messages.trySend("“${r.book.displayTitle}” já está na biblioteca.")
                }
                is ImportResult.Failure -> failures += "${r.fileName}: ${r.reason}"
            }
        }
        if (failures.isNotEmpty()) messages.trySend(failures.joinToString("\n"))
        else if (!openSingle) messages.trySend("$ok arquivo(s) importado(s).")
    }
}
