package com.learnjapanese.app.data

object Parsing {
    private fun cleanModelText(input: String): String {
        return input
            .replace(Regex("\\*\\*(.*?)\\*\\*"), "$1")
            .replace(Regex("__(.*?)__"), "$1")
            .replace(Regex("`(.*?)`"), "$1")
            .replace(Regex("^[-*]\\s+"), "")
            .trim()
    }

    fun parseExampleResponse(text: String): ExampleOutput? {
        val normalized = text.replace("\\n", "\n").trim()

        fun lineValue(label: String): String {
            val regex =
                Regex(
                    "^\\s*(?:\\*\\*\\s*)?" + Regex.escape(label) + "\\s*(?:\\*\\*\\s*)?:\\s*(.+)$",
                    RegexOption.IGNORE_CASE,
                )
            return normalized
                .lineSequence()
                .mapNotNull { line ->
                    regex
                        .find(line)
                        ?.groupValues
                        ?.getOrNull(1)
                        ?.let(::cleanModelText)
                }.firstOrNull()
                .orEmpty()
        }

        fun blockValue(label: String): String {
            val regex =
                Regex(
                    "(?:\\*\\*\\s*)?" + Regex.escape(label) + "\\s*(?:\\*\\*\\s*)?:\\s*([\\s\\S]+)$",
                    RegexOption.IGNORE_CASE,
                )
            return regex
                .find(normalized)
                ?.groupValues
                ?.getOrNull(1)
                ?.let(::cleanModelText)
                .orEmpty()
        }

        val jp = lineValue("JP")
        val reading = lineValue("Reading")
        val zh = lineValue("ZH")
        val grammar = blockValue("Grammar")

        return if (jp.isNotEmpty() && reading.isNotEmpty() && zh.isNotEmpty() && grammar.isNotEmpty()) {
            ExampleOutput(jp = jp, reading = reading, zh = zh, grammar = grammar)
        } else {
            null
        }
    }

    fun normalizeTranslation(raw: String): String? {
        val normalized = raw.replace("\\n", "\n").trim()
        val firstLine =
            normalized
                .lines()
                .map { it.trim() }
                .firstOrNull { it.isNotEmpty() }
                ?: return null

        var line = firstLine
        line = line.replace(Regex("^zh[:：]\\s*", RegexOption.IGNORE_CASE), "")
        line = line.replace(Regex("^translation[:：]\\s*", RegexOption.IGNORE_CASE), "")
        line = line.trim()
        line = line.replace(Regex("^['\"「『](.*)['\"」』]$"), "$1").trim()
        line = cleanModelText(line)
        return line.ifEmpty { null }
    }

    fun parseChoiceResponse(text: String): List<String> {
        val normalized = text.replace("\\n", "\n").trim()
        if (normalized.isEmpty()) return emptyList()
        return normalized
            .lines()
            .map { line ->
                line.replace(Regex("^[\\s*\\d.\\)\\(-]+"), "").trim()
            }.filter { it.isNotEmpty() }
    }
}
