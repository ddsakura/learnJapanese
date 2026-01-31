import Foundation

final class BankStore {
    static let shared = BankStore()

    private let verbKey = "jlpt-n4-verb-bank"
    private let adjectiveKey = "jlpt-n4-adjective-bank"

    func loadVerbBank() -> [CardFixture] {
        load(key: verbKey)
    }

    func loadAdjectiveBank() -> [CardFixture] {
        load(key: adjectiveKey)
    }

    func saveVerbBank(_ bank: [CardFixture]) {
        save(bank, key: verbKey)
    }

    func saveAdjectiveBank(_ bank: [CardFixture]) {
        save(bank, key: adjectiveKey)
    }

    private func load(key: String) -> [CardFixture] {
        guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
        return (try? JSONDecoder().decode([CardFixture].self, from: data)) ?? []
    }

    private func save(_ bank: [CardFixture], key: String) {
        if let data = try? JSONEncoder().encode(bank) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
