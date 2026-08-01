import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, resolveDaysOfWeek, unwrapCollection } from '../scripts/canonical-seed-utils.mjs';

// Regression test for a real bug: canonical-seed-utils.mjs was written
// against an assumed data shape (train.name, train.off_days) that didn't
// match trains_fixed.json's actual shape (train.name_en/name_bn,
// train.days_of_week). That mismatch didn't throw — it silently produced
// NULL names and "runs every day" for every single train, which then
// failed the trains INSERT outright (NOT NULL violation) and took the
// entire train_stops insert down with it via the FK constraint.
//
// This test runs against the real data file, not a hand-crafted fixture,
// specifically so a future rename/reshape of trains_fixed.json fails CI
// instead of silently producing wrong or empty seed data again.

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainsPayload = readJson(path.join(rootDir, 'data', 'trains_fixed.json'));
const trains = unwrapCollection(trainsPayload, 'trains');

test('every train in trains_fixed.json has a non-empty name_en and name_bn', () => {
  for (const train of trains) {
    assert.ok(train.name_en, `train ${train.number} is missing name_en`);
    assert.ok(train.name_bn, `train ${train.number} is missing name_bn`);
  }
});

test('every train in trains_fixed.json resolves to a real days_of_week, not a silent default', () => {
  for (const train of trains) {
    const days = resolveDaysOfWeek(train);
    assert.ok(Array.isArray(days) && days.length >= 1 && days.length <= 7);
  }
});

test('not every train actually runs all seven days (sanity check against silent "all days" defaulting)', () => {
  const runsEveryDay = trains.filter((t) => resolveDaysOfWeek(t).length === 7).length;
  // If this ever equals trains.length again, resolveDaysOfWeek has
  // regressed back to defaulting everything to "runs every day" instead
  // of reading the real per-train schedule.
  assert.notEqual(runsEveryDay, trains.length, 'every train resolved to running 7 days a week — this is the exact bug being regression-tested, not a real schedule');
});

test('resolveDaysOfWeek throws rather than defaulting when a train has neither field', () => {
  assert.throws(() => resolveDaysOfWeek({ number: 'TEST', name_en: 'Test Express' }));
});
