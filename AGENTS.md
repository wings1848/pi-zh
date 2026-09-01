# AGENTS.md — 给 AI/贡献者的项目说明

pi-zh 是 Pi 的汉化插件。修改代码前请牢记设计铁律：

- **默认不启用**：无配置或 `enabled !== true` 一律关闭，启动零开销
- **可逆幂等补丁**：patch（en→zh）与 restore（zh→en）共用 `lib/dict.ts` 词典，双向替换必须有唯一精确原文；重复执行无副作用
- **安全降级**：任一 target 探测/补丁失败不得影响其他 target 与 pi 本体
- **工具 schema 不汉化**：codegraph / mcp-adapter 等给 AI 的 description 汉化会降低准确率
- **与 pi-di18n 协调**：pi-di18n 激活时 pi target 让位（见 `lib/coexist.ts`），避免重复汉化
- 编辑器/补丁目标路径：`lib/targets.ts` 的 `packageRoots` 按安装位置探测，新增 target 需同步探针

新增汉化：编辑 `lib/dict.ts`（唯一数据源）。不要直接改上游文件——那是补丁引擎的输出。
