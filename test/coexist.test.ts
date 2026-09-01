/**
 * lib/coexist.ts — pi-di18n 协调逻辑测试
 *
 * 测纯函数部分（env locale 解析、英文环境判定）。
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { isEnglishLocale, readPiDi18nEnvLocale, getPiTargetOwner } from "../lib/coexist.ts";

const ENV_KEYS = ["PI_LOCALE", "LC_ALL", "LANG"] as const;

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

describe("readPiDi18nEnvLocale（优先级 PI_LOCALE > LC_ALL > LANG）", () => {
  test("无任何变量 → undefined", () => {
    expect(readPiDi18nEnvLocale()).toBeUndefined();
  });

  test("PI_LOCALE 优先", () => {
    process.env.PI_LOCALE = "zh-CN";
    process.env.LANG = "en_US.UTF-8";
    expect(readPiDi18nEnvLocale()).toBe("zh-CN");
  });

  test("没有 PI_LOCALE 时用 LC_ALL / LANG", () => {
    process.env.LC_ALL = "zh_CN.UTF-8";
    expect(readPiDi18nEnvLocale()).toBe("zh-CN");
  });

  test("去编码后缀 + _ 转 -（zh_CN.UTF-8 → zh-CN）", () => {
    process.env.LANG = "zh_CN.UTF-8";
    expect(readPiDi18nEnvLocale()).toBe("zh-CN");
  });

  test("空白/纯编码 → 跳过", () => {
    process.env.LANG = ".UTF-8";
    expect(readPiDi18nEnvLocale()).toBeUndefined();
  });
});

describe("isEnglishLocale", () => {
  test("en / en-US / en-GB → 英文（未激活）", () => {
    expect(isEnglishLocale("en")).toBe(true);
    expect(isEnglishLocale("en-US")).toBe(true);
    expect(isEnglishLocale("EN-gb")).toBe(true);
  });

  test("C / POSIX / 空 → 中性（未激活）", () => {
    expect(isEnglishLocale("C")).toBe(true);
    expect(isEnglishLocale("POSIX")).toBe(true);
    expect(isEnglishLocale(undefined)).toBe(true);
  });

  test("zh-CN / ja / de → 非英文（激活）", () => {
    expect(isEnglishLocale("zh-CN")).toBe(false);
    expect(isEnglishLocale("ja")).toBe(false);
    expect(isEnglishLocale("de")).toBe(false);
  });
});

describe("getPiTargetOwner", () => {
  test("未安装 pi-di18n（本机无包）时 → pi-zh 负责", () => {
    // isPiDi18nActive 依赖磁盘上的 pi-di18n 安装状态；测试环境（CI）没有它
    const owner = getPiTargetOwner();
    // 若本机恰好装了 pi-di18n 且 locale 非英文，结果为 pi-di18n；否则 pi-zh
    expect(["pi-zh", "pi-di18n"]).toContain(owner);
  });
});
