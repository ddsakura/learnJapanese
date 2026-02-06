import XCTest
@testable import LearnJapanese

final class ImportingTests: XCTestCase {
    func testImportingFixtures() throws {
        // This test validates the import normalization logic against a set of
        // fixture cases defined in importing.json.
        let fixtures = try FixtureLoader.load("importing", as: ImportingFixtures.self)

        for testCase in fixtures.cases {
            // Each case declares the practice kind (verb/adjective) and the raw input format.
            guard let practice = PracticeKind(rawValue: testCase.practice) else {
                XCTFail("Unknown practice: \(testCase.practice)")
                continue
            }

            // Normalize input into CardFixture[] or an error.
            let result = Importing.normalizeImport(testCase.input, practice: practice)
            switch (testCase.ok, result) {
            case (true, .success(let cards)):
                // Success case: compare count and every field against expected output.
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
                // Failure case: ensure we return the expected error message.
                XCTAssertEqual(error.message, testCase.error ?? "", "Case \(testCase.id)")

            default:
                // Any mismatch between expectation and actual result should fail.
                XCTFail("Case \(testCase.id) failed: \(result)")
            }
        }
    }
}
