import XCTest
@testable import LearnJapanese

final class ConjugationTests: XCTestCase {
    func testVerbConjugationFixtures() throws {
        let fixtures = try FixtureLoader.load("conjugation", as: ConjugationFixtures.self)
        for item in fixtures.verbs {
            guard let group = VerbGroup(rawValue: item.group) else {
                XCTFail("Unknown group: \(item.group)")
                continue
            }
            let result = try Conjugation.conjugateVerb(dict: item.dict, group: group)
            XCTAssertEqual(result.nai, item.expected.nai, "nai mismatch for \(item.dict)")
            XCTAssertEqual(result.ta, item.expected.ta, "ta mismatch for \(item.dict)")
            XCTAssertEqual(result.nakatta, item.expected.nakatta, "nakatta mismatch for \(item.dict)")
            XCTAssertEqual(result.te, item.expected.te, "te mismatch for \(item.dict)")
            XCTAssertEqual(result.potential, item.expected.potential, "potential mismatch for \(item.dict)")
        }
    }

    func testAdjectiveConjugationFixtures() throws {
        let fixtures = try FixtureLoader.load("conjugation", as: ConjugationFixtures.self)
        for item in fixtures.adjectives {
            guard let group = AdjectiveGroup(rawValue: item.group) else {
                XCTFail("Unknown group: \(item.group)")
                continue
            }
            let result = try Conjugation.conjugateAdjective(dict: item.dict, group: group)
            let expectedDict = item.expected.dict ?? item.dict.replacingOccurrences(of: "だ", with: "")
            XCTAssertEqual(result.dict, expectedDict, "dict mismatch for \(item.dict)")
            XCTAssertEqual(result.nai, item.expected.nai, "nai mismatch for \(item.dict)")
            XCTAssertEqual(result.ta, item.expected.ta, "ta mismatch for \(item.dict)")
            XCTAssertEqual(result.nakatta, item.expected.nakatta, "nakatta mismatch for \(item.dict)")
            XCTAssertEqual(result.te, item.expected.te, "te mismatch for \(item.dict)")
        }
    }
}
