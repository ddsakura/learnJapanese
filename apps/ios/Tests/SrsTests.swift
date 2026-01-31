import XCTest
@testable import LearnJapanese

final class SrsTests: XCTestCase {
    func testSrsFixtures() throws {
        let fixtures = try FixtureLoader.load("srs", as: SrsFixtures.self)
        for testCase in fixtures.cases {
            let interval = Srs.nextIntervalDays(previous: testCase.prevIntervalDays, isCorrect: testCase.isCorrect)
            let dueOffset = Srs.dueOffsetMs(previous: testCase.prevIntervalDays, isCorrect: testCase.isCorrect)
            XCTAssertEqual(interval, testCase.expected.intervalDays, "interval mismatch \(testCase.id)")
            XCTAssertEqual(dueOffset, testCase.expected.dueOffsetMs, "due mismatch \(testCase.id)")
        }
    }
}
