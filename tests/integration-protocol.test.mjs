import test from 'node:test';
import assert from 'node:assert/strict';
import {checkCompatibility} from '../src/protocol/compatibility.mjs';
import {createReceiptLedger} from '../src/protocol/receipt-ledger.mjs';

test('matching protocol and game permits writes',()=>{
  assert.equal(checkCompatibility({protocol:1,gameId:'g1'},{protocol:1,gameId:'g1'}).writable,true);
});
test('mismatched protocol locks writes',()=>{
  assert.equal(checkCompatibility({protocol:2},{protocol:1}).writable,false);
  assert.equal(checkCompatibility({protocol:1,gameId:'g1'},{protocol:1,gameId:'g2'}).writable,false);
  assert.equal(checkCompatibility({protocol:1},{protocol:1,maintenance:true}).writable,false);
});
test('cloud confirmation cannot skip to native or OBS',()=>{
  const l=createReceiptLedger();
  assert.equal(l.record({id:'score_00001',stage:'created'}).accepted,true);
  assert.equal(l.record({id:'score_00001',stage:'native_applied',revision:1}).accepted,false);
  assert.equal(l.record({id:'score_00001',stage:'obs_operator_verified'}).accepted,false);
  assert.equal(l.read('score_00001').stage,'created');
});
test('native receipt requires exact applied revision and ordered stages',()=>{
  const l=createReceiptLedger();
  l.record({id:'score_00002',stage:'created'});
  l.record({id:'score_00002',stage:'cloud_received'});
  l.record({id:'score_00002',stage:'bridge_received'});
  assert.equal(l.record({id:'score_00002',stage:'native_applied'}).accepted,false);
  assert.equal(l.record({id:'score_00002',stage:'native_applied',revision:12}).accepted,true);
  assert.equal(l.record({id:'score_00002',stage:'obs_operator_verified'}).accepted,true);
});
test('duplicate receipt is accepted but conflicting revision is blocked',()=>{
  const l=createReceiptLedger();
  l.record({id:'score_00003',stage:'created'});
  l.record({id:'score_00003',stage:'cloud_received'});
  l.record({id:'score_00003',stage:'bridge_received'});
  l.record({id:'score_00003',stage:'native_applied',revision:2});
  assert.equal(l.record({id:'score_00003',stage:'native_applied',revision:2}).duplicate,true);
  assert.equal(l.record({id:'score_00003',stage:'native_applied',revision:3}).accepted,false);
});
test('an uncertain receipt never silently replays',()=>{
  const l=createReceiptLedger();
  l.record({id:'score_00004',stage:'created'});
  l.record({id:'score_00004',stage:'uncertain',reason:'network timeout'});
  assert.equal(l.record({id:'score_00004',stage:'cloud_received'}).accepted,false);
  assert.equal(l.read('score_00004').stage,'uncertain');
});
