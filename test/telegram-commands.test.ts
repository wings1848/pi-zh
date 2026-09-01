/**
 * lib/telegram-commands.ts — 命令翻译纯函数测试
 */
import { describe, expect, test } from "bun:test";
import { isEnglishDescription, translateDescription } from "../lib/telegram-commands.ts";
import type { TelegramCommand } from "../lib/telegram-commands.ts";

describe("translateDescription", () => {
  test("内置命令 → 中文描述", () => {
    expect(translateDescription({ command: "start", description: "Open menu / Pair bridge" })).toBe(
      "🟢 打开菜单 / 配对桥接",
    );
  });

  test("扩展命令（status）→ 中文描述", () => {
    expect(translateDescription({ command: "status", description: "View status" })).toBe("📊 查看状态菜单");
  });

  test("未命中命令 → 保留原英文描述", () => {
    const cmd: TelegramCommand = { command: "custom-cmd", description: "Custom description" };
    expect(translateDescription(cmd)).toBe("Custom description");
  });
});

describe("isEnglishDescription", () => {
  test("英文内建描述 → true（需要修复）", () => {
    expect(isEnglishDescription("Open menu / Pair bridge")).toBe(true);
    expect(isEnglishDescription("Compact current session")).toBe(true);
    expect(isEnglishDescription("Force next turn")).toBe(true);
  });

  test("中文描述 → false（无需修复）", () => {
    expect(isEnglishDescription("🟢 打开菜单 / 配对桥接")).toBe(false);
  });

  test("不相关英文 → false", () => {
    expect(isEnglishDescription("Something random")).toBe(false);
  });
});
