/**
 * lib/dict.ts — 词典完整性测试（防低级事故）
 *
 * 契约：每条翻译 en/zh 非空、互不相同；targetFiles 规范性；分组可展开。
 */
import { describe, expect, test } from "bun:test";
import { ALL_ENTRIES, TARGET_DICTS } from "../lib/dict.ts";

const TARGET_NAMES = Object.keys(TARGET_DICTS);

describe("TARGET_DICTS 结构", () => {
  test("至少有一个 target", () => {
    expect(TARGET_NAMES.length).toBeGreaterThan(0);
  });

  test("每条目 en/zh 非空", () => {
    for (const entry of ALL_ENTRIES) {
      expect(entry.en.trim()).not.toBe("");
      expect(entry.zh.trim()).not.toBe("");
    }
  });

  test("每条目 en ≠ zh（防抄错/占位符）", () => {
    for (const entry of ALL_ENTRIES) {
      expect(entry.en).not.toBe(entry.zh);
    }
  });

  test("targetFiles 存在时非空数组且不含重复", () => {
    for (const entry of ALL_ENTRIES) {
      if (entry.targetFiles) {
        expect(Array.isArray(entry.targetFiles)).toBe(true);
        expect(entry.targetFiles.length).toBeGreaterThan(0);
        expect(new Set(entry.targetFiles).size).toBe(entry.targetFiles.length);
      }
    }
  });

  test("组内条目不重复（同 target 相同 en 只出现一次——避免歧义）", () => {
    for (const [name, entries] of Object.entries(TARGET_DICTS)) {
      const enSet = new Set(entries.map((e) => e.en));
      expect(enSet.size).toBe(entries.length);
    }
  });

  test("ALL_ENTRIES 与 TARGET_DICTS 展开一致", () => {
    const flat = Object.values(TARGET_DICTS).flat();
    expect(ALL_ENTRIES.length).toBe(flat.length);
  });
});
