/**
 * lib/patch.ts — 双向补丁引擎测试
 *
 * 核心契约：patch（en→zh）/ restore（zh→en）幂等可逆、安全降级、targetFiles 限定。
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyFile, applyTargets, needsPatch, needsRestore, type PatchTarget } from "../lib/patch.ts";
import type { DictEntry } from "../lib/dict.ts";

function tmpFile(content: string): { filePath: string; read: () => string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "pi-zh-test-"));
  const filePath = join(dir, "target.ts");
  writeFileSync(filePath, content, "utf8");
  return {
    filePath,
    read: () => readFileSync(filePath, "utf8"),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const ENTRY: DictEntry = { en: "Hello world", zh: "你好世界" };

describe("applyFile", () => {
  test("patch: en→zh", () => {
    const t = tmpFile("greet() { return 'Hello world'; }\n");
    const n = applyFile(t.filePath, "x:target.ts", [ENTRY], "patch");
    expect(n).toBe(1);
    expect(t.read()).toContain("你好世界");
    expect(t.read()).not.toContain("Hello world");
    t.cleanup();
  });

  test("restore: zh→en 还原", () => {
    const t = tmpFile("greet() { return '你好世界'; }\n");
    const n = applyFile(t.filePath, "x:target.ts", [ENTRY], "restore");
    expect(n).toBe(1);
    expect(t.read()).toContain("Hello world");
    t.cleanup();
  });

  test("幂等: 重复 patch 第二次 applied=0（en 已不存在）", () => {
    const t = tmpFile("'Hello world'\n");
    const first = applyFile(t.filePath, "x:target.ts", [ENTRY], "patch");
    const second = applyFile(t.filePath, "x:target.ts", [ENTRY], "patch");
    expect(first).toBe(1);
    expect(second).toBe(0);
    expect(t.read()).toContain("你好世界");
    t.cleanup();
  });

  test("幂等: 重复 restore 第二次 applied=0", () => {
    const t = tmpFile("'你好世界'\n");
    expect(applyFile(t.filePath, "x:target.ts", [ENTRY], "restore")).toBe(1);
    expect(applyFile(t.filePath, "x:target.ts", [ENTRY], "restore")).toBe(0);
    t.cleanup();
  });

  test("文件不存在 → 0，不抛错", () => {
    expect(applyFile("/nonexistent/x.ts", "x", [ENTRY], "patch")).toBe(0);
  });

  test("未命中的条目不影响其他条目", () => {
    const entries: DictEntry[] = [
      { en: "AAA", zh: "甲" },
      { en: "BBB", zh: "乙" },
    ];
    const t = tmpFile("only 'AAA' here\n");
    expect(applyFile(t.filePath, "x", entries, "patch")).toBe(1);
    const c = t.read();
    expect(c).toContain("甲");
    expect(c).not.toContain("乙");
    t.cleanup();
  });

  test("targetFiles 限定: 不匹配的 alias 不生效", () => {
    const entry: DictEntry = { en: "Alone", zh: "孤独", targetFiles: ["lib/commands.ts"] };
    const t = tmpFile("Alone\n");
    // alias 是 "telegram:lib/status.ts" → endsWith 不匹配
    expect(applyFile(t.filePath, "telegram:lib/status.ts", [entry], "patch")).toBe(0);
    // alias 是 "telegram:lib/commands.ts" → 匹配
    expect(applyFile(t.filePath, "telegram:lib/commands.ts", [entry], "patch")).toBe(1);
    t.cleanup();
  });

  test("全量替换（同文件多处都替换）", () => {
    const t = tmpFile("'Hello world' and 'Hello world'\n");
    expect(applyFile(t.filePath, "x", [ENTRY], "patch")).toBe(1);
    expect(t.read()).not.toContain("Hello world");
    t.cleanup();
  });
});

describe("applyTargets", () => {
  test("聚合报告：只报告有变更的文件", () => {
    const a = tmpFile("Hello world\n");
    const b = tmpFile("without match\n");
    const targets: PatchTarget[] = [
      { filePath: a.filePath, label: "a" },
      { filePath: b.filePath, label: "b" },
      { filePath: "/nonexistent.ts", label: "x" },
    ];
    const out = applyTargets(targets, [ENTRY], "patch");
    expect(out.changed).toBe(true);
    expect(out.reports).toHaveLength(1);
    expect(out.reports[0]!.label).toBe("a");
    a.cleanup();
    b.cleanup();
  });
});

describe("needsPatch / needsRestore", () => {
  const target = (p: string): PatchTarget => ({ filePath: p, label: "t" });

  test("needsPatch: 存在英文且无中文 → true", () => {
    const t = tmpFile("Hello world\n");
    expect(needsPatch([target(t.filePath)], [ENTRY])).toBe(true);
    t.cleanup();
  });

  test("needsPatch: 已汉化 → false", () => {
    const t = tmpFile("你好世界\n");
    expect(needsPatch([target(t.filePath)], [ENTRY])).toBe(false);
    t.cleanup();
  });

  test("needsRestore: 存在中文且无英文 → true", () => {
    const t = tmpFile("你好世界\n");
    expect(needsRestore([target(t.filePath)], [ENTRY])).toBe(true);
    t.cleanup();
  });

  test("needsRestore: 英文原文 → false", () => {
    const t = tmpFile("Hello world\n");
    expect(needsRestore([target(t.filePath)], [ENTRY])).toBe(false);
    t.cleanup();
  });
});
