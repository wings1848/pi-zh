/**
 * pi-zh 目标探测模块
 *
 * 每个 target 声明：
 * - name        标识符（config.targets 用）
 * - label       显示名
 * - probeFiles  探测文件（相对包根），存在任一个即认为插件已安装
 * - packageRoots 可能安装位置（按顺序探测）
 * - marker      包根标志文件（确认根目录）
 *
 * 核心原则：存在则汉化，不存在则不管。pi 更新/插件更新后仅需重启
 * pi-zh 重新探测（模块顶层每次启动执行）。任一探测失败不影响其他 target。
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface TargetDefinition {
  name: string;
  label: string;
  /** 候选包根（按序探测，取第一个含 marker 的） */
  packageRoots: string[];
  /** 包根标志文件（确认根目录用） */
  marker: string;
  /** 探针文件（相对包根），存在即视为「插件存在」 */
  probeFiles: string[];
}

/** pi 本体（bun 全局安装 / npm 全局 / .pi 包目录） */
const PI_ROOTS = [
  join(homedir(), ".bun/install/global/node_modules/@earendil-works/pi-coding-agent"),
  "/usr/local/lib/node_modules/@earendil-works/pi-coding-agent",
  "/usr/lib/node_modules/@earendil-works/pi-coding-agent",
  join(homedir(), ".pi/agent/npm/node_modules/@earendil-works/pi-coding-agent"),
];

/** pi 扩展包统一目录 */
const EXT_DIR = join(homedir(), ".pi/agent/npm/node_modules");

export const TARGETS: TargetDefinition[] = [
  {
    name: "pi",
    label: "Pi 本体（命令补全 / TUI 文案）",
    packageRoots: PI_ROOTS,
    marker: "package.json",
    probeFiles: ["dist/core/slash-commands.js"],
  },
  {
    name: "telegram",
    label: "pi-telegram（菜单卡片 / 状态卡）",
    packageRoots: [join(EXT_DIR, "@llblab/pi-telegram")],
    marker: "package.json",
    probeFiles: ["lib/commands.ts"],
  },
  {
    name: "cache-optimizer",
    label: "pi-cache-optimizer（/cache-optimizer 命令）",
    packageRoots: [join(EXT_DIR, "pi-cache-optimizer")],
    marker: "package.json",
    probeFiles: ["index.ts"],
  },
];

/** 从候选根列表中取第一个含 marker 的目录（纯函数，可测） */
export function resolveFirstRoot(
  candidates: string[],
  marker: string,
): string | null {
  for (const dir of candidates) {
    if (existsSync(join(dir, marker))) return dir;
  }
  return null;
}

/** 解析 target 的安装根目录；未安装返回 null */
export function resolveTargetRoot(target: TargetDefinition): string | null {
  return resolveFirstRoot(target.packageRoots, target.marker);
}

/** target 是否已安装（探测文件存在） */
export function isTargetInstalled(target: TargetDefinition): boolean {
  const root = resolveTargetRoot(target);
  if (!root) return false;
  return target.probeFiles.some((f) => existsSync(join(root, f)));
}

/** 全部已安装的 target */
export function getInstalledTargets(): TargetDefinition[] {
  return TARGETS.filter(isTargetInstalled);
}

/** 按名称取 target；未知名返回 null */
export function getTargetByName(name: string): TargetDefinition | null {
  return TARGETS.find((t) => t.name === name) ?? null;
}
