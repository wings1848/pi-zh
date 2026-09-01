/**
 * pi-zh rpiv-i18n SDK 管理
 *
 * rpiv-todo / rpiv-ask-user-question 等插件自带 zh.json 中文翻译，
 * 但需要 @juicesharp/rpiv-i18n SDK 激活（i18n bridge 动态 import，
 * SDK 缺失时静默回退英文）。安装到 .pi/agent/npm 即全局生效，
 * 用户可用插件提供的 /languages 命令实时切换。
 *
 * 本模块只在「启用时」确保 SDK 存在：存在则跳过，缺失则 npm install
 * 到 pi 的扩展包目录。失败不影响其他汉化功能。
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SDK_NAME = "@juicesharp/rpiv-i18n";

/** SDK 是否已安装（在 pi 扩展包目录） */
export function isI18nSdkInstalled(): boolean {
  const sdkPath = join(homedir(), ".pi/agent/npm/node_modules", SDK_NAME, "package.json");
  return existsSync(sdkPath);
}

/**
 * 确保 SDK 安装。返回 true 表示安装成功或已存在。
 * 安装到 ~/.pi/agent/npm（pi 统一扩展包目录，模块解析自动覆盖）。
 */
export function ensureI18nSdk(): boolean {
  if (isI18nSdkInstalled()) return true;
  try {
    const npmDir = join(homedir(), ".pi/agent/npm");
    if (!existsSync(npmDir)) return false;
    execFileSync("npm", ["install", SDK_NAME, "--no-save", "--omit=dev"], {
      cwd: npmDir,
      stdio: "pipe",
      timeout: 120_000,
    });
    return isI18nSdkInstalled();
  } catch {
    return false;
  }
}
