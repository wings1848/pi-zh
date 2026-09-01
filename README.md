# pi-zh — Pi 汉化插件

[![npm version](https://img.shields.io/npm/v/@wings1848/pi-zh)](https://www.npmjs.com/package/@wings1848/pi-zh)
[![license](https://img.shields.io/npm/l/@wings1848/pi-zh)](LICENSE)
[![CI](https://github.com/wings1848/pi-zh/actions/workflows/ci.yml/badge.svg)](https://github.com/wings1848/pi-zh/actions/workflows/ci.yml)

统一汉化 Pi 及其生态插件的界面文案。**默认不启用**，通过 `/pi-zh on` 优雅开启，`/pi-zh off` 一键还原。零侵入：不改动任何上游 API 行为，仅做**可逆幂等补丁**与 Telegram API 同步。

## 安装

```bash
# 方式一：npm 包（推荐）
pi install npm:@wings1848/pi-zh

# 方式二：GitHub 仓库
pi install git:github.com/wings1848/pi-zh@v0.3.0
```

安装后重启 pi，执行 `/pi-zh on` 启用汉化。

## 使用

```text
/pi-zh          # 查看状态
/pi-zh on       # 启用汉化（立即打补丁 + 安装 i18n SDK + 同步 Telegram 命令）
/pi-zh off      # 关闭并还原全部文件到英文
```

配置文件：`~/.pi/agent/pi-zh.json`（`{ "enabled": true, "targets": [...] }`，缺省 = 全部已安装）

## 覆盖范围（存在才处理，缺省自动跳过）

| target | 内容 | 方式 |
| --- | --- | --- |
| `pi` | 内置 slash 命令补全（23 条）、/hotkeys 面板（3 节 + 30+ 动作）、/session 面板（15+ 字段）、/settings 面板（35 设置项 + thinking 级别） | 补丁 `dist/.../slash-commands.js` + bundle chunk |
| `telegram` | /start 菜单卡片、状态卡、子菜单标题 | 补丁 `@llblab/pi-telegram/lib/*.ts` |
| `cache-optimizer` | `/cache-optimizer` 命令与提示 | 补丁 `pi-cache-optimizer/index.ts` |
| i18n SDK | rpiv-todo / rpiv-ask-user-question 等自带 `locales/zh.json` | 自动安装 `@juicesharp/rpiv-i18n`，`/languages` 切换 |

> 工具 schema（如 codegraph / mcp-adapter 的 description）**不汉化**——那是给 AI 看的功能说明，汉化反而降低准确率。

## 架构

```
~/.pi/agent/pi-zh/
├── package.json
├── extensions/index.ts            # 入口：开关编排 + /pi-zh 命令
├── lib/
│   ├── config.ts                  # 开关配置（默认关）
│   ├── dict.ts                    # ★ 词典总表（唯一数据源，按 target 分组）
│   ├── patch.ts                   # 双向补丁引擎（patch/restore 幂等可逆）
│   ├── targets.ts                 # 插件探测（存在才处理）
│   ├── sdk.ts                     # rpiv-i18n SDK 管理
│   └── telegram-commands.ts       # Telegram 命令同步（30s 防回滚）
└── scripts/zh-dict.mjs            # outbound 词典脚本（telegram.json 引用）
```

## 设计要点

- **默认不启用**：无配置文件或 `enabled !== true` 一律关闭，启动零开销
- **可逆还原**：restore 按词典反向替换（zh→en），与 patch 共用同一数据源，无备份文件依赖
- **安全降级**：任一 target 探测/补丁失败不影响其他 target 与 pi 本身；匹配不到原文时静默跳过
- **更新安全**：pi/插件更新覆盖补丁后，下次启动或 `/pi-zh on` 自动重打；SDK 缺失时插件回退英文，**不产生异常**
- **新增汉化**：编辑 `lib/dict.ts` 加一行 `{ en, zh, targetFiles?, note? }`；新增插件则加一个 target 定义（`targets.ts`）并挂上词典

## 与 pi-di18n 共存（自动分工，无冲突）

每个字符串只有一个 owner：

| pi-di18n 状态 | pi 本体负责 | pi-zh 负责 |
| --- | --- | --- |
| 激活（locale 非 en，含 LANG=zh_CN 自动触发） | pi-di18n（运行时 300+ 条） | telegram / cache-optimizer |
| 未激活 | pi-zh（磁盘补丁） | telegram / cache-optimizer |

- 判定依据：pi-di18n 配置 locale / 环境变量（LANG、PI_LOCALE）是否非 en，且 `coreHacksEnabled !== false`
- 让位原因：pi-di18n 的 slash 命令翻译以运行时数组的 "original" 为基准，若 pi-zh 先磁盘补丁成中文会造成基准错位与措辞覆盖（重复汉化）→ 让位根治
- 已安装 pi-di18n 但未激活时，pi-zh 仍全量接管；`/pi-zh status` 会显示当前 owner

## 新增 target 步骤

1. `lib/targets.ts` 加探测定义（包根候选 + marker + probeFiles）
2. `lib/dict.ts` 加 `TARGET_DICTS[名称] = [...]`
3. `lib/patch.ts` 无需改动（通用）
4. `extensions/index.ts` 如有默认文件路径需求，加 `defaults` 映射

## 验证

```bash
# 启用后重启 pi 的日志：
[pi-zh] patched pi:dist/core/slash-commands.js (23)
[pi-zh] patched telegram:lib/commands.ts (6)
[pi-zh] telegram commands synced (1/1)
```

## 开发

```bash
bun install          # 安装依赖
bun run typecheck    # 类型检查
```

新增汉化/新 target 指南见 [CONTRIBUTING.md](CONTRIBUTING.md)，版本历史见 [CHANGELOG.md](CHANGELOG.md)。

## License

[MIT](LICENSE) © 2026 wings1848
