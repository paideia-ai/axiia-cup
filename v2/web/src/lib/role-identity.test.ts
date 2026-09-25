import { describe, expect, it } from 'vitest'
import { roleIdentity } from './role-identity'
import { outcomeCopy, scenarioRoles } from './outcome'
import { ledgerFromScore, parseLedger } from './scoring-reasoning'
import {
  sideName,
  speakerLabels,
  speakerName,
  speakerSide,
} from '../components/timeline/labels'
import { roleByKey, roleOfOptions, scenarioModule } from '../scenarios'
import type { ScenarioSummary, TurnDTO } from '../api/types'
import reference from '../testing/reference-match-120.json'

const scenarioID = 'honnoji-decision'
const module = scenarioModule(scenarioID)!
const lanes = reference.speakerLabels

describe('participant role identity is separate from scenario faction', () => {
  for (const a of ['chosokabe', 'yoshiaki']) {
    for (const b of ['hosokawa', 'ashigaru']) {
      it(`resolves ${a} / ${b} across headings, events and ledger`, () => {
        const speakers = ['judge', a, b, a, b]
        const labels = speakerLabels(scenarioID, lanes, speakers)
        for (const [side, key] of [['a', a], ['b', b]] as const) {
          const expected = roleByKey(module, key)!.name
          expect(sideName(labels, side)).toBe(expected)
          expect(speakerName(labels, side)).toBe(expected)
          expect(speakerName(labels, key)).toBe(expected)
          expect(
            roleIdentity({
              scenarioID,
              side,
              options: JSON.stringify({ role: key }),
            }).name,
          ).toBe(expected)
        }
        const turns: TurnDTO[] = speakers.map((speaker, seq) => ({
          seq,
          channel: 'council',
          kind: 'dialogue',
          speaker,
          finalText: '进言',
        }))
        turns.push({
          seq: 6,
          channel: 'verdict',
          kind: 'event',
          speaker: 'event',
          finalText: '',
          event: {
            type: 'score',
            ledger: [{ side: 'a', delta: 1, why: '大政方针' }, {
              side: 'b',
              delta: -0.5,
              why: '假请求',
            }],
          },
        })
        const ledger = ledgerFromScore(turns, { slotID: scenarioID, lanes })!
        expect(ledger.items.map((row) => row.name)).toEqual([
          roleByKey(module, a)!.name,
          roleByKey(module, b)!.name,
        ])
        expect(ledger.subtotals).toEqual({ a: 1, b: -0.5 })
      })
    }
  }
  it('supports canonical script aliases everywhere', () => {
    for (
      const [alias, key, side] of [['yoshiaki_envoy', 'yoshiaki', 'a'], [
        'hosokawa_fujitaka',
        'hosokawa',
        'b',
      ], ['akechi_ashigaru', 'ashigaru', 'b']] as const
    ) {
      const labels = speakerLabels(scenarioID, lanes, [alias])
      expect(speakerSide(labels, alias)).toBe(side)
      expect(sideName(labels, side)).toBe(roleByKey(module, key)!.name)
      expect(roleOfOptions(module, { role: alias })?.key).toBe(key)
    }
  })
  it('does not infer a cast from a registry, the opposing side, or contradictory speakers', () => {
    for (
      const speakers of [[], ['judge', 'hosokawa'], ['yoshiaki', 'chosokabe']]
    ) {
      const identity = roleIdentity({ scenarioID, side: 'a', lanes, speakers })
      expect(identity.resolved).toBe(false)
      expect(identity.name).not.toMatch(/杀信长|足利|长宗/)
    }
    expect(
      roleIdentity({ scenarioID, side: 'a', options: '{"role":"hosokawa"}' })
        .resolved,
    ).toBe(false)
    expect(
      roleIdentity({ scenarioID, side: 'a', options: 'bad-json' }).resolved,
    ).toBe(false)
  })
  it('accepts a concrete match label before speech and preserves ordinary scenarios', () => {
    expect(
      roleIdentity({ scenarioID, side: 'a', lanes: { a: '足利义昭的使者' } })
        .name,
    ).toBe('足利义昭的使者')
    expect(
      speakerName(
        speakerLabels('shangyang-court', { a: '商鞅', b: '甘龙' }),
        'a',
      ),
    ).toBe('商鞅')
    expect(speakerName(speakerLabels(null, {}), 'a')).toBe('甲方')
  })
  it('keeps known concrete names in legacy prose and resolves faction-named rows from the actual match', () => {
    expect(
      parseLedger('足利义昭的使者 +1：大政方针', { slotID: scenarioID, lanes })
        .items[0].name,
    ).toBe('足利义昭的使者')
    expect(
      parseLedger('主张杀信长 +1：大政方针', {
        slotID: scenarioID,
        lanes,
        speakers: ['yoshiaki'],
      }).items[0].name,
    ).toBe('足利义昭的使者')
  })
  it('never uses faction names as historical or sibling match role names', () => {
    const roles = scenarioRoles([
      {
        id: scenarioID,
        sideAName: '主张杀信长',
        sideBName: '主张不杀信长',
      } as ScenarioSummary,
    ])[scenarioID]
    const copy = outcomeCopy({ scenarioID, winner: 'b' }, roles)
    expect(copy).toContain('角色待确认')
    expect(copy).not.toMatch(/杀信长|细川|足轻/)
  })
})

describe('server role identity snapshots', () => {
  const participants = {
    a: {
      isMine: true,
      role: { key: 'yoshiaki', name: '历史使者名', side: 'a' as const },
    },
    b: {
      isMine: false,
      role: { key: 'ashigaru', name: '历史足轻名', side: 'b' as const },
    },
  }
  it('uses each match snapshot without a transcript or the current catalog name', () => {
    const labels = speakerLabels(scenarioID, lanes, [], participants)
    expect(sideName(labels, 'a')).toBe('历史使者名')
    expect(speakerName(labels, 'yoshiaki_envoy')).toBe('历史使者名')
    expect(outcomeCopy({ scenarioID, winner: 'b', participants })).toBe(
      '对方（历史足轻名）胜',
    )
    expect(
      parseLedger('主张杀信长 +1：大政方针', {
        slotID: scenarioID,
        lanes,
        participants,
      }).items[0]?.name,
    ).toBe('历史使者名')
    expect(
      roleIdentity({
        scenarioID,
        side: 'a',
        role: participants.a.role,
        options: '{"role":"chosokabe"}',
      }).name,
    ).toBe('历史使者名')
  })
  it('rejects wrong-side snapshots and resolves each challenge leg independently', () => {
    expect(
      roleIdentity({ scenarioID, side: 'b', role: participants.a.role })
        .resolved,
    ).toBe(false)
    const other = {
      ...participants,
      a: {
        isMine: false,
        role: {
          key: 'chosokabe',
          name: '长宗我部元亲的密使',
          side: 'a' as const,
        },
      },
    }
    expect(outcomeCopy({ scenarioID, winner: 'a', participants: other })).toBe(
      '胜方 长宗我部元亲的密使',
    )
  })
})

it('accepts future server roles without a new frontend registry entry', () => {
  const labels = speakerLabels(scenarioID, {}, [], {
    a: {
      isMine: false,
      role: { key: 'future-envoy', name: '新使者', side: 'a' },
    },
    b: { isMine: false },
  })
  expect(sideName(labels, 'a')).toBe('新使者')
  expect(speakerName(labels, 'future-envoy')).toBe('新使者')
  expect(speakerSide(labels, 'future-envoy')).toBe('a')
})
