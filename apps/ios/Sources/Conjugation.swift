import Foundation

enum VerbGroup: String {
    case godan
    case ichidan
    case irregular
}

enum AdjectiveGroup: String {
    case i
    case na
}

enum ConjugationError: Error {
    case invalidVerb
    case invalidAdjective
}

enum Conjugation {
    static let godanRuExceptions: Set<String> = [
        "帰る",
        "走る",
        "入る",
        "切る",
        "知る",
        "要る",
        "喋る",
        "滑る",
        "減る",
        "焦る",
        "限る"
    ]

    static let naAdjectiveIExceptions: Set<String> = [
        "きれい",
        "嫌い",
        "きらい"
    ]

    static func isKana(_ char: Character) -> Bool {
        guard let scalar = char.unicodeScalars.first else { return false }
        return (0x3041...0x3096).contains(Int(scalar.value)) ||
            (0x30A1...0x30FA).contains(Int(scalar.value)) ||
            (0x30FC...0x30FE).contains(Int(scalar.value))
    }

    static func isIchidan(_ dict: String) -> Bool {
        guard dict.hasSuffix("る") else { return false }
        if godanRuExceptions.contains(dict) { return false }
        guard let before = dict.dropLast().last else { return false }
        guard isKana(before) else { return false }
        let ichidanBefore = "いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ"
        return ichidanBefore.contains(before)
    }

    static func inferVerbGroup(_ dict: String) -> VerbGroup {
        if dict.hasSuffix("する") { return .irregular }
        if dict.hasSuffix("くる") || dict.hasSuffix("来る") { return .irregular }
        if isIchidan(dict) { return .ichidan }
        return .godan
    }

    static func normalizeAdjectiveDict(_ dict: String) -> String {
        if dict.hasSuffix("だ") {
            return String(dict.dropLast())
        }
        return dict
    }

    static func inferAdjectiveGroup(_ dict: String) -> AdjectiveGroup {
        let normalized = normalizeAdjectiveDict(dict)
        if normalized.hasSuffix("い") && !naAdjectiveIExceptions.contains(normalized) {
            return .i
        }
        return .na
    }

    static func buildNakatta(_ nai: String) -> String {
        if nai.hasSuffix("ない") {
            return String(nai.dropLast(2)) + "なかった"
        }
        return nai + "なかった"
    }

    static func conjugateVerb(dict: String, group: VerbGroup) throws -> VerbExpected {
        if group == .irregular {
            if dict.hasSuffix("する") {
                let base = String(dict.dropLast(2))
                let nai = base + "しない"
                return VerbExpected(
                    nai: nai,
                    ta: base + "した",
                    nakatta: base + "しなかった",
                    te: base + "して",
                    potential: base + "できる"
                )
            }
            if dict.hasSuffix("くる") || dict.hasSuffix("来る") {
                let base = dict.hasSuffix("くる")
                    ? String(dict.dropLast(2))
                    : String(dict.dropLast(1))
                let nai = base + "こない"
                let potential = dict.hasSuffix("くる") ? base + "こられる" : base + "られる"
                return VerbExpected(
                    nai: nai,
                    ta: base + "きた",
                    nakatta: base + "こなかった",
                    te: base + "きて",
                    potential: potential
                )
            }
            throw ConjugationError.invalidVerb
        }

        if group == .ichidan {
            guard dict.hasSuffix("る") else { throw ConjugationError.invalidVerb }
            let stem = String(dict.dropLast())
            let nai = stem + "ない"
            return VerbExpected(
                nai: nai,
                ta: stem + "た",
                nakatta: stem + "なかった",
                te: stem + "て",
                potential: stem + "られる"
            )
        }

        guard let last = dict.last else { throw ConjugationError.invalidVerb }
        let stem = String(dict.dropLast())
        var nai = ""
        var ta = ""
        var te = ""
        var potential = ""

        switch last {
        case "う":
            nai = stem + "わない"
            ta = stem + "った"
            te = stem + "って"
            potential = stem + "える"
        case "つ":
            nai = stem + "たない"
            ta = stem + "った"
            te = stem + "って"
            potential = stem + "てる"
        case "る":
            nai = stem + "らない"
            ta = stem + "った"
            te = stem + "って"
            potential = stem + "れる"
        case "ぶ":
            nai = stem + "ばない"
            ta = stem + "んだ"
            te = stem + "んで"
            potential = stem + "べる"
        case "む":
            nai = stem + "まない"
            ta = stem + "んだ"
            te = stem + "んで"
            potential = stem + "める"
        case "ぬ":
            nai = stem + "なない"
            ta = stem + "んだ"
            te = stem + "んで"
            potential = stem + "ねる"
        case "く":
            nai = stem + "かない"
            if dict.hasSuffix("行く") {
                ta = stem + "った"
                te = stem + "って"
            } else {
                ta = stem + "いた"
                te = stem + "いて"
            }
            potential = stem + "ける"
        case "ぐ":
            nai = stem + "がない"
            ta = stem + "いだ"
            te = stem + "いで"
            potential = stem + "げる"
        case "す":
            nai = stem + "さない"
            ta = stem + "した"
            te = stem + "して"
            potential = stem + "せる"
        default:
            throw ConjugationError.invalidVerb
        }

        return VerbExpected(
            nai: nai,
            ta: ta,
            nakatta: buildNakatta(nai),
            te: te,
            potential: potential
        )
    }

    static func conjugateAdjective(dict: String, group: AdjectiveGroup) throws -> AdjectiveExpected {
        let normalized = normalizeAdjectiveDict(dict)
        if normalized.isEmpty { throw ConjugationError.invalidAdjective }

        if group == .i {
            if normalized == "いい" {
                return AdjectiveExpected(
                    dict: normalized,
                    nai: "よくない",
                    ta: "よかった",
                    nakatta: "よくなかった",
                    te: "よくて"
                )
            }
            guard normalized.hasSuffix("い") else { throw ConjugationError.invalidAdjective }
            let stem = String(normalized.dropLast())
            return AdjectiveExpected(
                dict: normalized,
                nai: stem + "くない",
                ta: stem + "かった",
                nakatta: stem + "くなかった",
                te: stem + "くて"
            )
        }

        return AdjectiveExpected(
            dict: normalized,
            nai: normalized + "じゃない",
            ta: normalized + "だった",
            nakatta: normalized + "じゃなかった",
            te: normalized + "で"
        )
    }
}
