import Foundation

struct ConjugationFixtures: Codable {
    let verbs: [VerbFixture]
    let adjectives: [AdjectiveFixture]
}

struct VerbFixture: Codable {
    let dict: String
    let group: String
    let expected: VerbExpected
}

struct VerbExpected: Codable {
    let nai: String
    let ta: String
    let nakatta: String
    let te: String
    let potential: String
}

struct AdjectiveFixture: Codable {
    let dict: String
    let group: String
    let expected: AdjectiveExpected
}

struct AdjectiveExpected: Codable {
    let dict: String?
    let nai: String
    let ta: String
    let nakatta: String
    let te: String
}

struct ParsingFixtures: Codable {
    let exampleResponse: ExampleResponseFixture
    let translation: TranslationFixture
    let choices: ChoicesFixture
}

struct ExampleResponseFixture: Codable {
    let input: String
    let output: ExampleOutput
}

struct ExampleOutput: Codable {
    let jp: String
    let reading: String
    let zh: String
    let grammar: String
}

struct TranslationFixture: Codable {
    let input: String
    let output: String
}

struct ChoicesFixture: Codable {
    let input: String
    let output: [String]
}

struct ImportingFixtures: Codable {
    let cases: [ImportCase]
}

struct ImportCase: Codable {
    let id: String
    let practice: String
    let input: [ImportItem]
    let ok: Bool
    let expected: [CardFixture]?
    let error: String?
}

enum ImportItem: Codable {
    case string(String)
    case object(ImportObject)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let value = try? container.decode(String.self) {
            self = .string(value)
            return
        }
        let object = try container.decode(ImportObject.self)
        self = .object(object)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        }
    }
}

struct ImportObject: Codable {
    let dict: String
    let group: String?
    let nai: String?
    let ta: String?
    let nakatta: String?
    let te: String?
    let potential: String?
    let zh: String?
}

struct CardFixture: Codable {
    let dict: String
    let nai: String
    let ta: String
    let nakatta: String
    let te: String
    let potential: String?
    let group: String
    let zh: String?
}

struct SrsFixtures: Codable {
    let cases: [SrsCase]
}

struct SrsCase: Codable {
    let id: String
    let prevIntervalDays: Int
    let isCorrect: Bool
    let expected: SrsExpected
}

struct SrsExpected: Codable {
    let intervalDays: Int
    let dueOffsetMs: Int
}
