import Foundation

final class AppState: ObservableObject {
    private let aiService = AppleIntelligenceService()
    private let srsStore = SrsStore.shared

    @Published var verbBank: [CardFixture] = []
    @Published var adjectiveBank: [CardFixture] = []
    @Published var currentQuestion: QuestionViewModel?
    @Published var currentPractice: PracticeKind = .verb
    @Published var answerMode: AnswerMode = .input
    @Published var answerText: String = ""
    @Published var choiceOptions: [String] = []
    @Published var result: AnswerResult?
    @Published var translationText: String?
    @Published var example: AIExample?
    @Published var aiStatus: AIStatus = .idle
    @Published var errorMessage: String?
    @Published var stats: Stats = Stats()
    @Published var wrongToday: [WrongEntry] = []

    init() {
        loadDefaults()
        stats = srsStore.loadStats()
        stats.normalizeForToday()
        wrongToday = srsStore.loadWrongToday()
        nextQuestion(practice: .verb)
    }

    func loadDefaults() {
        do {
            let fixtures = try FixtureLoader.load("conjugation", as: ConjugationFixtures.self)
            verbBank = fixtures.verbs.map { item in
                CardFixture(
                    dict: item.dict,
                    nai: item.expected.nai,
                    ta: item.expected.ta,
                    nakatta: item.expected.nakatta,
                    te: item.expected.te,
                    potential: item.expected.potential,
                    group: item.group,
                    zh: nil
                )
            }
            adjectiveBank = fixtures.adjectives.map { item in
                let dict = item.expected.dict ?? item.dict.replacingOccurrences(of: "だ", with: "")
                return CardFixture(
                    dict: dict,
                    nai: item.expected.nai,
                    ta: item.expected.ta,
                    nakatta: item.expected.nakatta,
                    te: item.expected.te,
                    potential: nil,
                    group: item.group,
                    zh: nil
                )
            }
        } catch {
            errorMessage = String(describing: error)
        }
    }

    func nextQuestion(practice: PracticeKind) {
        currentPractice = practice
        let bank = practice == .verb ? verbBank : adjectiveBank
        guard let card = pickNextCard(from: bank) else {
            currentQuestion = nil
            return
        }
        let types = QuestionType.allCases.filter { type in
            if type == .mixed { return false }
            if practice == .adjective && type == .potential { return false }
            return true
        }
        let type = types.randomElement() ?? .nai
        currentQuestion = QuestionViewModel(card: card, type: type)
        answerText = ""
        result = nil
        translationText = nil
        example = nil
        aiStatus = .idle
        if answerMode == .choice {
            generateChoices()
        } else {
            choiceOptions = []
        }
    }

    func submitAnswer(_ value: String) {
        guard let question = currentQuestion else { return }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        let correct = trimmed == question.answer
        result = AnswerResult(
            correct: correct,
            correctAnswer: question.answer,
            userAnswer: trimmed,
            type: question.type
        )
        applySrs(for: question.card.dict, isCorrect: correct)
        updateStats(isCorrect: correct)
        updateWrongToday(question: question, isCorrect: correct)
        Task { await generateAI(for: question) }
    }

    func skip() {
        submitAnswer("")
    }

    func generateChoices() {
        guard let question = currentQuestion else { return }
        var options: [String] = [question.answer]
        var used = Set<String>([question.answer])

        // Use other forms of the same card as distractors.
        let candidates = [
            question.card.nai,
            question.card.ta,
            question.card.nakatta,
            question.card.te,
            question.card.potential,
        ].compactMap { $0 }
        for candidate in candidates where !candidate.isEmpty && !used.contains(candidate) {
            options.append(candidate)
            used.insert(candidate)
            if options.count >= 4 { break }
        }

        // Pull extra distractors from bank if needed.
        if options.count < 4 {
            let bank = currentPractice == .verb ? verbBank : adjectiveBank
            for card in bank.shuffled() {
                let extras = [card.nai, card.ta, card.nakatta, card.te, card.potential].compactMap { $0 }
                for candidate in extras where !candidate.isEmpty && !used.contains(candidate) {
                    options.append(candidate)
                    used.insert(candidate)
                    if options.count >= 4 { break }
                }
                if options.count >= 4 { break }
            }
        }

        choiceOptions = options.shuffled()
    }

    func regenerateAI() {
        guard let question = currentQuestion else { return }
        Task { await generateAI(for: question) }
    }

    private func pickNextCard(from bank: [CardFixture]) -> CardFixture? {
        let srs = srsStore.loadSrs()
        let now = Date()
        let dueCards = bank.filter { card in
            if let state = srs[card.dict] {
                return state.due <= now
            }
            return true
        }
        if let selected = dueCards.randomElement() {
            return selected
        }
        return bank.randomElement()
    }

    private func applySrs(for dict: String, isCorrect: Bool) {
        var srs = srsStore.loadSrs()
        let previous = srs[dict]?.intervalDays ?? 0
        let interval = Srs.nextIntervalDays(previous: previous, isCorrect: isCorrect)
        let dueOffsetMs = Srs.dueOffsetMs(previous: previous, isCorrect: isCorrect)
        let dueDate = Date().addingTimeInterval(TimeInterval(dueOffsetMs) / 1000.0)
        srs[dict] = SrsState(intervalDays: interval, due: dueDate)
        srsStore.saveSrs(srs)
    }

    private func updateStats(isCorrect: Bool) {
        stats.normalizeForToday()
        stats.todayCount += 1
        stats.streak = isCorrect ? stats.streak + 1 : 0
        srsStore.saveStats(stats)
    }

    private func updateWrongToday(question: QuestionViewModel, isCorrect: Bool) {
        var items = wrongToday
        let entry = WrongEntry(dict: question.card.dict, type: question.type.rawValue)
        if isCorrect {
            items.removeAll { $0 == entry }
        } else {
            if !items.contains(entry) {
                items.append(entry)
            }
        }
        wrongToday = items
        srsStore.saveWrongToday(items)
    }

    @MainActor
    private func generateAI(for question: QuestionViewModel) async {
        aiStatus = .loading
        do {
            translationText = try await aiService.generateTranslation(question.answer)
        } catch {
            aiStatus = .error(friendlyAIError(error))
            return
        } catch {
            aiStatus = .error(friendlyAIError(error))
            return
        }

        do {
            example = try await aiService.generateExample(term: question.answer, typeLabel: question.promptLabel)
            aiStatus = .idle
        } catch {
            aiStatus = .error(friendlyAIError(error))
        }
    }

    private func friendlyAIError(_ error: Error) -> String {
        let text = String(describing: error)
        if text.contains("guardrailViolation") {
            return "AI 回覆被安全機制攔截，請重試"
        }
        if text.contains("unavailable") {
            return "AI 模型不可用，請確認 Apple Intelligence 已啟用"
        }
        return text
    }
}

struct QuestionViewModel {
    let card: CardFixture
    let type: QuestionType

    var answer: String {
        switch type {
        case .nai: return card.nai
        case .ta: return card.ta
        case .nakatta: return card.nakatta
        case .te: return card.te
        case .potential: return card.potential ?? ""
        case .mixed: return ""
        }
    }

    var promptLabel: String {
        type.label
    }
}

enum QuestionType: String, CaseIterable {
    case nai
    case ta
    case nakatta
    case te
    case potential
    case mixed

    var label: String {
        switch self {
        case .nai: return "ない形"
        case .ta: return "た形"
        case .nakatta: return "なかった形"
        case .te: return "て形"
        case .potential: return "可能形"
        case .mixed: return "混合"
        }
    }
}

enum AnswerMode: String, CaseIterable {
    case input
    case choice
}

struct AnswerResult {
    let correct: Bool
    let correctAnswer: String
    let userAnswer: String
    let type: QuestionType
}

enum AIStatus: Equatable {
    case idle
    case loading
    case error(String)
}
