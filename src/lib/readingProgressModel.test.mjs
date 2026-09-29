import assert from "node:assert/strict";
import test from "node:test";
import { addUniqueArticleRead, countDailyReads, isAttendanceComplete, localDateKey } from "./readingProgressModel.ts";

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

test("date keys use the device's local calendar day", () => {
  const date = new Date(2026, 8, 25, 23, 50);
  assert.equal(localDateKey(date), "2026-09-25");
});
