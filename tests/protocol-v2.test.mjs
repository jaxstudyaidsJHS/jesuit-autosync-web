import test from 'node:test';
import assert from 'node:assert/strict';
import {PROTOCOL_V2,validateV2Command,validateV2State,isWritableSession} from '../src/protocol/v2-contract.mjs';
import commandSchema from '../protocol/v2/command.schema.json' with {type:'json'};
import stateSchema from '../protocol/v2/state.schema.json' with {type:'json'};
import ackSchema from '../protocol/v2/ack.schema.json' with {type:'json'};
const gameId='0123456789abcdef0123456789abcdef';
const state={protocol:2,gameId,sport:'football',revision:5,homeScore:14,awayScore:7,period:3,clock:{remainingMs:420000,running:true}};
const action={protocol:2,gameId,sport:'football',id:'score-command-00001',expectedRevision:5,type:'score.add',payload:{team:'home',points:6}};
test('Go and Swift share protocol version 2 (v1 remains historical)',()=>{
  assert.equal(PROTOCOL_V2,2);
  assert.equal(commandSchema.properties.protocol.const,2);
  assert.equal(stateSchema.properties.protocol.const,2);
  assert.ok(ackSchema.properties.status.enum.includes('id_conflict'));
});
test('valid Mac-style score and clock commands',()=>{
  assert.equal(validateV2Command(action),null);
  assert.equal(validateV2Command({...action,id:'clock-reset-00001',type:'clock.reset',payload:{remainingMs:123000}}),null);
  assert.equal(validateV2Command({...action,id:'clock-start-00001',type:'clock.start',payload:{}}),null);
});
test('rejects unsafe input, stale protocol and malformed payloads',()=>{
  assert.match(validateV2Command({...action,protocol:1}),/Protocol/);
  assert.match(validateV2Command({...action,id:'short'}),/ID/);
  assert.match(validateV2Command({...action,payload:{team:'home',points:0}}),/Delta/);
  assert.match(validateV2Command({...action,payload:{team:'home',points:100}}),/Delta/);
  assert.match(validateV2Command({...action,payload:{team:'home',points:6,extra:true}}),/score fields/);
  assert.match(validateV2Command({...action,expectedRevision:-1}),/revision/);
  assert.match(validateV2Command({...action,gameId:'other'}),/gameId/);
});
test('state decoder and safety gate are fail closed',()=>{
  assert.equal(validateV2State(state),true);
  assert.equal(validateV2State({...state,clock:{remainingMs:'12:00',running:true}}),false);
  assert.equal(isWritableSession({clientProtocol:2,serverState:state,expectedGameId:gameId,authorized:true,staging:true}).allowed,true);
  assert.equal(isWritableSession({clientProtocol:2,serverState:state,expectedGameId:gameId,authorized:true}).allowed,false);
  assert.equal(isWritableSession({clientProtocol:2,serverState:state,expectedGameId:gameId,staging:true}).allowed,false);
  assert.equal(isWritableSession({clientProtocol:2,serverState:state,expectedGameId:'wrong-game',authorized:true,staging:true}).allowed,false);
});
test('receipt statuses do not equate cloud delivery with native apply',()=>{
  assert.equal(ackSchema.required.includes('revision'),true);
  assert.equal(ackSchema.properties.status.enum.includes('duplicate'),true);
  assert.equal(ackSchema.properties.status.enum.includes('applied'),true);
});
