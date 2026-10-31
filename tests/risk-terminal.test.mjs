import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('integrates the risk terminal into both static entry points', async () => {
  const [rootPage, publicPage] = await Promise.all([
    readFile(path.join(root, 'index.html'), 'utf8'),
    readFile(path.join(root, 'public', 'koundinya-capital.html'), 'utf8')
  ]);

  for (const page of [rootPage, publicPage]) {
    assert.match(page, /href="#risk-terminal">Risk Terminal<\/a>/);
    assert.match(page, /<section id="risk-terminal" aria-labelledby="risk-title"><\/section>/);
    assert.match(page, /risk-terminal\.css/);
    assert.match(page, /risk-terminal\.js/);
  }
});

test('keeps the terminal local-only and includes key safeguards', async () => {
  const script = await readFile(path.join(root, 'public', 'risk-terminal.js'), 'utf8');

  assert.match(script, /localStorage\.setItem/);
  assert.match(script, /amountInWords/);
  assert.match(script, /Start typing to see the amount in words/);
  assert.match(script, /aria-describedby="rt-capital-guide rt-capital-error"/);
  assert.match(script, /id="rt-add-position"/);
  assert.match(script, /data-position-scenario="-1"/);
  assert.match(script, /estimatePositionImpact/);
  assert.match(script, /data-position-field="strike"/);
  assert.match(script, /Analyse portfolio/);
  assert.match(script, /Scenario Lab/);
  assert.match(script, /Hedge guidance/);
  assert.match(script, /educational, deterministic scenario tool/);
  assert.match(script, /aria-invalid/);
  assert.doesNotMatch(script, /\bfetch\s*\(/);
  assert.doesNotMatch(script, /WebSocket|EventSource|XMLHttpRequest/);
});
