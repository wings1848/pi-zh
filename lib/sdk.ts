/**
 * pi-zh rpiv-i18n SDK 管理
 *
 * rpiv-todo / rpiv-ask-user-question 等插件自带 zh.json 中文翻译，
 * 但需要 @juicesharp/rpiv-i18n SDK 激活（i18n bridge 动态 import，
 * SDK 缺失时静默回退英文）。安装到 .pi/agent/npm 即全局生效，
 * 用户可用插件提供的 /languages 命令实时切换。
 *
 * 本模块只在「启用时」确保 SDK 存在：存在则跳过，缺失则自动安装
 * 到 pi 的扩展包目录。
 *
 * 性能设计（v0.4 起）：
 * - 同步检测（existsSync）毫秒级，永不阻塞启动；
 * - 安装走异步 execFile 而非 execFileSync，避免 pi 启动被包安装卡死
 *   （旧版 npm install 与 pnpm 目录不兼容时曾阻塞 30~80s）；
 * - 自动探测包管理器：优先 pnpm，回退 npm/bun，且与目录特征匹配；
 * - 后台安装并发去重（同一进程只触发一次），失败静默，下次再试。
 */

import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SDK_NAME = "@juicesharp/rpiv-i18n";

/** pi 扩展包统一目录（可注入，便于测试） */
export function getDefaultNpmDir(): string {
  return join(homedir(), ".pi/agent/npm");
}

/** SDK 是否已安装（在 pi 扩展包目录） */
export function isI18nSdkInstalled(npmDir: string = getDefaultNpmDir()): boolean {
  const sdkPath = join(npmDir, "node_modules", SDK_NAME, "package.json");
  return existsSync(sdkPath);
}

// ---------------------------------------------------------------------------
// 包管理器探测
// ---------------------------------------------------------------------------

export type PackageManager = "pnpm" | "npm" | "bun";

/**
 * 探测包管理器：
 * 1. 优先匹配目录特征（pnpm 的 .pnpm / lockfile），因为 npm 在
 *    pnpm 目录里装包会触发 arborist 崩溃（Cannot read properties of null）；
 * 2. 无特征时读 pi settings.json 的 npmCommand 配置；
 * 3. 仍无则按 PATH 存在性回退（pnpm > npm > bun）。
 */
export function detectPackageManager(
  npmDir: string = getDefaultNpmDir(),
): PackageManager {
  // 1) 目录特征：pnpm 用锁文件/stores 结构标记
  if (
    existsSync(join(npmDir, "node_modules", ".pnpm")) ||
    existsSync(join(npmDir, "pnpm-lock.yaml"))
  ) {
    return "pnpm";
  }
  if (existsSync(join(npmDir, "package-lock.json"))) {
    return "npm";
  }
  if (existsSync(join(npmDir, "bun.lock")) || existsSync(join(npmDir, "bun.lockb"))) {
    return "bun";
  }

  // 2) pi 配置 npmCommand（用户显式声明了包管理器）
  try {
    const settingsPath = join(homedir(), ".pi/agent/settings.json");
    const raw = readFileSync(settingsPath, "utf8");
    const settings = JSON.parse(raw) as { npmCommand?: unknown };
    const cmd = Array.isArray(settings.npmCommand)
      ? String(settings.npmCommand[0]).toLowerCase()
      : typeof settings.npmCommand === "string"
        ? settings.npmCommand.toLowerCase()
        : "";
    if (cmd === "pnpm" || cmd === "npm" || cmd === "bun") return cmd;
  } catch {
    // settings.json 缺失/损坏 → 走 PATH 探测
  }

  // 3) PATH 探测：pnpm 优先（与 pi 现代安装方式一致）
  if (commandExists("pnpm")) return "pnpm";
  if (commandExists("npm")) return "npm";
  if (commandExists("bun")) return "bun";
  return "npm"; // 兜底，install 会失败但静默
}

/** PATH 中是否存在可执行文件（无外部依赖，直接查 PATH 目录） */
function commandExists(cmd: string): boolean {
  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(":")) {
    if (!dir) continue;
    if (existsSync(join(dir, cmd))) return true;
    if (existsSync(join(dir, cmd + ".exe"))) return true; // Windows
  }
  return false;
}

// ---------------------------------------------------------------------------
// 安装（异步、非阻塞）
// ---------------------------------------------------------------------------

/** 后台安装任务去重：同一进程只允许一个在途安装 */
let installInFlight: Promise<boolean> | null = null;

/** 按包管理器拼装安装参数（不写 package.json 的方式各异，统一处理） */
function buildInstallArgs(pm: PackageManager): { cmd: string; args: string[] } {
  switch (pm) {
    case "pnpm":
      // pnpm add/install 不支持 --no-save；install <pkg> 会写入 dependencies，
      // 这反而是期望行为：让 pi 后续 pnpm install 也能带上 SDK
      return { cmd: "pnpm", args: ["install", SDK_NAME, "--prefer-offline"] };
    case "bun":
      return { cmd: "bun", args: ["add", SDK_NAME, "--no-save"] };
    case "npm":
    default:
      return { cmd: "npm", args: ["install", SDK_NAME, "--no-save", "--omit=dev"] };
  }
}

/**
 * 异步安装 SDK（不阻塞调用方）。返回安装是否成功。
 * 安装失败（网络/包管理器问题）静默返回 false，绝不影响使用方。
 */
export function installI18nSdk(
  npmDir: string = getDefaultNpmDir(),
): Promise<boolean> {
  if (isI18nSdkInstalled(npmDir)) return Promise.resolve(true);
  if (!existsSync(npmDir)) return Promise.resolve(false);

  // 并发去重：复用同一在途任务
  if (installInFlight) return installInFlight;

  const { cmd, args } = buildInstallArgs(detectPackageManager(npmDir));

  installInFlight = new Promise<boolean>((resolve) => {
    execFile(
      cmd,
      args,
      { cwd: npmDir, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
      (_error, _stdout, _stderr) => {
        const ok = isI18nSdkInstalled(npmDir);
        resolve(ok);
      },
    );
  }).finally(() => {
    installInFlight = null;
  });

  return installInFlight;
}

/**
 * 确保 SDK 安装——同步返回，毫秒级，永不在启动路径阻塞。
 *
 * 返回：
 * - "installed"  已就绪（或刚触发后台安装完成前已存在）
 * - "installing" 未安装，已触发后台安装（下次检查生效）
 * - "missing"    扩展包目录不存在或无法安装（静默回退英文）
 *
 * 注意：安装本身是 fire-and-forget 的，调用方任何时候都不应 await 它
 * 参与启动时序；需要确认结果时请等待 installI18nSdk() 返回的 Promise。
 */
export function ensureI18nSdk(
  npmDir: string = getDefaultNpmDir(),
): "installed" | "installing" | "missing" {
  if (isI18nSdkInstalled(npmDir)) return "installed";
  if (!existsSync(npmDir)) return "missing";
  // 触发后台安装，不等待
  void installI18nSdk(npmDir);
  return "installing";
}
