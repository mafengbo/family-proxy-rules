import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function findings(text) {
  const checks=[
    ['GitHub credential', /gh[pousr]_[A-Za-z0-9]{20,}/g],
    ['private key', /-----BEGIN (?:OPENSSH |RSA |EC |DSA )?PRIVATE KEY-----/g],
    ['credential in URL', /https?:\/\/[^\s"'`]*[?&](?:token|key|access_token|auth)=[^\s"'`&]+/gi],
    ['local user path', /\/(?:Users|home)\/[A-Za-z0-9_.-]+\//g],
    ['likely embedded node credential', /(?:password|uuid|secret|private-key)["']?\s*[:=]\s*["'][A-Za-z0-9+/_=-]{16,}["']/gi],
  ];
  return checks.filter(([,pattern])=>pattern.test(text)).map(([label])=>label);
}

export function scan(root) {
  const failures=[];
  function walk(dir) {
    for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
      if(['.git','node_modules'].includes(item.name))continue;
      const file=path.join(dir,item.name), rel=path.relative(root,file);
      if(item.isDirectory()) {
        if(['private','backup','runtime'].includes(item.name)) {failures.push(rel+': private directory present');continue;}
        walk(file);continue;
      }
      if(/\.(?:plist|sqlite(?:-wal|-shm)?|db|zip|pem|key)$/i.test(item.name))failures.push(rel+': private/binary artifact');
      for(const finding of findings(fs.readFileSync(file,'utf8')))failures.push(rel+': '+finding);
    }
  }
  walk(root);return failures;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const failures=scan(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
  if(failures.length) {console.error(failures.join('\n'));process.exitCode=1;}
  else console.log('Privacy check passed (heuristic; manual review still required).');
}
