import Foundation

final class AppState: ObservableObject {
    @Published var verbBank: [CardFixture] = []
    @Published var adjectiveBank: [CardFixture] = []
    @Published var currentQuestion: QuestionViewModel?
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
        let bank = practice == .verb ? verbBank : adjectiveBank
        guard let card = bank.randomElement() else {
            currentQuestion = nil
            return
        }
        let type = QuestionType.allCases.filter { $0 != .mixed }.randomElement() ?? .nai
        currentQuestion = QuestionViewModel(card: card, type: type)
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
