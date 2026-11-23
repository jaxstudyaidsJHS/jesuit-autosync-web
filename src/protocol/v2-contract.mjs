/**
 * Wire validation for v2 staging clients. The Mac independently validates
 * every command. This module is NOT an authentication or permissions check.
 */
export const PROTOCOL_V2 = 2;
export const SPORTS_V2 = Object.freeze(['football','basketball','baseball','lacrosse','soccer']);
export const COMMANDS_V2 = Object.freeze(['score.set','score.add','period.set','clock.start','clock.stop','clock.reset']);
const safeInt = Number.isSafeInteger;
const rec = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v,allowed) => Object.keys(v).every(k => allowed.includes(k));
export function validateV2Command(v) {
  if (!rec(v) || !keys(v,['protocol','gameId','sport','id','expectedRevision','type','payload'])) return 'Invalid command shape';
  if (v.protocol !== PROTOCOL_V2) return 'Protocol mismatch';
  if (typeof v.gameId !== 'string' || v.gameId.length < 8 || v.gameId.length > 128) return 'Invalid gameId';
  if (!SPORTS_V2.includes(v.sport)) return 'Unsupported sport';
  if (typeof v.id !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(v.id)) return 'Invalid command ID';
  if (!safeInt(v.expectedRevision) || v.expectedRevision < 0) return 'Invalid revision';
  if (!COMMANDS_V2.includes(v.type) || !rec(v.payload)) return 'Invalid type/payload';
  const p=v.payload;
  if (v.type === 'score.set' || v.type === 'score.add') {
    if (!keys(p,['team','points']) || !['home','away'].includes(p.team) || !safeInt(p.points)) return 'Invalid score fields';
    if (v.type === 'score.set' && (p.points < 0 || p.points > 999)) return 'Score out of range';
    if (v.type === 'score.add' && (p.points === 0 || p.points < -10 || p.points > 10)) return 'Delta out of range';
  } else if (v.type === 'period.set') {
    if (!keys(p,['period']) || !safeInt(p.period) || p.period < 1 || p.period > 20) return 'Invalid period';
  } else if (v.type === 'clock.reset') {
    if (!keys(p,['remainingMs']) || !safeInt(p.remainingMs) || p.remainingMs < 0 || p.remainingMs > 86_400_000) return 'Invalid clock';
  } else if (Object.keys(p).length) return 'Start and stop payload must be empty';
  return null;
}
export function validateV2State(v) {
  if (!rec(v) || v.protocol !== 2 || !SPORTS_V2.includes(v.sport)) return false;
  if (typeof v.gameId !== 'string' || v.gameId.length < 8) return false;
  if (!safeInt(v.revision) || v.revision < 0) return false;
  if (!safeInt(v.homeScore) || !safeInt(v.awayScore) ||
    v.homeScore < 0 || v.awayScore < 0 || v.homeScore > 999 || v.awayScore > 999) return false;
  if (!safeInt(v.period) || v.period < 1 || v.period > 20) return false;
  return rec(v.clock) && safeInt(v.clock.remainingMs) &&
    v.clock.remainingMs >= 0 && v.clock.remainingMs <= 86_400_000 &&
    typeof v.clock.running === 'boolean';
}
export function isWritableSession({clientProtocol,serverState,expectedGameId,authorized=false,staging=false}={}) {
  if (!staging) return {allowed:false,reason:'No production authority enabled'};
  if (!authorized) return {allowed:false,reason:'Operator authorization required'};
  if (clientProtocol !== PROTOCOL_V2 || !validateV2State(serverState)) return {allowed:false,reason:'Protocol mismatch or invalid state'};
  if (serverState.gameId !== expectedGameId) return {allowed:false,reason:'Active game changed'};
  return {allowed:true,reason:'Staging protocol compatible; Mac must independently authorize'};
}
