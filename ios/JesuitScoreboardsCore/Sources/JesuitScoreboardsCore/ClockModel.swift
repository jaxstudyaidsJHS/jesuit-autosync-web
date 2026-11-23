import Foundation

/// A deterministic clock model that uses host-provided *monotonic uptime* seconds.
/// Pure core model, not an iPhone camera service or authoritative Mac daemon.
public struct ClockModel: Sendable, Codable, Equatable {
    public private(set) var remainingSeconds: Double
    public private(set) var deadlineUptime: Double?

    public var isRunning: Bool { deadlineUptime != nil }

    public init(remainingSeconds: Double) {
        self.remainingSeconds = max(0, remainingSeconds)
        self.deadlineUptime = nil
    }

    public func remaining(at uptime: Double) -> Double {
        guard let deadlineUptime else { return remainingSeconds }
        return max(0, deadlineUptime - uptime)
    }

    public mutating func start(at uptime: Double) {
        guard !isRunning, remainingSeconds > 0, uptime.isFinite else { return }
        deadlineUptime = uptime + remainingSeconds
    }

    public mutating func stop(at uptime: Double) {
        remainingSeconds = remaining(at: uptime)
        deadlineUptime = nil
    }

    public mutating func reset(to seconds: Double) {
        remainingSeconds = max(0, seconds)
        deadlineUptime = nil
    }

    /// Store this on crash recovery; never restore a previous process uptime deadline.
    public func pausedRecoverySnapshot(at uptime: Double) -> ClockModel {
        ClockModel(remainingSeconds: remaining(at: uptime))
    }
}

public enum Sport: String, Codable, CaseIterable, Sendable {
    case football, basketball, baseball, lacrosse, soccer
}

public struct GameState: Codable, Equatable, Sendable {
    public var sport: Sport
    public var revision: Int
    public var homeScore: Int
    public var awayScore: Int
    public var period: Int
    public var clock: ClockModel

    public init(sport: Sport) {
        self.sport = sport
        self.revision = 0
        self.homeScore = 0
        self.awayScore = 0
        self.period = 1
        switch sport {
        case .football, .lacrosse: self.clock = ClockModel(remainingSeconds: 12 * 60)
        case .basketball: self.clock = ClockModel(remainingSeconds: 8 * 60)
        case .soccer: self.clock = ClockModel(remainingSeconds: 40 * 60)
        case .baseball: self.clock = ClockModel(remainingSeconds: 0)
        }
    }
}
