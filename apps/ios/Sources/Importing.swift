import Foundation

enum PracticeKind: String {
    case verb
    case adjective
}

struct ImportFailure: Error, Equatable {
    let message: String
}

enum Importing {
    static func normalizeImport(_ items: [ImportItem], practice: PracticeKind) -> Result<[CardFixture], ImportFailure> {
        var bank: [CardFixture] = []

        for item in items {
            switch item {
            case .string(let dictRaw):
                let dict = dictRaw.trimmingCharacters(in: .whitespacesAndNewlines)
                if dict.isEmpty { return .failure(ImportFailure(message: "存在空的項目。")) }
                switch practice {
                case .verb:
                    let group = Conjugation.inferVerbGroup(dict)
                    do {
                        let conjugated = try Conjugation.conjugateVerb(dict: dict, group: group)
                        bank.append(CardFixture(dict: dict, nai: conjugated.nai, ta: conjugated.ta, nakatta: conjugated.nakatta, te: conjugated.te, potential: conjugated.potential, group: group.rawValue, zh: nil))
                    } catch {
                        return .failure(ImportFailure(message: "無法推導：\(dict)"))
                    }
                case .adjective:
                    let group = Conjugation.inferAdjectiveGroup(dict)
                    do {
                        let conjugated = try Conjugation.conjugateAdjective(dict: dict, group: group)
                        let normalizedDict = conjugated.dict ?? Conjugation.normalizeAdjectiveDict(dict)
                        bank.append(CardFixture(dict: normalizedDict, nai: conjugated.nai, ta: conjugated.ta, nakatta: conjugated.nakatta, te: conjugated.te, potential: nil, group: group.rawValue, zh: nil))
                    } catch {
                        return .failure(ImportFailure(message: "無法推導：\(dict)"))
                    }
                }

            case .object(let record):
                let dict = record.dict.trimmingCharacters(in: .whitespacesAndNewlines)
                if dict.isEmpty { return .failure(ImportFailure(message: "每筆資料需包含 dict。")) }

                switch practice {
                case .verb:
                    if let card = verbCardFromRecord(record) {
                        bank.append(card)
                        continue
                    }
                    let group = VerbGroup(rawValue: record.group ?? "") ?? Conjugation.inferVerbGroup(dict)
                    do {
                        let conjugated = try Conjugation.conjugateVerb(dict: dict, group: group)
                        let overrides = buildOverrides(record, fields: ["nai", "ta", "nakatta", "te", "potential", "zh"])
                        let card = CardFixture(
                            dict: dict,
                            nai: overrides.nai ?? conjugated.nai,
                            ta: overrides.ta ?? conjugated.ta,
                            nakatta: overrides.nakatta ?? conjugated.nakatta,
                            te: overrides.te ?? conjugated.te,
                            potential: overrides.potential ?? conjugated.potential,
                            group: group.rawValue,
                            zh: overrides.zh
                        )
                        bank.append(card)
                    } catch {
                        return .failure(ImportFailure(message: "無法推導：\(dict)"))
                    }

                case .adjective:
                    if let card = adjectiveCardFromRecord(record) {
                        bank.append(card)
                        continue
                    }
                    let group = AdjectiveGroup(rawValue: record.group ?? "") ?? Conjugation.inferAdjectiveGroup(dict)
                    do {
                        let conjugated = try Conjugation.conjugateAdjective(dict: dict, group: group)
                        let overrides = buildOverrides(record, fields: ["nai", "ta", "nakatta", "te", "zh"])
                        let normalizedDict = conjugated.dict ?? Conjugation.normalizeAdjectiveDict(dict)
                        let card = CardFixture(
                            dict: normalizedDict,
                            nai: overrides.nai ?? conjugated.nai,
                            ta: overrides.ta ?? conjugated.ta,
                            nakatta: overrides.nakatta ?? conjugated.nakatta,
                            te: overrides.te ?? conjugated.te,
                            potential: nil,
                            group: group.rawValue,
                            zh: overrides.zh
                        )
                        bank.append(card)
                    } catch {
                        return .failure(ImportFailure(message: "無法推導：\(dict)"))
                    }
                }
            }
        }

        return .success(bank)
    }

    private static func verbCardFromRecord(_ record: ImportObject) -> CardFixture? {
        guard let group = record.group,
              let nai = record.nai,
              let ta = record.ta,
              let nakatta = record.nakatta,
              let te = record.te,
              let potential = record.potential
        else { return nil }
        return CardFixture(dict: record.dict, nai: nai, ta: ta, nakatta: nakatta, te: te, potential: potential, group: group, zh: record.zh)
    }

    private static func adjectiveCardFromRecord(_ record: ImportObject) -> CardFixture? {
        guard let group = record.group,
              let nai = record.nai,
              let ta = record.ta,
              let nakatta = record.nakatta,
              let te = record.te
        else { return nil }
        return CardFixture(dict: record.dict, nai: nai, ta: ta, nakatta: nakatta, te: te, potential: nil, group: group, zh: record.zh)
    }

    private static func buildOverrides(_ record: ImportObject, fields: [String]) -> OverrideValues {
        var overrides = OverrideValues()
        fields.forEach { field in
            let value: String?
            switch field {
            case "nai": value = record.nai
            case "ta": value = record.ta
            case "nakatta": value = record.nakatta
            case "te": value = record.te
            case "potential": value = record.potential
            case "zh": value = record.zh
            default: value = nil
            }
            guard let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else { return }
            switch field {
            case "nai": overrides.nai = trimmed
            case "ta": overrides.ta = trimmed
            case "nakatta": overrides.nakatta = trimmed
            case "te": overrides.te = trimmed
            case "potential": overrides.potential = trimmed
            case "zh": overrides.zh = trimmed
            default: break
            }
        }
        return overrides
    }

    private struct OverrideValues {
        var nai: String?
        var ta: String?
        var nakatta: String?
        var te: String?
        var potential: String?
        var zh: String?
    }
}
