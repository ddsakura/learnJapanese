package com.learnjapanese.app.data

import android.content.Context
import kotlinx.serialization.builtins.ListSerializer

class BankStore(
    context: Context,
) {
    private val prefs = context.getSharedPreferences("learnjapanese.bank", Context.MODE_PRIVATE)
    private val json = FixtureLoader.json()

    private val verbKey = "jlpt-n4-verb-bank"
    private val adjectiveKey = "jlpt-n4-adjective-bank"

    fun loadVerbBank(): List<CardFixture> = load(verbKey)

    fun loadAdjectiveBank(): List<CardFixture> = load(adjectiveKey)

    fun saveVerbBank(bank: List<CardFixture>) = save(bank, verbKey)

    fun saveAdjectiveBank(bank: List<CardFixture>) = save(bank, adjectiveKey)

    private fun load(key: String): List<CardFixture> {
        val raw = prefs.getString(key, null) ?: return emptyList()
        return runCatching { json.decodeFromString<List<CardFixture>>(raw) }.getOrElse { emptyList() }
    }

    private fun save(
        bank: List<CardFixture>,
        key: String,
    ) {
        val raw = json.encodeToString(ListSerializer(CardFixture.serializer()), bank)
        prefs.edit().putString(key, raw).apply()
    }
}
