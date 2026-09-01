/**
 * pi-zh 开关配置模块
 *
 * 配置文件：~/.pi/agent/pi-zh.json
 * 默认不启用（文件缺失或 enabled !== true 均视为关闭）。
 *
 * 格式：
 * {
 *   "enabled": true,
 *   "targets": ["pi", "telegram"]  // 可选，缺省为全部可用 target
 * }
 *
 * 优雅启用：在 TUI 中执行 /pi-zh on（写入配置并立即生效），
 * 关闭执行 /pi-zh off（还原所有已汉化文件）。
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface PiZhConfig {
  /** 是否启用汉化（默认 false） */
  enabled: boolean;
  /** 启用的 target 列表（缺省 = 全部可用） */
  targets?: string[];
}

const CONFIG_PATH = join(homedir(), ".pi/agent/pi-zh.json");

/** 读取配置；文件不存在或无效返回默认关闭配置 */
export function readConfig(): PiZhConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return { enabled: false };
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Partial<PiZhConfig>;
    return {
      enabled: raw.enabled === true,
      ...(Array.isArray(raw.targets) ? { targets: raw.targets } : {}),
    };
  } catch {
    return { enabled: false };
  }
}

/** 写入配置（原子写：先写临时文件再 rename） */
export function writeConfig(config: PiZhConfig): void {
  const dir = join(homedir(), ".pi/agent");
  if (!existsSync(dir)) return;
  const tmp = `${CONFIG_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(config, null, 2) + "\n", "utf8");
  // 同步替换避免读到半截文件
  renameSync(tmp, CONFIG_PATH);
}

/** 简易启用：写入 enabled 配置 */
export function enableConfig(targets?: string[]): PiZhConfig {
  const config: PiZhConfig = { enabled: true, ...(targets ? { targets } : {}) };
  writeConfig(config);
  return config;
}

/** 简易关闭：写入 enabled:false（并清空 targets 以便下次重新探测） */
export function disableConfig(): PiZhConfig {
  const config: PiZhConfig = { enabled: false };
  writeConfig(config);
  return config;
}

/** 配置路径（供状态显示/调试） */
export function getConfigPath(): string {
  return CONFIG_PATH;
}
