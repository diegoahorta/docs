package com.oducreative.reader

import com.oducreative.reader.features.reader.ReadingSessionTracker
import org.junit.Assert.assertEquals
import org.junit.Test

class ReadingSessionTrackerTest {
    private var t = 0L
    private val tracker = ReadingSessionTracker(idleTimeoutMillis = 120_000, clock = { t })

    @Test fun countsOnlyActiveTime() {
        tracker.start(0f)
        t += 30_000; tracker.onInteraction()   // +30s
        t += 60_000; tracker.onInteraction()   // +60s
        t += 600_000; tracker.onInteraction()  // 10 min parado: descartado
        t += 10_000; tracker.pause()           // +10s
        assertEquals(100_000L, tracker.activeMillis)
    }

    @Test fun pausedTimeIsNotCounted() {
        tracker.start(0f)
        t += 20_000; tracker.pause()
        t += 3_600_000 // app em segundo plano
        tracker.start(0f)
        t += 5_000; tracker.onInteraction()
        assertEquals(25_000L, tracker.activeMillis)
    }
}
