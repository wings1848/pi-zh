/**
 * pi-zh Telegram 命令同步模块
 *
 * 职责：用 curl 调用 Telegram Bot API，把 bot 命令菜单（setMyCommands 默认层）
 * 注册为中文描述。插件每次 /start 会重写默认层为英文，本模块检测到英文描述
 * 时立即重写（每隔 30 秒轮询）。
 *
 * 背景：不能使用 language_code 分层 —— 中文客户端上报 zh-hans，不匹配 zh 层，
 * 会回退默认层英文（Telegram 官方 bug）。
 */

import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** 内置命令的中文描述（与 telegram.json 服务端同步用的） */
const BUILTIN_ZH: Record<string, string> = {
  start: "🟢 打开菜单 / 配对桥接",
  compact: "🗜 压缩当前会话",
  next: "⏩ 强制下一轮",
  continue: "▶️ 排入继续提示",
  abort: "⏹️ 中止 Pi",
  stop: "🟥 中止 Pi 并清空队列",
};

/** 常见扩展命令的中文描述（未命中时保留原英文描述） */
const EXTENSION_ZH: Record<string, string> = {
  status: "📊 查看状态菜单",
  model: "🤖 选择模型",
  thinking: "🧠 设置思考级别",
  queue: "⏳ 查看任务队列",
  settings: "⚙️ 打开设置",
  review: "🧩 审查排队任务",
};

export interface TelegramCommand {
  command: string;
  description: string;
}

interface TelegramProfile {
  botToken?: string;
}

interface TelegramConfigFile {
  profiles?: Record<string, TelegramProfile>;
  botToken?: string;
}

/** 读取 ~/.pi/agent/telegram.json 中的全部 botToken */
export function readBotTokens(): string[] {
  const candidates = [
    join(homedir(), ".pi/agent/telegram.json"),
    join(homedir(), ".pi/telegram.json"),
  ];
  for (const path of candidates) {
    try {
      const raw = readFileSync(path, "utf8");
      const cfg = JSON.parse(raw) as TelegramConfigFile;
      const tokens = new Set<string>();
      if (cfg.profiles) {
        for (const profile of Object.values(cfg.profiles)) {
          if (profile.botToken) tokens.add(profile.botToken);
        }
      }
      if (cfg.botToken) tokens.add(cfg.botToken);
      if (tokens.size > 0) return [...tokens];
    } catch {
      // 尝试下一个路径
    }
  }
  return [];
}

function runCurl(
  url: string,
  body?: unknown,
): Promise<{ ok: boolean; result?: unknown; description?: string }> {
  return new Promise((resolve, reject) => {
    const args = ["-s", "--max-time", "20"];
    if (body === undefined) {
      args.push(url);
    } else {
      args.push(
        "-X",
        "POST",
        "-H",
        "Content-Type: application/json",
        "-d",
        JSON.stringify(body),
        url,
      );
    }
    execFile("curl", args, { timeout: 25_000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`curl failed: ${error.message} ${stderr}`));
        return;
      }
      try {
        resolve(
          JSON.parse(stdout) as {
            ok: boolean;
            result?: unknown;
            description?: string;
          },
        );
      } catch {
        reject(new Error(`curl output not JSON: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

async function callTelegramApi<T>(
  token: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const payload = await runCurl(url, body);
  if (!payload.ok) {
    throw new Error(
      `Telegram API ${method} failed: ${payload.description ?? "unknown"}`,
    );
  }
  return payload.result as T;
}

export function translateDescription(cmd: TelegramCommand): string {
  return BUILTIN_ZH[cmd.command] ?? EXTENSION_ZH[cmd.command] ?? cmd.description;
}

export function isEnglishDescription(description: string): boolean {
  return /Open menu \/ Pair bridge|Compact current session|Force next turn/.test(
    description,
  );
}

/** 同步一次：把默认层命令注册为中文 */
export async function syncZhCommands(token: string): Promise<void> {
  const current = await callTelegramApi<TelegramCommand[]>(
    token,
    "getMyCommands",
  );
  const commands = current.map((cmd) => ({
    command: cmd.command,
    description: translateDescription(cmd),
  }));
  if (commands.length === 0) {
    for (const [command, description] of Object.entries(BUILTIN_ZH)) {
      commands.push({ command, description });
    }
  }
  await callTelegramApi(token, "setMyCommands", { commands });
}

/** 检测默认层是否被插件重写为英文，是则修复，返回是否修复 */
export async function ensureZhCommands(token: string): Promise<boolean> {
  const current = await callTelegramApi<TelegramCommand[]>(
    token,
    "getMyCommands",
  );
  if (current.length === 0) return false;
  if (current.some((cmd) => isEnglishDescription(cmd.description))) {
    await syncZhCommands(token);
    return true;
  }
  return false;
}

/** 启动时同步所有 token（失败不抛错，返回成功数） */
export async function syncAllTokens(): Promise<number> {
  const tokens = readBotTokens();
  let ok = 0;
  for (const token of tokens) {
    try {
      await syncZhCommands(token);
      ok++;
    } catch (error) {
      console.warn("[pi-zh] telegram command sync failed:", error);
    }
  }
  return ok;
}
