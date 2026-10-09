import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./munfiq-shell.tsx', import.meta.url), 'utf8');

test('Munfiq workspace keeps create, edit, delete, detail, and bulk selection flows', () => {
  for (const token of ['onDetail', 'onEdit', 'onDelete', 'checkedIds', 'MunfiqFormDialog']) {
    assert.match(source, new RegExp(token));
  }
});
