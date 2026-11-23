import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../docs/release-manifest.example.json',import.meta.url)));
const rules=JSON.parse(readFileSync(new URL('../cloud/firebase/staging/database.rules.development-example.json',import.meta.url)));
test('2.0 manifest explicitly marks every live connection disabled',()=>{
 assert.equal(manifest.protocolVersion,2);
 assert.equal(manifest.channel,'development');
 assert.equal(manifest.ios.remoteWrites,false);
 assert.equal(manifest.ios.cameraCapture,false);
 assert.equal(manifest.cloud.firebaseConnected,false);
 assert.equal(manifest.cloud.netlifyProductionConnected,false);
 assert.equal(manifest.mac.connectedToLegacyOBS,false);
 assert.equal(manifest.release.broadcastReady,false);
 assert.equal(manifest.release.automaticDeployment,false);
});
test('staging database rules are deny-all until security audit',()=>{
 assert.equal(rules.rules['.read'],false);
 assert.equal(rules.rules['.write'],false);
});
