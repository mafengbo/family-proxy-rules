// Generated from src/policy.json. Pure configuration transform; no I/O or downloads.
// Optional local-only customization: declare FAMILY_RULES_OPTIONS before this script.
const POLICY = __POLICY__;
const DNS_POLICY = __DNS__;
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
  // __EMBED_DNS__
  return config;
};
