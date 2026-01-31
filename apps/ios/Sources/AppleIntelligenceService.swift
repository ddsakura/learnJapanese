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
        let basePrompt = "你是一位專業的日語老師，擅長將複雜的文法用簡單易懂的方式解釋給 N4 程度的學生。請用單字『\(term)』（形態：\(typeLabel)）造一個 N4 程度的日文句子。"
        let safePrompt = basePrompt + " 限制：只允許日常生活場景，不涉及暴力、犯罪、醫療、成人、政治、宗教、歧視等敏感話題。句子要簡短、單一句，避免故事化。"
        do {
            let response = try await respond(generating: ExampleResponse.self, prompt: basePrompt)
            return AIExample(jp: response.jp, reading: response.reading, zh: response.zh, grammar: response.grammar)
        } catch {
            let response = try await respond(generating: ExampleResponse.self, prompt: safePrompt)
            return AIExample(jp: response.jp, reading: response.reading, zh: response.zh, grammar: response.grammar)
        }
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
