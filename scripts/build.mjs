import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy=JSON.parse(fs.readFileSync(path.join(root,'src/policy.json'),'utf8'));
const dist=path.join(root,'dist');fs.mkdirSync(dist,{recursive:true});
const domestic='https://223.5.5.5/dns-query';
const dns={enable:true,listen:'127.0.0.1:1053','prefer-h3':false,'respect-rules':true,ipv6:false,
  'default-nameserver':[domestic],'enhanced-mode':'fake-ip','fake-ip-range':'198.18.0.1/16',
  'fake-ip-filter':policy.compatibilityDomains,
  'nameserver-policy':Object.fromEntries(policy.domesticDnsSets.map(s=>['geosite:'+s,domestic+'#DIRECT'])),
  nameserver:['https://1.1.1.1/dns-query','https://8.8.8.8/dns-query'],fallback:[],
  'proxy-server-nameserver':[domestic+'#DIRECT','https://doh.pub/dns-query#DIRECT'],
  'fallback-filter':{geoip:false,'geoip-code':'CN',geosite:[],ipcidr:[],domain:[]}};
let js=fs.readFileSync(path.join(root,'src/flclash.template.js'),'utf8')
  .replace('__POLICY__',JSON.stringify(policy)).replace('__DNS__',JSON.stringify(dns));
fs.writeFileSync(path.join(dist,'flclash-routing.js'),js.replace('  // __EMBED_DNS__\n',''));
fs.writeFileSync(path.join(dist,'flclash-with-dns.js'),js.replace('// __EMBED_DNS__',
  'config.dns = JSON.parse(JSON.stringify(DNS_POLICY));'));
fs.writeFileSync(path.join(dist,'mihomo-dns.json'),JSON.stringify(dns,null,2)+'\n');

const groups=[
  {groupid:'custom',name:'家庭直连例外',type:'',or:true,domain_suffix:['lan','local']},
  ...[['家庭AI','ai'],['家庭开发与Google','development'],['家庭流媒体','media'],['家庭社交','social']]
    .map(([name,key])=>({groupid:'custom',name,type:'',or:true,domain_suffix:policy[key]})),
  ...policy.vendors.map(g=>({groupid:'custom',name:g.name,type:'',or:true,rule_set_build_in:g.sets.map(s=>'geosite:'+s)})),
  {groupid:'custom',name:'家庭国内直连',type:'',or:true,rule_set_build_in:['geosite:cn']},
  {groupid:'custom',name:'家庭海外',type:'',or:true,rule_set_build_in:['geosite:geolocation-!cn']}
];
const directNames=new Set(['家庭直连例外','家庭国内直连',...policy.vendors.filter(g=>g.direct).map(g=>g.name)]);
fs.writeFileSync(path.join(dist,'karing-routing-groups.json'),JSON.stringify({items:[{groupid:'custom',urlOrPath:'',remark:'家庭规则',editAble:true,groups}],rule_set_items:[]},null,2)+'\n');
fs.writeFileSync(path.join(dist,'karing-assignment-guide.json'),JSON.stringify({
  note:'Mapping recipe, not a complete Karing backup. Apply through the app or adapt to its current data schema.',
  groups:groups.map(g=>({name:g.name,action:directNames.has(g.name)?'direct':'currentSelected'})),
  final:'currentSelected',dns:{enable_rule:true,enable_client_subnet:false,proxy_resolve_mode:'fakeip',
    resolver_addresses:[domestic],outbound_addresses:[domestic,'https://doh.pub/dns-query'],
    direct_addresses:[domestic,'https://doh.pub/dns-query'],proxy_addresses:dns.nameserver}
},null,2)+'\n');

const fake={proxies:[{name:'test-node',type:'socks5',server:'127.0.0.1',port:9}],
  'proxy-groups':['家庭代理','家庭AI','家庭流媒体','家庭社交'].map(name=>({name,type:'select',proxies:['test-node']})),rules:['MATCH,家庭代理']};
const transformed=vm.runInNewContext(js.replace('// __EMBED_DNS__','')+'\nmain(input)',{input:fake},{timeout:1000});
const stashRules=Array.from(transformed.rules).map(r=>r==='GEOSITE,apple-cn,DIRECT'?'RULE-SET,family-apple-cn,DIRECT':r);
const stashDns={'follow-rule':true,'skip-cert-verify':false,ipv6:false,
  'default-nameserver':[domestic],'proxy-server-nameserver':[domestic,'https://doh.pub/dns-query'],
  nameserver:dns.nameserver,'nameserver-policy':Object.fromEntries(policy.domesticDnsSets.map(s=>
    [s==='apple-cn'?'rule-set:family-apple-cn':'geosite:'+s,[domestic]])),fallback:[],
  'fake-ip-filter':[...policy.compatibilityDomains,'+.stun.*.*','+.stun.*.*.*','+.stun.*.*.*.*',
    '*.n.n.srv.nintendo.net','+.stun.playstation.net','*.msftncsi.com','*.msftconnecttest.com','*.mcdn.bilivideo.cn']};
const stashGroups=[{name:'家庭代理',type:'select','include-all':true,interval:600,lazy:true},
  ...['家庭AI','家庭流媒体','家庭社交'].map(name=>({name,type:'select',proxies:['家庭代理'],'include-all':true,interval:600,lazy:true}))];
// JSON flow values are valid YAML; preserve Stash's replace directives explicitly.
const stash=`name: "家庭分流与DNS ${policy.version}"\ndesc: "导入后先选择可用节点；需要 Stash iOS 3.6+，并下载首次使用的规则数据。"\nipv6: false\n`+
  `dns: #!replace\n  ${JSON.stringify(stashDns)}\n`+
  `proxy-groups:\n  ${JSON.stringify(stashGroups)}\n`+
  `rule-providers:\n  ${JSON.stringify({'family-apple-cn':{behavior:'domain',format:'mrs',url:'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple-cn.mrs',interval:86400}})}\n`+
  `rules: #!replace\n  ${JSON.stringify(stashRules)}\n`;
fs.writeFileSync(path.join(dist,'stash-family.stoverride'),stash);
console.log('Built 6 credential-free policy adapters.');
