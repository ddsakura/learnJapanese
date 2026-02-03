import Foundation

final class AppState: ObservableObject {
    private let aiService = AppleIntelligenceService()
    private let srsStore = SrsStore.shared
    private let bankStore = BankStore.shared
    private let speechService = SpeechService.shared

    @Published var verbBank: [CardFixture] = []
    @Published var adjectiveBank: [CardFixture] = []
    @Published var currentQuestion: QuestionViewModel?
    @Published var currentPractice: PracticeKind = .verb
    @Published var selectedQuestionType: QuestionType = .mixed
    @Published var selectedVerbScope: VerbScope = .all
    @Published var selectedAdjectiveScope: AdjectiveScope = .all
    @Published var answerMode: AnswerMode = .input
    @Published var answerText: String = ""
    @Published var choiceOptions: [String] = []
    @Published var result: AnswerResult?
    @Published var translationText: String?
    @Published var example: AIExample?
    @Published var aiStatus: AIStatus = .idle
    @Published var errorMessage: String?
    @Published var stats: Stats = Stats()
    @Published var wrongToday: WrongToday = WrongToday(date: Stats.todayKey(), items: [])
    @Published var bankText: String = ""
    @Published var bankMessage: String = ""
    @Published var isImporting: Bool = false
    @Published var quickInput: String = ""
    @Published var mode: PracticeMode = .normal

    init() {
        loadDefaults()
        stats = srsStore.loadStats()
        stats.normalizeForToday()
        wrongToday = srsStore.loadWrongToday()
        nextQuestion(practice: .verb)
    }

    func loadDefaults() {
        do {
            let savedVerbs = bankStore.loadVerbBank()
            let savedAdjectives = bankStore.loadAdjectiveBank()
            if !savedVerbs.isEmpty || !savedAdjectives.isEmpty {
                verbBank = savedVerbs
                adjectiveBank = savedAdjectives
                return
            }
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
        let scopedBank = filterBank(bank, practice: practice)
        if mode == .reviewWrong {
            guard let reviewQuestion = pickReviewQuestion(from: scopedBank, practice: practice) else {
                currentQuestion = nil
                return
            }
            currentQuestion = reviewQuestion
        } else {
            guard let card = pickNextCard(from: scopedBank) else {
                currentQuestion = nil
                return
            }
            let type = resolveQuestionType(for: practice)
            currentQuestion = QuestionViewModel(card: card, type: type)
        }
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
            question.card.potential
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

    func startReview() {
        mode = .reviewWrong
        nextQuestion(practice: currentPractice)
    }

    func exitReview() {
        mode = .normal
        nextQuestion(practice: currentPractice)
    }

    func speakQuestion() {
        guard let question = currentQuestion else { return }
        speechService.speak(question.card.dict)
    }

    func speakExample() {
        guard let example = example else { return }
        speechService.speak(example.jp)
    }

    func exportBank(practice: PracticeKind) {
        bankMessage = ""
        let bank = practice == .verb ? verbBank : adjectiveBank
        if let data = try? JSONEncoder().encode(bank),
           let text = String(data: data, encoding: .utf8) {
            bankText = text
            bankMessage = "已匯出題庫"
        } else {
            bankMessage = "匯出失敗"
        }
    }

    func importBank(practice: PracticeKind) {
        bankMessage = ""
        isImporting = true
        defer { isImporting = false }
        guard let data = bankText.data(using: .utf8) else {
            bankMessage = "匯入失敗：JSON 解析錯誤。"
            return
        }
        do {
            let decoded = try JSONDecoder().decode([ImportItem].self, from: data)
            let result = Importing.normalizeImport(decoded, practice: practice)
            switch result {
            case .success(let bank):
                if practice == .verb {
                    verbBank = bank
                    bankStore.saveVerbBank(bank)
                } else {
                    adjectiveBank = bank
                    bankStore.saveAdjectiveBank(bank)
                }
                bankMessage = "匯入成功"
                nextQuestion(practice: practice)
            case .failure(let error):
                bankMessage = "匯入失敗：\(error.message)"
            }
        } catch {
            bankMessage = "匯入失敗：JSON 解析錯誤。"
        }
    }

    func quickImport(practice: PracticeKind) {
        bankMessage = ""
        isImporting = true
        defer { isImporting = false }
        let entries = quickInput
            .split { $0 == " " || $0 == "\n" || $0 == "\t" || $0 == "," }
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        if entries.isEmpty {
            bankMessage = practice == .verb ? "請先輸入動詞。" : "請先輸入形容詞。"
            return
        }
        let items = entries.map { ImportItem.string($0) }
        let result = Importing.normalizeImport(items, practice: practice)
        switch result {
        case .success(let bank):
            if practice == .verb {
                verbBank = bank
                bankStore.saveVerbBank(bank)
            } else {
                adjectiveBank = bank
                bankStore.saveAdjectiveBank(bank)
            }
            bankMessage = "匯入成功"
            quickInput = ""
            nextQuestion(practice: practice)
        case .failure(let error):
            bankMessage = "匯入失敗：\(error.message)"
        }
    }

    func resetBank(practice: PracticeKind) {
        bankMessage = ""
        loadDefaults()
        if practice == .verb {
            bankStore.saveVerbBank(verbBank)
        } else {
            bankStore.saveAdjectiveBank(adjectiveBank)
        }
        bankMessage = "已重置為預設題庫"
        nextQuestion(practice: practice)
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

    private func pickReviewQuestion(from bank: [CardFixture], practice: PracticeKind) -> QuestionViewModel? {
        let items = wrongToday.items.filter { $0.practice == practice.rawValue }
        guard let entry = items.randomElement() else { return nil }
        guard let card = bank.first(where: { $0.dict == entry.dict }) else { return nil }
        let type = QuestionType(rawValue: entry.type) ?? .nai
        return QuestionViewModel(card: card, type: type)
    }

    private func filterBank(_ bank: [CardFixture], practice: PracticeKind) -> [CardFixture] {
        switch practice {
        case .verb:
            switch selectedVerbScope {
            case .all:
                return bank
            case .godan:
                return bank.filter { $0.group == "godan" }
            case .ichidan:
                return bank.filter { $0.group == "ichidan" }
            case .irregular:
                return bank.filter { $0.group == "irregular" }
            }
        case .adjective:
            switch selectedAdjectiveScope {
            case .all:
                return bank
            case .i:
                return bank.filter { $0.group == "i" }
            case .na:
                return bank.filter { $0.group == "na" }
            }
        }
    }

    private func resolveQuestionType(for practice: PracticeKind) -> QuestionType {
        let allowed = QuestionType.allCases.filter { type in
            if practice == .adjective && type == .potential { return false }
            return true
        }
        if selectedQuestionType == .mixed {
            let pool = allowed.filter { $0 != .mixed }
            return pool.randomElement() ?? .nai
        }
        if allowed.contains(selectedQuestionType) {
            return selectedQuestionType
        }
        return .nai
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
        var items = wrongToday.items
        let entry = WrongEntry(dict: question.card.dict, type: question.type.rawValue, practice: currentPractice.rawValue)
        if isCorrect {
            items.removeAll { $0 == entry }
        } else {
            if !items.contains(entry) {
                items.append(entry)
            }
        }
        wrongToday = WrongToday(date: Stats.todayKey(), items: items)
        srsStore.saveWrongToday(wrongToday)
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

enum PracticeMode {
    case normal
    case reviewWrong
}

enum VerbScope: String, CaseIterable {
    case all
    case godan
    case ichidan
    case irregular

    var label: String {
        switch self {
        case .all: return "全部"
        case .godan: return "五段"
        case .ichidan: return "二段"
        case .irregular: return "不規則"
        }
    }
}

enum AdjectiveScope: String, CaseIterable {
    case all
    case i
    case na

    var label: String {
        switch self {
        case .all: return "全部"
        case .i: return "い形"
        case .na: return "な形"
        }
    }
}
