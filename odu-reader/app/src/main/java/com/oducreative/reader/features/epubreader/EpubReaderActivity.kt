package com.oducreative.reader.features.epubreader

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.fragment.app.FragmentContainerView
import androidx.fragment.app.commitNow
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.oducreative.reader.R
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.designsystem.OduTheme
import com.oducreative.reader.features.studytools.SelectionContext
import kotlinx.coroutines.launch
import org.readium.r2.navigator.epub.EpubNavigatorFactory
import org.readium.r2.navigator.epub.EpubNavigatorFragment
import org.readium.r2.navigator.epub.EpubPreferences
import org.readium.r2.shared.publication.Publication
import org.readium.r2.shared.util.AbsoluteUrl

/**
 * Leitor EPUB baseado no Readium Kotlin Toolkit (EpubNavigatorFragment).
 * Suporta EPUB reflowable e fixed-layout, sistemas de escrita CJK/RTL e escrita vertical
 * conforme os metadados do livro. Livros com DRM não são abertos.
 */
class EpubReaderActivity : AppCompatActivity() {

    private val bookId: Long by lazy { intent.getLongExtra(EXTRA_BOOK_ID, 0L) }
    val vm: EpubReaderViewModel by viewModels {
        viewModelFactory { initializer { EpubReaderViewModel(appContainer, bookId) } }
    }

    /** Navegador ativo (null até o fragment ser criado). */
    val navigatorState = mutableStateOf<EpubNavigatorFragment?>(null)
    /** Trecho selecionado pelo usuário para as ferramentas de estudo. */
    val selectionState = mutableStateOf<SelectionContext?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        // O fragment do navegador é recriado a partir do progresso salvo, por isso não restauramos
        // o estado dos fragments (evita recriá-lo sem a FragmentFactory do Readium).
        super.onCreate(null)
        setContent {
            val settings by vm.settings.collectAsState()
            OduTheme(themeMode = settings.themeMode, dynamicColor = settings.dynamicColor) {
                EpubReaderScreen(activity = this, onBack = { finish() })
            }
        }
    }

    /** Cria o fragment do navegador dentro do container já anexado à janela. */
    fun attachNavigator(container: FragmentContainerView, publication: Publication, initialPreferences: EpubPreferences) {
        if (supportFragmentManager.findFragmentByTag(NAV_TAG) != null) {
            navigatorState.value = supportFragmentManager.findFragmentByTag(NAV_TAG) as? EpubNavigatorFragment
            return
        }
        val factory = EpubNavigatorFactory(publication)
        supportFragmentManager.fragmentFactory = factory.createFragmentFactory(
            initialLocator = vm.state.value.initialLocator,
            initialPreferences = initialPreferences,
            listener = object : EpubNavigatorFragment.Listener {
                override fun onExternalLinkActivated(url: AbsoluteUrl) {
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url.toString()))) }
                }
            },
            configuration = EpubNavigatorFragment.Configuration(selectionActionModeCallback = selectionCallback),
        )
        supportFragmentManager.commitNow {
            replace(container.id, EpubNavigatorFragment::class.java, Bundle(), NAV_TAG)
        }
        val navigator = supportFragmentManager.findFragmentByTag(NAV_TAG) as? EpubNavigatorFragment ?: return
        navigatorState.value = navigator
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                navigator.currentLocator.collect { vm.onLocatorChanged(it) }
            }
        }
    }

    /** Adiciona "Estudar" ao menu nativo de seleção de texto do Readium. */
    private val selectionCallback = object : ActionMode.Callback {
        override fun onCreateActionMode(mode: ActionMode, menu: Menu): Boolean {
            menu.add(Menu.NONE, R.id.menu_odu_highlight, 0, "Destacar")
            menu.add(Menu.NONE, R.id.menu_odu_study, 1, "Estudar / anotar")
            return true
        }

        override fun onPrepareActionMode(mode: ActionMode, menu: Menu): Boolean = false

        override fun onActionItemClicked(mode: ActionMode, item: MenuItem): Boolean {
            if (item.itemId != R.id.menu_odu_study && item.itemId != R.id.menu_odu_highlight) return false
            val navigator = navigatorState.value ?: return false
            val quick = item.itemId == R.id.menu_odu_highlight
            lifecycleScope.launch {
                val selection = navigator.currentSelection() ?: return@launch
                val text = selection.locator.text.highlight?.trim().orEmpty()
                val book = vm.state.value.book ?: return@launch
                if (text.isEmpty()) return@launch
                val ctx = SelectionContext(
                    text = text, bookId = book.id, bookTitle = book.displayTitle,
                    locator = selection.locator.toJSON().toString(), chapter = selection.locator.title,
                    language = vm.state.value.publication?.metadata?.languages?.firstOrNull() ?: book.language,
                )
                navigator.clearSelection()
                if (quick) quickHighlight(ctx) else selectionState.value = ctx
            }
            mode.finish()
            return true
        }

        override fun onDestroyActionMode(mode: ActionMode) {}
    }

    private fun quickHighlight(ctx: SelectionContext) {
        lifecycleScope.launch {
            appContainer.annotations.add(
                com.oducreative.reader.data.models.AnnotationEntity(
                    bookId = ctx.bookId, type = com.oducreative.reader.data.models.AnnotationType.HIGHLIGHT,
                    locator = ctx.locator, chapter = ctx.chapter, selectedText = ctx.text,
                )
            )
        }
    }

    override fun onPause() {
        super.onPause()
        vm.onPauseLifecycle()
    }

    override fun onResume() {
        super.onResume()
        vm.onResumeLifecycle()
    }

    companion object {
        private const val EXTRA_BOOK_ID = "bookId"
        private const val NAV_TAG = "epub_navigator"

        fun intent(context: Context, bookId: Long): Intent =
            Intent(context, EpubReaderActivity::class.java).putExtra(EXTRA_BOOK_ID, bookId)

    }
}
