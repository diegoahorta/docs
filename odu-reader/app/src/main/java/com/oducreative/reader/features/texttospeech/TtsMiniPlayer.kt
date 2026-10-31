package com.oducreative.reader.features.texttospeech

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.outlined.RecordVoiceOver
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.oducreative.reader.R
import com.oducreative.reader.app.appContainer

/** Barra persistente de controle do TTS, visível em todas as telas enquanto houver leitura. */
@Composable
fun TtsMiniPlayer(modifier: Modifier = Modifier) {
    val tts = appContainer().tts
    val state by tts.state.collectAsState()
    val context = LocalContext.current
    val visible = state.isActive || state.status == TtsStatus.ERROR
    AnimatedVisibility(visible = visible, modifier = modifier) {
        Surface(tonalElevation = 6.dp, color = MaterialTheme.colorScheme.secondaryContainer) {
            if (state.status == TtsStatus.ERROR) {
                Column(Modifier.fillMaxWidth().padding(12.dp)) {
                    Text(state.message.orEmpty(), style = MaterialTheme.typography.bodyMedium)
                    Row {
                        if (state.missingLanguage != null) {
                            TextButton(onClick = { tts.openInstallVoiceData(context) }) { Text("Instalar voz") }
                        }
                        TextButton(onClick = { tts.clearMessage() }) { Text(stringResource(R.string.action_close)) }
                    }
                }
                return@Surface
            }
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.RecordVoiceOver, contentDescription = null)
                Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                    Text(state.title, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    val seg = state.segment?.text.orEmpty()
                    val text = buildAnnotatedString {
                        if (state.rangeStart in 0 until state.rangeEnd && state.rangeEnd <= seg.length) {
                            append(seg.substring(0, state.rangeStart))
                            withStyle(SpanStyle(fontWeight = FontWeight.Bold, background = MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))) {
                                append(seg.substring(state.rangeStart, state.rangeEnd))
                            }
                            append(seg.substring(state.rangeEnd))
                        } else append(seg)
                    }
                    Text(text, style = MaterialTheme.typography.bodySmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                when (state.status) {
                    TtsStatus.PREPARING -> CircularProgressIndicator(Modifier.size(24.dp), strokeWidth = 2.dp)
                    else -> IconButton(onClick = { tts.togglePause() }) {
                        if (state.status == TtsStatus.SPEAKING) Icon(Icons.Filled.Pause, stringResource(R.string.tts_pause))
                        else Icon(Icons.Filled.PlayArrow, stringResource(R.string.tts_resume))
                    }
                }
                IconButton(onClick = { tts.skipNext() }) { Icon(Icons.Filled.SkipNext, stringResource(R.string.tts_next)) }
                IconButton(onClick = { tts.stop() }) { Icon(Icons.Filled.Stop, stringResource(R.string.tts_stop)) }
            }
        }
    }
}
