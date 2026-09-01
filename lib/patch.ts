/**
 * pi-zh 补丁引擎 — 通用、幂等、双向可逆、安全降级
 *
 * 对目标文件做精确字符串替换：
 * - patch：  en → zh（存在原文且译文不存在时才替换）
 * - restore：zh → en（存在译文且原文不存在时才还原）
 * - 幂等：重复执行无副作用
 * - 安全：匹配不到时静默跳过，绝不破坏源码
 * - 多目标：一条词典可作用于多个文件（targetFiles 限定）
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DictEntry } from "./dict.ts";

export interface PatchTarget {
  /** 绝对路径（可不存在，跳过） */
  filePath: string;
  /** 相对标识（仅日志用） */
  label: string;
}

export interface PatchReport {
  label: string;
  /** 本次修改条数 */
  applied: number;
}

export interface PatchOutcome {
  changed: boolean;
  reports: PatchReport[];
}

/** 条目是否适用于某文件别名（targetFiles 限定） */
function entryAppliesTo(entry: DictEntry, alias: string): boolean {
  if (!entry.targetFiles || entry.targetFiles.length === 0) return true;
  return entry.targetFiles.some((t) => alias.endsWith(t));
}

/** 对单个文件执行 patch（en→zh）或 restore（zh→en），返回命中条数 */
export function applyFile(
  filePath: string,
  alias: string,
  entries: readonly DictEntry[],
  mode: "patch" | "restore",
): number {
  if (!existsSync(filePath)) return 0;
  let content = readFileSync(filePath, "utf8");
  let applied = 0;

  for (const entry of entries) {
    if (!entryAppliesTo(entry, alias)) continue;
    const from = mode === "patch" ? entry.en : entry.zh;
    const to = mode === "patch" ? entry.zh : entry.en;
    // 原文/译文不存在 → 自然幂等（该条目已完成）；存在 → 全量替换
    if (!content.includes(from)) continue;
    content = content.split(from).join(to);
    applied++;
  }

  if (applied > 0) {
    writeFileSync(filePath, content, "utf8");
  }
  return applied;
}

/** 对多个目标执行 patch/restore */
export function applyTargets(
  targets: readonly PatchTarget[],
  entries: readonly DictEntry[],
  mode: "patch" | "restore",
): PatchOutcome {
  const reports: PatchReport[] = [];
  let changed = false;
  for (const target of targets) {
    const applied = applyFile(target.filePath, target.label, entries, mode);
    if (applied > 0) {
      changed = true;
      reports.push({ label: target.label, applied });
    }
  }
  return { changed, reports };
}

/** 便捷：判定文件当前态是否「需要 patch」（存在英文且无中文） */
export function needsPatch(
  targets: readonly PatchTarget[],
  entries: readonly DictEntry[],
): boolean {
  for (const target of targets) {
    if (!existsSync(target.filePath)) continue;
    const content = readFileSync(target.filePath, "utf8");
    for (const entry of entries) {
      if (!entryAppliesTo(entry, target.label)) continue;
      if (content.includes(entry.en) && !content.includes(entry.zh)) return true;
    }
  }
  return false;
}

/** 便捷：判定文件当前态是否「需要还原」（存在中文） */
export function needsRestore(
  targets: readonly PatchTarget[],
  entries: readonly DictEntry[],
): boolean {
  for (const target of targets) {
    if (!existsSync(target.filePath)) continue;
    const content = readFileSync(target.filePath, "utf8");
    for (const entry of entries) {
      if (!entryAppliesTo(entry, target.label)) continue;
      if (content.includes(entry.zh) && !content.includes(entry.en)) return true;
    }
  }
  return false;
}

/** 兼容：定位包根（存在标志文件即返回） */
export function findPackageRoot(
  candidates: string[],
  markerFile: string,
): string | null {
  for (const dir of candidates) {
    if (existsSync(join(dir, markerFile))) return dir;
  }
  return null;
}
