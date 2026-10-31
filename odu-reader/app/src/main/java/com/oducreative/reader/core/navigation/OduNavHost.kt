package com.oducreative.reader.core.navigation

import android.content.Context
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.BookFormat
import com.oducreative.reader.features.annotations.AnnotationsScreen
import com.oducreative.reader.features.dashboard.DashboardScreen
import com.oducreative.reader.features.epubreader.EpubReaderActivity
import com.oducreative.reader.features.library.LibraryScreen
import com.oducreative.reader.features.pdfreader.PdfReaderScreen
import com.oducreative.reader.features.settings.SettingsScreen
import com.oducreative.reader.features.studytools.StudyToolsScreen
import com.oducreative.reader.features.texttospeech.TtsMiniPlayer

/** Abre o leitor adequado ao formato. EPUB usa uma Activity própria (navegador Readium baseado em Fragment). */
fun openBook(context: Context, nav: NavHostController, book: BookEntity) {
    when (book.format) {
        BookFormat.PDF -> nav.navigate(Routes.pdf(book.id)) { launchSingleTop = true }
        BookFormat.EPUB -> context.startActivity(EpubReaderActivity.intent(context, book.id))
    }
}

@Composable
fun OduAppShell(
    nav: NavHostController,
    widthClass: WindowWidthSizeClass,
    snackbar: SnackbarHostState,
    onImportRequest: () -> Unit,
) {
    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route
    val isTop = TopDestination.entries.any { it.route == route }
    val useRail = widthClass != WindowWidthSizeClass.Compact

    fun go(dest: TopDestination) {
        nav.navigate(dest.route) {
            popUpTo(nav.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    Row(Modifier.fillMaxSize()) {
        if (isTop && useRail) {
            NavigationRail {
                TopDestination.entries.forEach { d ->
                    NavigationRailItem(
                        selected = route == d.route,
                        onClick = { go(d) },
                        icon = { Icon(d.icon, contentDescription = null) },
                        label = { Text(stringResource(d.label)) },
                    )
                }
            }
        }
        Scaffold(
            modifier = Modifier.weight(1f),
            snackbarHost = { SnackbarHost(snackbar) },
            bottomBar = {
                Column {
                    if (isTop) TtsMiniPlayer()
                    if (isTop && !useRail) {
                        NavigationBar {
                            TopDestination.entries.forEach { d ->
                                NavigationBarItem(
                                    selected = route == d.route,
                                    onClick = { go(d) },
                                    icon = { Icon(d.icon, contentDescription = null) },
                                    label = { Text(stringResource(d.label), maxLines = 1) },
                                )
                            }
                        }
                    }
                }
            },
        ) { padding ->
            NavHost(
                navController = nav,
                startDestination = Routes.LIBRARY,
                modifier = Modifier.padding(padding),
                enterTransition = { fadeIn() },
                exitTransition = { fadeOut() },
            ) {
                composable(Routes.LIBRARY) {
                    LibraryScreen(
                        favoritesOnly = false,
                        onOpen = { openBook(nav.context, nav, it) },
                        onImport = onImportRequest,
                        onSettings = { nav.navigate(Routes.SETTINGS) },
                    )
                }
                composable(Routes.FAVORITES) {
                    LibraryScreen(
                        favoritesOnly = true,
                        onOpen = { openBook(nav.context, nav, it) },
                        onImport = onImportRequest,
                        onSettings = { nav.navigate(Routes.SETTINGS) },
                    )
                }
                composable(Routes.ANNOTATIONS) { AnnotationsScreen(onOpenBook = { openBook(nav.context, nav, it) }) }
                composable(Routes.STUDY) { StudyToolsScreen() }
                composable(Routes.DASHBOARD) { DashboardScreen(onOpen = { openBook(nav.context, nav, it) }) }
                composable(Routes.SETTINGS) { SettingsScreen(onBack = { nav.popBackStack() }) }
                composable(Routes.PDF, arguments = listOf(navArgument("bookId") { type = NavType.LongType })) { entry ->
                    PdfReaderScreen(
                        bookId = entry.arguments?.getLong("bookId") ?: 0L,
                        onBack = { nav.popBackStack() },
                    )
                }
            }
        }
    }
}
