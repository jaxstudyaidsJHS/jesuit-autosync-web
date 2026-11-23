/**
 * Jesuit Scoreboards 2.0 — protocol reference implementation.
 *
 * This is an isolated, in-memory reference engine. It is NOT the current
 * compiled Mac service, a Firebase connector, or an OBS integration.
 * Integrate it into the authoritative local service only after migration tests.
 */

export const SPORTS = Object.freeze(['football', 'basketball', 'baseball', 'lacrosse', 'soccer']);
const COMMANDS = Object.freeze(['score.set', 'score.add', 'period.set', 'clock.start', 'clock.stop', 'clock.reset']);
const DEFAULT_CLOCK_MS = Object.freeze({ football: 12 * 60_000, basketball: 8 * 60_000, baseball: 0, lacrosse: 12 * 60_000, soccer: 40 * 60_000 });
const SCORE_LIMIT = 999;

export function initialState(sport = 'football') {
  if (!SPORTS.includes(sport)) throw new TypeError('Unsupported sport');
  return {
    protocol: 1,
    sport,
    revision: 0,
    homeScore: 0,
    awayScore: 0,
    period: 1,
    clock: { remainingMs: DEFAULT_CLOCK_MS[sport], running: false, deadlineUptimeMs: null }
  };
}

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
const integer = Number.isSafeInteger;

export function validateCommand(command) {
  if (!object(command)) return 'Command must be an object';
  if (command.protocol !== 1) return 'Unsupported protocol version';
  if (typeof command.id !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(command.id)) return 'Invalid command id';
  if (!SPORTS.includes(command.sport)) return 'Invalid sport';
  if (!integer(command.expectedRevision) || command.expectedRevision < 0) return 'Invalid expected revision';
  if (!COMMANDS.includes(command.type)) return 'Invalid command type';
  if (!object(command.payload)) return 'Invalid payload';
  const p = command.payload;
  if (command.type.startsWith('score.')) {
    if (!['home', 'away'].includes(p.team)) return 'Invalid team';
    if (!integer(p.points)) return 'Invalid points';
    if (command.type === 'score.set' && (p.points < 0 || p.points > SCORE_LIMIT)) return 'Score out of range';
    if (command.type === 'score.add' && (p.points < -10 || p.points > 10 || p.points === 0)) return 'Score delta out of range';
  } else if (command.type === 'period.set') {
    if (!integer(p.period) || p.period < 1 || p.period > 20) return 'Invalid period';
  } else if (command.type === 'clock.reset') {
    if (!integer(p.remainingMs) || p.remainingMs < 0 || p.remainingMs > 24 * 60 * 60_000) return 'Invalid clock value';
  }
  return null;
}

function safeNow(now) {
  if (typeof now !== 'number' || !Number.isFinite(now) || now < 0) throw new TypeError('Invalid monotonic uptime');
  return now;
}

export class ScoreboardEngine {
  #state;
  #journal = new Map();
  #journalLimit;

  constructor({sport = 'football', journalLimit = 2048} = {}) {
    if (!integer(journalLimit) || journalLimit < 1) throw new TypeError('Invalid journal limit');
    this.#state = initialState(sport);
    this.#journalLimit = journalLimit;
  }

  read(nowUptimeMs) {
    const now = safeNow(nowUptimeMs);
    const s = structuredClone(this.#state);
    if (s.clock.running) {
      s.clock.remainingMs = Math.max(0, Math.ceil(s.clock.deadlineUptimeMs - now));
      if (s.clock.remainingMs === 0) {
        s.clock.running = false;
        s.clock.deadlineUptimeMs = null;
      }
    }
    return s;
  }

  /**
   * Apply once per command id, with optimistic concurrency and an authority
   * decision from the caller's authenticated server session. Never trust a
   * role supplied by the remote client.
   */
  execute(command, {nowUptimeMs, authorized = false} = {}) {
    const now = safeNow(nowUptimeMs);
    const error = validateCommand(command);
    if (error) return Object.freeze({status: 'invalid', reason: error, revision: this.#state.revision});
    if (command.sport !== this.#state.sport) return Object.freeze({status: 'invalid', reason: 'Wrong active sport', revision: this.#state.revision});
    if (!authorized) return Object.freeze({status: 'unauthorized', revision: this.#state.revision});
    if (this.#journal.has(command.id)) return Object.freeze({...this.#journal.get(command.id), duplicate: true});
    if (command.expectedRevision !== this.#state.revision) return Object.freeze({status: 'conflict', revision: this.#state.revision});

    const s = this.read(now);
    const p = command.payload;
    if (command.type === 'score.set' || command.type === 'score.add') {
      const k = p.team === 'home' ? 'homeScore' : 'awayScore';
      const next = command.type === 'score.set' ? p.points : s[k] + p.points;
      if (next < 0 || next > SCORE_LIMIT) return Object.freeze({status: 'invalid', reason: 'Resulting score out of range', revision: s.revision});
      s[k] = next;
    } else if (command.type === 'period.set') {
      s.period = p.period;
    } else if (command.type === 'clock.start') {
      if (s.clock.remainingMs > 0 && !s.clock.running) {
        s.clock.running = true;
        s.clock.deadlineUptimeMs = now + s.clock.remainingMs;
      }
    } else if (command.type === 'clock.stop') {
      s.clock.running = false;
      s.clock.deadlineUptimeMs = null;
    } else if (command.type === 'clock.reset') {
      s.clock.running = false;
      s.clock.deadlineUptimeMs = null;
      s.clock.remainingMs = p.remainingMs;
    }
    s.revision++;
    this.#state = s;
    const ack = Object.freeze({status: 'applied', commandId: command.id, revision: s.revision});
    this.#journal.set(command.id, ack);
    if (this.#journal.size > this.#journalLimit) this.#journal.delete(this.#journal.keys().next().value);
    return ack;
  }

  /** A persisted recovery checkpoint deliberately pauses the clock. */
  recoverySnapshot(nowUptimeMs) {
    const snapshot = this.read(nowUptimeMs);
    snapshot.clock.running = false;
    snapshot.clock.deadlineUptimeMs = null;
    return snapshot;
  }
}
