import test from 'node:test';
import assert from 'node:assert/strict';
import { kstDate, recentRange, previousRange, attendanceWeek, groupRecords, judgementResult, judgementSummary } from './historyRecords.ts';

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
  const rows=[{judgedAt:'2026-09-02T03:00:00Z',choice:'UP',comparisonDate:'2026-09-03',actualDirection:'DOWN',actualChangePercent:-2},
    {judgedAt:'2026-10-05T10:00:00Z',choice:'UP',comparisonDate:'2026-10-06',actualDirection:'UP',actualChangePercent:1},
    {judgedAt:'2026-10-06T03:00:00Z',choice:'UP',actualDirection:null,actualChangePercent:null},
    {judgedAt:'2026-10-06T04:00:00Z',choice:'UP',actualDirection:'UNKNOWN',actualChangePercent:null}];
  assert.deepEqual(groupRecords(rows,r=>r.judgedAt,'2026-10-06',null).map(g=>g.label),['오늘','어제','지난 기록']);
  assert.equal(groupRecords(rows,r=>r.judgedAt,'2026-10-06','2026-10-05')[0].items.length,1);
  assert.deepEqual(judgementSummary(rows),{total:4,hits:1,pending:1,unavailable:1,legacy:0});
  assert.deepEqual(groupRecords([],r=>r.createdAt,'2026-10-06',null),[]);
});

test('direction and change remain separate for rise, fall, neutral, unknown and pending', () => {
  for (const [direction, percent, label, correct] of [
    ['UP', 1.2, '실제 상승 +1.20%', true],
    ['DOWN', -1.2, '실제 하락 -1.20%', false],
    ['NEUTRAL', 0, '실제 중립 0.00%', false],
    ['UNKNOWN', 0, '비교 불가', null],
    [null, 1.2, '결과 대기', null]
  ]) {
    const result = judgementResult({choice:'UP', actualDirection:direction, actualChangePercent:percent,comparisonDate:'2026-10-07'});
    assert.equal(result.label, label);
    assert.equal(result.correct, correct);
  }
});

test('legacy unknown feedback cannot claim a mismatch or expose enum codes',()=>{
  const result=judgementResult({choice:'UP',actualDirection:'UNKNOWN',actualChangePercent:null,feedbackText:'UP 예측은 UNKNOWN과 달랐습니다'});
  assert.equal(result.correct,null);
  assert.equal(result.feedbackText,'관련 종목이 없어 결과를 비교하지 않았어요');
  assert.equal(judgementResult({choice:'UP',actualDirection:'DOWN',actualChangePercent:-1,comparisonDate:'2026-10-07',feedbackText:'UP과 DOWN'}).feedbackText,'상승과 하락');
});

test('old confirmed outcomes without comparison date never count as hits', () => {
  const legacy = { choice: 'UP', actualDirection: 'UP', actualChangePercent: 1, comparisonDate: null };
  const current = { ...legacy, comparisonDate: '2026-10-07' };
  assert.equal(judgementResult(legacy).legacy, true);
  assert.equal(judgementResult(legacy).correct, null);
  assert.deepEqual(judgementSummary([legacy, current]), { total: 2, hits: 1, pending: 0, unavailable: 0, legacy: 1 });
});

test('mismatched targets exclude old success and praise from history summaries',()=>{
 const row={choice:'UP',actualDirection:'UP',actualChangePercent:2,comparisonDate:'2026-10-07',gradingIssue:'TARGET_MISMATCH',feedbackText:'잘 연결한 정확한 판단'};
 const result=judgementResult(row);assert.equal(result.correct,null);assert.equal(result.label,'채점 대상 확인 필요');assert(!result.feedbackText.includes('정확한 판단'));assert.equal(judgementSummary([row]).hits,0);
});
