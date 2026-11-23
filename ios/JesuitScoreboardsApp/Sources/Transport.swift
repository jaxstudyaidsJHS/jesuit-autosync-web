import Foundation
import JesuitScoreboardsCore

/// Future transport boundary. The iPhone MUST NOT access the Mac localhost
/// service directly or fabricate an authenticated scoring context.
protocol ScoreboardsTransport {
    func readState() async throws -> AuthorityStateV2
    func submit(_ command: AuthorityCommandV2) async throws -> AuthorityAckV2
}

enum ScoreboardsTransportError: Error {
    case readOnlyDemonstration
    case notPaired
}

/// Safe development transport. No network, Firebase or OBS side effects.
struct DemonstrationTransport: ScoreboardsTransport {
    let sport: Sport

    func readState() async throws -> AuthorityStateV2 {
        AuthorityStateV2.demo(sport: sport)
    }

    func submit(_ command: AuthorityCommandV2) async throws -> AuthorityAckV2 {
        throw ScoreboardsTransportError.readOnlyDemonstration
    }
}
