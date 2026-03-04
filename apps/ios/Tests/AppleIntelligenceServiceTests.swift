import XCTest
@testable import LearnJapanese

final class AppleIntelligenceServiceTests: XCTestCase {
    func testExampleValidatorContainsExactTerm() {
        XCTAssertTrue(ExampleValidator.containsExactTerm("このへやは静かじゃないです。", term: "静かじゃない"))
    }

    func testExampleValidatorRejectsDifferentForm() {
        XCTAssertFalse(ExampleValidator.containsExactTerm("このへやは静かです。", term: "静かじゃない"))
    }
}
