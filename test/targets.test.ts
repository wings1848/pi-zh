/**
 * lib/targets.ts — 目标探测测试
 *
 * 契约：resolveFirstRoot 取第一个含 marker 的根；TARGETS 定义完整；
 * getTargetByName 精确匹配。
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getTargetByName, resolveFirstRoot, TARGETS } from "../lib/targets.ts";

describe("resolveFirstRoot（纯函数，临时目录注入）", () => {
  test("命中第一个含 marker 的候选", () => {
    const a = mkdtempSync(join(tmpdir(), "pi-zh-root-"));
    const b = mkdtempSync(join(tmpdir(), "pi-zh-root-"));
    writeFileSync(join(a, "package.json"), "{}");
    writeFileSync(join(b, "package.json"), "{}");
    expect(resolveFirstRoot([a, b], "package.json")).toBe(a);
    expect(resolveFirstRoot([b, a], "package.json")).toBe(b);
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  });

  test("全部不含 marker → null", () => {
    const empty = mkdtempSync(join(tmpdir(), "pi-zh-root-"));
    expect(resolveFirstRoot([empty], "package.json")).toBeNull();
    rmSync(empty, { recursive: true, force: true });
  });

  test("空候选列表 → null", () => {
    expect(resolveFirstRoot([], "package.json")).toBeNull();
  });
});

describe("TARGETS 定义", () => {
  test("每个 target 定义完整（name/label/packageRoots/marker/probeFiles）", () => {
    expect(TARGETS.length).toBeGreaterThan(0);
    for (const t of TARGETS) {
      expect(t.name).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.packageRoots.length).toBeGreaterThan(0);
      expect(t.marker).toBeTruthy();
      expect(t.probeFiles.length).toBeGreaterThan(0);
    }
  });

  test("target 名称唯一", () => {
    const names = TARGETS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("getTargetByName", () => {
  test("已知名称命中", () => {
    const t = getTargetByName("pi");
    expect(t).not.toBeNull();
    expect(t!.name).toBe("pi");
  });

  test("未知名称 → null", () => {
    expect(getTargetByName("no-such-target")).toBeNull();
  });
});
