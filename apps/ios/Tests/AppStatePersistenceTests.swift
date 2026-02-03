import SwiftUI
import XCTest
@testable import LearnJapanese

final class AppStatePersistenceTests: XCTestCase {
    private let defaults = UserDefaults.standard

    override func setUp() {
        super.setUp()
        clearDefaults()
        seedBanks()
    }

    override func tearDown() {
        clearDefaults()
        super.tearDown()
    }

    func testAppStateLoadsPersistedSettings() {
        defaults.set(AnswerMode.choice.rawValue, forKey: "learnJapanese.answerMode")
        defaults.set(QuestionType.te.rawValue, forKey: "learnJapanese.questionType")
        defaults.set(VerbScope.godan.rawValue, forKey: "learnJapanese.verbScope")
        defaults.set(AdjectiveScope.na.rawValue, forKey: "learnJapanese.adjectiveScope")

        let state = AppState()

        XCTAssertEqual(state.answerMode, .choice)
        XCTAssertEqual(state.selectedQuestionType, .te)
        XCTAssertEqual(state.selectedVerbScope, .godan)
        XCTAssertEqual(state.selectedAdjectiveScope, .na)
    }

    func testAppStatePersistsSettingsOnChange() {
        let state = AppState()

        state.answerMode = .choice
        state.selectedQuestionType = .ta
        state.selectedVerbScope = .ichidan
        state.selectedAdjectiveScope = .i

        XCTAssertEqual(defaults.string(forKey: "learnJapanese.answerMode"), AnswerMode.choice.rawValue)
        XCTAssertEqual(defaults.string(forKey: "learnJapanese.questionType"), QuestionType.ta.rawValue)
        XCTAssertEqual(defaults.string(forKey: "learnJapanese.verbScope"), VerbScope.ichidan.rawValue)
        XCTAssertEqual(defaults.string(forKey: "learnJapanese.adjectiveScope"), AdjectiveScope.i.rawValue)
    }

    func testPracticeKindAppStorageReadsDefaults() {
        defaults.set(PracticeKind.adjective.rawValue, forKey: "learnJapanese.practiceKind")

        struct PracticeProbe {
            @AppStorage("learnJapanese.practiceKind") var practiceRaw: String = PracticeKind.verb.rawValue
        }

        let probe = PracticeProbe()
        XCTAssertEqual(probe.practiceRaw, PracticeKind.adjective.rawValue)
    }

    private func seedBanks() {
        let verb = CardFixture(
            dict: "行く",
            nai: "行かない",
            ta: "行った",
            nakatta: "行かなかった",
            te: "行って",
            potential: "行ける",
            group: "godan",
            zh: nil
        )
        let adjective = CardFixture(
            dict: "静か",
            nai: "静かじゃない",
            ta: "静かだった",
            nakatta: "静かじゃなかった",
            te: "静かで",
            potential: nil,
            group: "na",
            zh: nil
        )
        BankStore.shared.saveVerbBank([verb])
        BankStore.shared.saveAdjectiveBank([adjective])
    }

    private func clearDefaults() {
        [
            "learnJapanese.answerMode",
            "learnJapanese.questionType",
            "learnJapanese.verbScope",
            "learnJapanese.adjectiveScope",
            "learnJapanese.practiceKind",
            "jlpt-n4-verb-bank",
            "jlpt-n4-adjective-bank",
            "jlpt-n4-srs",
            "jlpt-n4-wrong-today",
            "jlpt-n4-stats"
        ].forEach { defaults.removeObject(forKey: $0) }
    }
}
