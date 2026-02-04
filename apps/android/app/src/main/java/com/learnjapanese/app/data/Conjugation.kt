package com.learnjapanese.app.data

object Conjugation {
    enum class VerbGroup { GODAN, ICHIDAN, IRREGULAR }

    enum class AdjectiveGroup { I, NA }

    class ConjugationError(
        message: String,
    ) : Exception(message)

    private val godanRuExceptions =
        setOf(
            "帰る",
            "走る",
            "入る",
            "切る",
            "知る",
            "要る",
            "喋る",
            "滑る",
            "減る",
            "焦る",
            "限る",
        )

    private val naAdjectiveIExceptions = setOf("きれい", "嫌い", "きらい")

    private fun isKana(char: Char): Boolean {
        val code = char.code
        return code in 0x3041..0x3096 || code in 0x30A1..0x30FA || code in 0x30FC..0x30FE
    }

    private fun isIchidan(dict: String): Boolean {
        if (!dict.endsWith("る")) return false
        if (godanRuExceptions.contains(dict)) return false
        val before = dict.dropLast(1).lastOrNull() ?: return false
        if (!isKana(before)) return false
        val ichidanBefore = "いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ"
        return ichidanBefore.contains(before)
    }

    fun inferVerbGroup(dict: String): VerbGroup =
        when {
            dict.endsWith("する") -> VerbGroup.IRREGULAR
            dict.endsWith("くる") || dict.endsWith("来る") -> VerbGroup.IRREGULAR
            isIchidan(dict) -> VerbGroup.ICHIDAN
            else -> VerbGroup.GODAN
        }

    fun normalizeAdjectiveDict(dict: String): String = if (dict.endsWith("だ")) dict.dropLast(1) else dict

    fun inferAdjectiveGroup(dict: String): AdjectiveGroup {
        val normalized = normalizeAdjectiveDict(dict)
        return if (normalized.endsWith("い") && !naAdjectiveIExceptions.contains(normalized)) {
            AdjectiveGroup.I
        } else {
            AdjectiveGroup.NA
        }
    }

    private fun buildNakatta(nai: String): String =
        if (nai.endsWith("ない")) {
            nai.dropLast(2) + "なかった"
        } else {
            nai + "なかった"
        }

    fun conjugateVerb(
        dict: String,
        group: VerbGroup,
    ): VerbExpected {
        if (group == VerbGroup.IRREGULAR) {
            if (dict.endsWith("する")) {
                val base = dict.dropLast(2)
                val nai = base + "しない"
                return VerbExpected(
                    nai = nai,
                    ta = base + "した",
                    nakatta = base + "しなかった",
                    te = base + "して",
                    potential = base + "できる",
                )
            }
            if (dict.endsWith("くる") || dict.endsWith("来る")) {
                val base = if (dict.endsWith("くる")) dict.dropLast(2) else dict.dropLast(1)
                val nai = base + "こない"
                val potential = if (dict.endsWith("くる")) base + "こられる" else base + "られる"
                return VerbExpected(
                    nai = nai,
                    ta = base + "きた",
                    nakatta = base + "こなかった",
                    te = base + "きて",
                    potential = potential,
                )
            }
            throw ConjugationError("invalid verb")
        }

        if (group == VerbGroup.ICHIDAN) {
            if (!dict.endsWith("る")) throw ConjugationError("invalid verb")
            val stem = dict.dropLast(1)
            val nai = stem + "ない"
            return VerbExpected(
                nai = nai,
                ta = stem + "た",
                nakatta = stem + "なかった",
                te = stem + "て",
                potential = stem + "られる",
            )
        }

        val last = dict.lastOrNull() ?: throw ConjugationError("invalid verb")
        val stem = dict.dropLast(1)
        val nai: String
        val ta: String
        val te: String
        val potential: String

        when (last) {
            'う' -> {
                nai = stem + "わない"
                ta = stem + "った"
                te = stem + "って"
                potential = stem + "える"
            }

            'つ' -> {
                nai = stem + "たない"
                ta = stem + "った"
                te = stem + "って"
                potential = stem + "てる"
            }

            'る' -> {
                nai = stem + "らない"
                ta = stem + "った"
                te = stem + "って"
                potential = stem + "れる"
            }

            'ぶ' -> {
                nai = stem + "ばない"
                ta = stem + "んだ"
                te = stem + "んで"
                potential = stem + "べる"
            }

            'む' -> {
                nai = stem + "まない"
                ta = stem + "んだ"
                te = stem + "んで"
                potential = stem + "める"
            }

            'ぬ' -> {
                nai = stem + "なない"
                ta = stem + "んだ"
                te = stem + "んで"
                potential = stem + "ねる"
            }

            'く' -> {
                nai = stem + "かない"
                if (dict.endsWith("行く")) {
                    ta = stem + "った"
                    te = stem + "って"
                } else {
                    ta = stem + "いた"
                    te = stem + "いて"
                }
                potential = stem + "ける"
            }

            'ぐ' -> {
                nai = stem + "がない"
                ta = stem + "いだ"
                te = stem + "いで"
                potential = stem + "げる"
            }

            'す' -> {
                nai = stem + "さない"
                ta = stem + "した"
                te = stem + "して"
                potential = stem + "せる"
            }

            else -> {
                throw ConjugationError("invalid verb")
            }
        }

        return VerbExpected(
            nai = nai,
            ta = ta,
            nakatta = buildNakatta(nai),
            te = te,
            potential = potential,
        )
    }

    fun conjugateAdjective(
        dict: String,
        group: AdjectiveGroup,
    ): AdjectiveExpected {
        val normalized = normalizeAdjectiveDict(dict)
        if (normalized.isEmpty()) throw ConjugationError("invalid adjective")

        if (group == AdjectiveGroup.I) {
            if (normalized == "いい") {
                return AdjectiveExpected(
                    dict = normalized,
                    nai = "よくない",
                    ta = "よかった",
                    nakatta = "よくなかった",
                    te = "よくて",
                )
            }
            if (!normalized.endsWith("い")) throw ConjugationError("invalid adjective")
            val stem = normalized.dropLast(1)
            return AdjectiveExpected(
                dict = normalized,
                nai = stem + "くない",
                ta = stem + "かった",
                nakatta = stem + "くなかった",
                te = stem + "くて",
            )
        }

        return AdjectiveExpected(
            dict = normalized,
            nai = normalized + "じゃない",
            ta = normalized + "だった",
            nakatta = normalized + "じゃなかった",
            te = normalized + "で",
        )
    }
}
