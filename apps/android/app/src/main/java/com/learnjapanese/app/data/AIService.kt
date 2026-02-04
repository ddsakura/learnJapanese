package com.learnjapanese.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL

class AIServiceUnavailable(
    message: String,
) : Exception(message)

class AIServiceFailed(
    message: String,
) : Exception(message)

data class AIExample(
    val jp: String,
    val reading: String,
    val zh: String,
    val grammar: String,
)

interface AIService {
    suspend fun generateTranslation(dict: String): String

    suspend fun generateExample(
        term: String,
        typeLabel: String,
    ): AIExample
}

class OllamaAIService(
    private val baseUrl: String,
    private val model: String,
    private val json: Json = Json { ignoreUnknownKeys = true },
) : AIService {
    override suspend fun generateTranslation(dict: String): String {
        val prompt = buildTranslationPrompt(dict)
        val text = requestText(prompt)
        return Parsing.normalizeTranslation(text) ?: throw AIServiceFailed("無法解析翻譯結果")
    }

    override suspend fun generateExample(
        term: String,
        typeLabel: String,
    ): AIExample {
        val prompt = buildExamplePrompt(term, typeLabel)
        val text = requestText(prompt)
        Parsing.parseExampleResponse(text)?.let { parsed ->
            return AIExample(
                jp = parsed.jp,
                reading = parsed.reading,
                zh = parsed.zh,
                grammar = parsed.grammar,
            )
        }
        parseExampleLoose(text)?.let { return it }
        throw AIServiceFailed("無法解析例句結果")
    }

    private suspend fun requestText(prompt: String): String =
        withContext(Dispatchers.IO) {
            runCatching { requestGenerate(prompt) }.getOrElse { requestChat(prompt) }
        }

    private fun requestGenerate(prompt: String): String {
        val endpoint = "${baseUrl.trimEnd('/')}/api/generate"
        val connection =
            (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15_000
                readTimeout = 30_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        val payload =
            OllamaGenerateRequest(
                model = model,
                prompt = prompt,
                stream = false,
            )
        try {
            connection.outputStream.use { stream ->
                stream.write(json.encodeToString(payload).toByteArray(Charsets.UTF_8))
            }

            val code = connection.responseCode
            val responseText =
                if (code in 200..299) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    connection.errorStream
                        ?.bufferedReader()
                        ?.use { it.readText() }
                        .orEmpty()
                }
            if (code !in 200..299) {
                throw AIServiceFailed("Ollama generate failed: HTTP $code ${responseText.take(120)}")
            }
            val parsed = decodeGenerateResponse(responseText)
            return parsed.response?.trim().orEmpty().ifEmpty {
                throw AIServiceFailed("Ollama generate response is empty")
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun requestChat(prompt: String): String {
        val endpoint = "${baseUrl.trimEnd('/')}/api/chat"
        val connection =
            (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15_000
                readTimeout = 30_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        val payload =
            OllamaChatRequest(
                model = model,
                messages =
                    listOf(
                        OllamaMessage("system", "你是可靠的日語老師"),
                        OllamaMessage("user", prompt),
                    ),
                stream = false,
            )
        try {
            connection.outputStream.use { stream ->
                stream.write(json.encodeToString(payload).toByteArray(Charsets.UTF_8))
            }

            val code = connection.responseCode
            val responseText =
                if (code in 200..299) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    connection.errorStream
                        ?.bufferedReader()
                        ?.use { it.readText() }
                        .orEmpty()
                }
            if (code !in 200..299) {
                throw AIServiceFailed("Ollama chat failed: HTTP $code ${responseText.take(120)}")
            }

            val parsed = decodeChatResponse(responseText)
            return parsed.message?.content?.trim().orEmpty().ifEmpty {
                throw AIServiceFailed("Ollama chat content is empty")
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun parseExampleLoose(text: String): AIExample? {
        val normalized = text.replace("\\n", "\n").trim()
        if (normalized.isEmpty()) return null
        val lines = normalized.lines().map { it.trim() }.filter { it.isNotEmpty() }
        if (lines.isEmpty()) return null

        fun extractLine(prefixes: List<String>): String? {
            val lowerPrefixes = prefixes.map { it.lowercase() }
            return lines.firstNotNullOfOrNull { line ->
                val idx = line.indexOf(':')
                if (idx <= 0) return@firstNotNullOfOrNull null
                val key = line.substring(0, idx).trim().lowercase()
                if (key in lowerPrefixes) line.substring(idx + 1).trim().ifEmpty { null } else null
            }
        }

        val jp = extractLine(listOf("jp", "例句", "日文")) ?: lines.firstOrNull() ?: return null
        val reading = extractLine(listOf("reading", "假名", "よみ")) ?: "（未提供假名）"
        val zh = extractLine(listOf("zh", "中文", "翻譯")) ?: "（未提供翻譯）"
        val grammar = extractLine(listOf("grammar", "文法", "說明")) ?: "例句由模型輸出（寬鬆解析）。"
        return AIExample(jp = jp, reading = reading, zh = zh, grammar = grammar)
    }

    private fun decodeGenerateResponse(raw: String): OllamaGenerateResponse {
        runCatching { json.decodeFromString(OllamaGenerateResponse.serializer(), raw) }
            .getOrNull()
            ?.let { return it }

        // Some Ollama setups can still return NDJSON-like chunks.
        val candidates =
            raw
                .lineSequence()
                .map { it.trim() }
                .filter { it.isNotEmpty() }
                .mapNotNull { line ->
                    runCatching { json.decodeFromString(OllamaGenerateResponse.serializer(), line) }.getOrNull()
                }.toList()

        if (candidates.isEmpty()) {
            throw AIServiceFailed("Ollama generate parse failed: ${raw.take(120)}")
        }

        val mergedResponse =
            candidates
                .mapNotNull { it.response }
                .joinToString(separator = "")
                .trim()

        return OllamaGenerateResponse(
            model = candidates.lastOrNull()?.model,
            response = mergedResponse,
            done = candidates.lastOrNull()?.done,
        )
    }

    private fun decodeChatResponse(raw: String): OllamaChatResponse {
        runCatching { json.decodeFromString(OllamaChatResponse.serializer(), raw) }
            .getOrNull()
            ?.let { return it }

        val candidates =
            raw
                .lineSequence()
                .map { it.trim() }
                .filter { it.isNotEmpty() }
                .mapNotNull { line ->
                    runCatching { json.decodeFromString(OllamaChatResponse.serializer(), line) }.getOrNull()
                }.toList()

        if (candidates.isEmpty()) {
            throw AIServiceFailed("Ollama chat parse failed: ${raw.take(120)}")
        }

        val mergedContent =
            candidates
                .mapNotNull { it.message?.content }
                .joinToString(separator = "")
                .trim()

        return OllamaChatResponse(
            model = candidates.lastOrNull()?.model,
            createdAt = candidates.lastOrNull()?.createdAt,
            message = OllamaMessage(role = "assistant", content = mergedContent),
            done = candidates.lastOrNull()?.done,
        )
    }

    private fun buildExamplePrompt(
        term: String,
        typeLabel: String,
    ): String =
        "系統設定： 你是一位專業的日語老師，擅長將複雜的文法用簡單易懂的方式解釋給 N4 程度的學生。 " +
            "任務： 請用單字『$term』（形態：$typeLabel）造一個 N4 程度的日文句子。  " +
            "輸出格式要求（嚴格執行）： JP: [日文句子] Reading: [全平假名] ZH: [繁體中文翻譯] " +
            "Grammar: [簡短說明該單字在此處的用法與形態變化，需點出$typeLabel]"

    private fun buildTranslationPrompt(dict: String): String = "請把以下日文翻譯成繁體中文，只輸出翻譯結果，不要加標點或解釋。\n日文：$dict"
}

class OfflineAIService : AIService {
    override suspend fun generateTranslation(dict: String): String = "（暫無翻譯）$dict"

    override suspend fun generateExample(
        term: String,
        typeLabel: String,
    ): AIExample {
        val jp =
            when (typeLabel) {
                "ない形" -> "今日は$term。"
                "た形" -> "昨日、$term。"
                "なかった形" -> "先週は$term。"
                "て形" -> "$term、寝ます。"
                "可能形" -> "$term。"
                else -> "$term。"
            }
        val grammar =
            when (typeLabel) {
                "ない形" -> "「ない形」表示否定。"
                "た形" -> "「た形」表示過去完成。"
                "なかった形" -> "「なかった形」表示過去否定。"
                "て形" -> "「て形」可用於動作連接。"
                "可能形" -> "「可能形」表示能力或可能。"
                else -> "依題型進行變化練習。"
            }
        return AIExample(
            jp = jp,
            reading = "（暫未提供假名）",
            zh = "（暫無翻譯）",
            grammar = grammar,
        )
    }
}

@Serializable
private data class OllamaChatRequest(
    val model: String,
    val messages: List<OllamaMessage>,
    val stream: Boolean = false,
)

@Serializable
private data class OllamaMessage(
    val role: String,
    val content: String,
)

@Serializable
private data class OllamaChatResponse(
    val model: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null,
    val message: OllamaMessage? = null,
    @SerialName("done")
    val done: Boolean? = null,
)

@Serializable
private data class OllamaGenerateRequest(
    val model: String,
    val prompt: String,
    val stream: Boolean = false,
)

@Serializable
private data class OllamaGenerateResponse(
    val model: String? = null,
    val response: String? = null,
    @SerialName("done")
    val done: Boolean? = null,
)
