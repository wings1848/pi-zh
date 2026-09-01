/**
 * lib/config.ts — 开关配置测试
 *
 * 核心契约：默认关闭、原子写、无效文件安全降级、路径可注入。
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  disableConfig,
  enableConfig,
  readConfig,
  writeConfig,
} from "../lib/config.ts";

let dir: string;
let cfgPath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "pi-zh-cfg-"));
  cfgPath = join(dir, "pi-zh.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("readConfig", () => {
  test("文件不存在 → 默认关闭", () => {
    const cfg = readConfig(cfgPath);
    expect(cfg.enabled).toBe(false);
    expect(cfg.targets).toBeUndefined();
  });

  test("enabled:true 且带 targets", () => {
    writeFileSync(cfgPath, JSON.stringify({ enabled: true, targets: ["pi", "telegram"] }), "utf8");
    const cfg = readConfig(cfgPath);
    expect(cfg.enabled).toBe(true);
    expect(cfg.targets).toEqual(["pi", "telegram"]);
  });

  test("无效 JSON → 安全降级为默认关闭", () => {
    writeFileSync(cfgPath, "{broken json", "utf8");
    expect(readConfig(cfgPath).enabled).toBe(false);
  });

  test('enabled 非布尔（如字符串 "true"）→ 视为关闭', () => {
    writeFileSync(cfgPath, JSON.stringify({ enabled: "true" }), "utf8");
    expect(readConfig(cfgPath).enabled).toBe(false);
  });
});

describe("writeConfig / enableConfig / disableConfig", () => {
  test("enableConfig 写入 enabled:true + targets，可读回", () => {
    const cfg = enableConfig(["pi"], cfgPath);
    expect(cfg.enabled).toBe(true);
    expect(readConfig(cfgPath).targets).toEqual(["pi"]);
  });

  test("disableConfig 写入 enabled:false 且清空 targets", () => {
    enableConfig(["pi"], cfgPath);
    const cfg = disableConfig(cfgPath);
    expect(cfg.enabled).toBe(false);
    expect(readConfig(cfgPath).targets).toBeUndefined();
  });

  test("往返：enable → disable → enable（幂等可逆）", () => {
    enableConfig(undefined, cfgPath);
    expect(readConfig(cfgPath).enabled).toBe(true);
    disableConfig(cfgPath);
    expect(readConfig(cfgPath).enabled).toBe(false);
    enableConfig(undefined, cfgPath);
    expect(readConfig(cfgPath).enabled).toBe(true);
  });

  test("原子写：无 .tmp 残留", () => {
    writeConfig({ enabled: true }, cfgPath);
    expect(existsSync(`${cfgPath}.tmp`)).toBe(false);
    expect(readConfig(cfgPath).enabled).toBe(true);
  });

  test("父目录不存在 → 静默跳过不抛错", () => {
    expect(() => writeConfig({ enabled: true }, join(dir, "no-such-dir", "x.json"))).not.toThrow();
  });
});
