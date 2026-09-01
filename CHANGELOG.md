# Changelog

本文件记录 pi-zh 的重要变更。版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.3.0] - 2026-09-02

- 正式作为开源项目发布（MIT License）
- pi-zh 与 pi-di18n 自动分工（`lib/coexist.ts`）：pi-di18n 激活时 pi 本体让位，避免重复汉化
- 新增 `/pi-zh status` 显示 pi-di18n 分工与 i18n SDK 状态
- i18n SDK（rpiv-i18n）仅在启用时确保安装，失败不影响其他功能
- Telegram 命令菜单中文同步增加 30s 防回滚轮询
- 默认不启用，零侵入可逆补丁

## [0.2.0] - 早期版本

- 初始的 slash 命令补全与 TUI 文案汉化
