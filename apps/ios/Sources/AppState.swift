import Foundation

final class AppState: ObservableObject {
    private let aiService = AppleIntelligenceService()

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

    init() {
        loadDefaults()
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
        guard let card = bank.randomElement() else {
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
        Task { await generateAI(for: question) }
    }

    func skip() {
        submitAnswer("")
    }

    func generateChoices() {
        guard let question = currentQuestion else { return }
        var pool = Set<String>()
        pool.insert(question.answer)

        // Use other forms of the same card as distractors.
        let candidates = [
            question.card.nai,
            question.card.ta,
            question.card.nakatta,
            question.card.te,
            question.card.potential,
        ].compactMap { $0 }
        candidates.forEach { pool.insert($0) }

        // Pull extra distractors from bank if needed.
        let bank = currentPractice == .verb ? verbBank : adjectiveBank
        for card in bank.shuffled() {
            if pool.count >= 4 { break }
            [card.nai, card.ta, card.nakatta, card.te, card.potential].compactMap { $0 }.forEach {
                if pool.count < 4 { pool.insert($0) }
            }
        }

        // Ensure correct answer included and shuffle.
        var options = Array(pool)
        if !options.contains(question.answer) {
            options.append(question.answer)
        }
        choiceOptions = options.shuffled().prefix(4).map { $0 }
    }

    @MainActor
    private func generateAI(for question: QuestionViewModel) async {
        aiStatus = .loading
        do {
            translationText = try await aiService.generateTranslation(question.answer)
        } catch {
            aiStatus = .error(String(describing: error))
            return
        } catch {
            aiStatus = .error(String(describing: error))
            return
        }

        do {
            example = try await aiService.generateExample(term: question.answer, typeLabel: question.promptLabel)
            aiStatus = .idle
        } catch {
            aiStatus = .error(String(describing: error))
        }
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
