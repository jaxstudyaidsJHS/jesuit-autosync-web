# Master backlog — Jesuit Scoreboards 2.0

This file is the **navigation index**. GitHub Issues are the actionable work items. A planned item is not a tested feature. Update the issue first when implementation or device testing changes its status.

## P0 — must be resolved before a production native rollout

| Issue | Theme | Status |
| --- | --- | --- |
| [#1](../../issues/1) | School ownership, Apple Developer and public/private repository decision | Awaiting moderator |
| [#2](../../issues/2) | Review/migrate legacy RC2 Mac and hosted source | Inventory complete; import pending |
| [#3](../../issues/3) | Mac-authoritative clock and durable state | Not yet in compiled Mac service |
| [#4](../../issues/4) | Durable deduplication, permissions, revisioned commands | Reference code only |
| [#5](../../issues/5) | Firebase pairing, security and separate staging | Audit pending |
| [#6](../../issues/6) | End-to-end delivery receipts and operator visual confirmation | Reference code in this PR |
| [#7](../../issues/7) | Physical iPhone/Mac/OBS acceptance testing | Pending real devices |

## P1 — integration/build milestones

| Issue | Theme |
| --- | --- |
| [#8](../../issues/8) | Staging Netlify and cloud/Mac protocol handshake |
| [#9](../../issues/9) | Signable SwiftUI Xcode app and TestFlight |
| [#10](../../issues/10) | Native OCR, LED flicker, crop calibration, real-image benchmark |
| [#11](../../issues/11) | Phone remote and manual override for all five sports |
| [#12](../../issues/12) | Preflight, heartbeat, safe recovery, watchdog |
| [#13](../../issues/13) | CI/release/version manifest, manual updates, rollback |
| [#14](../../issues/14) | Privacy-preserving PostHog diagnostics (opt-in) |
| [#15](../../issues/15) | Source-buildable Mac Bridge/service, GUI-only signed install |

## P2 — preserve product capabilities and future enhancements

| Issue | Theme |
| --- | --- |
| [#16](../../issues/16) | All-in-one Control Center, profiles, logo manager |
| [#17](../../issues/17) | Sport rules, controls, hotkeys, celebrations |
| [#18](../../issues/18) | OBS graphics, playoffs, roster/lineups, player spotlight |
| [#19](../../issues/19) | Music player: fade, random shuffle, offline, limiter, recovery |
| [#20](../../issues/20) | School operator handbook, GUI-only deployment, incident response |
| [#21](../../issues/21) | Jesuit-only versus multi-school product and licensing |

## Known inherited constraints

- **Live production:** keep working Mac app, existing OBS source `http://127.0.0.1:8780/overlay`, and the production Netlify site untouched during review.
- **Mac:** school-managed macOS 14.5; operator must not need Terminal or new Mac software.
- **Sports:** football, basketball, lacrosse, soccer, baseball; approved logos, visual layouts, scoring animations, and control hotkeys preserved.
- **Camera:** real iPhone OCR reads must actually be accepted by the Mac service and rendered in OBS; a Firebase write alone does not prove success.
- **Remote:** require exact acknowledgments; never repeat an uncertain score/clock command blindly.
- **Clocks:** one real second corresponds to one game-clock second; safe stop/pause/restart rules.
- **Development:** no credentials, student rosters, or unapproved school graphics in a public GitHub repository.

## Previously approved feature details to preserve

**Football:** period/Final, downs, yardage, possession, safety vs conversion, field goal/extrapoint celebrations, alternative 2-period vs 4-quarter mode for intramurals. The separate approved intramural championship artwork is locked and must not be redesigned silently.

**Basketball:** synchronized game/shot-clock start-stop, buzzer on zero, shot clock reset without stopping it, records, bonus/double bonus, possession arrows, logos, hotkeys.

**Lacrosse:** 90-second shot clock, automatic timed penalty release, three timeouts, overtime/halftime/Final behavior, goal horn and clock-zero flash.

**Soccer:** penalty kicks, extra time and PK shootout in final display, correctly fitted logos and transparent graphic.

**Baseball:** 1–4 run home-run action and celebration.

**Shared:** profiles with team name/logo/colors/record; persistent logo add/rename/replace/remove; original OBS transparency; browser Control Center with new-tab navigation; no unsafe forced mid-game updates.

**Music:** random song from beginning after Stop, 1.5-second fade, instant emergency Cut, always-on shuffle without repeats, ~1-second song crossfade, volume normalization, offline library, safety limiter, Mac hotkeys, crash recovery, stream-safe sources.

## Operating rule

Never label a backlog issue **done** on the basis of a mock/synthetic test alone if acceptance criteria require actual iPhone, native Mac, OBS, Firebase, or school approval.
