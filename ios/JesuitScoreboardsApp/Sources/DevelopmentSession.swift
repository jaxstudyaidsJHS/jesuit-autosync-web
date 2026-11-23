import Foundation
import SwiftUI
import JesuitScoreboardsCore

/// The development shell has no production credentials, pairing or write access.
@MainActor
final class DevelopmentSession: ObservableObject {
    @Published private(set) var selectedSport: Sport = .football
    @Published private(set) var snapshot: AuthorityStateV2 = .demo(sport: .football)
    @Published var protectionEnabled: Bool = true
    @Published var draftMinutes = "12"
    @Published var draftSeconds = "00"

    let environmentLabel = "OFF-AIR DEMO"
    let canSendCommands = false

    func selectSport(_ sport: Sport) {
        selectedSport = sport
        snapshot = .demo(sport: sport)
        let total = max(0, snapshot.clock.remainingMs / 1000)
        draftMinutes = String(total / 60)
        draftSeconds = String(format: "%02lld", total % 60)
    }

    var proposedSeconds: Int? {
        let m = draftMinutes.trimmingCharacters(in: .whitespaces)
        let s = draftSeconds.trimmingCharacters(in: .whitespaces)
        guard !m.isEmpty && !s.isEmpty,
              m.allSatisfy(\.isNumber), s.allSatisfy(\.isNumber),
              let minutes = Int(m), let seconds = Int(s),
              (0...99).contains(minutes), (0...59).contains(seconds)
        else { return nil }
        return minutes * 60 + seconds
    }

    func shiftDraft(by delta: Int) {
        guard let now = proposedSeconds, [-10, -1, 1, 10].contains(delta) else { return }
        let next = min(99 * 60 + 59, max(0, now + delta))
        draftMinutes = String(next / 60)
        draftSeconds = String(format: "%02d", next % 60)
    }

    var proposedClock: String {
        guard let total = proposedSeconds else { return "INVALID" }
        return String(format: "%02d:%02d", total / 60, total % 60)
    }
}
