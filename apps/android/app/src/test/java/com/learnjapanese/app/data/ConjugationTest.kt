package com.learnjapanese.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ConjugationTest {
    @Test
    fun conjugateVerb_godanKu() {
        val result = Conjugation.conjugateVerb("書く", Conjugation.VerbGroup.GODAN)

        assertEquals("書かない", result.nai)
        assertEquals("書いた", result.ta)
        assertEquals("書かなかった", result.nakatta)
        assertEquals("書いて", result.te)
        assertEquals("書ける", result.potential)
    }

    @Test
    fun conjugateVerb_irregularSuru() {
        val result = Conjugation.conjugateVerb("勉強する", Conjugation.VerbGroup.IRREGULAR)

        assertEquals("勉強しない", result.nai)
        assertEquals("勉強した", result.ta)
        assertEquals("勉強しなかった", result.nakatta)
        assertEquals("勉強して", result.te)
        assertEquals("勉強できる", result.potential)
    }

    @Test
    fun conjugateAdjective_naWithDa() {
        val result = Conjugation.conjugateAdjective("元気だ", Conjugation.AdjectiveGroup.NA)

        assertEquals("元気", result.dict)
        assertEquals("元気じゃない", result.nai)
        assertEquals("元気だった", result.ta)
        assertEquals("元気じゃなかった", result.nakatta)
        assertEquals("元気で", result.te)
    }

    @Test
    fun inferGroup_basics() {
        assertEquals(Conjugation.VerbGroup.IRREGULAR, Conjugation.inferVerbGroup("する"))
        assertEquals(Conjugation.VerbGroup.ICHIDAN, Conjugation.inferVerbGroup("食べる"))
        assertEquals(Conjugation.AdjectiveGroup.I, Conjugation.inferAdjectiveGroup("高い"))
        assertEquals(Conjugation.AdjectiveGroup.NA, Conjugation.inferAdjectiveGroup("静か"))
        assertTrue(Conjugation.normalizeAdjectiveDict("元気だ") == "元気")
    }
}
