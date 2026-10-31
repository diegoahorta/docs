package com.oducreative.reader.features.settings

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.speech.tts.Voice
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.oducreative.reader.BuildConfig
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.datastore.AppSettings
import com.oducreative.reader.core.datastore.ThemeMode
import com.oducreative.reader.core.designsystem.SectionTitle
import com.oducreative.reader.core.utilities.LanguageDetector
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(onBack: () -> Unit) {
    val container = appContainer()
    val st = container.settings
    val s by st.settings.collectAsState(initial = AppSettings())
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var confirmDelete by remember { mutableStateOf(false) }
    var aiDisclosure by remember { mutableStateOf(false) }
    var availability by remember { mutableStateOf<Map<String, Boolean>?>(null) }
    var voices by remember { mutableStateOf<List<Voice>>(emptyList()) }

    LaunchedEffect(s.ttsLanguage) {
        voices = container.tts.voicesFor(s.ttsLanguage.ifBlank { null })
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Configurações") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
            SectionTitle("Aparência")
            FlowRow(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(ThemeMode.SYSTEM to "Sistema", ThemeMode.LIGHT to "Claro", ThemeMode.DARK to "Escuro", ThemeMode.SEPIA to "Sépia").forEach { (m, l) ->
                    FilterChip(s.themeMode == m, { scope.launch { st.setTheme(m) } }, { Text(l) })
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                SwitchRow("Cores dinâmicas (Material You)", "Usa as cores do papel de parede em vez da paleta ODU.", s.dynamicColor) { v -> scope.launch { st.setDynamicColor(v) } }
            }
            SwitchRow("Manter tela ligada durante a leitura", null, s.keepScreenOn) { v -> scope.launch { st.setKeepScreenOn(v) } }
            Text(
                "Fonte, espaçamento, margens, alinhamento e modo de rolagem do EPUB são ajustados dentro do leitor (ícone “Aa”).",
                style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 16.dp),
            )

            HorizontalDivider(Modifier.padding(vertical = 12.dp))
            SectionTitle("Leitura em voz alta (TTS)")
            SliderRow("Velocidade: ${"%.2f".format(s.ttsRate)}x", s.ttsRate, 0.5f..2.5f) { v -> scope.launch { st.setTtsRate(v) } }
            SliderRow("Tom: ${"%.2f".format(s.ttsPitch)}", s.ttsPitch, 0.5f..2.0f) { v -> scope.launch { st.setTtsPitch(v) } }
            DropdownSetting(
                label = "Idioma da voz",
                value = if (s.ttsLanguage.isBlank()) "Automático (idioma do documento)" else LanguageDetector.displayName(s.ttsLanguage),
                options = listOf("" to "Automático (idioma do documento)") + LanguageDetector.priorityLanguages,
            ) { tag -> scope.launch { st.setTtsLanguage(tag); st.setTtsVoice("") } }
            if (voices.isNotEmpty()) {
                DropdownSetting(
                    label = "Voz",
                    value = s.ttsVoice.ifBlank { "Padrão do mecanismo" },
                    options = listOf("" to "Padrão do mecanismo") + voices.map { v ->
                        v.name to "${v.name}${if (v.isNetworkConnectionRequired) " (online)" else ""}"
                    },
                ) { name -> scope.launch { st.setTtsVoice(name) } }
            }
            Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { scope.launch { availability = container.tts.languageAvailability() } }) { Text("Verificar idiomas") }
                OutlinedButton(onClick = { container.tts.openInstallVoiceData(context) }) { Text("Instalar vozes") }
            }
            availability?.let { map ->
                Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    if (map.isEmpty()) Text("Nenhum mecanismo TTS disponível no aparelho.", color = MaterialTheme.colorScheme.error)
                    map.forEach { (tag, ok) ->
                        Text("${if (ok) "✓" else "✗"} ${LanguageDetector.displayName(tag)}${if (ok) "" else " — voz não instalada"}", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            Text("Somente vozes instaladas no aparelho são usadas. Vozes marcadas como “online” dependem do mecanismo TTS do sistema.", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 16.dp))

            HorizontalDivider(Modifier.padding(vertical = 12.dp))
            SectionTitle("Metas de leitura")
            SliderRow("Meta diária: ${s.dailyGoalMinutes} min", s.dailyGoalMinutes.toFloat(), 5f..180f) { v -> scope.launch { st.setDailyGoal(v.toInt()) } }
            SliderRow("Meta semanal: ${s.weeklyGoalMinutes} min", s.weeklyGoalMinutes.toFloat(), 30f..1260f) { v -> scope.launch { st.setWeeklyGoal(v.toInt()) } }

            HorizontalDivider(Modifier.padding(vertical = 12.dp))
            SectionTitle("Ferramentas de estudo")
            DropdownSetting(
                label = "Idioma de destino (tradução/estudo)",
                value = LanguageDetector.displayName(s.studyTargetLanguage),
                options = LanguageDetector.priorityLanguages.map { it.first.substringBefore('-') to it.second },
            ) { tag -> scope.launch { st.setStudyTargetLanguage(tag) } }
            SwitchRow(
                "Tradução on-device (ML Kit)",
                "Traduz no aparelho. Requer internet apenas para baixar cada modelo de idioma (~30 MB) uma vez.",
                s.translationEnabled,
            ) { v -> scope.launch { st.setTranslationEnabled(v) } }
            SwitchRow(
                "Dicionário online (Wiktionary)",
                "Envia somente a palavra consultada ao Wiktionary. Requer internet. Apps de dicionário instalados funcionam offline sem esta opção.",
                s.onlineDictionaryEnabled,
            ) { v -> scope.launch { st.setOnlineDictionaryEnabled(v) } }
            SwitchRow("OCR para PDFs digitalizados", "Reconhecimento de texto no aparelho (ML Kit, alfabeto latino). O texto reconhecido é sempre identificado como OCR.", s.ocrEnabled) { v -> scope.launch { st.setOcrEnabled(v) } }

            HorizontalDivider(Modifier.padding(vertical = 12.dp))
            SectionTitle("Inteligência artificial (opcional)")
            SwitchRow(
                "Ativar recursos de IA",
                "Resumo, explicação de frases, vocabulário e exercícios. Desativado por padrão.",
                s.aiEnabled,
            ) { v -> if (v) aiDisclosure = true else scope.launch { st.setAiEnabled(false) } }
            if (s.aiEnabled) {
                var key by remember(s.aiApiKey) { mutableStateOf(s.aiApiKey) }
                var model by remember(s.aiModel) { mutableStateOf(s.aiModel) }
                OutlinedTextField(
                    key, { key = it }, label = { Text("Chave de API da Anthropic") }, singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                )
                OutlinedTextField(model, { model = it }, label = { Text("Modelo") }, singleLine = true, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp))
                Row(Modifier.padding(horizontal = 16.dp)) {
                    TextButton(onClick = { scope.launch { st.setAiApiKey(key); st.setAiModel(model) } }) { Text("Salvar") }
                    TextButton(onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://console.anthropic.com/"))) }) { Text("Obter chave") }
                }
                Text(
                    "A chave fica apenas no armazenamento privado deste aparelho. Somente o trecho que você escolher é enviado, e só quando você toca em uma ação de IA. Livros completos nunca são enviados.",
                    style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 16.dp),
                )
            }

            HorizontalDivider(Modifier.padding(vertical = 12.dp))
            SectionTitle("Privacidade e dados (LGPD)")
            Text(
                "Livros, anotações, progresso e estatísticas ficam somente no armazenamento privado do app neste aparelho. Nada é enviado automaticamente a servidores, e os dados não entram no backup em nuvem.",
                style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp),
            )
            OutlinedButton(onClick = { confirmDelete = true }, modifier = Modifier.padding(16.dp)) {
                Text("Excluir todos os meus dados", color = MaterialTheme.colorScheme.error)
            }

            HorizontalDivider(Modifier.padding(vertical = 12.dp))
            SectionTitle("Sobre")
            Text(
                "ODU Reader ${BuildConfig.VERSION_NAME} — ODU CREATIVE\nRead. Learn. Explore.\n\nComponentes de código aberto: Readium Kotlin Toolkit (BSD-3), PdfBox-Android (Apache 2.0), AndroidX/Jetpack (Apache 2.0). Google ML Kit (termos do Google). Definições do Wiktionary (CC BY-SA).",
                style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp),
            )
            Spacer(Modifier.height(32.dp))
        }
    }

    if (aiDisclosure) {
        AlertDialog(
            onDismissRequest = { aiDisclosure = false },
            title = { Text("Ativar IA?") },
            text = {
                Text(
                    "Os recursos de IA enviam o trecho que você selecionar para a API Claude da Anthropic, usando a sua própria chave de API (sujeita aos termos e cobrança da Anthropic). " +
                        "Nada é enviado sem uma ação sua. Você pode desativar a qualquer momento."
                )
            },
            confirmButton = { TextButton(onClick = { scope.launch { st.setAiEnabled(true) }; aiDisclosure = false }) { Text("Ativar") } },
            dismissButton = { TextButton(onClick = { aiDisclosure = false }) { Text("Cancelar") } },
        )
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("Excluir todos os dados?") },
            text = { Text("Remove do ODU Reader todas as cópias de livros importados, anotações, marcadores, flashcards, estatísticas e preferências. Os arquivos originais no seu aparelho não são afetados. Esta ação não pode ser desfeita.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmDelete = false
                    container.appScope.launch { container.deleteAllPersonalData() }
                }) { Text("Excluir tudo", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancelar") } },
        )
    }
}

@Composable
private fun SwitchRow(title: String, subtitle: String?, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge)
            subtitle?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        }
        Spacer(Modifier.padding(4.dp))
        Switch(checked, onChange)
    }
}

@Composable
private fun SliderRow(label: String, value: Float, range: ClosedFloatingPointRange<Float>, onChange: (Float) -> Unit) {
    var local by remember(value) { mutableStateOf(value) }
    Column(Modifier.padding(horizontal = 16.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Slider(local, { local = it }, valueRange = range, onValueChangeFinished = { onChange(local) })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropdownSetting(label: String, value: String, options: List<Pair<String, String>>, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded, { expanded = it }, Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
        OutlinedTextField(
            value = value, onValueChange = {}, readOnly = true, label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable),
        )
        ExposedDropdownMenu(expanded, { expanded = false }) {
            options.forEach { (key, text) ->
                DropdownMenuItem(text = { Text(text) }, onClick = { onSelect(key); expanded = false })
            }
        }
    }
}
