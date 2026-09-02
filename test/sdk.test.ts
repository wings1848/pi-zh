/**
 * lib/sdk.ts — SDK 安装检测与管理测试
 *
 * 契约：
 * - isI18nSdkInstalled 检测 package.json 存在（路径可注入）；
 * - detectPackageManager 目录特征优先（.pnpm > package-lock > bun.lock），
 *   其次 pi settings npmCommand，最后 PATH 探测；
 * - ensureI18nSdk 同步毫秒级返回 installed/installing/missing，
 *   绝不在测试中真实执行安装（安装路径可注入 + 不存在的目录快速失败）。
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  detectPackageManager,
  ensureI18nSdk,
  isI18nSdkInstalled,
  type PackageManager,
} from "../lib/sdk.ts";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "pi-zh-sdk-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("isI18nSdkInstalled", () => {
  test("SDK 存在 → true", () => {
    const sdkDir = join(dir, "node_modules", "@juicesharp", "rpiv-i18n");
    mkdirSync(sdkDir, { recursive: true });
    writeFileSync(join(sdkDir, "package.json"), "{}");
    expect(isI18nSdkInstalled(dir)).toBe(true);
  });

  test("SDK 不存在 → false", () => {
    expect(isI18nSdkInstalled(dir)).toBe(false);
  });
});

describe("detectPackageManager（目录特征优先）", () => {
  test(".pnpm 目录 → pnpm（即使同时有 package-lock）", () => {
    mkdirSync(join(dir, "node_modules", ".pnpm"), { recursive: true });
    writeFileSync(join(dir, "package-lock.json"), "{}");
    expect(detectPackageManager(dir)).toBe("pnpm");
  });

  test("pnpm-lock.yaml → pnpm", () => {
    writeFileSync(join(dir, "pnpm-lock.yaml"), "");
    expect(detectPackageManager(dir)).toBe("pnpm");
  });

  test("package-lock.json → npm", () => {
    writeFileSync(join(dir, "package-lock.json"), "{}");
    expect(detectPackageManager(dir)).toBe("npm");
  });

  test("bun.lock → bun", () => {
    writeFileSync(join(dir, "bun.lock"), "");
    expect(detectPackageManager(dir)).toBe("bun");
  });
});

describe("ensureI18nSdk（同步非阻塞）", () => {
  test("已安装 → installed（不触发任何安装）", () => {
    const sdkDir = join(dir, "node_modules", "@juicesharp", "rpiv-i18n");
    mkdirSync(sdkDir, { recursive: true });
    writeFileSync(join(sdkDir, "package.json"), "{}");
    expect(ensureI18nSdk(dir)).toBe("installed");
  });

  test("目录不存在 → missing（快速失败，不触发安装）", () => {
    const missing = join(dir, "no-such-dir");
    expect(ensureI18nSdk(missing)).toBe("missing");
  });

  test("目录存在但 SDK 未装 → installing（触发后台安装）", () => {
    mkdirSync(dir, { recursive: true });
    expect(ensureI18nSdk(dir)).toBe("installing");
  });
});
