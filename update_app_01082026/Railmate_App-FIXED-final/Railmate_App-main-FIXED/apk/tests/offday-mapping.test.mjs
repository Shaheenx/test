import test from 'node:test';
import assert from 'node:assert/strict';
import { invertOffDays } from '../scripts/canonical-seed-utils.mjs';

test('maps Sonar Bangla 787 Tuesday off-day to inclusive service days', () => {
  assert.deepEqual(invertOffDays(['tuesday']), [0, 1, 3, 4, 5, 6]);
});

test('maps Sonar Bangla 788 Wednesday off-day to inclusive service days', () => {
  assert.deepEqual(invertOffDays(['wednesday']), [0, 1, 2, 4, 5, 6]);
});

test('maps a daily train with no off-days to all seven service days', () => {
  assert.deepEqual(invertOffDays([]), [0, 1, 2, 3, 4, 5, 6]);
});
