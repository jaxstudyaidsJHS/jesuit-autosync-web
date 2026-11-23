import test from 'node:test';
import assert from 'node:assert/strict';
import {parseClockFields, formatClock, adjustClock, scoreBefore, protectionEnabled, controllerAppliedClockSet, previousCommandConfirmed} from '../src/client/remote-safety-199.mjs';

test('valid 0:00 and 99:59 clock values',()=>{
  assert.equal(parseClockFields('0','0'),0);
  assert.equal(parseClockFields('99','59'),5999);
  assert.equal(formatClock(0),'00:00');assert.equal(formatClock(5999),'99:59');
});
test('invalid seconds, empty strings and negative/decimal values rejected',()=>{
  for (const p of [['8','60'],['100','00'],['','0'],['-1','2'],['2.5','0']]) assert.equal(parseClockFields(...p),null);
  assert.equal(formatClock(6000),null);
});
test('one- and ten-second adjustments clamp boundaries',()=>{
  assert.equal(adjustClock(3,-10),0);assert.equal(adjustClock(5996,10),5999);
  assert.equal(adjustClock(121,-1),120);assert.equal(adjustClock(121,10),131);
  assert.equal(adjustClock(121,100),null);
});
test('Score Protection defaults on without v1.9.9 explicit opt-out',()=>{
  assert.equal(protectionEnabled(undefined),true);assert.equal(protectionEnabled('1'),true);assert.equal(protectionEnabled('0'),false);
});
test('team and PK score are read from correct sport-specific source',()=>{
  assert.equal(scoreBefore({homeScore:7},'football','home'),7);
  assert.equal(scoreBefore({away:{score:2,pk:4}},'soccer','away','pk'),4);
  assert.equal(scoreBefore({away:{score:2,pk:4}},'soccer','away','goal'),2);
});
test('football clock ACK requires matching ID, stopped flag AND expected time',()=>{
  const request={id:'clockset-0001',seconds:275};
  const good={__jesuitRemoteClockSetApplied:request.id,__jesuitClockRunning:false,clock:'04:35'};
  assert.equal(controllerAppliedClockSet(good,request),true);
  assert.equal(controllerAppliedClockSet({...good,clock:'04:36'},request),false);
  assert.equal(controllerAppliedClockSet({...good,__jesuitClockRunning:true},request),false);
  assert.equal(controllerAppliedClockSet({...good,__jesuitRemoteClockSetApplied:'other'},request),false);
});
test('pending command cannot be cleared on cloud write alone',()=>{
  const pending={id:'cmd123456',sport:'football',clockSet:'clockset-0001'};
  const cloud={__jesuit198CommandId:'cmd123456',__jesuitRemoteClockSet:{id:'clockset-0001'}};
  assert.equal(previousCommandConfirmed(pending,cloud,'football'),false);
  assert.equal(previousCommandConfirmed(pending,{...cloud,__jesuitRemoteClockSetApplied:'clockset-0001'},'football'),true);
});
