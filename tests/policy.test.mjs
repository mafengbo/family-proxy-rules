import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findings,scan} from '../scripts/privacy-check.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const source=read('dist/flclash-with-dns.js');
function fixture(main='Airport selector') {
  return {proxies:[{name:'Example JP',type:'ss',server:'proxy.example.com',port:443,password:'test-only'}],
    'proxy-groups':[{name:main,type:'select',proxies:['Example JP']}],rules:[`MATCH,${main}`]};
}
const transform=(config,options)=>vm.runInNewContext(
  (options?'const FAMILY_RULES_OPTIONS='+JSON.stringify(options)+';\n':'')+source+'\nmain(input)',
  {input:structuredClone(config)},{timeout:1000});
test('unknown airport names work without mutating nodes, credentials or groups',()=>{
  for(const name of ['Airport selector','节点选择','MAIN','🚀 节点选择']) {
    const before=fixture(name), after=transform(before);
    assert.equal(JSON.stringify(after.proxies),JSON.stringify(before.proxies));
    assert.equal(JSON.stringify(after['proxy-groups']),JSON.stringify(before['proxy-groups']));
    assert.equal(after.rules.at(-1),`MATCH,${name}`);
  }
});
test('specialized service groups are used when available, with defined fallbacks',()=>{
  const f=fixture();f['proxy-groups'].push({name:'AI',type:'select',proxies:['Example JP']});
  const a=transform(f);assert.ok(a.rules.includes('DOMAIN-SUFFIX,chatgpt.com,AI'));
  const names=new Set(['DIRECT','REJECT',...a['proxy-groups'].map(g=>g.name)]);
  for(const r of a.rules){const v=r.split(',');assert.ok(names.has(v[v[0]==='MATCH'?1:2]));}
});
test('domestic vendor subsets precede the broad vendor and country rules',()=>{
  const a=transform(fixture()), index=s=>a.rules.findIndex(r=>r.startsWith(s));
  assert.ok(index('GEOSITE,apple-cn,DIRECT')<index('GEOSITE,apple,Airport selector'));
  assert.ok(index('GEOSITE,microsoft@cn,DIRECT')<index('GEOSITE,microsoft,Airport selector'));
  assert.ok(index('GEOSITE,onedrive,DIRECT')<index('GEOSITE,microsoft,Airport selector'));
  assert.ok(index('GEOSITE,bing,Airport selector')<index('GEOSITE,microsoft@cn,DIRECT'));
});
test('encrypted upstreams, independent bootstrap and explicit remote DNS routes',()=>{
  const a=transform(fixture());assert.equal(a.dns['respect-rules'],true);
  for(const key of ['nameserver','default-nameserver','proxy-server-nameserver'])
    assert.ok(a.dns[key].every(url=>url.startsWith('https://')));
  assert.equal(a.dns.fallback.length,0);
  assert.ok(a.rules.includes('IP-CIDR,1.1.1.1/32,Airport selector,no-resolve'));
  assert.ok(a.rules.includes('GEOIP,CN,DIRECT,no-resolve'));
});
test('invalid selector fails instead of silently choosing DIRECT',()=>{
  assert.throws(()=>transform({proxies:[],rules:['MATCH,DIRECT']}));
  assert.throws(()=>transform(fixture(),{proxyGroup:'missing'}));
});
test('personal exceptions remain optional and are absent from default exports',()=>{
  const a=transform(fixture(),{directDomains:['private.example.com']});
  assert.equal(a.rules[0],'DOMAIN-SUFFIX,private.example.com,DIRECT');
  assert.ok(!transform(fixture()).rules.some(r=>r.includes('private.example.com')));
});
test('Stash uses its own DNS syntax and a provider for Meta-only apple-cn',()=>{
  const s=read('dist/stash-family.stoverride');
  assert.ok(s.includes('dns: #!replace')&&s.includes('rules: #!replace'));
  assert.ok(s.includes('"follow-rule":true')&&s.includes('"skip-cert-verify":false'));
  assert.ok(s.includes('RULE-SET,family-apple-cn,DIRECT'));
  assert.ok(!s.includes('GEOSITE,apple-cn,')&&!s.includes('respect-rules'));
});
test('Karing output has valid assignments and correct domestic-before-vendor ordering',()=>{
  const groups=JSON.parse(read('dist/karing-routing-groups.json')).items[0].groups;
  const guide=JSON.parse(read('dist/karing-assignment-guide.json'));
  const names=new Set(groups.map(g=>g.name));assert.ok(guide.groups.every(g=>names.has(g.name)));
  assert.ok(groups.findIndex(g=>g.name==='家庭苹果国内')<groups.findIndex(g=>g.name==='家庭苹果其他'));
  assert.equal(guide.groups.find(g=>g.name==='家庭微软云盘').action,'direct');
});
test('privacy scanner rejects key material and the publication tree stays clean',()=>{
  assert.ok(findings('gh'+'p_'+'a'.repeat(30)).length);
  assert.ok(findings('https://example.com/sub?'+'token='+'not-a-real-token').length);
  assert.deepEqual(scan(root),[]);
});
