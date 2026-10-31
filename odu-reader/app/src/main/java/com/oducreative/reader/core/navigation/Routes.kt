package com.oducreative.reader.core.navigation

import androidx.annotation.StringRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.LibraryBooks
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.School
import androidx.compose.ui.graphics.vector.ImageVector
import com.oducreative.reader.R

object Routes {
    const val LIBRARY = "library"
    const val FAVORITES = "favorites"
    const val ANNOTATIONS = "annotations"
    const val STUDY = "study"
    const val DASHBOARD = "dashboard"
    const val SETTINGS = "settings"
    const val PDF = "pdf/{bookId}"
    fun pdf(bookId: Long) = "pdf/$bookId"
}

enum class TopDestination(val route: String, @StringRes val label: Int, val icon: ImageVector) {
    LIBRARY(Routes.LIBRARY, R.string.nav_library, Icons.AutoMirrored.Outlined.LibraryBooks),
    FAVORITES(Routes.FAVORITES, R.string.nav_favorites, Icons.Outlined.FavoriteBorder),
    ANNOTATIONS(Routes.ANNOTATIONS, R.string.nav_annotations, Icons.Outlined.EditNote),
    STUDY(Routes.STUDY, R.string.nav_study, Icons.Outlined.School),
    DASHBOARD(Routes.DASHBOARD, R.string.nav_dashboard, Icons.Outlined.BarChart),
}
