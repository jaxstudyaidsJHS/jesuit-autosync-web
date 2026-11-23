import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const tracked = execFileSync('git',['ls-files'],{encoding:'utf8'}).split('\n').filter(Boolean);
const forbiddenPaths = [
  /(^|\/)\.env($|\.)/i,/GoogleService-Info\.plist$/i, /service-account/i,
  /adminsdk/i, /AuthKey_.*\.p8$/i, /\.(?:p8|p12|mobileprovision|pem|key|cer|pfx|ipa|dmg|zip)$/i,
  /(?:^|\/)(?:logos|rosters)\//i, /\.app\//i
];
const forbiddenContents = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9]{36,}/, /github_pat_[A-Za-z0-9_]{40,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /sk_(?:live|test)_[A-Za-z0-9]{15,}/
];
let errors=0;
for(const path of tracked){
  if(forbiddenPaths.some(r=>r.test(path))){console.error('Blocked path:',path);errors++;continue;}
  const data=readFileSync(path);
  if(data.includes(0)){console.error('Binary file requires review:',path);errors++;continue;}
  const content=data.toString('utf8');
  if(forbiddenContents.some(r=>r.test(content))){console.error('Potential credential in:',path);errors++;}
}
if(errors){console.error(String(errors)+' repository safety issue(s)');process.exit(1)}
console.log('Repository safety check passed ('+tracked.length+' tracked files).');
