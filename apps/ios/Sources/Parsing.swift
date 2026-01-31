import Foundation

enum Parsing {
    static func parseExampleResponse(_ text: String) -> ExampleOutput? {
        let normalized = text.replacingOccurrences(of: "\\n", with: "\n").trimmingCharacters(in: .whitespacesAndNewlines)

        func lineValue(_ label: String) -> String {
            let pattern = "^\\s*" + NSRegularExpression.escapedPattern(for: label) + ":\\s*(.+)$"
            let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive])
            for line in normalized.components(separatedBy: "\n") {
                if let match = regex?.firstMatch(in: line, options: [], range: NSRange(location: 0, length: line.utf16.count)) {
                    if let range = Range(match.range(at: 1), in: line) {
                        return String(line[range]).trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                }
            }
            return ""
        }

        func blockValue(_ label: String) -> String {
            let pattern = NSRegularExpression.escapedPattern(for: label) + ":\\s*([\\s\\S]+)$"
            let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive])
            if let match = regex?.firstMatch(in: normalized, options: [], range: NSRange(location: 0, length: normalized.utf16.count)) {
                if let range = Range(match.range(at: 1), in: normalized) {
                    return String(normalized[range]).trimmingCharacters(in: .whitespacesAndNewlines)
                }
            }
            return ""
        }

        let jp = lineValue("JP")
        let reading = lineValue("Reading")
        let zh = lineValue("ZH")
        let grammar = blockValue("Grammar")

        guard !jp.isEmpty, !reading.isEmpty, !zh.isEmpty, !grammar.isEmpty else { return nil }
        return ExampleOutput(jp: jp, reading: reading, zh: zh, grammar: grammar)
    }

    static func normalizeTranslation(_ raw: String) -> String? {
        let normalized = raw.replacingOccurrences(of: "\\n", with: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
        let firstLine = normalized
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .first { !$0.isEmpty }

        guard var line = firstLine else { return nil }
        line = line.replacingOccurrences(of: "^zh[:：]\\s*", with: "", options: [.regularExpression, .caseInsensitive])
        line = line.replacingOccurrences(of: "^translation[:：]\\s*", with: "", options: [.regularExpression, .caseInsensitive])
        line = line.trimmingCharacters(in: .whitespacesAndNewlines)

        line = line.replacingOccurrences(of: "^['\"「『](.*)['\"」』]$", with: "$1", options: [.regularExpression])
        let result = line.trimmingCharacters(in: .whitespacesAndNewlines)
        return result.isEmpty ? nil : result
    }

    static func parseChoiceResponse(_ text: String) -> [String] {
        let normalized = text.replacingOccurrences(of: "\\n", with: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return [] }
        return normalized
            .components(separatedBy: "\n")
            .map { line in
                line.replacingOccurrences(of: "^[\\s*\\d.\\)\\(-]+", with: "", options: [.regularExpression])
                    .trimmingCharacters(in: .whitespacesAndNewlines)
            }
            .filter { !$0.isEmpty }
    }
}
