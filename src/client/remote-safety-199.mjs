/**
 * Portable, side-effect-free safety helpers for Jesuit Scoreboards v1.9.9.
 * Reference implementation extracted from the tested Mac-served remote.
 * This module alone does NOT change the installed Mac app.
 */
export const MAX_CLOCK_SECONDS = 99 * 60 + 59;

export function parseClockFields(minutes, seconds) {
  const mm = String(minutes ?? '').trim();
  const ss = String(seconds ?? '').trim();
  if (!/^\d{1,2}$/.test(mm) || !/^\d{1,2}$/.test(ss)) return null;
  const m = Number(mm), s = Number(ss);
  return m <= 99 && s <= 59 ? m * 60 + s : null;
}

export function formatClock(total) {
  if (!Number.isSafeInteger(total) || total < 0 || total > MAX_CLOCK_SECONDS) return null;
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

export function adjustClock(total, delta) {
  if (!Number.isSafeInteger(total) || ![-10,-1,1,10].includes(delta)) return null;
  return Math.min(MAX_CLOCK_SECONDS, Math.max(0, total + delta));
}

export function scoreBefore(state, sport, side, kind) {
  if (!state || !['home','away'].includes(side)) return null;
  if (sport === 'football') return Number(state[side + 'Score']) || 0;
  if (sport === 'soccer' && ['pk','pk-correction'].includes(kind)) return Number(state[side]?.pk) || 0;
  return Number(state[side]?.score) || 0;
}

export function protectionEnabled(versionedStorageValue) {
  // Old v1.9.8 opt-out is intentionally NOT inherited into v1.9.9.
  return versionedStorageValue !== '0';
}

export function controllerAppliedClockSet(observed, request) {
  if (!observed || !request || typeof request.id !== 'string' || !Number.isSafeInteger(request.seconds)) return false;
  if (request.seconds < 0 || request.seconds > MAX_CLOCK_SECONDS) return false;
  return observed.__jesuitRemoteClockSetApplied === request.id &&
    observed.__jesuitClockRunning === false && observed.clock === formatClock(request.seconds);
}

export function previousCommandConfirmed(pending, state, sport) {
  if (!pending || !state || pending.sport !== sport) return false;
  if (state.__jesuit198CommandId !== pending.id) return false;
  if (pending.clock && state.__jesuitRemoteClockApplied !== pending.clock) return false;
  if (pending.clockSet && state.__jesuitRemoteClockSetApplied !== pending.clockSet) return false;
  return true;
}
