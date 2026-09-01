# 贡献指南

感谢你参与 pi-zh 的开发！这是一个 Pi 的汉化插件，核心原则：

- **默认不启用**，用户显式 `/pi-zh on` 才生效
- **可逆幂等**补丁：`/pi-zh off` 一键还原
- **零侵入**：不改动任何上游 API 行为

## 新增一条汉化

1. 编辑 `lib/dict.ts`，在对应 target 的数组里加一行：

```ts
{ en: "英文原文（与文件逐字一致）", zh: "中文译文", targetFiles?: ["相对路径"], note?: "备注" }
```

2. 英文原文必须与目标文件内容**逐字一致**（含空格/标点/转义）
3. 原文应足够长/独特，避免误伤代码标识符
4. 工具 schema（给 AI 看的 description）**不汉化**

## 新增一个 target（插件）

1. `lib/targets.ts` 加探测定义（包根候选 + marker + probeFiles）
2. `lib/dict.ts` 加 `TARGET_DICTS[名称] = [...]`
3. `lib/patch.ts` 无需改动（通用引擎）
4. `extensions/index.ts` 如有默认文件路径需求，加 `defaults` 映射

## 开发环境

```bash
bun install          # 安装依赖
bun run typecheck    # 类型检查
```

## 提 PR 前

- [ ] `bun run typecheck` 通过
- [ ] 新增汉化条目不与其他条目重叠
- [ ] patch/restore 幂等语义正确（重复执行无副作用）

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 汉化 telegram 状态卡
fix: 修复 patch 幂等误判
docs: 更新 README 架构图
refactor: 拆分 patch 引擎
```
