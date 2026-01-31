import XCTest
@testable import LearnJapanese

final class ParsingTests: XCTestCase {
    func testParsingFixtures() throws {
        let fixtures = try FixtureLoader.load("parsing", as: ParsingFixtures.self)
        let example = Parsing.parseExampleResponse(fixtures.exampleResponse.input)
        XCTAssertEqual(example?.jp, fixtures.exampleResponse.output.jp)
        XCTAssertEqual(example?.reading, fixtures.exampleResponse.output.reading)
        XCTAssertEqual(example?.zh, fixtures.exampleResponse.output.zh)
        XCTAssertEqual(example?.grammar, fixtures.exampleResponse.output.grammar)

        let translation = Parsing.normalizeTranslation(fixtures.translation.input)
        XCTAssertEqual(translation, fixtures.translation.output)

        let choices = Parsing.parseChoiceResponse(fixtures.choices.input)
        XCTAssertEqual(choices, fixtures.choices.output)
    }
}
