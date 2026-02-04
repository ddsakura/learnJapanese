package com.learnjapanese.app.ui

import android.app.Application
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.learnjapanese.app.BuildConfig
import com.learnjapanese.app.data.AIExample
import com.learnjapanese.app.data.AIService
import com.learnjapanese.app.data.AdjectiveScope
import com.learnjapanese.app.data.AnswerMode
import com.learnjapanese.app.data.BankStore
import com.learnjapanese.app.data.CardFixture
import com.learnjapanese.app.data.ConjugationFixtures
import com.learnjapanese.app.data.FixtureLoader
import com.learnjapanese.app.data.ImportItem
import com.learnjapanese.app.data.ImportResult
import com.learnjapanese.app.data.Importing
import com.learnjapanese.app.data.OfflineAIService
import com.learnjapanese.app.data.OllamaAIService
import com.learnjapanese.app.data.PracticeKind
import com.learnjapanese.app.data.PracticeMode
import com.learnjapanese.app.data.QuestionType
import com.learnjapanese.app.data.SpeechService
import com.learnjapanese.app.data.SpeechStatus
import com.learnjapanese.app.data.Srs
import com.learnjapanese.app.data.SrsState
import com.learnjapanese.app.data.SrsStore
import com.learnjapanese.app.data.Stats
import com.learnjapanese.app.data.VerbScope
import com.learnjapanese.app.data.WrongEntry
import com.learnjapanese.app.data.WrongToday
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.builtins.ListSerializer

data class QuestionViewModel(
    val card: CardFixture,
    val type: QuestionType,
) {
    val answer: String
        get() =
            when (type) {
                QuestionType.NAI -> card.nai
                QuestionType.TA -> card.ta
                QuestionType.NAKATTA -> card.nakatta
                QuestionType.TE -> card.te
                QuestionType.POTENTIAL -> card.potential ?: ""
                QuestionType.MIXED -> ""
            }

    val promptLabel: String
        get() = type.label
}

data class AnswerResult(
    val correct: Boolean,
    val correctAnswer: String,
    val userAnswer: String,
    val type: QuestionType,
)

class AppViewModel(
    application: Application,
) : AndroidViewModel(application) {
    private val tag = "AppViewModel"
    private val fallbackAiService: AIService = OfflineAIService()
    private val srsStore = SrsStore(application)
    private val bankStore = BankStore(application)
    private val prefs = application.getSharedPreferences("learnjapanese.prefs", 0)
    private val speechService = SpeechService(application)

    override fun onCleared() {
        super.onCleared()
        speechService.shutdown()
    }

    private object DefaultsKey {
        const val ANSWER_MODE = "learnJapanese.answerMode"
        const val QUESTION_TYPE = "learnJapanese.questionType"
        const val VERB_SCOPE = "learnJapanese.verbScope"
        const val ADJECTIVE_SCOPE = "learnJapanese.adjectiveScope"
        const val PRACTICE_KIND = "learnJapanese.practiceKind"
        const val OLLAMA_ENABLED = "learnJapanese.ollama.enabled"
        const val OLLAMA_BASE_URL = "learnJapanese.ollama.baseUrl"
        const val OLLAMA_MODEL = "learnJapanese.ollama.model"
    }

    var verbBank by mutableStateOf(listOf<CardFixture>())
        private set
    var adjectiveBank by mutableStateOf(listOf<CardFixture>())
        private set
    var currentQuestion by mutableStateOf<QuestionViewModel?>(null)
        private set
    var currentPractice by mutableStateOf(PracticeKind.VERB)
        private set
    var selectedQuestionType by mutableStateOf(QuestionType.MIXED)
        private set
    var selectedVerbScope by mutableStateOf(VerbScope.ALL)
        private set
    var selectedAdjectiveScope by mutableStateOf(AdjectiveScope.ALL)
        private set
    var answerMode by mutableStateOf(AnswerMode.INPUT)
        private set
    var answerText by mutableStateOf("")
    var choiceOptions by mutableStateOf(listOf<String>())
        private set
    var result by mutableStateOf<AnswerResult?>(null)
        private set
    var translationText by mutableStateOf<String?>(null)
        private set
    var example by mutableStateOf<AIExample?>(null)
        private set
    var aiStatus by mutableStateOf<AIStatus>(AIStatus.Idle)
        private set
    var aiSourceNote by mutableStateOf<String?>(null)
        private set
    var ollamaEnabled by mutableStateOf(BuildConfig.OLLAMA_ENABLED)
        private set
    var ollamaBaseUrl by mutableStateOf(BuildConfig.OLLAMA_BASE_URL)
        private set
    var ollamaModel by mutableStateOf(BuildConfig.OLLAMA_MODEL)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var speechMessage by mutableStateOf<String?>(null)
        private set
    var stats by mutableStateOf(Stats())
        private set
    var wrongToday by mutableStateOf(WrongToday(date = Stats.todayKey(), items = emptyList()))
        private set
    var bankText by mutableStateOf("")
    var bankMessage by mutableStateOf("")
        private set
    var isImporting by mutableStateOf(false)
        private set
    var quickInput by mutableStateOf("")
    var mode by mutableStateOf(PracticeMode.NORMAL)
        private set

    init {
        loadDefaults()
        loadPreferences()
        stats = srsStore.loadStats()
        stats.normalizeForToday()
        wrongToday = srsStore.loadWrongToday()
        nextQuestion(currentPractice)
    }

    private fun loadDefaults() {
        val savedVerbs = bankStore.loadVerbBank()
        val savedAdjectives = bankStore.loadAdjectiveBank()
        if (savedVerbs.isNotEmpty() || savedAdjectives.isNotEmpty()) {
            verbBank = savedVerbs
            adjectiveBank = savedAdjectives
            return
        }
        try {
            val fixtures = FixtureLoader.load<ConjugationFixtures>(getApplication(), "conjugation")
            verbBank =
                fixtures.verbs.map { item ->
                    CardFixture(
                        dict = item.dict,
                        nai = item.expected.nai,
                        ta = item.expected.ta,
                        nakatta = item.expected.nakatta,
                        te = item.expected.te,
                        potential = item.expected.potential,
                        group = item.group,
                        zh = null,
                    )
                }
            adjectiveBank =
                fixtures.adjectives.map { item ->
                    val dict = item.expected.dict ?: item.dict.replace("だ", "")
                    CardFixture(
                        dict = dict,
                        nai = item.expected.nai,
                        ta = item.expected.ta,
                        nakatta = item.expected.nakatta,
                        te = item.expected.te,
                        potential = null,
                        group = item.group,
                        zh = null,
                    )
                }
        } catch (error: Exception) {
            errorMessage = error.message
        }
    }

    private fun loadPreferences() {
        prefs.getString(DefaultsKey.ANSWER_MODE, null)?.let { raw ->
            answerMode = runCatching { AnswerMode.valueOf(raw) }.getOrDefault(answerMode)
        }
        prefs.getString(DefaultsKey.QUESTION_TYPE, null)?.let { raw ->
            selectedQuestionType = runCatching { QuestionType.valueOf(raw) }.getOrDefault(selectedQuestionType)
        }
        prefs.getString(DefaultsKey.VERB_SCOPE, null)?.let { raw ->
            selectedVerbScope = runCatching { VerbScope.valueOf(raw) }.getOrDefault(selectedVerbScope)
        }
        prefs.getString(DefaultsKey.ADJECTIVE_SCOPE, null)?.let { raw ->
            selectedAdjectiveScope = runCatching { AdjectiveScope.valueOf(raw) }.getOrDefault(selectedAdjectiveScope)
        }
        prefs.getString(DefaultsKey.PRACTICE_KIND, null)?.let { raw ->
            currentPractice = if (raw == PracticeKind.ADJECTIVE.raw) PracticeKind.ADJECTIVE else PracticeKind.VERB
        }
        ollamaEnabled = prefs.getBoolean(DefaultsKey.OLLAMA_ENABLED, BuildConfig.OLLAMA_ENABLED)
        ollamaBaseUrl =
            prefs
                .getString(DefaultsKey.OLLAMA_BASE_URL, BuildConfig.OLLAMA_BASE_URL)
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
                ?: BuildConfig.OLLAMA_BASE_URL
        ollamaModel =
            prefs
                .getString(DefaultsKey.OLLAMA_MODEL, BuildConfig.OLLAMA_MODEL)
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
                ?: BuildConfig.OLLAMA_MODEL
    }

    fun setOllamaConfig(
        enabled: Boolean,
        baseUrl: String,
        model: String,
    ) {
        val safeBaseUrl = baseUrl.trim().ifEmpty { BuildConfig.OLLAMA_BASE_URL }
        val safeModel = model.trim().ifEmpty { BuildConfig.OLLAMA_MODEL }
        ollamaEnabled = enabled
        ollamaBaseUrl = safeBaseUrl
        ollamaModel = safeModel
        prefs
            .edit()
            .putBoolean(DefaultsKey.OLLAMA_ENABLED, enabled)
            .putString(DefaultsKey.OLLAMA_BASE_URL, safeBaseUrl)
            .putString(DefaultsKey.OLLAMA_MODEL, safeModel)
            .apply()
    }

    @JvmName("updatePracticeKind")
    fun setPracticeKind(value: PracticeKind) {
        currentPractice = value
        prefs.edit().putString(DefaultsKey.PRACTICE_KIND, value.raw).apply()
    }

    @JvmName("updateAnswerMode")
    fun setAnswerMode(value: AnswerMode) {
        answerMode = value
        prefs.edit().putString(DefaultsKey.ANSWER_MODE, value.name).apply()
        // Ensure UI updates immediately when switching answer mode from settings.
        if (value == AnswerMode.CHOICE) {
            if (currentQuestion != null) {
                generateChoices()
            }
        } else {
            choiceOptions = emptyList()
        }
    }

    @JvmName("updateQuestionType")
    fun setQuestionType(value: QuestionType) {
        selectedQuestionType = value
        prefs.edit().putString(DefaultsKey.QUESTION_TYPE, value.name).apply()
    }

    @JvmName("updateVerbScope")
    fun setVerbScope(value: VerbScope) {
        selectedVerbScope = value
        prefs.edit().putString(DefaultsKey.VERB_SCOPE, value.name).apply()
    }

    @JvmName("updateAdjectiveScope")
    fun setAdjectiveScope(value: AdjectiveScope) {
        selectedAdjectiveScope = value
        prefs.edit().putString(DefaultsKey.ADJECTIVE_SCOPE, value.name).apply()
    }

    fun nextQuestion(practice: PracticeKind) {
        currentPractice = practice
        val bank = if (practice == PracticeKind.VERB) verbBank else adjectiveBank
        val scopedBank = filterBank(bank, practice)
        currentQuestion =
            if (mode == PracticeMode.REVIEW_WRONG) {
                pickReviewQuestion(scopedBank, practice)
            } else {
                val card = pickNextCard(scopedBank)
                card?.let {
                    val type = resolveQuestionType(practice)
                    QuestionViewModel(card = it, type = type)
                }
            }

        answerText = ""
        result = null
        translationText = null
        example = null
        aiStatus = AIStatus.Idle

        if (answerMode == AnswerMode.CHOICE) {
            generateChoices()
        } else {
            choiceOptions = emptyList()
        }
    }

    fun submitAnswer(value: String) {
        val question = currentQuestion ?: return
        val trimmed = value.trim()
        val correct = trimmed == question.answer
        result =
            AnswerResult(
                correct = correct,
                correctAnswer = question.answer,
                userAnswer = trimmed,
                type = question.type,
            )
        applySrs(question.card.dict, correct)
        updateStats(correct)
        updateWrongToday(question, correct)
        viewModelScope.launch { generateAI(question) }
    }

    fun skip() {
        submitAnswer("")
    }

    fun generateChoices() {
        val question = currentQuestion ?: return
        val options = mutableListOf(question.answer)
        val used = mutableSetOf(question.answer)

        val candidates =
            listOf(
                question.card.nai,
                question.card.ta,
                question.card.nakatta,
                question.card.te,
                question.card.potential,
            ).filterNotNull()

        for (candidate in candidates) {
            if (candidate.isNotEmpty() && !used.contains(candidate)) {
                options.add(candidate)
                used.add(candidate)
                if (options.size >= 4) break
            }
        }

        if (options.size < 4) {
            val bank = if (currentPractice == PracticeKind.VERB) verbBank else adjectiveBank
            for (card in bank.shuffled()) {
                val extras = listOf(card.nai, card.ta, card.nakatta, card.te, card.potential).filterNotNull()
                for (candidate in extras) {
                    if (candidate.isNotEmpty() && !used.contains(candidate)) {
                        options.add(candidate)
                        used.add(candidate)
                        if (options.size >= 4) break
                    }
                }
                if (options.size >= 4) break
            }
        }

        choiceOptions = options.shuffled()
    }

    fun regenerateAI() {
        val question = currentQuestion ?: return
        viewModelScope.launch { generateAI(question) }
    }

    fun startReview() {
        mode = PracticeMode.REVIEW_WRONG
        nextQuestion(currentPractice)
    }

    fun exitReview() {
        mode = PracticeMode.NORMAL
        nextQuestion(currentPractice)
    }

    fun speakQuestion() {
        val question = currentQuestion ?: return
        updateSpeechMessageForCurrentStatus()
        speechService.speak(question.card.dict)
    }

    fun speakExample() {
        val content = example ?: return
        updateSpeechMessageForCurrentStatus()
        speechService.speak(content.jp)
    }

    private fun updateSpeechMessageForCurrentStatus() {
        speechMessage =
            when (speechService.currentStatus()) {
                SpeechStatus.READY_NON_JAPANESE -> "語音引擎未安裝日文語音，請到系統 TTS 下載 ja-JP。"
                SpeechStatus.FAILED -> "語音引擎初始化失敗。"
                else -> null
            }
    }

    fun exportBank(practice: PracticeKind) {
        bankMessage = ""
        val bank = if (practice == PracticeKind.VERB) verbBank else adjectiveBank
        val json = FixtureLoader.json()
        val raw = json.encodeToString(ListSerializer(CardFixture.serializer()), bank)
        bankText = raw
        bankMessage = "已匯出題庫"
    }

    fun importBank(practice: PracticeKind) {
        bankMessage = ""
        isImporting = true
        val raw = bankText
        viewModelScope.launch {
            val res =
                withContext(Dispatchers.Default) {
                    runCatching {
                        val json = FixtureLoader.json()
                        val decoded = json.decodeFromString(ListSerializer(ImportItem.serializer()), raw)
                        Importing.normalizeImport(decoded, practice)
                    }.getOrElse {
                        ImportResult.Failure("匯入失敗：JSON 解析錯誤。")
                    }
                }
            when (res) {
                is ImportResult.Success -> {
                    if (practice == PracticeKind.VERB) {
                        verbBank = res.bank
                        bankStore.saveVerbBank(res.bank)
                    } else {
                        adjectiveBank = res.bank
                        bankStore.saveAdjectiveBank(res.bank)
                    }
                    bankMessage = "匯入完成：${res.bank.size} 筆資料"
                    nextQuestion(practice)
                }

                is ImportResult.Failure -> {
                    bankMessage = res.message
                }
            }
            isImporting = false
        }
    }

    fun resetBank(practice: PracticeKind) {
        if (practice == PracticeKind.VERB) {
            verbBank = emptyList()
            bankStore.saveVerbBank(emptyList())
        } else {
            adjectiveBank = emptyList()
            bankStore.saveAdjectiveBank(emptyList())
        }
        loadDefaults()
        nextQuestion(practice)
    }

    fun quickImport(practice: PracticeKind) {
        bankMessage = ""
        isImporting = true
        val entries =
            quickInput
                .split(" ", "\n", "\t", ",")
                .map { it.trim() }
                .filter { it.isNotEmpty() }
        if (entries.isEmpty()) {
            bankMessage = if (practice == PracticeKind.VERB) "請先輸入動詞。" else "請先輸入形容詞。"
            isImporting = false
            return
        }
        val items = entries.map { ImportItem.StringItem(it) }
        when (val result = Importing.normalizeImport(items, practice)) {
            is ImportResult.Success -> {
                if (practice == PracticeKind.VERB) {
                    verbBank = result.bank
                    bankStore.saveVerbBank(result.bank)
                } else {
                    adjectiveBank = result.bank
                    bankStore.saveAdjectiveBank(result.bank)
                }
                bankMessage = "匯入成功"
                quickInput = ""
                nextQuestion(practice)
            }

            is ImportResult.Failure -> {
                bankMessage = "匯入失敗：${result.message}"
            }
        }
        isImporting = false
    }

    fun quickImport() {
        quickImport(currentPractice)
    }

    private fun filterBank(
        bank: List<CardFixture>,
        practice: PracticeKind,
    ): List<CardFixture> =
        if (practice == PracticeKind.VERB) {
            when (selectedVerbScope) {
                VerbScope.ALL -> bank
                VerbScope.GODAN -> bank.filter { it.group == "godan" }
                VerbScope.ICHIDAN -> bank.filter { it.group == "ichidan" }
                VerbScope.IRREGULAR -> bank.filter { it.group == "irregular" }
            }
        } else {
            when (selectedAdjectiveScope) {
                AdjectiveScope.ALL -> bank
                AdjectiveScope.I -> bank.filter { it.group == "i" }
                AdjectiveScope.NA -> bank.filter { it.group == "na" }
            }
        }

    private fun pickNextCard(bank: List<CardFixture>): CardFixture? {
        val srs = srsStore.loadSrs()
        val now = System.currentTimeMillis()
        val dueCards =
            bank.filter { card ->
                val state = srs[card.dict]
                state == null || state.dueMillis <= now
            }
        return dueCards.randomOrNull() ?: bank.randomOrNull()
    }

    private fun pickReviewQuestion(
        bank: List<CardFixture>,
        practice: PracticeKind,
    ): QuestionViewModel? {
        val items = wrongToday.items.filter { it.practice == practice.raw }
        if (items.isEmpty()) return null
        val entry = items.random()
        val card = bank.find { it.dict == entry.dict } ?: return null
        val type = QuestionType.entries.find { it.name == entry.type } ?: QuestionType.MIXED
        return QuestionViewModel(card = card, type = type)
    }

    private fun resolveQuestionType(practice: PracticeKind): QuestionType {
        // If the user selected a specific question type and it's valid for this practice kind,
        // honor it. Otherwise, fall back to picking a valid type at random.
        val isPotentialUnsupported = practice != PracticeKind.VERB && selectedQuestionType == QuestionType.POTENTIAL
        if (selectedQuestionType != QuestionType.MIXED && !isPotentialUnsupported) {
            return selectedQuestionType
        }
        val types =
            if (practice == PracticeKind.VERB) {
                listOf(
                    QuestionType.NAI,
                    QuestionType.TA,
                    QuestionType.NAKATTA,
                    QuestionType.TE,
                    QuestionType.POTENTIAL,
                )
            } else {
                listOf(
                    QuestionType.NAI,
                    QuestionType.TA,
                    QuestionType.NAKATTA,
                    QuestionType.TE,
                )
            }
        return types.random()
    }

    private fun applySrs(
        dict: String,
        correct: Boolean,
    ) {
        val srsStates = srsStore.loadSrs().toMutableMap()
        val state = srsStates[dict] ?: SrsState(intervalDays = 0, dueMillis = 0)

        val intervalDays = Srs.nextIntervalDays(state.intervalDays, correct)
        val dueOffsetMs = Srs.dueOffsetMs(state.intervalDays, correct)
        val newState =
            state.copy(
                intervalDays = intervalDays,
                dueMillis = System.currentTimeMillis() + dueOffsetMs,
            )

        srsStates[dict] = newState
        srsStore.saveSrs(srsStates)
    }

    private fun updateStats(correct: Boolean) {
        stats.normalizeForToday()
        stats =
            stats.copy(
                todayCount = stats.todayCount + 1,
                streak = if (correct) stats.streak + 1 else 0,
            )
        srsStore.saveStats(stats)
    }

    private fun updateWrongToday(
        question: QuestionViewModel,
        correct: Boolean,
    ) {
        val items = wrongToday.items.toMutableList()
        val entry = WrongEntry(dict = question.card.dict, type = question.type.name, practice = currentPractice.raw)
        if (correct) {
            items.removeAll { it == entry }
        } else if (!items.contains(entry)) {
            items.add(entry)
        }
        wrongToday = wrongToday.copy(items = items)
        srsStore.saveWrongToday(wrongToday)
    }

    private suspend fun generateAI(question: QuestionViewModel) {
        if (!BuildConfig.DEBUG && ollamaEnabled && ollamaBaseUrl.startsWith("http://")) {
            aiStatus = AIStatus.Error("Release 版本僅支援 HTTPS Ollama URL。")
            aiSourceNote = "AI 來源：離線模板（release 禁用 HTTP Ollama）"
            return
        }

        val aiService: AIService =
            if (ollamaEnabled) {
                OllamaAIService(
                    baseUrl = ollamaBaseUrl,
                    model = ollamaModel,
                )
            } else {
                fallbackAiService
            }
        aiStatus = AIStatus.Loading
        aiSourceNote = null
        var usedFallback = false
        var fallbackReason: String? = null

        val translationPrimary = runCatching { aiService.generateTranslation(question.answer) }
        val translationTextValue =
            translationPrimary.getOrElse { primaryError ->
                usedFallback = true
                fallbackReason = primaryError.message
                Log.w(tag, "Translation via Ollama failed, fallback to offline", primaryError)
                runCatching { fallbackAiService.generateTranslation(question.answer) }
                    .getOrElse { fallbackError ->
                        aiStatus = AIStatus.Error(fallbackError.message ?: "Unknown error")
                        return
                    }
            }
        translationText = translationTextValue

        val examplePrimary = runCatching { aiService.generateExample(question.answer, question.promptLabel) }
        val exampleValue =
            examplePrimary.getOrElse { primaryError ->
                usedFallback = true
                fallbackReason = primaryError.message
                Log.w(tag, "Example via Ollama failed, fallback to offline", primaryError)
                runCatching { fallbackAiService.generateExample(question.answer, question.promptLabel) }
                    .getOrElse { fallbackError ->
                        aiStatus = AIStatus.Error(fallbackError.message ?: "Unknown error")
                        return
                    }
            }
        example = exampleValue

        aiSourceNote =
            when {
                !ollamaEnabled -> "AI 來源：離線模板（已停用 Ollama）"
                usedFallback -> "AI 來源：離線模板（Ollama 失敗已 fallback：${fallbackReason?.take(60) ?: "未知原因"}）"
                else -> "AI 來源：Ollama ($ollamaModel)"
            }
        aiStatus = AIStatus.Idle
    }
}

sealed class AIStatus {
    data object Idle : AIStatus()

    data object Loading : AIStatus()

    data class Error(
        val message: String,
    ) : AIStatus()
}
