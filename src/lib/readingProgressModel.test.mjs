import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { kstDate } from "./historyRecords.ts";
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("./readingProgressModel.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText, { exports, require: () => ({ kstDate }) });
const { addUniqueArticleRead, countDailyReads, isAttendanceComplete, localDateKey } = exports;

test("re-reading the same article does not increase the daily count", () => {
  const first = addUniqueArticleRead({}, "2026-09-25", 11);
  const repeated = addUniqueArticleRead(first, "2026-09-25", 11);
  assert.equal(countDailyReads(repeated, "2026-09-25"), 1);
  assert.equal(isAttendanceComplete(repeated, "2026-09-25"), false);
});

test("three distinct articles complete attendance for that date only", () => {
  let log = {};
  for (const id of [11, 12, 13]) log = addUniqueArticleRead(log, "2026-09-25", id);
  assert.equal(isAttendanceComplete(log, "2026-09-25"), true);
  assert.equal(isAttendanceComplete(log, "2026-09-24"), false);
});

test("reading date keys match attendance KST regardless of device timezone", () => {
  assert.equal(localDateKey(new Date("2026-09-25T15:01:00Z")), "2026-09-26");
  assert.equal(localDateKey(new Date("2026-09-25T14:59:00Z")), "2026-09-25");
});
