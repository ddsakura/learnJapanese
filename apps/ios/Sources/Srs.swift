import Foundation

enum Srs {
    static let dayMs: Int = 86_400_000
    static let incorrectDelayMs: Int = 120_000

    static func nextIntervalDays(previous: Int, isCorrect: Bool) -> Int {
        if !isCorrect { return 0 }
        let doubled = previous == 0 ? 1 : previous * 2
        return max(1, doubled)
    }

    static func dueOffsetMs(previous: Int, isCorrect: Bool) -> Int {
        if !isCorrect { return incorrectDelayMs }
        let interval = nextIntervalDays(previous: previous, isCorrect: isCorrect)
        return interval * dayMs
    }
}
