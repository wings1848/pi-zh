# Changelog

本文件记录 pi-zh 的重要变更。版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.4.0] - 2026-09-02

- **性能修复**：i18n SDK 安装改为异步非阻塞（`execFile` 取代 `execFileSync`），pi 启动不再被包安装卡死（旧版曾在 npm 与 pnpm 目录不兼容时阻塞 30~80s）
- 自动探测包管理器（pnpm / npm / bun）：优先匹配目录特征（.pnpm / lockfile），其次 pi settings `npmCommand`，最后 PATH 回退
- 后台安装并发去重，失败静默下次再试；`ensureI18nSdk` 同步毫秒级返回 `installed | installing | missing`
- `/pi-zh on` 提示语区分 SDK 就绪 / 后台安装中 / 缺失回退英文
- 新增 sdk.test.ts（8 用例），全量 59 用例通过

## [0.3.1] - 2026-09-02

- 发布至 npm：Trusted Publishing (OIDC) 全自动发布验证
- CI 发布流程升级 npm CLI（OIDC 要求 >= 11.5.1）

## [0.3.0] - 2026-09-02

- 正式作为开源项目发布（MIT License）
- pi-zh 与 pi-di18n 自动分工（`lib/coexist.ts`）：pi-di18n 激活时 pi 本体让位，避免重复汉化
- 新增 `/pi-zh status` 显示 pi-di18n 分工与 i18n SDK 状态
- i18n SDK（rpiv-i18n）仅在启用时确保安装，失败不影响其他功能
- Telegram 命令菜单中文同步增加 30s 防回滚轮询
- 默认不启用，零侵入可逆补丁

## [0.2.0] - 早期版本

- 初始的 slash 命令补全与 TUI 文案汉化
