import test from 'node:test';
import assert from 'node:assert/strict';
import { kstDate, recentRange, previousRange, attendanceWeek, groupRecords, judgementSummary } from './historyRecords.ts';

test('KST dates, year boundaries and seven-day windows skip empty weeks directly', () => {
  assert.equal(kstDate('2026-10-05T15:00:00Z'), '2026-10-06');
  assert.deepEqual(recentRange('2026-01-03'), {from:'2025-12-28', to:'2026-01-04'});
  assert.deepEqual(previousRange('2026-09-03', '2026-09-30'), {from:'2026-08-28', to:'2026-09-04'});
  for (const bad of ['', '2026-09-30', '2026-10-01', '2026-02-30', '2026-9-03']) assert.equal(previousRange(bad,'2026-09-30'), undefined);
});
test('attendance filter uses real Monday dates and disables future weekdays', () => {
  const week=attendanceWeek('2026-10-06');
  assert.equal(week[0].key,'2026-10-05');
  assert.equal(week[1].isToday,true);
  assert.equal(week[1].future,false);
  assert.equal(week[2].future,true);
  assert.equal(week[6].key,'2026-10-11');
});
test('groups are newest first, day filter applies and pending never counts as a hit', () => {
  const rows=[{judgedAt:'2026-09-02T03:00:00Z',correct:false,actualResult:'-2%'},
    {judgedAt:'2026-10-05T10:00:00Z',correct:true,actualResult:'1%'},
    {judgedAt:'2026-10-06T03:00:00Z',correct:true,actualResult:''},
    {judgedAt:'2026-10-06T04:00:00Z',correct:null,actualResult:'UNKNOWN'}];
  assert.deepEqual(groupRecords(rows,r=>r.judgedAt,'2026-10-06',null).map(g=>g.label),['오늘','어제','지난 기록']);
  assert.equal(groupRecords(rows,r=>r.judgedAt,'2026-10-06','2026-10-05')[0].items.length,1);
  assert.deepEqual(judgementSummary(rows),{total:4,hits:1,pending:1,unavailable:1});
  assert.deepEqual(groupRecords([],r=>r.createdAt,'2026-10-06',null),[]);
});
