import test from 'node:test';
import assert from 'node:assert/strict';
import { runAllTestCases } from './testCases';

test('Security Analyzer Suite - 20 Verification Tests (Część 19)', async (t) => {
  const results = runAllTestCases();

  assert.equal(results.length, 20, 'Suite must execute exactly 20 tests');

  for (const res of results) {
    await t.test(res.title, () => {
      assert.equal(
        res.status,
        'PASS',
        `Test ${res.id} failed: Expected ${res.expectedCategoryOrOutcome}, got ${res.actualResult}. Details: ${res.errorDetails || 'none'}`
      );
    });
  }
});
