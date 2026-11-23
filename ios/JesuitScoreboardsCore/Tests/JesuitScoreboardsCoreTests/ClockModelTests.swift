import XCTest
@testable import JesuitScoreboardsCore

final class ClockModelTests: XCTestCase {
    func testElapsedSecondsAreNotTimerCallbacks() {
        var c = ClockModel(remainingSeconds: 60)
        c.start(at: 100)
        XCTAssertEqual(c.remaining(at: 125), 35, accuracy: 0.0001)
        XCTAssertEqual(c.remaining(at: 160), 0, accuracy: 0.0001)
    }

    func testPausedClockDoesNotMove() {
        var c = ClockModel(remainingSeconds: 60)
        c.start(at: 100)
        c.stop(at: 115)
        XCTAssertEqual(c.remaining(at: 300), 45, accuracy: 0.0001)
    }

    func testRecoveryPausesOldDeadline() {
        var c = ClockModel(remainingSeconds: 60)
        c.start(at: 100)
        let snapshot = c.pausedRecoverySnapshot(at: 110)
        XCTAssertFalse(snapshot.isRunning)
        XCTAssertEqual(snapshot.remaining(at: 9_999), 50, accuracy: 0.0001)
    }

    func testFiveSupportedSports() {
        XCTAssertEqual(Sport.allCases.count, 5)
        XCTAssertEqual(GameState(sport: .football).clock.remainingSeconds, 720)
    }
}
