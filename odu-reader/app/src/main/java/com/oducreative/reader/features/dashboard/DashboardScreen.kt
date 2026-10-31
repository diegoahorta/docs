package com.oducreative.reader.features.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.oducreative.reader.app.AppContainer
import com.oducreative.reader.app.appContainer
import com.oducreative.reader.core.datastore.AppSettings
import com.oducreative.reader.core.designsystem.BookCover
import com.oducreative.reader.core.designsystem.ProgressLine
import com.oducreative.reader.core.designsystem.SectionTitle
import com.oducreative.reader.core.utilities.Formatters
import com.oducreative.reader.data.models.BookEntity
import com.oducreative.reader.data.models.DailyReading
import com.oducreative.reader.data.models.ReadingSessionEntity
import com.oducreative.reader.data.repositories.ReadingStatsRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

data class DashboardState(
    val inProgress: List<BookEntity> = emptyList(),
    val completed: List<BookEntity> = emptyList(),
    val todayMillis: Long = 0,
    val weekMillis: Long = 0,
    val totalMillis: Long = 0,
    val last14: List<Pair<String, Long>> = emptyList(),
    val streakDays: Int = 0,
    val sessions: List<ReadingSessionEntity> = emptyList(),
    val remainingEstimate: Map<Long, Long> = emptyMap(),
    val settings: AppSettings = AppSettings(),
)

object DashboardMath {
    /** Últimos [days] dias (inclui hoje) no formato yyyy-MM-dd, preenchendo dias sem leitura com 0. */
    fun fillDays(daily: List<DailyReading>, days: Int, now: Long = System.currentTimeMillis()): List<Pair<String, Long>> {
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val map = daily.associate { it.day to it.totalMillis }
        val cal = Calendar.getInstance().apply { timeInMillis = now; add(Calendar.DAY_OF_YEAR, -(days - 1)) }
        return (0 until days).map {
            val key = fmt.format(cal.time)
            cal.add(Calendar.DAY_OF_YEAR, 1)
            key to (map[key] ?: 0L)
        }
    }

    /** Dias consecutivos (até hoje ou ontem) com pelo menos 1 minuto de leitura. */
    fun streak(days: List<Pair<String, Long>>): Int {
        var count = 0
        val list = days.reversed()
        val startIdx = if (list.firstOrNull()?.second ?: 0L < 60_000L) 1 else 0
        for (i in startIdx until list.size) {
            if (list[i].second >= 60_000L) count++ else break
        }
        return count
    }

    /** Tempo restante estimado com base na velocidade de leitura registrada para o livro. */
    fun remaining(book: BookEntity, sessions: List<ReadingSessionEntity>): Long? {
        val own = sessions.filter { it.bookId == book.id && it.endProgress > it.startProgress }
        val time = own.sumOf { it.activeMillis }
        val gained = own.sumOf { (it.endProgress - it.startProgress).toDouble() }
        if (time < 60_000 || gained <= 0.001) return null
        return ((1.0 - book.progress) / (gained / time)).toLong()
    }
}

class DashboardViewModel(c: AppContainer) : ViewModel() {
    private val since = ReadingStatsRepository.daysAgo(13)
    val state = combine(
        c.books.books,
        c.stats.daily(since),
        c.stats.recentSessions,
        c.stats.totalTime,
        c.settings.settings,
    ) { books, daily, sessions, total, settings ->
        val days = DashboardMath.fillDays(daily, 14)
        val weekStart = ReadingStatsRepository.startOfWeek()
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val weekKey = fmt.format(weekStart)
        val inProgress = books.filter { it.progress > 0f && !it.isCompleted }.sortedByDescending { it.lastOpenedAt ?: 0 }
        DashboardState(
            inProgress = inProgress,
            completed = books.filter { it.isCompleted }.sortedByDescending { it.completedAt ?: 0 },
            todayMillis = days.lastOrNull()?.second ?: 0,
            weekMillis = days.filter { it.first >= weekKey }.sumOf { it.second },
            totalMillis = total,
            last14 = days,
            streakDays = DashboardMath.streak(days),
            sessions = sessions,
            remainingEstimate = inProgress.mapNotNull { b -> DashboardMath.remaining(b, sessions)?.let { b.id to it } }.toMap(),
            settings = settings,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardState())
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(onOpen: (BookEntity) -> Unit) {
    val container = appContainer()
    val vm: DashboardViewModel = viewModel { DashboardViewModel(container) }
    val s by vm.state.collectAsState()
    val books by container.books.books.collectAsState(initial = emptyList())
    Scaffold(topBar = { TopAppBar(title = { Text("Painel de leitura") }) }) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(bottom = 32.dp)) {
            item {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    GoalCard("Hoje", s.todayMillis, s.settings.dailyGoalMinutes, Modifier.weight(1f))
                    GoalCard("Semana", s.weekMillis, s.settings.weeklyGoalMinutes, Modifier.weight(1f))
                }
            }
            item {
                Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard("Sequência", "${s.streakDays} dia(s)", Modifier.weight(1f))
                    StatCard("Tempo total", Formatters.duration(s.totalMillis), Modifier.weight(1f))
                    StatCard("Concluídos", "${s.completed.size}", Modifier.weight(1f))
                }
            }
            item {
                SectionTitle("Últimos 14 dias")
                DailyBars(s.last14, s.settings.dailyGoalMinutes)
                Text(
                    "Conta apenas sessões efetivas: períodos sem interação por mais de 2 minutos e o app em segundo plano não são somados.",
                    style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
            }
            item { SectionTitle("Em andamento (${s.inProgress.size})") }
            if (s.inProgress.isEmpty()) item { Text("Nenhum livro em andamento.", Modifier.padding(horizontal = 16.dp)) }
            items(s.inProgress, key = { "p${it.id}" }) { b ->
                ListItem(
                    leadingContent = { BookCover(b, Modifier.width(44.dp).aspectRatio(0.68f)) },
                    headlineContent = { Text(b.displayTitle, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    supportingContent = {
                        Column {
                            ProgressLine(b.progress, Modifier.padding(vertical = 4.dp))
                            Text(
                                Formatters.percent(b.progress) + (s.remainingEstimate[b.id]?.let { " · ~${Formatters.duration(it)} restantes" } ?: ""),
                                style = MaterialTheme.typography.labelSmall,
                            )
                        }
                    },
                    modifier = Modifier.clickable { onOpen(b) },
                )
            }
            item { SectionTitle("Concluídos (${s.completed.size})") }
            items(s.completed.take(20), key = { "c${it.id}" }) { b ->
                ListItem(
                    headlineContent = { Text(b.displayTitle, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    supportingContent = { b.completedAt?.let { Text("Concluído em ${Formatters.date(it)}") } },
                    modifier = Modifier.clickable { onOpen(b) },
                )
            }
            item { SectionTitle("Histórico de sessões") }
            if (s.sessions.isEmpty()) item { Text("As sessões aparecem aqui depois que você lê por pelo menos 15 segundos.", Modifier.padding(horizontal = 16.dp)) }
            items(s.sessions.take(30), key = { "s${it.id}" }) { session ->
                val title = books.firstOrNull { it.id == session.bookId }?.displayTitle ?: "Livro"
                ListItem(
                    headlineContent = { Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    supportingContent = {
                        Text("${Formatters.dateTime(session.startedAt)} · ${Formatters.duration(session.activeMillis)} · ${Formatters.percent(session.startProgress)} → ${Formatters.percent(session.endProgress)}")
                    },
                )
                HorizontalDivider()
            }
        }
    }
}

@Composable
private fun GoalCard(label: String, millis: Long, goalMinutes: Int, modifier: Modifier) {
    val fraction = (millis / 60_000f / goalMinutes.coerceAtLeast(1)).coerceIn(0f, 1f)
    Card(modifier) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(progress = { fraction }, modifier = Modifier.size(56.dp), strokeWidth = 6.dp, trackColor = MaterialTheme.colorScheme.surfaceVariant)
                Text(Formatters.percent(fraction), style = MaterialTheme.typography.labelSmall)
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(label, style = MaterialTheme.typography.labelLarge)
                Text(Formatters.duration(millis), style = MaterialTheme.typography.titleMedium)
                Text("meta: $goalMinutes min", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier) {
    Card(modifier) {
        Column(Modifier.padding(12.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium)
            Text(value, style = MaterialTheme.typography.titleMedium, maxLines = 1)
        }
    }
}

@Composable
private fun DailyBars(days: List<Pair<String, Long>>, goalMinutes: Int) {
    val bar = MaterialTheme.colorScheme.primary
    val goalColor = MaterialTheme.colorScheme.secondary
    val track = MaterialTheme.colorScheme.surfaceVariant
    val maxMin = maxOf(goalMinutes.toFloat(), days.maxOfOrNull { it.second / 60_000f } ?: 0f, 1f)
    val description = days.joinToString { "${it.first.takeLast(5)}: ${it.second / 60_000} min" }
    Column(Modifier.padding(horizontal = 16.dp)) {
        Canvas(Modifier.fillMaxWidth().height(140.dp).semantics { contentDescription = "Minutos lidos por dia. $description" }) {
            val n = days.size.coerceAtLeast(1)
            val slot = size.width / n
            val barW = slot * 0.6f
            days.forEachIndexed { i, (_, ms) ->
                val h = (ms / 60_000f) / maxMin * size.height
                val x = i * slot + (slot - barW) / 2
                drawRoundRect(track, Offset(x, 0f), Size(barW, size.height), CornerRadius(6f, 6f))
                if (h > 0) drawRoundRect(bar, Offset(x, size.height - h), Size(barW, h), CornerRadius(6f, 6f))
            }
            val gy = size.height - goalMinutes / maxMin * size.height
            drawLine(goalColor, Offset(0f, gy), Offset(size.width, gy), strokeWidth = 3f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 10f)))
        }
        Row(Modifier.fillMaxWidth()) {
            days.forEachIndexed { i, (d, _) ->
                Text(if (i % 2 == 1 || i == days.lastIndex) d.takeLast(2) else "", style = MaterialTheme.typography.labelSmall, modifier = Modifier.weight(1f), maxLines = 1)
            }
        }
        Text("Linha tracejada: meta diária ($goalMinutes min)", style = MaterialTheme.typography.labelSmall)
    }
}
