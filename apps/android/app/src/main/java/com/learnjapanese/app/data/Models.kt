package com.learnjapanese.app.data

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Serializable
data class BankFixtures(
    val verb: List<CardFixture>,
    val adjective: List<CardFixture>,
)

@Serializable
data class ConjugationFixtures(
    val verbs: List<VerbFixture>,
    val adjectives: List<AdjectiveFixture>,
)

@Serializable
data class VerbFixture(
    val dict: String,
    val group: String,
    val expected: VerbExpected,
)

@Serializable
data class VerbExpected(
    val nai: String,
    val ta: String,
    val nakatta: String,
    val te: String,
    val potential: String,
)

@Serializable
data class AdjectiveFixture(
    val dict: String,
    val group: String,
    val expected: AdjectiveExpected,
)

@Serializable
data class AdjectiveExpected(
    val dict: String? = null,
    val nai: String,
    val ta: String,
    val nakatta: String,
    val te: String,
)

@Serializable
data class ParsingFixtures(
    val exampleResponse: ExampleResponseFixture,
    val translation: TranslationFixture,
    val choices: ChoicesFixture,
)

@Serializable
data class ExampleResponseFixture(
    val input: String,
    val output: ExampleOutput,
)

@Serializable
data class ExampleOutput(
    val jp: String,
    val reading: String,
    val zh: String,
    val grammar: String,
)

@Serializable
data class TranslationFixture(
    val input: String,
    val output: String,
)

@Serializable
data class ChoicesFixture(
    val input: String,
    val output: List<String>,
)

@Serializable
data class ImportingFixtures(
    val cases: List<ImportCase>,
)

@Serializable
data class ImportCase(
    val id: String,
    val practice: String,
    val input: List<ImportItem>,
    val ok: Boolean,
    val expected: List<CardFixture>? = null,
    val error: String? = null,
)

@Serializable(with = ImportItemSerializer::class)
sealed class ImportItem {
    data class StringItem(
        val value: String,
    ) : ImportItem()

    data class ObjectItem(
        val value: ImportObject,
    ) : ImportItem()
}

object ImportItemSerializer : KSerializer<ImportItem> {
    @OptIn(kotlinx.serialization.InternalSerializationApi::class)
    override val descriptor: SerialDescriptor =
        buildSerialDescriptor("ImportItem", kotlinx.serialization.descriptors.SerialKind.CONTEXTUAL)

    override fun deserialize(decoder: Decoder): ImportItem {
        val jsonDecoder = decoder as? JsonDecoder ?: throw SerializationException("Expected JsonDecoder")
        val element = jsonDecoder.decodeJsonElement()
        return when (element) {
            is JsonPrimitive -> {
                ImportItem.StringItem(element.content)
            }

            is JsonObject -> {
                ImportItem.ObjectItem(
                    jsonDecoder.json.decodeFromJsonElement(ImportObject.serializer(), element),
                )
            }

            else -> {
                throw SerializationException("Unsupported ImportItem")
            }
        }
    }

    override fun serialize(
        encoder: Encoder,
        value: ImportItem,
    ) {
        val jsonEncoder =
            encoder as? kotlinx.serialization.json.JsonEncoder
                ?: throw SerializationException("Expected JsonEncoder")
        when (value) {
            is ImportItem.StringItem -> {
                jsonEncoder.encodeJsonElement(JsonPrimitive(value.value))
            }

            is ImportItem.ObjectItem -> {
                jsonEncoder.encodeJsonElement(
                    jsonEncoder.json.encodeToJsonElement(ImportObject.serializer(), value.value),
                )
            }
        }
    }
}

@Serializable
data class ImportObject(
    val dict: String,
    val group: String? = null,
    val nai: String? = null,
    val ta: String? = null,
    val nakatta: String? = null,
    val te: String? = null,
    val potential: String? = null,
    val zh: String? = null,
)

@Serializable
data class CardFixture(
    val dict: String,
    val nai: String,
    val ta: String,
    val nakatta: String,
    val te: String,
    val potential: String? = null,
    val group: String,
    val zh: String? = null,
)

@Serializable
data class SrsFixtures(
    val cases: List<SrsCase>,
)

@Serializable
data class SrsCase(
    val id: String,
    val prevIntervalDays: Int,
    val isCorrect: Boolean,
    val expected: SrsExpected,
)

@Serializable
data class SrsExpected(
    val intervalDays: Int,
    val dueOffsetMs: Int,
)

@Serializable
data class SrsState(
    val intervalDays: Int,
    val dueMillis: Long,
)

@Serializable
data class WrongEntry(
    val dict: String,
    val type: String,
    val practice: String,
)

@Serializable
data class WrongToday(
    val date: String,
    val items: List<WrongEntry>,
)

@Serializable
data class Stats(
    var streak: Int = 0,
    var todayCount: Int = 0,
    var lastDate: String = todayKey(),
) {
    fun normalizeForToday() {
        val today = todayKey()
        if (lastDate != today) {
            lastDate = today
            todayCount = 0
        }
    }

    companion object {
        fun todayKey(): String =
            java.time.LocalDate
                .now()
                .toString()
    }
}
