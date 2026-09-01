/**
 * pi-zh 与 pi-di18n 的协调层
 *
 * 分工原则（每个字符串只有一个 owner，避免冲突/重复汉化）：
 * - pi-di18n 激活（locale 非 en）→ pi 本体 runtime 文案（slash 命令描述、TUI 面板、
 *   通知/错误提示等 300+ 条）归 pi-di18n；pi-zh 自动让位 pi target，只保留
 *   telegram / cache-optimizer（pi-di18n 不覆盖的生态）。
 * - pi-di18n 未激活 → pi-zh 全管线接管（含 pi target）。
 *
 * 为什么让位：
 * pi-di18n 的 patchCoreBuiltinSlashCommandDescriptions 会 import dist 的
 * BUILTIN_SLASH_COMMANDS 数组并记录 "original" 作为翻译基准。若 pi-zh
 * 先磁盘补丁成中文，pi-di18n 会把中文误当基准（基准错位），再按它的
 * bundle 覆盖（措辞/繁简差异 = 重复汉化）。让位即可根治。
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** pi-di18n 包是否已安装（在 pi 扩展包目录） */
function isPiDi18nInstalled(): boolean {
  const pkg = join(
    homedir(),
    ".pi/agent/npm/node_modules/pi-di18n/package.json",
  );
  return existsSync(pkg);
}

/** pi-di18n 的状态目录（与它源码 config.ts 保持一致） */
function getPiDi18nConfigPath(): string {
  return join(homedir(), ".pi/agent/state/pi-di18n/config.json");
}

/** 读 pi-di18n 配置文件中的 locale（仿照其 loadI18nConfig 优先级） */
function readPiDi18nLocale(): string | undefined {
  try {
    const path = getPiDi18nConfigPath();
    if (!existsSync(path)) return undefined;
    const cfg = JSON.parse(readFileSync(path, "utf8")) as {
      locale?: string;
      fallbackLocale?: string;
      coreHacksEnabled?: boolean;
    };
    // coreHacks 被显式禁用 → pi-di18n 不碰内核 → pi-zh 可接管
    if (cfg.coreHacksEnabled === false) return undefined;
    return cfg.locale ?? cfg.fallbackLocale;
  } catch {
    return undefined;
  }
}

/** pi-di18n 运行时 locale（模拟它的 detectLocaleFromEnv） */
function readPiDi18nEnvLocale(): string | undefined {
  const candidates = [
    process.env.PI_LOCALE,
    process.env.LC_ALL,
    process.env.LANG,
  ].filter(Boolean) as string[];
  for (const raw of candidates) {
    const s = raw.trim();
    if (!s) continue;
    const base = (s.split(".")[0] ?? s).replace(/_/g, "-");
    if (base) return base;
  }
  return undefined;
}

/** pi-di18n 是否激活（已安装 + locale 非 en + coreHacks 未禁用） */
export function isPiDi18nActive(): boolean {
  if (!isPiDi18nInstalled()) return false;
  const locale = readPiDi18nLocale() ?? readPiDi18nEnvLocale();
  if (!locale) return false;
  const lang = String(locale).toLowerCase().split("-")[0]!;
  // en、en-US、en-GB、C、POSIX 等英文/中性环境 → 未激活
  return !(
    lang === "" ||
    lang === "en" ||
    lang === "c" ||
    lang === "posix"
  );
}

/** 协调结果：当前 pi target 由谁负责 */
export function getPiTargetOwner(): "pi-zh" | "pi-di18n" {
  return isPiDi18nActive() ? "pi-di18n" : "pi-zh";
}
