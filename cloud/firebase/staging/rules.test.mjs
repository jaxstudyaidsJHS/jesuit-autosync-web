import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, get, set, update } from 'firebase/database';

const game = 'staging-game-001';
const path = 'stagingGames/' + game;
const ruleText = readFileSync(new URL('./database.rules.staging.json', import.meta.url), 'utf8');
let env;
const context = (uid, role='operator', matchGame=game, environment='staging') =>
  env.authenticatedContext(uid, {
    jesuitEnv: environment,
    jesuitRole: role,
    jesuitGame: matchGame
  });

before(async () => {
  env = await initializeTestEnvironment({
    projectId:'demo-jesuit-scoreboards-2',
    database:{host:'127.0.0.1',port:9000,rules:ruleText}
  });
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async admin => {
    await set(ref(admin.database(), path + '/state'),
      {protocol:2,gameId:game,sport:'football',revision:0,homeScore:0,awayScore:0,
        period:1,clock:{remainingMs:720000,running:false}});
  });
});
after(async () => { if(env) await env.cleanup(); });

test('only paired staging roles can read a game snapshot',async ()=>{
  const snapshot=await assertSucceeds(get(ref(context('op01').database(),path+'/state')));
  assert.equal(snapshot.val().protocol,2);
  await assertSucceeds(get(ref(context('viewer01','viewer').database(),path+'/state')));
  await assertFails(get(ref(env.unauthenticatedContext().database(),path+'/state')));
  await assertFails(get(ref(context('op01','operator','another-game').database(),path+'/state')));
  await assertFails(get(ref(context('op01','operator',game,'production').database(),path+'/state')));
});
test('no phone may write authoritative scoreboard state or receipts',async ()=>{
  const op=context('op02');
  await assertFails(set(ref(op.database(),path+'/state/homeScore'),44));
  await assertFails(set(ref(op.database(),path+'/receipts/command-123'),{status:'applied'}));
  await assertFails(set(ref(op.database(),path),{state:{homeScore:99}}));
});
test('authenticated operator may submit a new immutable ping only',async ()=>{
  const op=context('operator03');
  const pingId='ping_12345678';
  const target=ref(op.database(),path+'/pings/operator03/'+pingId);
  await assertSucceeds(set(target,{kind:'ping',id:pingId,at:Date.now()}));
  const message=await assertSucceeds(get(target));
  assert.equal(message.val().kind,'ping');
  await assertFails(set(target,{kind:'ping',id:pingId,at:Date.now()}));
});
test('no user can write another device UID path',async ()=>{
  const op=context('operator04');
  await assertFails(set(ref(op.database(),path+'/pings/victim-device/ping_12345678'),
    {kind:'ping',id:'ping_12345678',at:Date.now()}));
});
test('rules reject malformed, stale and arbitrary ping payloads',async ()=>{
  const op=context('operator05');
  const base=path+'/pings/operator05/';
  await assertFails(set(ref(op.database(),base+'ping_BAD_TYPE'),
    {kind:'score.add',id:'ping_BAD_TYPE',at:Date.now()}));
  await assertFails(set(ref(op.database(),base+'ping_MISMATCH'),
    {kind:'ping',id:'different-id',at:Date.now()}));
  await assertFails(set(ref(op.database(),base+'ping_STALE001'),
    {kind:'ping',id:'ping_STALE001',at:Date.now()-120000}));
  await assertFails(set(ref(op.database(),base+'ping_MORE0001'),
    {kind:'ping',id:'ping_MORE0001',at:Date.now(),evil:true}));
  await assertFails(set(ref(op.database(),base+'ping_NO_TIME'),
    {kind:'ping',id:'ping_NO_TIME'}));
});
test('viewer and unauthenticated clients cannot send ping proposals',async ()=>{
  await assertFails(set(ref(context('viewer06','viewer').database(),
    path+'/pings/viewer06/ping_12345678'),{kind:'ping',id:'ping_12345678',at:Date.now()}));
  await assertFails(set(ref(env.unauthenticatedContext().database(),
    path+'/pings/anyone/ping_12345678'),{kind:'ping',id:'ping_12345678',at:Date.now()}));
});
test('separate game claim prevents cross-room commands',async ()=>{
  await assertFails(set(ref(context('operator07','operator','different-game').database(),
    path+'/pings/operator07/ping_12345678'),{kind:'ping',id:'ping_12345678',at:Date.now()}));
});
test('bridge can inspect pings but still cannot send or rewrite state',async ()=>{
  const bridge=context('bridge01','bridge');
  await assertSucceeds(get(ref(bridge.database(),path+'/pings')));
  await assertFails(set(ref(bridge.database(),path+'/pings/bridge01/ping_12345678'),
    {kind:'ping',id:'ping_12345678',at:Date.now()}));
  await assertFails(set(ref(bridge.database(),path+'/state/clock/remainingMs'),0));
});
test('parent/root listings and updates remain forbidden to operator',async ()=>{
  const op=context('operator08');
  await assertFails(get(ref(op.database(),'stagingGames')));
  await assertFails(update(ref(op.database(),path+'/state'),
    {homeScore:18,awayScore:3}));
});
