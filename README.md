# Family Proxy Rules / 家庭代理规则

一份可读源策略，生成 FlClash/Mihomo、Karing、Stash 的分流与 DNS 适配文件。
机场提供节点；本项目负责规则。仓库不提供节点或订阅，也不需要上传完整客户端配置。

## 默认策略

| 流量类别 | 默认出站 |
| --- | --- |
| 局域网、私有地址 | 直连 |
| 苹果国内 `apple-cn` / `apple@cn` | 直连，先于苹果大集合匹配 |
| 微软国内 `microsoft@cn` | 直连，先于微软大集合匹配 |
| OneDrive `onedrive` | 初始默认直连，可按实际同步体验调整 |
| 其余苹果、微软服务 | 主代理 |
| Google、Google Play、Bing/Copilot | 主代理 |
| AI、开发、流媒体、社交服务 | 有对应策略组则使用，否则回到主代理 |
| 其他国内分类 | 直连 |
| 未匹配流量 | 主代理 |

“国内分类”是社区维护的域名分类，不是服务所在地、账号地区或服务可用性的保证。
OneDrive 直连不保证在每家宽带上最快。分流错误应增加精确例外；不建议不断叠加完整规则集。

## DNS

- 国内分类用国内加密 DNS；其他域名默认用海外 DoH。
- FlClash/Mihomo 使用 `respect-rules`，并把海外解析器 IP 显式路由到本订阅的主代理组。
- 节点域名及解析器引导有独立的直连加密解析路径，避免循环。
- 不混入系统/明文备用 DNS；不关闭 TLS 证书校验。
- Fake-IP 有助于保留域名和分流，但不是防泄漏证明。

浏览器内置 DoH、IPv6、应用排除、另一个 VPN、网络切换仍可能改变实际路径。
本项目没有配置系统级断网保护，也不承诺绝对无泄漏、固定延迟或服务解锁。
DNS 查询经代理时可能增加延迟或改变 CDN 调度，需要在实际网络验证。

## 文件与使用

### FlClash：保留节点，替换规则

`dist/flclash-with-dns.js` 是可复用的脚本覆写，适合 Android 和桌面版。

1. 先备份客户端。在脚本管理中新建脚本，导入或粘贴文件全文。
2. 在要使用的每份机场配置中，选择脚本覆写并关联该脚本。新导入配置通常也需要关联一次。
3. **关闭客户端全局“覆写 DNS”及“追加系统 DNS”**，让脚本内的 DNS 生效；不要关闭 DNS 服务。
4. 启用 VPN/TUN、DNS 接管，保持规则模式，选可用节点。可编辑劫持列表时同时设置 `any:53` 与 `tcp://any:53`。
5. Android 使用客户端统一解析时，检查系统私人 DNS 是否另行绕过；仅开系统 HTTP 代理不能覆盖所有应用。

脚本不改节点密码、订阅 URL、策略组或节点顺序。它选择常见主选择组，或第一个 `select` 组。
特殊订阅应在文件前声明 `FAMILY_RULES_OPTIONS`，指定 `proxyGroup` 为已有组名。
组名识别错误、组内选择 DIRECT 或订阅为空时不能提供预期的代理保护；导入后必须检查。

`dist/flclash-routing.js` 仅替换规则，不设置 DNS。适用于由全局覆写单独管理 DNS 的安装；
`dist/mihomo-dns.json` 是对应的 DNS 配置片段，不是完整订阅。不要同时启用两份路由覆写。

### Karing：应用级分流

`dist/karing-routing-groups.json` 是原生分流组结构，
`dist/karing-assignment-guide.json` 列出各组应选“直连”还是“当前选择”，以及 DNS 设置配方。
它们不是完整客户端备份；不要用其替换订阅数据库。

在自定义分流组入口导入/适配分流组，按配方选择出站；启用自定义组、禁用机场分流规则。
国内和私有地址直连，海外组及 final 跟随当前选择。
开启 DNS 分流、Fake-IP，关闭 ECS；解析器/节点/直连类别填国内 HTTPS DNS，代理类别填海外 DoH。
确认这些 geosite 名称存在于当前客户端；内置库和远程库的版本不一定相同。

### Stash：独立适配，不能运行 FlClash JS

`dist/stash-family.stoverride` 按 Stash iOS 3.6+ 文档编写。

1. 先确认原订阅能联网，再从覆写入口导入并启用文件。
2. 它完全替换 DNS 与规则，新增家庭策略组，保留原节点和其他策略组。
3. **先在“家庭代理”选择真实可用节点**，跳过流量/到期提示条目。空组可能退化为 DIRECT，发现空组请停用覆写。
4. AI、流媒体、社交组默认跟随家庭代理，也可独立选节点。
5. 首次使用需要下载 geosite 数据及 `family-apple-cn` 规则集，确保 GitHub 可访问。

Stash 使用 `follow-rule`，不能照搬 `respect-rules` 或 Mihomo 的 DNS `#DIRECT` 语法。
`apple-cn` 不是 v2fly 原始数据文件，因此 Stash 适配通过 MetaCubeX MRS provider 引用，
没有假设 Stash 能按同名 GEOSITE 自动下载它。其他有冲突的 DNS/路由覆写请先单独排查。

## 与上游的关系

| 上游 | 本项目如何使用 |
| --- | --- |
| [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) | Mihomo 分类命名参考；Stash 引用其苹果国内 MRS 数据 |
| [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community) | 苹果/微软 `@cn`、OneDrive、Google、Bing 等维护中的分类 |
| [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) | 可选细分规则来源，也是部分上游数据的来源；本项目未打包复制其完整数据集 |

这里维护的是策略选择、优先级和客户端适配，不重新维护全部大厂域名，也不声称优于上游。
规则库的同名分类可能来自不同版本，三个客户端不是逐域名完全等价。
远程 provider 默认随上游更新；并非所有客户端内置库都会自动更新。
上游数据各自遵循其原许可证，本仓库 MIT 许可仅覆盖自己的代码、文档和策略组合。

## 开发与验证

Node.js 18+，无 npm 依赖：

```sh
npm run build
npm test
node scripts/privacy-check.mjs
```

编辑 `src/policy.json` 后重新生成 `dist/`。测试检查节点保留、跨订阅目标匹配、
分类优先级、DNS 路由、跨内核差异和发布树中的明显敏感数据；它们不替代真机联网测试。
先验证 Wi-Fi/移动网络、登录、云盘同步、系统下载和 DNS 实际出口，再作为主力使用。
更新失败可停用覆写回到原订阅；手机通过本地文件安装时不会自动同步本仓库更新。

## 隐私与贡献

只提交规则和不含凭据的最小示例。不要提交客户端备份、完整订阅、节点配置、
访问令牌、私人域名/IP、个人日志或带账号信息的截图。
订阅链接即使只读，也往往含有认证信息。
本仓库不要求第三方转换站，不上传任何客户端数据；脚本只是纯配置变换。
隐私扫描只能发现部分模式，发布前仍需人工审查。公开规则不是匿名网络或账号安全保证。

反馈问题时提供客户端版本、规则命中结果及已脱敏的域名例外；不要粘贴完整配置。

## 官方参考

- [Mihomo DNS](https://wiki.metacubex.one/config/dns/)
- [Mihomo TUN](https://wiki.metacubex.one/config/inbound/tun/)
- [Karing DNS](https://karing.app/app-manual/dns)
- [Karing 分流](https://karing.app/tutorial/diversion)
- [Stash 覆写](https://stash.wiki/configuration/override)
- [Stash DNS](https://stash.wiki/features/dns-server)
- [Stash 规则类型](https://stash.wiki/rules/rule-types)
