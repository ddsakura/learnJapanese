import Foundation

struct SrsState: Codable {
    let intervalDays: Int
    let due: Date
}

struct WrongEntry: Codable, Hashable {
    let dict: String
    let type: String
    let practice: String
}

struct WrongToday: Codable {
    let date: String
    let items: [WrongEntry]
}

final class SrsStore {
    static let shared = SrsStore()

    private let srsKey = "jlpt-n4-srs"
    private let wrongKey = "jlpt-n4-wrong-today"
    private let statsKey = "jlpt-n4-stats"

    func loadSrs() -> [String: SrsState] {
        guard let data = UserDefaults.standard.data(forKey: srsKey) else { return [:] }
        return (try? JSONDecoder().decode([String: SrsState].self, from: data)) ?? [:]
    }

    func saveSrs(_ value: [String: SrsState]) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: srsKey)
        }
    }

    func loadWrongToday() -> WrongToday {
        let today = Stats.todayKey()
        guard let data = UserDefaults.standard.data(forKey: wrongKey),
              let stored = try? JSONDecoder().decode(WrongToday.self, from: data)
        else {
            return WrongToday(date: today, items: [])
        }
        if stored.date != today {
            return WrongToday(date: today, items: [])
        }
        return stored
    }

    func saveWrongToday(_ value: WrongToday) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: wrongKey)
        }
    }

    func loadStats() -> Stats {
        guard let data = UserDefaults.standard.data(forKey: statsKey),
              let stats = try? JSONDecoder().decode(Stats.self, from: data)
        else {
            return Stats()
        }
        return stats
    }

    func saveStats(_ value: Stats) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: statsKey)
        }
    }
}

struct Stats: Codable {
    var streak: Int = 0
    var todayCount: Int = 0
    var lastDate: String = Stats.todayKey()

    static func todayKey() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    mutating func normalizeForToday() {
        let today = Stats.todayKey()
        if lastDate != today {
            lastDate = today
            todayCount = 0
        }
    }
}
