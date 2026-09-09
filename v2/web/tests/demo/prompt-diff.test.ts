import assert from 'node:assert/strict'
import { promptDiff } from '../../src/demo/prompt-diff.ts'

Deno.test('diff preserves both exact prompts, including whitespace and Unicode', () => {
  for (
    const [before, after] of [
      ['', ''],
      ['', '新增'],
      ['删去', ''],
      ['相同\n正文', '相同\n正文'],
      ['先谈利益，再提条件。', '先谈风险，再提条件。'],
      ['  a\nb\n', ' a\n b\n'],
      ['🧑🏽‍💻说：é', '🧑🏽‍💻说：é'],
      ['aaaaabaaaa', 'aaaacaaaaa'],
      [
        '开始' + '甲'.repeat(2000) + '结束',
        '开始' + '乙'.repeat(2000) + '结束',
      ],
    ]
  ) {
    const changes = promptDiff(before, after)
    assert.equal(
      changes.filter((part) => part.kind !== 'added').map((part) => part.text)
        .join(''),
      before,
    )
    assert.equal(
      changes.filter((part) => part.kind !== 'removed').map((part) => part.text)
        .join(''),
      after,
    )
    if (before === after) {
      assert.ok(changes.every((part) => part.kind === 'same'))
    }
  }
})

Deno.test('diff highlights only the changed Chinese phrase', () => {
  assert.deepEqual(promptDiff('先谈利益，再提条件。', '先谈风险，再提条件。'), [
    { kind: 'same', text: '先谈' },
    { kind: 'removed', text: '利益' },
    { kind: 'added', text: '风险' },
    { kind: 'same', text: '，再提条件。' },
  ])
})
