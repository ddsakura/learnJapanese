import XCTest
@testable import LearnJapanese

final class AppStateReviewModeTests: XCTestCase {
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

    func testStartReviewUsesWrongEntryForPractice() {
        let state = AppState()
        state.currentPractice = .verb
        state.verbBank = [makeVerbCard(dict: "行く")]
        state.wrongToday = WrongToday(
            date: Stats.todayKey(),
            items: [WrongEntry(dict: "行く", type: QuestionType.nai.rawValue, practice: PracticeKind.verb.rawValue)]
        )

        state.startReview()

        XCTAssertEqual(state.mode, .reviewWrong)
        XCTAssertEqual(state.currentQuestion?.card.dict, "行く")
        XCTAssertEqual(state.currentQuestion?.type, .nai)
    }

    func testStartReviewSkipsWrongEntriesFromOtherPractice() {
        let state = AppState()
        state.currentPractice = .verb
        state.verbBank = [makeVerbCard(dict: "行く")]
        state.wrongToday = WrongToday(
            date: Stats.todayKey(),
            items: [WrongEntry(dict: "行く", type: QuestionType.ta.rawValue, practice: PracticeKind.adjective.rawValue)]
        )

        state.startReview()

        XCTAssertNil(state.currentQuestion)
    }

    private func makeVerbCard(dict: String) -> CardFixture {
        CardFixture(
            dict: dict,
            nai: "\(dict)ない",
            ta: "\(dict)た",
            nakatta: "\(dict)なかった",
            te: "\(dict)て",
            potential: "\(dict)れる",
            group: "godan",
            zh: nil
        )
    }

    private func seedBanks() {
        BankStore.shared.saveVerbBank([makeVerbCard(dict: "行く")])
        BankStore.shared.saveAdjectiveBank([
            CardFixture(
                dict: "静か",
                nai: "静かじゃない",
                ta: "静かだった",
                nakatta: "静かじゃなかった",
                te: "静かで",
                potential: nil,
                group: "na",
                zh: nil
            )
        ])
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
