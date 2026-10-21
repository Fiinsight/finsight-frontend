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

 test("resume learning uses recent unique readings and excludes completed quizzes", () => {
  assert.deepEqual(Array.from(exports.resumeLearningIds({"2026-10-05":[1,2],"2026-10-06":[2,3,4]},[3])),[4,2]);
  assert.deepEqual(Array.from(exports.resumeLearningIds({},[])),[]);
 });

test("server quiz completions prevent a false never-read state on another device", () => {
  assert.equal(exports.resumeLearningEmptyMessage({}, [42]), "최근 읽은 기사의 퀴즈를 모두 마쳤어요.");
  assert.equal(countDailyReads({}, "2026-10-21"), 0);
  assert.equal(exports.resumeLearningEmptyMessage({"2026-10-21": []}, []), "아직 읽은 기사가 없어요. 오늘의 뉴스부터 시작해보세요.");
  assert.equal(exports.resumeLearningEmptyMessage({"2026-10-20": [42]}, [42]), "최근 읽은 기사의 퀴즈를 모두 마쳤어요.");
});
