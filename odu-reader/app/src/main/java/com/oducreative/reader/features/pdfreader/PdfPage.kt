package com.oducreative.reader.features.pdfreader

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.oducreative.reader.core.designsystem.EffectiveTheme

/** Filtros de cor para leitura de PDF em modo escuro (inversão) e sépia. */
fun pdfColorFilter(theme: EffectiveTheme): ColorFilter? = when (theme) {
    EffectiveTheme.LIGHT -> null
    EffectiveTheme.DARK -> ColorFilter.colorMatrix(
        ColorMatrix(
            floatArrayOf(
                -0.85f, 0f, 0f, 0f, 235f,
                0f, -0.85f, 0f, 0f, 235f,
                0f, 0f, -0.85f, 0f, 235f,
                0f, 0f, 0f, 1f, 0f,
            )
        )
    )
    EffectiveTheme.SEPIA -> ColorFilter.colorMatrix(
        ColorMatrix(
            floatArrayOf(
                0.393f * 0.6f + 0.4f, 0.769f * 0.6f, 0.189f * 0.6f, 0f, 0f,
                0.349f * 0.6f, 0.686f * 0.6f + 0.4f, 0.168f * 0.6f, 0f, 0f,
                0.272f * 0.6f, 0.534f * 0.6f, 0.131f * 0.6f + 0.25f, 0f, 0f,
                0f, 0f, 0f, 1f, 0f,
            )
        )
    )
}

/** Página renderizada sob demanda; o bitmap é liberado para o cache quando sai da tela. */
@Composable
fun PdfPage(
    page: Int,
    ratio: Float,
    renderWidthPx: Int,
    theme: EffectiveTheme,
    render: suspend (Int, Int) -> Bitmap?,
    modifier: Modifier = Modifier,
) {
    var bitmap by remember(page) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(page, renderWidthPx) {
        if (renderWidthPx > 0) bitmap = render(page, renderWidthPx) ?: bitmap
    }
    Box(
        modifier
            .aspectRatio(1f / ratio.coerceIn(0.1f, 10f))
            .background(Color.White)
            .semantics { contentDescription = "Página ${page + 1}" },
        contentAlignment = Alignment.Center,
    ) {
        val bmp = bitmap
        if (bmp != null && !bmp.isRecycled) {
            Image(
                bmp.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.FillBounds,
                colorFilter = pdfColorFilter(theme),
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            CircularProgressIndicator(Modifier.size(28.dp), color = MaterialTheme.colorScheme.primary, strokeWidth = 2.dp)
        }
    }
}
