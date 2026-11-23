import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/client/jesuit-198-remote-clock.js';
const {create,parseFootball} = globalThis.JesuitRemoteClock198;
let mono=0,epoch=1_000_000;
const reset=()=>{mono=0;epoch=1_000_000;};
const advance=n=>{mono+=n;epoch+=n;};
const model=(ttl=6500)=>create({monotonic:()=>mono,wall:()=>epoch,staleAfter:ttl});
const football=(value='08:42',running=true,stamp=epoch)=>({clock:value,quarter:'4',__jesuitClockRunning:running,__jesuitClockSampleAt:stamp});
test('football progresses each second independently of 1.8s polling',()=>{
 reset();const c=model();c.capture('football',football());
 assert.equal(c.current().text,'08:42 · Q4');advance(1000);assert.equal(c.current().text,'08:41 · Q4');
 advance(800);c.capture('football',football('08:41'));advance(1000);assert.equal(c.current().text,'08:40 · Q4');
});
test('stopped/reset football clock does not drift',()=>{
 reset();const c=model();c.capture('football',football('04:15',false));advance(4000);
 assert.equal(c.current().time,'04:15');c.capture('football',football('12:00',false));
 assert.equal(c.current().time,'12:00');
});
test('legacy state without running flag must not guess',()=>{
 reset();const c=model();c.capture('football',{clock:'08:42',quarter:'4'});advance(3000);
 assert.equal(c.current().time,'08:42');
});
test('duplicate snapshots cannot rewind running clock',()=>{
 reset();const c=model(),f=football();c.capture('football',f);advance(1800);c.capture('football',f);
 advance(600);assert.equal(c.current().time,'08:40');
});
test('stale running state shows CHECK SYNC',()=>{
 reset();const c=model(3000);c.capture('football',football('01:00'));advance(4000);
 assert.equal(c.current().stale,true);assert.match(c.current().text,/CHECK SYNC/);
});
test('old Mac football sample is stale immediately',()=>{
 reset();const c=model(3000);c.capture('football',football('01:00',true,epoch-5000));
 assert.equal(c.current().stale,true);
});
test('lacrosse time interpolates from milliseconds',()=>{
 reset();const c=model();c.capture('lacrosse',{game:{clockMs:90000,running:true,period:'3RD'}});
 advance(1100);assert.equal(c.current().time,'1:28');
});
test('basketball uses an endAt deadline',()=>{
 reset();const c=model();c.capture('basketball',{game:{period:'2ND',clock:{seconds:480,running:true,endAt:epoch+121000}}});
 advance(1000);assert.equal(c.current().text,'2:00 · 2ND');
});
test('soccer pause/resume and stage label',()=>{
 reset();const c=model();c.capture('soccer',{game:{stage:'1H',clock:{seconds:600,running:false,endAt:null}}});
 advance(4000);assert.equal(c.current().text,'10:00 · 1H');
 c.capture('soccer',{game:{stage:'2H',clock:{seconds:600,running:true,endAt:epoch+600000}}});
 advance(1000);assert.equal(c.current().text,'9:59 · 2H');
});
test('baseball static and football FINAL',()=>{
 reset();const c=model();c.capture('baseball',{game:{inning:7,half:'BOTTOM'}});
 assert.equal(c.current().text,'Inning 7 · BOTTOM');
 c.capture('football',{clock:'00:00',quarter:'FINAL'});
 assert.equal(c.current().text,'FINAL');
});
test('invalid clocks never show NaN',()=>{
 reset();const c=model();c.capture('football',{clock:'bad'});
 assert.equal(c.current().text,'--:--');assert.equal(parseFootball('09:82'),null);
});
