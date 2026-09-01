/**
 * pi-zh — Pi 汉化插件（统一入口 v0.3）
 *
 * 功能（按配置开关，默认关闭）：
 * 1. Pi 内置 slash 命令补全 + TUI 文案汉化（target: pi）
 * 2. pi-telegram 菜单卡片/状态卡汉化（target: telegram）
 * 3. pi-cache-optimizer 命令与提示汉化（target: cache-optimizer）
 * 4. rpiv-i18n SDK 激活（内置 locales 插件的中文支持，如 rpiv-todo）
 * 5. Telegram bot 命令菜单中文同步（30s 防回滚轮询）
 *
 * 架构：
 * - lib/config.ts   开关配置（~/.pi/agent/pi-zh.json，默认关）
 * - lib/dict.ts     词典总表（唯一数据源，按 target 分组）
 * - lib/targets.ts  插件探测（存在才处理）
 * - lib/patch.ts    双向补丁引擎（patch/restore 幂等可逆）
 * - lib/sdk.ts      rpiv-i18n SDK 管理
 *
 * 启用/关闭：TUI 中执行 /pi-zh on | off | status
 * 安全：任何 target 探测失败/补丁失败都不影响其他 target 与 pi 本身。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { homedir } from "node:os";
import { join } from "node:path";
import { getPiTargetOwner, isPiDi18nActive } from "../lib/coexist.ts";
import { disableConfig, enableConfig, readConfig, getConfigPath } from "../lib/config.ts";
import { TARGET_DICTS } from "../lib/dict.ts";
import { applyTargets, type PatchTarget } from "../lib/patch.ts";
import { ensureI18nSdk, isI18nSdkInstalled } from "../lib/sdk.ts";
import { getInstalledTargets, getTargetByName, resolveTargetRoot, type TargetDefinition } from "../lib/targets.ts";
import { ensureZhCommands, readBotTokens, syncAllTokens } from "../lib/telegram-commands.ts";

// ---------------------------------------------------------------------------
// 补丁编排
// ---------------------------------------------------------------------------

/** 生成某 target 的补丁目标文件列表（按词典 targetFiles 集合 + 包根） */
function buildTargetFiles(target: TargetDefinition): PatchTarget[] {
  const root = resolveTargetRoot(target);
  if (!root) return [];
  const entries = TARGET_DICTS[target.name] ?? [];
  const files = new Set<string>();
  for (const entry of entries) {
    for (const file of entry.targetFiles ?? []) {
      files.add(file);
    }
  }
  // 无 targetFiles 限定的条目（如 pi 的 slash-commands 需特殊处理）在 files 为空时补默认文件
  const defaults: Record<string, string[]> = {
    pi: [
      "dist/core/slash-commands.js",
      "dist/bundle/chunks/chunk-OMWWHBTG.js",
    ],
    telegram: ["lib/commands.ts", "lib/status.ts", "lib/menu-status.ts", "lib/menu-model.ts", "lib/menu-thinking.ts", "lib/menu-queue.ts", "lib/menu-settings.ts"],
    "cache-optimizer": ["index.ts"],
  };
  const targetFiles = files.size > 0 ? files : new Set(defaults[target.name] ?? []);
  return [...targetFiles].map((f) => ({
    filePath: join(root, f),
    label: `${target.name}:${f}`,
  }));
}

/** 对某 target 执行 patch 或 restore，返回修改数 */
function applyTarget(
  target: TargetDefinition,
  mode: "patch" | "restore",
): { changed: boolean; reports: Array<{ label: string; applied: number }> } {
  const entries = TARGET_DICTS[target.name] ?? [];
  const files = buildTargetFiles(target);
  return applyTargets(files, entries, mode);
}

/** 对全部已安装 target 执行操作（on=patch，off=restore），自动协调 pi-di18n 分工 */
function applyAll(mode: "patch" | "restore"): Array<{ target: string; applied: number }> {
  const results: Array<{ target: string; applied: number }> = [];
  const piOwner = getPiTargetOwner();
  for (const target of getInstalledTargets()) {
    // 协调：pi-di18n 激活时，pi target 让它负责（避免 slash 命令双 owner、基准错位）
    if (target.name === "pi" && piOwner === "pi-di18n" && mode === "patch") {
      console.log("[pi-zh] pi target delegated to pi-di18n (active), skipping");
      results.push({ target: target.name, applied: 0 });
      continue;
    }
    // restore 时仍需处理 pi：若之前 pi-zh 打过补丁，还原之（幂等：未打过则无操作）
    const outcome = applyTarget(target, mode);
    const applied = outcome.reports.reduce((sum, r) => sum + r.applied, 0);
    for (const report of outcome.reports) {
      console.log(`[pi-zh] ${mode === "patch" ? "patched" : "restored"} ${report.label} (${report.applied})`);
    }
    results.push({ target: target.name, applied });
  }
  return results;
}

// ---------------------------------------------------------------------------
// 开关动作（供 /pi-zh 命令与启动逻辑共用）
// ---------------------------------------------------------------------------

/** 启用：写配置 + 立即打补丁 + 确保 i18n SDK + 同步 Telegram 命令 */
async function turnOn(targetList?: string[]): Promise<string> {
  enableConfig(targetList);
  const results = applyAll("patch");
  const sdkOk = ensureI18nSdk();
  const counts = results.map((r) => `${r.target}:${r.applied}`).join(" ");
  return `✅ pi-zh 已启用${targetList ? `（${targetList.join(", ")}）` : ""}（${counts}）${sdkOk ? "，i18n SDK 就绪" : "，i18n SDK 安装失败"}`;
}

/** 关闭：还原所有已汉化文件 + 写配置 */
function turnOff(): string {
  const results = applyAll("restore");
  disableConfig();
  const counts = results.map((r) => `${r.target}:${r.applied}`).join(" ");
  return `✅ pi-zh 已关闭，已还原（${counts}）`;
}

/** 状态：显示配置、已安装 target、SDK 状态、pi-di18n 分工 */
function status(): string {
  const config = readConfig();
  const installed = getInstalledTargets().map((t) => t.name).join(", ") || "无";
  const enabledTargets = config.targets?.join(", ") ?? "全部";
  const piOwner = getPiTargetOwner();
  return [
    `📋 pi-zh 状态：${config.enabled ? "启用中" : "已关闭（默认）"}`,
    `   配置：${getConfigPath()}`,
    `   已安装 target：${installed}`,
    `   启用范围：${enabledTargets}`,
    `   pi 本体负责：${piOwner === "pi-di18n" ? "pi-di18n（已激活，避免重复）" : "pi-zh"}`,
    `   i18n SDK：${isI18nSdkInstalled() ? "已安装" : "未安装"}`,
    `   用法：/pi-zh on | off | status`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// 扩展入口
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000;
const TG_TOKENS = readBotTokens();

export default async function (pi: ExtensionAPI) {
  // ---- 启动时按配置执行（默认关）----
  const config = readConfig();
  if (config.enabled) {
    applyAll("patch");
    if (["pi", "telegram", "cache-optimizer"].every((t) => config.targets?.includes(t) || !config.targets)) {
      ensureI18nSdk();
    }
    if (TG_TOKENS.length > 0) {
      const ok = await syncAllTokens();
      console.log(`[pi-zh] telegram commands synced (${ok}/${TG_TOKENS.length})`);
    }
  } else {
    console.log("[pi-zh] disabled (default) — enable with /pi-zh on");
  }

  // ---- /pi-zh 命令：优雅开关 ----
  pi.registerCommand("pi-zh", {
    description: "管理 pi-zh 汉化（on/off/status）",
    handler: async (args, ctx) => {
      const cmd = (args ?? "").trim().toLowerCase();
      let message: string;
      if (cmd === "on") {
        message = await turnOn();
      } else if (cmd === "off") {
        message = turnOff();
      } else if (cmd === "status" || cmd === "") {
        message = status();
      } else {
        message = `用法：/pi-zh on | off | status`;
      }
      await ctx.ui.notify(message, "info");
    },
  });

  // ---- Telegram 命令防回滚轮询（无论开关，若此前启用了命令菜单中文，保底修复）----
  // 仅在已启用时轮询，避免无谓 API 调用
  if (config.enabled && TG_TOKENS.length > 0) {
    let pollTimer: NodeJS.Timeout | undefined;
    pi.on("session_start", async () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        for (const token of TG_TOKENS) {
          ensureZhCommands(token).catch(() => {});
        }
      }, POLL_INTERVAL_MS);
    });
    pi.on("session_shutdown", () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    });
  }
}
