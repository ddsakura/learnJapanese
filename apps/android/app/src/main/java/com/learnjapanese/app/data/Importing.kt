package com.learnjapanese.app.data

sealed class ImportResult {
    data class Success(
        val bank: List<CardFixture>,
    ) : ImportResult()

    data class Failure(
        val message: String,
    ) : ImportResult()
}

enum class PracticeKind(
    val raw: String,
) {
    VERB("verb"),
    ADJECTIVE("adjective"),
}

enum class AnswerMode { INPUT, CHOICE }

enum class QuestionType(
    val label: String,
) {
    NAI("ない形"),
    TA("た形"),
    NAKATTA("なかった形"),
    TE("て形"),
    POTENTIAL("可能形"),
    MIXED("混合"),
}

enum class VerbScope(
    val label: String,
) {
    ALL("全部"),
    GODAN("五段"),
    ICHIDAN("二段"),
    IRREGULAR("不規則"),
}

enum class AdjectiveScope(
    val label: String,
) {
    ALL("全部"),
    I("い形"),
    NA("な形"),
}

enum class PracticeMode { NORMAL, REVIEW_WRONG }

object Importing {
    fun normalizeImport(
        items: List<ImportItem>,
        practice: PracticeKind,
    ): ImportResult {
        val bank = mutableListOf<CardFixture>()

        for (item in items) {
            when (item) {
                is ImportItem.StringItem -> {
                    val dict = item.value.trim()
                    if (dict.isEmpty()) return ImportResult.Failure("存在空的項目。")
                    when (practice) {
                        PracticeKind.VERB -> {
                            val group = Conjugation.inferVerbGroup(dict)
                            try {
                                val conjugated = Conjugation.conjugateVerb(dict, group)
                                bank.add(
                                    CardFixture(
                                        dict = dict,
                                        nai = conjugated.nai,
                                        ta = conjugated.ta,
                                        nakatta = conjugated.nakatta,
                                        te = conjugated.te,
                                        potential = conjugated.potential,
                                        group = group.name.lowercase(),
                                        zh = null,
                                    ),
                                )
                            } catch (_: Exception) {
                                return ImportResult.Failure("無法推導：$dict")
                            }
                        }

                        PracticeKind.ADJECTIVE -> {
                            val group = Conjugation.inferAdjectiveGroup(dict)
                            try {
                                val conjugated = Conjugation.conjugateAdjective(dict, group)
                                val normalizedDict = conjugated.dict ?: Conjugation.normalizeAdjectiveDict(dict)
                                bank.add(
                                    CardFixture(
                                        dict = normalizedDict,
                                        nai = conjugated.nai,
                                        ta = conjugated.ta,
                                        nakatta = conjugated.nakatta,
                                        te = conjugated.te,
                                        potential = null,
                                        group = group.name.lowercase(),
                                        zh = null,
                                    ),
                                )
                            } catch (_: Exception) {
                                return ImportResult.Failure("無法推導：$dict")
                            }
                        }
                    }
                }

                is ImportItem.ObjectItem -> {
                    val record = item.value
                    val dict = record.dict.trim()
                    if (dict.isEmpty()) return ImportResult.Failure("每筆資料需包含 dict。")

                    when (practice) {
                        PracticeKind.VERB -> {
                            verbCardFromRecord(record)?.let {
                                bank.add(it)
                                continue
                            }
                            val group =
                                record.group?.let { value ->
                                    runCatching { Conjugation.VerbGroup.valueOf(value.uppercase()) }.getOrNull()
                                } ?: Conjugation.inferVerbGroup(dict)
                            try {
                                val conjugated = Conjugation.conjugateVerb(dict, group)
                                val overrides =
                                    buildOverrides(record, listOf("nai", "ta", "nakatta", "te", "potential", "zh"))
                                bank.add(
                                    CardFixture(
                                        dict = dict,
                                        nai = overrides.nai ?: conjugated.nai,
                                        ta = overrides.ta ?: conjugated.ta,
                                        nakatta = overrides.nakatta ?: conjugated.nakatta,
                                        te = overrides.te ?: conjugated.te,
                                        potential = overrides.potential ?: conjugated.potential,
                                        group = group.name.lowercase(),
                                        zh = overrides.zh,
                                    ),
                                )
                            } catch (_: Exception) {
                                return ImportResult.Failure("無法推導：$dict")
                            }
                        }

                        PracticeKind.ADJECTIVE -> {
                            adjectiveCardFromRecord(record)?.let {
                                bank.add(it)
                                continue
                            }
                            val group =
                                record.group?.let { value ->
                                    runCatching { Conjugation.AdjectiveGroup.valueOf(value.uppercase()) }.getOrNull()
                                } ?: Conjugation.inferAdjectiveGroup(dict)
                            try {
                                val conjugated = Conjugation.conjugateAdjective(dict, group)
                                val overrides = buildOverrides(record, listOf("nai", "ta", "nakatta", "te", "zh"))
                                val normalizedDict = conjugated.dict ?: Conjugation.normalizeAdjectiveDict(dict)
                                bank.add(
                                    CardFixture(
                                        dict = normalizedDict,
                                        nai = overrides.nai ?: conjugated.nai,
                                        ta = overrides.ta ?: conjugated.ta,
                                        nakatta = overrides.nakatta ?: conjugated.nakatta,
                                        te = overrides.te ?: conjugated.te,
                                        potential = null,
                                        group = group.name.lowercase(),
                                        zh = overrides.zh,
                                    ),
                                )
                            } catch (_: Exception) {
                                return ImportResult.Failure("無法推導：$dict")
                            }
                        }
                    }
                }
            }
        }

        return ImportResult.Success(bank)
    }

    private fun verbCardFromRecord(record: ImportObject): CardFixture? {
        val group = record.group ?: return null
        val nai = record.nai ?: return null
        val ta = record.ta ?: return null
        val nakatta = record.nakatta ?: return null
        val te = record.te ?: return null
        val potential = record.potential ?: return null
        return CardFixture(
            dict = record.dict,
            nai = nai,
            ta = ta,
            nakatta = nakatta,
            te = te,
            potential = potential,
            group = group,
            zh = record.zh,
        )
    }

    private fun adjectiveCardFromRecord(record: ImportObject): CardFixture? {
        val group = record.group ?: return null
        val nai = record.nai ?: return null
        val ta = record.ta ?: return null
        val nakatta = record.nakatta ?: return null
        val te = record.te ?: return null
        return CardFixture(
            dict = record.dict,
            nai = nai,
            ta = ta,
            nakatta = nakatta,
            te = te,
            potential = null,
            group = group,
            zh = record.zh,
        )
    }

    private data class OverrideValues(
        var nai: String? = null,
        var ta: String? = null,
        var nakatta: String? = null,
        var te: String? = null,
        var potential: String? = null,
        var zh: String? = null,
    )

    private fun buildOverrides(
        record: ImportObject,
        fields: List<String>,
    ): OverrideValues {
        val overrides = OverrideValues()
        for (field in fields) {
            val value =
                when (field) {
                    "nai" -> record.nai
                    "ta" -> record.ta
                    "nakatta" -> record.nakatta
                    "te" -> record.te
                    "potential" -> record.potential
                    "zh" -> record.zh
                    else -> null
                }
            val trimmed = value?.trim().orEmpty()
            if (trimmed.isEmpty()) continue
            when (field) {
                "nai" -> overrides.nai = trimmed
                "ta" -> overrides.ta = trimmed
                "nakatta" -> overrides.nakatta = trimmed
                "te" -> overrides.te = trimmed
                "potential" -> overrides.potential = trimmed
                "zh" -> overrides.zh = trimmed
            }
        }
        return overrides
    }
}
