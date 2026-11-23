import test from 'node:test';
import assert from 'node:assert/strict';
import {ScoreboardEngine, initialState, validateCommand} from '../src/scoreboard-engine.mjs';

function cmd(id, expectedRevision, type, payload = {}) {
  return {protocol: 1, id, sport: 'football', expectedRevision, type, payload};
}

test('all five sports initialize with stopped clocks', () => {
  for (const sport of ['football','basketball','baseball','lacrosse','soccer']) {
    const s = initialState(sport);
    assert.equal(s.sport, sport);
    assert.equal(s.clock.running, false);
  }
});
test('time is derived from actual monotonic elapsed time, not callback count', () => {
  const e = new ScoreboardEngine();
  assert.equal(e.execute(cmd('start_0001',0,'clock.start'),{nowUptimeMs:1_000, authorized:true}).status,'applied');
  assert.equal(e.read(31_000).clock.remainingMs, 690_000);
  assert.equal(e.read(61_000).clock.remainingMs, 660_000);
  assert.equal(e.read(72_500).clock.remainingMs, 648_500);
  assert.equal(e.execute(cmd('stop_00001',1,'clock.stop'),{nowUptimeMs:72_500, authorized:true}).status,'applied');
  assert.equal(e.read(999_999).clock.remainingMs,648_500);
});
test('duplicates do not apply twice', () => {
  const e = new ScoreboardEngine();
  const action = cmd('touchdown_0001',0,'score.add',{team:'home',points:6});
  assert.equal(e.execute(action,{nowUptimeMs:0,authorized:true}).status,'applied');
  assert.equal(e.execute(action,{nowUptimeMs:500,authorized:true}).duplicate,true);
  assert.equal(e.read(500).homeScore,6);
  assert.equal(e.read(500).revision,1);
});
test('simultaneous stale revision produces conflict', () => {
  const e = new ScoreboardEngine();
  assert.equal(e.execute(cmd('home_00001',0,'score.set',{team:'home',points:7}),{nowUptimeMs:0,authorized:true}).status,'applied');
  assert.equal(e.execute(cmd('away_00001',0,'score.set',{team:'away',points:3}),{nowUptimeMs:2,authorized:true}).status,'conflict');
  assert.equal(e.read(2).awayScore,0);
});
test('unauthenticated client cannot mutate scoreboard', () => {
  const e = new ScoreboardEngine();
  assert.equal(e.execute(cmd('guest_00001',0,'score.set',{team:'home',points:7}),{nowUptimeMs:0}).status,'unauthorized');
  assert.equal(e.read(0).revision,0);
});
test('restart recovery snapshot pauses safely', () => {
  const e = new ScoreboardEngine();
  e.execute(cmd('start_0001',0,'clock.start'),{nowUptimeMs:0,authorized:true});
  const s=e.recoverySnapshot(20_000);
  assert.equal(s.clock.running,false);
  assert.equal(s.clock.remainingMs,700_000);
  assert.equal(s.clock.deadlineUptimeMs,null);
});
test('clock.start is idempotent even with distinct command ids',()=>{
  const e = new ScoreboardEngine();
  e.execute(cmd('start_0001',0,'clock.start'),{nowUptimeMs:1000,authorized:true});
  e.execute(cmd('start_0002',1,'clock.start'),{nowUptimeMs:2000,authorized:true});
  assert.equal(e.read(3000).clock.remainingMs,718_000);
});
test('invalid negative score and malformed IDs rejected',()=>{
  const e=new ScoreboardEngine();
  assert.ok(validateCommand(cmd('bad',0,'score.add',{team:'home',points:6})));
  assert.equal(e.execute(cmd('minus_0001',0,'score.add',{team:'home',points:-1}),{nowUptimeMs:0,authorized:true}).status,'invalid');
  assert.equal(e.read(0).revision,0);
});
