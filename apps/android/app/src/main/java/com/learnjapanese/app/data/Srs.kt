package com.learnjapanese.app.data

object Srs {
    const val DAY_MS: Long = 86_400_000L
    const val INCORRECT_DELAY_MS: Long = 120_000L

    fun nextIntervalDays(
        previous: Int,
        isCorrect: Boolean,
    ): Int {
        if (!isCorrect) return 0
        val doubled = if (previous == 0) 1 else previous * 2
        return maxOf(1, doubled)
    }

    fun dueOffsetMs(
        previous: Int,
        isCorrect: Boolean,
    ): Long {
        if (!isCorrect) return INCORRECT_DELAY_MS
        val interval = nextIntervalDays(previous, isCorrect)
        return interval * DAY_MS
勿    }
}
