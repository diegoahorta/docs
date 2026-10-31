package com.oducreative.reader.core.designsystem

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oducreative.reader.core.datastore.ThemeMode

/** Paleta ODU Creative. */
object OduColors {
    val Indigo = Color(0xFF5B3FD9)
    val IndigoDark = Color(0xFF1B1340)
    val Lavender = Color(0xFFC9BEFF)
    val Amber = Color(0xFFF2A93B)
    val SepiaPaper = Color(0xFFF4ECD8)
    val SepiaInk = Color(0xFF5B4636)
}

private val LightScheme = lightColorScheme(
    primary = OduColors.Indigo,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE6DEFF),
    onPrimaryContainer = Color(0xFF1B0063),
    secondary = Color(0xFF8A5A00),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFFDDB3),
    onSecondaryContainer = Color(0xFF2B1700),
    tertiary = Color(0xFF006B5E),
    background = Color(0xFFFBF8FF),
    surface = Color(0xFFFBF8FF),
    surfaceVariant = Color(0xFFE5E0EC),
    surfaceContainer = Color(0xFFF1ECF6),
    surfaceContainerHigh = Color(0xFFEBE6F0),
    surfaceContainerLow = Color(0xFFF6F2FB),
)

private val DarkScheme = darkColorScheme(
    primary = OduColors.Lavender,
    onPrimary = Color(0xFF2E009C),
    primaryContainer = Color(0xFF4321C0),
    onPrimaryContainer = Color(0xFFE6DEFF),
    secondary = Color(0xFFFFB955),
    onSecondary = Color(0xFF482900),
    secondaryContainer = Color(0xFF673D00),
    onSecondaryContainer = Color(0xFFFFDDB3),
    tertiary = Color(0xFF53DBC5),
    background = Color(0xFF141218),
    surface = Color(0xFF141218),
    surfaceVariant = Color(0xFF48454E),
    surfaceContainer = Color(0xFF211F26),
    surfaceContainerHigh = Color(0xFF2B2930),
    surfaceContainerLow = Color(0xFF1D1B20),
)

private val SepiaScheme = lightColorScheme(
    primary = Color(0xFF7A4E2D),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEAD7BE),
    onPrimaryContainer = Color(0xFF2E1500),
    secondary = Color(0xFF8A5A00),
    secondaryContainer = Color(0xFFF2DFC0),
    onSecondaryContainer = Color(0xFF2B1700),
    background = OduColors.SepiaPaper,
    onBackground = OduColors.SepiaInk,
    surface = OduColors.SepiaPaper,
    onSurface = OduColors.SepiaInk,
    surfaceVariant = Color(0xFFE6D9BF),
    onSurfaceVariant = Color(0xFF6B5A48),
    surfaceContainer = Color(0xFFEDE2CA),
    surfaceContainerHigh = Color(0xFFE7DBC1),
    surfaceContainerLow = Color(0xFFF1E7D1),
)

val OduTypography = Typography(
    displaySmall = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 34.sp, lineHeight = 40.sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 26.sp, lineHeight = 32.sp),
    headlineSmall = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold, fontSize = 22.sp, lineHeight = 28.sp),
    titleLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 26.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 22.sp),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp),
)

val OduShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(22.dp),
)

/** Tema efetivo (útil para leitores ajustarem cores do conteúdo). */
enum class EffectiveTheme { LIGHT, DARK, SEPIA }

val LocalEffectiveTheme = staticCompositionLocalOf { EffectiveTheme.LIGHT }

@Composable
fun resolveTheme(mode: ThemeMode): EffectiveTheme = when (mode) {
    ThemeMode.LIGHT -> EffectiveTheme.LIGHT
    ThemeMode.DARK -> EffectiveTheme.DARK
    ThemeMode.SEPIA -> EffectiveTheme.SEPIA
    ThemeMode.SYSTEM -> if (isSystemInDarkTheme()) EffectiveTheme.DARK else EffectiveTheme.LIGHT
}

@Composable
fun OduTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val effective = resolveTheme(themeMode)
    val context = LocalContext.current
    val scheme: ColorScheme = when {
        effective == EffectiveTheme.SEPIA -> SepiaScheme
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (effective == EffectiveTheme.DARK) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        effective == EffectiveTheme.DARK -> DarkScheme
        else -> LightScheme
    }
    androidx.compose.runtime.CompositionLocalProvider(LocalEffectiveTheme provides effective) {
        MaterialTheme(colorScheme = scheme, typography = OduTypography, shapes = OduShapes, content = content)
    }
}
