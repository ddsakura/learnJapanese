import Foundation

enum FixtureLoader {
    static func load<T: Decodable>(_ name: String, as type: T.Type) throws -> T {
        let bundles = Bundle.allBundles
        let url = bundles.compactMap {
            $0.url(forResource: name, withExtension: "json", subdirectory: "fixtures")
        }.first
        guard let url else {
            let searched = bundles.map { $0.bundlePath }
            throw FixtureError.missingFile(name, searched)
        }
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(T.self, from: data)
    }
}

private final class FixtureLoaderToken {}

enum FixtureError: Error, LocalizedError {
    case missingFile(String, [String])

    var errorDescription: String? {
        switch self {
        case .missingFile(let name, let bundles):
            let bundleList = bundles.joined(separator: ", ")
            return "Missing fixture: \(name).json. Searched bundles: [\(bundleList)]"
        }
    }
}
