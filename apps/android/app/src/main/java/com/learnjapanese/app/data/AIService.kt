package com.learnjapanese.app.data

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

class OfflineAIService : AIService {
    override suspend fun generateTranslation(dict: String): String = throw AIServiceUnavailable("AI 模型不可用，請先在 Android 端接上 AI 服務")

    override suspend fun generateExample(
        term: String,
        typeLabel: String,
    ): AIExample = throw AIServiceUnavailable("AI 模型不可用，請先在 Android 端接上 AI 服務")
}
