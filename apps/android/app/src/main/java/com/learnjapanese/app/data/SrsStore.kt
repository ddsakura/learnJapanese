package com.learnjapanese.app.data

import android.content.Context
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer

class SrsStore(
    context: Context,
) {
    private val prefs = context.getSharedPreferences("learnjapanese.srs", Context.MODE_PRIVATE)
    private val json = FixtureLoader.json()

    private val srsKey = "jlpt-n4-srs"
    private val wrongKey = "jlpt-n4-wrong-today"
    private val statsKey = "jlpt-n4-stats"

    fun loadSrs(): Map<String, SrsState> {
        val raw = prefs.getString(srsKey, null) ?: return emptyMap()
        val serializer = MapSerializer(String.serializer(), SrsState.serializer())
        return runCatching { json.decodeFromString(serializer, raw) }.getOrElse { emptyMap() }
    }

    fun saveSrs(value: Map<String, SrsState>) {
        val serializer = MapSerializer(String.serializer(), SrsState.serializer())
        val raw = json.encodeToString(serializer, value)
        prefs.edit().putString(srsKey, raw).apply()
    }

    fun loadWrongToday(): WrongToday {
        val today = Stats.todayKey()
        val raw = prefs.getString(wrongKey, null) ?: return WrongToday(date = today, items = emptyList())
        val stored =
            runCatching { json.decodeFromString(WrongToday.serializer(), raw) }.getOrNull()
                ?: return WrongToday(date = today, items = emptyList())
        return if (stored.date != today) {
            WrongToday(date = today, items = emptyList())
        } else {
            stored
        }
    }

    fun saveWrongToday(value: WrongToday) {
        val raw = json.encodeToString(WrongToday.serializer(), value)
        prefs.edit().putString(wrongKey, raw).apply()
    }

    fun loadStats(): Stats {
        val raw = prefs.getString(statsKey, null) ?: return Stats()
        return runCatching { json.decodeFromString(Stats.serializer(), raw) }.getOrElse { Stats() }
    }

    fun saveStats(value: Stats) {
        val raw = json.encodeToString(Stats.serializer(), value)
        prefs.edit().putString(statsKey, raw).apply()
    }
}
