import Foundation

#if canImport(FoundationModels)
import FoundationModels
#endif

struct AIAvailability {
    let isAvailable: Bool
    let message: String?
}

struct AIExample {
    let jp: String
    let reading: String
    let zh: String
    let grammar: String
}

enum AIServiceError: Error {
    case unavailable(String)
    case generationFailed(String)
}

final class AppleIntelligenceService {
    #if canImport(FoundationModels)
    private let model = SystemLanguageModel.default
    #endif

    func availability() -> AIAvailability {
        #if canImport(FoundationModels)
        switch model.availability {
        case .available:
            return AIAvailability(isAvailable: true, message: nil)
        case .unavailable(let reason):
            return AIAvailability(isAvailable: false, message: unavailableMessage(reason))
        }
        #else
        return AIAvailability(isAvailable: false, message: "FoundationModels unavailable")
        #endif
    }

    #if canImport(FoundationModels)
    private func unavailableMessage(_ reason: SystemLanguageModel.Availability.UnavailableReason) -> String {
        switch reason {
        case .deviceNotEligible:
            return "裝置不支援 Apple Intelligence"
        case .appleIntelligenceNotEnabled:
            return "未啟用 Apple Intelligence"
        case .modelNotReady:
            return "模型尚未就緒（下載中或系統尚未完成）"
        @unknown default:
            return "模型不可用（未知原因）"
        }
    }
    #endif

    func generateTranslation(_ dict: String) async throws -> String {
        let prompt = "請把以下日文翻譯成繁體中文，只輸出翻譯結果，不要加標點或解釋。\n日文：\(dict)"
        let response = try await respond(generating: TranslationResponse.self, prompt: prompt)
        return response.text
    }

    func generateExample(term: String, typeLabel: String) async throws -> AIExample {
        let strictPrompt = """
        你是一位專業的日語老師。請用「\(term)」（形態：\(typeLabel)）造一個 N4 程度、日常生活情境的單一句。
        強制規則：
        1) 日文句子必須逐字包含「\(term)」，不可改寫成其他形態。
        2) 句子簡短自然，不要故事化。
        3) 不涉及暴力、犯罪、醫療、成人、政治、宗教、歧視等敏感話題。
        """
        let repairPrompt = """
        請重新產生。你是一位專業的日語老師。請用「\(term)」（形態：\(typeLabel)）造一個 N4 程度、日常生活情境的單一句。
        強制規則：
        1) 日文句子必須逐字包含「\(term)」，不可改寫成其他形態。
        2) 句子簡短自然，不要故事化，只能一個簡短句子。
        3) 不涉及暴力、犯罪、醫療、成人、政治、宗教、歧視等敏感話題。
        """

        for prompt in [strictPrompt, repairPrompt] {
            for _ in 0..<2 {
                try Task.checkCancellation()
                do {
                    let response = try await respond(generating: ExampleResponse.self, prompt: prompt)
                    if ExampleValidator.containsExactTerm(response.jp, term: term) {
                        return AIExample(
                            jp: response.jp.trimmingCharacters(in: .whitespacesAndNewlines),
                            reading: response.reading.trimmingCharacters(in: .whitespacesAndNewlines),
                            zh: response.zh.trimmingCharacters(in: .whitespacesAndNewlines),
                            grammar: response.grammar.trimmingCharacters(in: .whitespacesAndNewlines)
                        )
                    }
                } catch let error as CancellationError {
                    throw error
                } catch {
                    continue
                }
            }
        }

        // Keep UI usable even when the model repeatedly fails or ignores the exact-term constraint.
        return fallbackExample(term: term, typeLabel: typeLabel)
    }

    private func fallbackExample(term: String, typeLabel: String) -> AIExample {
        AIExample(
            jp: "この例では「\(term)」を使います。",
            reading: "このれいでは「\(term)」をつかいます。",
            zh: "這個例句會直接使用「\(term)」。",
            grammar: "保底例句：包含題目答案「\(term)」（\(typeLabel)）。"
        )
    }

    #if canImport(FoundationModels)
    private func respond<T: Generable>(generating type: T.Type, prompt: String) async throws -> T {
        let availability = self.availability()
        guard availability.isAvailable else {
            throw AIServiceError.unavailable(availability.message ?? "模型不可用")
        }
        let session = LanguageModelSession(instructions: "你是可靠的日語老師")
        let response = try await session.respond(generating: type) {
            prompt
        }
        return response.content
    }
    #else
    private func respond<T>(generating type: T.Type, prompt: String) async throws -> T {
        throw AIServiceError.unavailable("FoundationModels unavailable")
    }
    #endif
}

enum ExampleValidator {
    static func containsExactTerm(_ sentence: String, term: String) -> Bool {
        let normalizedSentence = normalize(sentence)
        let normalizedTerm = normalize(term)
        guard !normalizedSentence.isEmpty, !normalizedTerm.isEmpty else { return false }
        return normalizedSentence.contains(normalizedTerm)
    }

    private static func normalize(_ text: String) -> String {
        text
            .precomposedStringWithCanonicalMapping
            .replacingOccurrences(of: "　", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

#if canImport(FoundationModels)
@Generable
struct TranslationResponse {
    @Guide(description: "繁體中文翻譯結果，不含標點與解釋")
    var text: String
}

@Generable
struct ExampleResponse {
    @Guide(description: "日文句子")
    var jp: String
    @Guide(description: "全平假名")
    var reading: String
    @Guide(description: "繁體中文翻譯")
    var zh: String
    @Guide(description: "簡短說明該單字在此處的用法與形態變化，需點出題型")
    var grammar: String
}
#else
struct TranslationResponse {
    let text: String
}

struct ExampleResponse {
    let jp: String
    let reading: String
    let zh: String
    let grammar: String
}
#endif
