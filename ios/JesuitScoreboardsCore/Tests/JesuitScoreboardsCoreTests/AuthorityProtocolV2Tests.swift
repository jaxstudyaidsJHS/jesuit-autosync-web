import Foundation
import XCTest
@testable import JesuitScoreboardsCore

final class AuthorityProtocolV2Tests: XCTestCase {
    func testDecodeMacWireState() throws {
        let json = """
        {"protocol":2,"gameId":"0123456789abcdef0123456789abcdef",
         "sport":"football","revision":7,"homeScore":14,"awayScore":7,
         "period":3,"clock":{"remainingMs":425000,"running":true}}
        """
        let state = try JSONDecoder().decode(AuthorityStateV2.self, from: Data(json.utf8))
        XCTAssertEqual(state.revision, 7)
        XCTAssertEqual(state.clock.remainingMs, 425_000)
        XCTAssertTrue(state.clock.running)
        XCTAssertEqual(state.homeScore, 14)
        XCTAssertTrue(protocolCompatible(clientVersion: 2, remoteState: state,
                                         expectedGameId: state.gameId))
        XCTAssertFalse(protocolCompatible(clientVersion: 1, remoteState: state,
                                          expectedGameId: state.gameId))
        XCTAssertFalse(protocolCompatible(clientVersion: 2, remoteState: state,
                                          expectedGameId: "other-game"))
    }

    func testCommandEncodingMatchesGoFieldNames() throws {
        let state = AuthorityStateV2.demo(sport: .basketball)
        let command = AuthorityCommandV2(
            state: state, id: "test-command-00001", type: .scoreAdd,
            payload: AuthorityCommandPayloadV2(team: "home", points: 2)
        )
        let object = try XCTUnwrap(JSONSerialization.jsonObject(
            with: JSONEncoder().encode(command)) as? [String: Any])
        XCTAssertEqual(object["protocol"] as? Int, 2)
        XCTAssertEqual(object["gameId"] as? String, "OFF-AIR-DEMO")
        XCTAssertEqual(object["type"] as? String, "score.add")
        XCTAssertEqual(object["expectedRevision"] as? Int, 0)
        let payload = try XCTUnwrap(object["payload"] as? [String: Any])
        XCTAssertEqual(payload["team"] as? String, "home")
        XCTAssertEqual(payload["points"] as? Int, 2)
    }

    func testDuplicateAckDecodingIsNotSecondScore() throws {
        let json = """
        {"status":"duplicate","commandId":"test-command-00001",
         "revision":4,"duplicate":true}
        """
        let ack = try JSONDecoder().decode(AuthorityAckV2.self, from: Data(json.utf8))
        XCTAssertEqual(ack.status, .duplicate)
        XCTAssertTrue(ack.confirmsApplication)
        XCTAssertEqual(ack.revision, 4)
    }

    func testDemoIsReadOnlyAndSportSpecific() {
        XCTAssertEqual(AuthorityStateV2.demo(sport: .soccer).clock.remainingMs, 2_400_000)
        XCTAssertEqual(AuthorityStateV2.demo(sport: .baseball).clock.remainingMs, 0)
        XCTAssertEqual(AuthorityStateV2.demo(sport: .football).clock.stoppedDisplay, "12:00")
        XCTAssertEqual(ScoreboardsProtocolV2.version, 2)
    }
}
