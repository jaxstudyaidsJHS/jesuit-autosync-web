import Foundation

/// The network contract shared by the future iPhone client and the off-air Mac authority.
/// Protocol 2 is separate from the older browser-only protocol 1.
public enum ScoreboardsProtocolV2 {
    public static let version = 2
}

public struct AuthorityClockV2: Codable, Equatable, Sendable {
    public let remainingMs: Int64
    public let running: Bool

    public init(remainingMs: Int64, running: Bool = false) {
        self.remainingMs = max(0, remainingMs)
        self.running = running
    }

    /// The Mac is the authority. A read-only client can animate a recently
    /// received snapshot, but must not send locally estimated time as a command.
    public var stoppedDisplay: String {
        let total = max(0, remainingMs / 1_000)
        return String(format: "%02lld:%02lld", total / 60, total % 60)
    }
}

public struct AuthorityStateV2: Codable, Equatable, Sendable {
    public let protocolVersion: Int
    public let gameId: String
    public let sport: Sport
    public let revision: UInt64
    public let homeScore: Int
    public let awayScore: Int
    public let period: Int
    public let clock: AuthorityClockV2

    enum CodingKeys: String, CodingKey {
        case protocolVersion = "protocol"
        case gameId, sport, revision, homeScore, awayScore, period, clock
    }

    public init(gameId: String, sport: Sport, revision: UInt64 = 0,
                homeScore: Int = 0, awayScore: Int = 0, period: Int = 1,
                clock: AuthorityClockV2) {
        self.protocolVersion = ScoreboardsProtocolV2.version
        self.gameId = gameId
        self.sport = sport
        self.revision = revision
        self.homeScore = homeScore
        self.awayScore = awayScore
        self.period = period
        self.clock = clock
    }

    /// Deliberately fake state for the unsigned development shell.
    public static func demo(sport: Sport) -> AuthorityStateV2 {
        let ms: Int64
        switch sport {
        case .football, .lacrosse: ms = 720_000
        case .basketball: ms = 480_000
        case .soccer: ms = 2_400_000
        case .baseball: ms = 0
        }
        return AuthorityStateV2(
            gameId: "OFF-AIR-DEMO",
            sport: sport,
            clock: AuthorityClockV2(remainingMs: ms)
        )
    }

    public var isValidReadback: Bool {
        protocolVersion == ScoreboardsProtocolV2.version &&
        !gameId.isEmpty && clock.remainingMs >= 0 &&
        homeScore >= 0 && awayScore >= 0
    }
}

public enum AuthorityCommandKindV2: String, Codable, CaseIterable, Sendable {
    case scoreSet = "score.set"
    case scoreAdd = "score.add"
    case periodSet = "period.set"
    case clockStart = "clock.start"
    case clockStop = "clock.stop"
    case clockReset = "clock.reset"
}

public struct AuthorityCommandPayloadV2: Codable, Equatable, Sendable {
    public let team: String?
    public let points: Int?
    public let period: Int?
    public let remainingMs: Int64?

    public init(team: String? = nil, points: Int? = nil, period: Int? = nil,
                remainingMs: Int64? = nil) {
        self.team = team
        self.points = points
        self.period = period
        self.remainingMs = remainingMs
    }
}

public struct AuthorityCommandV2: Codable, Equatable, Sendable {
    public let protocolVersion: Int
    public let gameId: String
    public let sport: Sport
    public let id: String
    public let expectedRevision: UInt64
    public let type: AuthorityCommandKindV2
    public let payload: AuthorityCommandPayloadV2

    enum CodingKeys: String, CodingKey {
        case protocolVersion = "protocol"
        case gameId, sport, id, expectedRevision, type, payload
    }

    public init(state: AuthorityStateV2, id: String, type: AuthorityCommandKindV2,
                payload: AuthorityCommandPayloadV2 = AuthorityCommandPayloadV2()) {
        protocolVersion = ScoreboardsProtocolV2.version
        gameId = state.gameId
        sport = state.sport
        self.id = id
        expectedRevision = state.revision
        self.type = type
        self.payload = payload
    }
}

public enum AuthorityAckStatusV2: String, Codable, Sendable {
    case applied
    case duplicate
    case conflict
    case idConflict = "id_conflict"
    case invalid
    case unavailable
}

public struct AuthorityAckV2: Codable, Equatable, Sendable {
    public let status: AuthorityAckStatusV2
    public let commandId: String
    public let revision: UInt64
    public let reason: String?
    public let duplicate: Bool?

    public var confirmsApplication: Bool {
        status == .applied || status == .duplicate
    }
}

public enum SessionSafetyV2: Equatable, Sendable {
    case readOnlyDemo
    case disconnected
    case incompatible
    case pending
    case paired
}

/// A matching protocol number alone does NOT authorize commands.
/// Authentication/roles are validated on the Mac authority.
public func protocolCompatible(clientVersion: Int, remoteState: AuthorityStateV2,
                               expectedGameId: String) -> Bool {
    clientVersion == ScoreboardsProtocolV2.version &&
    remoteState.protocolVersion == ScoreboardsProtocolV2.version &&
    remoteState.gameId == expectedGameId &&
    remoteState.isValidReadback
}
