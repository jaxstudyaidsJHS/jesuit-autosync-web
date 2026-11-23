/**
 * Reference event ledger for explicit acknowledgment stages.
 * IN-MEMORY ONLY: this is not the durable Mac command journal.
 * A successful Firebase write is NOT scoreboard application or OBS proof.
 */
export const RECEIPT_STAGES = Object.freeze([
  'created','cloud_received','bridge_received','native_applied','obs_operator_verified'
]);
export function createReceiptLedger(maxRecords = 1000) {
  if (!Number.isSafeInteger(maxRecords) || maxRecords < 1) throw new TypeError('Invalid capacity');
  const records = new Map();
  function read(id) {
    const r = records.get(id);
    return r ? structuredClone(r) : null;
  }
  function record({id, stage, revision = null, reason = null}) {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(id)) throw new TypeError('Invalid command ID');
    const index = RECEIPT_STAGES.indexOf(stage);
    if (index < 0 && stage !== 'failed' && stage !== 'uncertain') throw new TypeError('Invalid stage');
    const previous = records.get(id);
    if (previous && ['failed','uncertain'].includes(previous.stage)) {
      return {accepted:false,reason:'Terminal status requires operator reconciliation',record:read(id)};
    }
    if (previous && stage === previous.stage) {
      if (previous.revision !== revision && revision !== null && previous.revision !== null) {
        return {accepted:false,reason:'Conflicting acknowledgment revision',record:read(id)};
      }
      return {accepted:true,duplicate:true,record:read(id)};
    }
    if (previous && index >= 0) {
      const oldIndex = RECEIPT_STAGES.indexOf(previous.stage);
      if (index !== oldIndex + 1) return {accepted:false,reason:'Receipt stage out of order',record:read(id)};
    } else if (!previous && stage !== 'created') {
      return {accepted:false,reason:'Missing created receipt',record:null};
    }
    if (stage === 'native_applied' && (!Number.isSafeInteger(revision) || revision < 0)) {
      return {accepted:false,reason:'Native readback revision required',record:read(id)};
    }
    if (stage === 'obs_operator_verified' && (!previous || previous.stage !== 'native_applied')) {
      return {accepted:false,reason:'OBS visual confirmation is separate from native receipt',record:read(id)};
    }
    const next = {id,stage,revision:revision ?? previous?.revision ?? null,reason:reason ?? null};
    records.set(id,next);
    if (records.size > maxRecords) records.delete(records.keys().next().value);
    return {accepted:true,duplicate:false,record:read(id)};
  }
  return Object.freeze({read,record,count:()=>records.size});
}
