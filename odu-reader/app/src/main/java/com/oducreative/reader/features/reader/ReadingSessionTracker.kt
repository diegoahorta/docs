package com.oducreative.reader.features.reader

/**
 * Mede o tempo EFETIVO de leitura. Só conta o intervalo entre interações quando ele é menor
 * que [idleTimeoutMillis]; pausas longas (app aberto mas sem uso) não são contabilizadas.
 * Também pausa quando o leitor sai do primeiro plano. Independente de Android para testes.
 */
class ReadingSessionTracker(
    private val idleTimeoutMillis: Long = 2 * 60 * 1000L,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    var startedAt: Long = 0L; private set
    var activeMillis: Long = 0L; private set
    private var lastInteraction: Long = 0L
    private var running = false
    var startProgress: Float = 0f; private set

    val isRunning: Boolean get() = running

    fun start(progress: Float) {
        val now = clock()
        if (startedAt == 0L) {
            startedAt = now
            startProgress = progress
        }
        lastInteraction = now
        running = true
    }

    /** Chamar a cada virada de página, rolagem, toque ou progresso de TTS. */
    fun onInteraction() {
        val now = clock()
        if (!running) {
            running = true
            lastInteraction = now
            if (startedAt == 0L) startedAt = now
            return
        }
        accumulate(now)
        lastInteraction = now
    }

    fun pause() {
        if (!running) return
        accumulate(clock())
        running = false
    }

    private fun accumulate(now: Long) {
        val delta = now - lastInteraction
        // Intervalos maiores que o limite de inatividade são descartados.
        if (delta in 1..idleTimeoutMillis) activeMillis += delta
    }

    fun reset() {
        startedAt = 0L; activeMillis = 0L; lastInteraction = 0L; running = false
    }
}
