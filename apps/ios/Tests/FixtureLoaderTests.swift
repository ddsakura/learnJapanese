import XCTest
@testable import LearnJapanese

final class FixtureLoaderTests: XCTestCase {
    func testLoadConjugationFixtures() throws {
        do {
            let fixtures = try FixtureLoader.load("conjugation", as: ConjugationFixtures.self)
            XCTAssertFalse(fixtures.verbs.isEmpty)
            XCTAssertFalse(fixtures.adjectives.isEmpty)
        } catch {
            XCTFail(String(describing: error))
        }
    }

    func testLoadParsingFixtures() throws {
        do {
            let fixtures = try FixtureLoader.load("parsing", as: ParsingFixtures.self)
            XCTAssertEqual(fixtures.translation.output, "可愛")
        } catch {
            XCTFail(String(describing: error))
        }
    }

    func testLoadImportingFixtures() throws {
        do {
            let fixtures = try FixtureLoader.load("importing", as: ImportingFixtures.self)
            XCTAssertFalse(fixtures.cases.isEmpty)
        } catch {
            XCTFail(String(describing: error))
        }
    }

    func testLoadSrsFixtures() throws {
        do {
            let fixtures = try FixtureLoader.load("srs", as: SrsFixtures.self)
            XCTAssertFalse(fixtures.cases.isEmpty)
        } catch {
            XCTFail(String(describing: error))
        }
    }
}
