// Generated from src/policy.json. Pure configuration transform; no I/O or downloads.
// Optional local-only customization: declare FAMILY_RULES_OPTIONS before this script.
const POLICY = {"version":"2026-10-21","ai":["openai.com","chatgpt.com","oaistatic.com","oaiusercontent.com","anthropic.com","claude.ai","claude.com","x.ai","grok.com","gemini.google.com","generativelanguage.googleapis.com","ai.google.dev"],"development":["google.com","googleapis.com","gstatic.com","googleusercontent.com","github.com","githubusercontent.com","githubassets.com"],"media":["youtube.com","youtu.be","googlevideo.com","ytimg.com","netflix.com","nflxvideo.net","nflximg.net","nflxso.net","disneyplus.com"],"social":["telegram.org","t.me","telegra.ph","telegram.me","whatsapp.com","whatsapp.net","signal.org","discord.com","discord.gg","discordapp.com","discordapp.net","x.com","twitter.com","twimg.com"],"vendors":[{"name":"家庭Google","sets":["google","google-play"],"direct":false},{"name":"家庭Bing与Copilot","sets":["bing"],"direct":false},{"name":"家庭苹果国内","sets":["apple-cn","apple@cn"],"direct":true},{"name":"家庭微软国内","sets":["microsoft@cn"],"direct":true},{"name":"家庭微软云盘","sets":["onedrive"],"direct":true},{"name":"家庭苹果其他","sets":["apple"],"direct":false},{"name":"家庭微软其他","sets":["microsoft"],"direct":false}],"privateCidrs":["127.0.0.0/8","10.0.0.0/8","172.16.0.0/12","192.168.0.0/16","169.254.0.0/16","100.64.0.0/10"],"privateCidrs6":["::1/128","fc00::/7","fe80::/10"],"domesticDnsSets":["cn","apple-cn","apple@cn","microsoft@cn","onedrive"],"compatibilityDomains":["*.lan","*.local","localhost","localhost.ptlogin2.qq.com","*.qq.com","*.weixin.qq.com","*.weixin.com","*.wechat.com","*.gtimg.com","*.qpic.cn","*.qlogo.cn","*.servicewechat.com"]};
const DNS_POLICY = {"enable":true,"listen":"127.0.0.1:1053","prefer-h3":false,"respect-rules":true,"ipv6":false,"default-nameserver":["https://223.5.5.5/dns-query"],"enhanced-mode":"fake-ip","fake-ip-range":"198.18.0.1/16","fake-ip-filter":["*.lan","*.local","localhost","localhost.ptlogin2.qq.com","*.qq.com","*.weixin.qq.com","*.weixin.com","*.wechat.com","*.gtimg.com","*.qpic.cn","*.qlogo.cn","*.servicewechat.com"],"nameserver-policy":{"geosite:cn":"https://223.5.5.5/dns-query#DIRECT","geosite:apple-cn":"https://223.5.5.5/dns-query#DIRECT","geosite:apple@cn":"https://223.5.5.5/dns-query#DIRECT","geosite:microsoft@cn":"https://223.5.5.5/dns-query#DIRECT","geosite:onedrive":"https://223.5.5.5/dns-query#DIRECT"},"nameserver":["https://1.1.1.1/dns-query","https://8.8.8.8/dns-query"],"fallback":[],"proxy-server-nameserver":["https://223.5.5.5/dns-query#DIRECT","https://doh.pub/dns-query#DIRECT"],"fallback-filter":{"geoip":false,"geoip-code":"CN","geosite":[],"ipcidr":[],"domain":[]}};
const main = (config) => {
  const options = typeof FAMILY_RULES_OPTIONS === 'undefined' ? {} : FAMILY_RULES_OPTIONS;
  const groups = config['proxy-groups'] || [];
  const names = groups.map(g => g.name);
  const preferred = ['节点选择', '🚀 节点选择', '♻️ 手动切换', 'MAIN', '主代理', 'Proxy', 'PROXY'];
  const base = options.proxyGroup || preferred.find(n => names.includes(n)) ||
    (groups.find(g => g.type === 'select') || {}).name;
  if (!base || !names.includes(base) || ['DIRECT', 'REJECT'].includes(base)) {
    throw new Error('No main proxy selector found. Set FAMILY_RULES_OPTIONS.proxyGroup to an existing group.');
  }
  const choose = candidates => candidates.find(n => names.includes(n)) || base;
  const ai = choose(['AI', '🧲 OpenAI', 'OpenAI']);
  const media = choose(['流媒体', '🎬 YouTube', 'Netflix']);
  const social = choose(['社交媒体', '📲 聊天软件', 'Telegram']);
  const rules = [];
  const suffixes = (domains, target) => domains.forEach(d => rules.push(`DOMAIN-SUFFIX,${d},${target}`));
  suffixes(options.directDomains || [], 'DIRECT');
  suffixes(['lan', 'local'], 'DIRECT');
  rules.push('DOMAIN,localhost,DIRECT');
  POLICY.privateCidrs.forEach(c => rules.push(`IP-CIDR,${c},DIRECT,no-resolve`));
  POLICY.privateCidrs6.forEach(c => rules.push(`IP-CIDR6,${c},DIRECT,no-resolve`));
  ['dns.alidns.com', 'doh.pub'].forEach(d => rules.push(`DOMAIN,${d},DIRECT`));
  ['223.5.5.5', '119.29.29.29'].forEach(ip => rules.push(`IP-CIDR,${ip}/32,DIRECT,no-resolve`));
  ['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4'].forEach(ip => rules.push(`IP-CIDR,${ip}/32,${base},no-resolve`));
  suffixes(POLICY.ai, ai);
  suffixes(POLICY.development, base);
  suffixes(POLICY.media, media);
  suffixes(POLICY.social, social);
  POLICY.vendors.forEach(g => g.sets.forEach(s => rules.push(`GEOSITE,${s},${g.direct ? 'DIRECT' : base}`)));
  rules.push('GEOSITE,cn,DIRECT', 'GEOIP,CN,DIRECT,no-resolve', `MATCH,${base}`);
  config.rules = rules;
  return config;
};
