package com.learnjapanese.app.data

import android.content.Context
import kotlinx.serialization.json.Json

object FixtureLoader {
    @PublishedApi
    internal val json = Json { ignoreUnknownKeys = true }

    inline fun <reified T> load(
        context: Context,
        name: String,
    ): T {
        val path = "fixtures/$name.json"
        context.assets.open(path).use { stream ->
            val text = stream.bufferedReader().use { it.readText() }
            return json.decodeFromString(text)
        }
    }

    fun json(): Json = json
}
