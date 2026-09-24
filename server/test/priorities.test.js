const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const { validDate, todayInZone, priorityInput, publicDay } = require('../src/services/priorities');
const Day = require('../src/models/DailyPriorityDay');

test('priority dates are real calendar dates including leap years', () => {
  for (const value of ['2024-02-29', '2026-09-23', '0001-01-01', '0099-12-31']) assert.equal(validDate(value), true, value);
  for (const value of ['2025-02-29', '2026-04-31', '2026-13-01', '2026-1-02', '0000-01-01', '', null, 20260101]) assert.equal(validDate(value), false, String(value));
});
test('declared timezone handles midnight and daylight saving without shifting stored dates', () => {
  const midnight = new Date('2026-09-23T01:00:00Z');
  assert.equal(todayInZone('America/Los_Angeles', midnight), '2026-09-22');
  assert.equal(todayInZone('Asia/Tokyo', midnight), '2026-09-23');
  for (const instant of ['2026-03-08T09:59:59Z', '2026-03-08T10:00:00Z']) {
    assert.equal(todayInZone('America/Los_Angeles', new Date(instant)), '2026-03-08');
  }
  for (const zone of ['', undefined, 'Invalid/Zone', '+01:00']) assert.equal(todayInZone(zone), null);
});
test('strict priority bodies reject injected ownership and invalid types before casting', () => {
  assert.deepEqual(priorityInput({ title: '  Focus  ' }), { title: 'Focus' });
  assert.deepEqual(priorityInput({ completed: false }, true), { completed: false });
  assert.deepEqual(priorityInput({ title: 'Same', completed: true }, true), { title: 'Same', completed: true });
  for (const body of [null, [], {}, { title: 12 }, { title: ' ' }, { title: 'a'.repeat(121) },
    { title: '\nFocus' }, { title: 'Focus\r' }, { title: 'A\u2028B' }, { title: 'A\u2029B' },
    { title: 'A', userId: 'B' }, { title: 'A', date: '2026-01-01' }, { title: 'A', completed: false }]) {
    assert.equal(priorityInput(body), null, JSON.stringify(body));
  }
  for (const body of [{ completed: 'false' }, { completed: 0 }, { completed: null }, { id: '123' }, {}]) {
    assert.equal(priorityInput(body, true), null, JSON.stringify(body));
  }
  assert.ok(priorityInput({ title: 'a'.repeat(120) }));
  assert.equal(priorityInput({ title: '😀'.repeat(61) }), null);
});
test('day responses count actual rows, preserve insertion order, and reveal no ownership', () => {
  assert.deepEqual(publicDay('2026-01-01', null), { date: '2026-01-01', priorities: [], progress: { completed: 0, total: 0, limit: 3 } });
  const result = publicDay('2026-01-01', { userId: 'private', priorities: [
    { _id: 'a', title: 'A', completed: false }, { _id: 'b', title: 'B', completed: true }
  ] });
  assert.deepEqual(result.progress, { completed: 1, total: 2, limit: 3 });
  assert.deepEqual(result.priorities.map((item) => item.id), ['a', 'b']);
  assert.equal('userId' in result, false);
});
test('persisted day schema rejects excess items, duplicate IDs, impossible dates and invalid titles', async () => {
  const base = { userId: new mongoose.Types.ObjectId(), date: '2026-01-01' };
  await new Day(base).validate();
  const id = new mongoose.Types.ObjectId();
  for (const fields of [
    { date: '2026-02-30' }, { priorities: Array.from({ length: 4 }, () => ({ title: 'Focus' })) },
    { priorities: [{ _id: id, title: 'A' }, { _id: id, title: 'B' }] },
    { priorities: [{ title: 'A\nB' }] }, { priorities: [{ title: ' A ' }] }
  ]) await assert.rejects(new Day({ ...base, ...fields }).validate());
  assert.ok(Day.schema.indexes().some(([keys, options]) => keys.userId === 1 && keys.date === 1 && options.unique));
});
test('browser calendar navigation uses local days across DST and year boundaries', async () => {
  const { localDate, moveCalendarDate } = await import('../../web/src/priorities-calendar.js');
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(localDate(new Date('2026-09-23T01:00:00Z')), '2026-09-22');
    assert.equal(moveCalendarDate('2026-03-08', 1), '2026-03-09');
    assert.equal(moveCalendarDate('2026-11-01', -1), '2026-10-31');
    assert.equal(moveCalendarDate('2024-03-01', -1), '2024-02-29');
    assert.equal(moveCalendarDate('2026-12-31', 1), '2027-01-01');
    assert.equal(moveCalendarDate('0099-12-31', 1), '0100-01-01');
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});
