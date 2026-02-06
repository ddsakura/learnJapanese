package com.learnjapanese.app.data

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ConjugationFixturesTest {
    @Test
    fun verbFixtures_matchConjugationRules() {
        val fixtures = loadConjugationFixtures()

        for (item in fixtures.verbs) {
            val group = runCatching { Conjugation.VerbGroup.valueOf(item.group.uppercase()) }.getOrNull()
            assertTrue("Unknown group: ${item.group}", group != null)
            val result = Conjugation.conjugateVerb(item.dict, group!!)

            assertEquals("nai mismatch for ${item.dict}", item.expected.nai, result.nai)
            assertEquals("ta mismatch for ${item.dict}", item.expected.ta, result.ta)
            assertEquals("nakatta mismatch for ${item.dict}", item.expected.nakatta, result.nakatta)
            assertEquals("te mismatch for ${item.dict}", item.expected.te, result.te)
            assertEquals("potential mismatch for ${item.dict}", item.expected.potential, result.potential)
        }
    }

    @Test
    fun adjectiveFixtures_matchConjugationRules() {
        val fixtures = loadConjugationFixtures()

        for (item in fixtures.adjectives) {
            val group = runCatching { Conjugation.AdjectiveGroup.valueOf(item.group.uppercase()) }.getOrNull()
            assertTrue("Unknown group: ${item.group}", group != null)
            val result = Conjugation.conjugateAdjective(item.dict, group!!)
            val expectedDict = item.expected.dict ?: if (item.dict.endsWith("だ")) item.dict.dropLast(1) else item.dict

            assertEquals("dict mismatch for ${item.dict}", expectedDict, result.dict)
            assertEquals("nai mismatch for ${item.dict}", item.expected.nai, result.nai)
            assertEquals("ta mismatch for ${item.dict}", item.expected.ta, result.ta)
            assertEquals("nakatta mismatch for ${item.dict}", item.expected.nakatta, result.nakatta)
            assertEquals("te mismatch for ${item.dict}", item.expected.te, result.te)
        }
    }

    private fun loadConjugationFixtures(): ConjugationFixtures {
        val relativePath = "packages/core/fixtures/conjugation.json"
        val startDir = File(System.getProperty("user.dir") ?: ".").canonicalFile

        var current: File? = startDir
        var resolved: File? = null
        while (current != null) {
            val candidate = File(current, relativePath)
            if (candidate.exists()) {
                resolved = candidate
                break
            }
            current = current.parentFile
        }

        val file = resolved
            ?: error(
                "Missing conjugation.json. Looked for '$relativePath' from '${startDir.path}' while walking parent directories.",
            )
        val text = file.readText()
        return FixtureLoader.json().decodeFromString(text)
    }
}
