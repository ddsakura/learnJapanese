package com.learnjapanese.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ImportingTest {
    @Test
    fun normalizeImport_verbStringItem() {
        val input = listOf(ImportItem.StringItem("書く"))
        val result = Importing.normalizeImport(input, PracticeKind.VERB)

        assertTrue(result is ImportResult.Success)
        val bank = (result as ImportResult.Success).bank
        assertEquals(1, bank.size)
        assertEquals("書く", bank[0].dict)
        assertEquals("書かない", bank[0].nai)
        assertEquals("godan", bank[0].group)
    }

    @Test
    fun normalizeImport_adjectiveStringItemWithDa() {
        val input = listOf(ImportItem.StringItem("元気だ"))
        val result = Importing.normalizeImport(input, PracticeKind.ADJECTIVE)

        assertTrue(result is ImportResult.Success)
        val bank = (result as ImportResult.Success).bank
        assertEquals(1, bank.size)
        assertEquals("元気", bank[0].dict)
        assertEquals("元気じゃない", bank[0].nai)
        assertEquals("na", bank[0].group)
    }

    @Test
    fun normalizeImport_objectItemOverride() {
        val input = listOf(
            ImportItem.ObjectItem(
                ImportObject(
                    dict = "書く",
                    group = "godan",
                    nai = "書かん",
                    zh = "寫",
                ),
            ),
        )

        val result = Importing.normalizeImport(input, PracticeKind.VERB)

        assertTrue(result is ImportResult.Success)
        val card = (result as ImportResult.Success).bank.first()
        assertEquals("書かん", card.nai)
        assertEquals("書いた", card.ta)
        assertEquals("寫", card.zh)
    }

    @Test
    fun normalizeImport_emptyStringFailure() {
        val input = listOf(ImportItem.StringItem("   "))
        val result = Importing.normalizeImport(input, PracticeKind.VERB)

        assertTrue(result is ImportResult.Failure)
        assertEquals("存在空的項目。", (result as ImportResult.Failure).message)
    }
}
