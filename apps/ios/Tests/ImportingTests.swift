import XCTest
@testable import LearnJapanese

final class ImportingTests: XCTestCase {
    func testImportingFixtures() throws {
        let fixtures = try FixtureLoader.load("importing", as: ImportingFixtures.self)

        for testCase in fixtures.cases {
            guard let practice = PracticeKind(rawValue: testCase.practice) else {
                XCTFail("Unknown practice: \(testCase.practice)")
                continue
            }

            let result = Importing.normalizeImport(testCase.input, practice: practice)
            switch (testCase.ok, result) {
            case (true, .success(let cards)):
                XCTAssertEqual(cards.count, testCase.expected?.count ?? 0, "Case \(testCase.id)")
                if let expected = testCase.expected {
                    for (index, card) in cards.enumerated() {
                        let exp = expected[index]
                        XCTAssertEqual(card.dict, exp.dict, "dict mismatch \(testCase.id)")
                        XCTAssertEqual(card.nai, exp.nai, "nai mismatch \(testCase.id)")
                        XCTAssertEqual(card.ta, exp.ta, "ta mismatch \(testCase.id)")
                        XCTAssertEqual(card.nakatta, exp.nakatta, "nakatta mismatch \(testCase.id)")
                        XCTAssertEqual(card.te, exp.te, "te mismatch \(testCase.id)")
                        XCTAssertEqual(card.potential, exp.potential, "potential mismatch \(testCase.id)")
                        XCTAssertEqual(card.group, exp.group, "group mismatch \(testCase.id)")
                    }
                }

            case (false, .failure(let error)):
                XCTAssertEqual(error.message, testCase.error ?? "", "Case \(testCase.id)")

            default:
                XCTFail("Case \(testCase.id) failed: \(result)")
            }
        }
    }
}
