import { describe, expect, it } from 'vitest'
import type { MatchDetail } from '../api/types'
import {
  type EmotionOutput,
  EmotionPlayback,
  presentedText,
} from './emotion-playback'

const output = (
  ref = 'one',
  status: EmotionOutput['status'] = 'pending',
): EmotionOutput => ({
  outputRef: ref,
  status,
  categoryId: status === 'ready' ? 'E06' : null,
  waitMs: 350,
  updateMs: 1000,
  playback: {
    text: '先说。再说。',
    frames: [{ atMs: 0, end: 3 }, { atMs: 400, end: 6 }],
  },
})
const match = (outputs: EmotionOutput[]): MatchDetail => ({
  turns: outputs.map((item, seq) => ({ seq, outputRef: item.outputRef })),
  verdicts: [],
  emotions: { enabled: true, settled: false, outputs },
} as unknown as MatchDetail)
function live() {
  const store = new EmotionPlayback()
  store.ingest(match([]), 0)
  store.ingest(match([output()]), 10)
  return store
}

describe('emotion playback deadlines', () => {
  it('starts with neutral by 350 ms even if the provider never responds, using original chunk intervals', () => {
    const store = live()
    store.tick(359)
    expect(store.get('one')?.waiting).toBe(true)
    store.tick(360)
    expect(store.get('one')).toMatchObject({
      category: 'E01',
      end: 3,
      waiting: false,
    })
    store.tick(759)
    expect(presentedText(store.get('one'), '先说。再说。')).toBe('先说。')
    store.tick(760)
    expect(store.get('one')?.complete).toBe(true)
  })
  it('starts text and the decoded portrait together for a result inside the 350 ms gate', () => {
    const store = live()
    store.update([output('one', 'ready')], 300)
    expect(store.get('one')?.waiting).toBe(true)
    store.prepare('one', 'E06', 310)
    expect(store.get('one')).toMatchObject({
      category: 'E06',
      end: 3,
      waiting: false,
    })
  })
  it('allows a late portrait under 1 second without restarting or accelerating text', () => {
    const store = live()
    store.tick(360)
    store.update([output('one', 'ready')], 500)
    store.prepare('one', 'E06', 501)
    expect(store.get('one')).toMatchObject({ category: 'E06', end: 3 })
    store.tick(760)
    expect(store.get('one')?.complete).toBe(true)
  })
  it('locks only the missing result after 1 second, including late image decoding', () => {
    const store = live()
    store.update([output('one', 'ready')], 500)
    store.tick(1011)
    store.prepare('one', 'E06', 1100)
    expect(store.get('one')?.category).toBe('E01')
    store.tick(1600)
    expect(store.needsTick).toBe(false)
    store.ingest(match([output('one', 'ready')]), 1700)
    store.prepare('one', 'E06', 1701)
    expect(store.get('one')?.category).toBe('E01')
  })
  it('does not extend deadlines or regress a successful result on reconnect', () => {
    const store = live()
    store.update([output()], 199)
    store.tick(360)
    expect(store.get('one')?.waiting).toBe(false)
    store.update([output('one', 'ready')], 380)
    store.prepare('one', 'E06', 381)
    store.update([output('one', 'unavailable')], 400)
    expect(store.get('one')?.category).toBe('E06')
  })
  it('a provider failure releases text immediately and leaves previous successes intact', () => {
    const store = live()
    store.update([output('one', 'ready')], 20)
    store.prepare('one', 'E06', 21)
    store.tick(421)
    store.ingest(
      match([output('one', 'ready'), output('two', 'unavailable')]),
      430,
    )
    expect(store.get('one')?.category).toBe('E06')
    expect(store.get('two')).toMatchObject({ category: 'E01', waiting: false })
  })
  it('queues serial replies without delaying model generation or changing playback speed', () => {
    const store = live()
    store.tick(360)
    store.ingest(match([output(), output('two')]), 400)
    store.tick(450)
    expect(store.get('two')?.waiting).toBe(true)
    store.tick(760)
    expect(store.get('two')).toMatchObject({ end: 3, waiting: false })
    store.tick(1160)
    expect(store.busy).toBe(false)
  })
  it('opens historical text immediately and does not replay it on refetch', () => {
    const store = new EmotionPlayback()
    store.ingest(match([output('one', 'ready')]), 0)
    expect(store.get('one')?.complete).toBe(true)
    store.prepare('one', 'E06', 2000)
    expect(store.get('one')?.category).toBe('E06')
    store.ingest(match([output()]), 3000)
    expect(store.busy).toBe(false)
  })
  it('retains results received before the corresponding transcript refresh', () => {
    const store = new EmotionPlayback()
    store.ingest(match([]), 0)
    store.update([output('one', 'ready')], 20)
    store.ingest(match([output()]), 30)
    store.prepare('one', 'E06', 40)
    expect(store.get('one')?.category).toBe('E06')
  })
  it('keeps a bounded image gate for a valid result published after classification', () => {
    const store = new EmotionPlayback()
    store.ingest(match([]), 0)
    store.update([output('one', 'ready')], 20)
    store.ingest(match([{ ...output(), waitMs: 0, updateMs: 200 }]), 820)
    store.prepare('one', 'E06', 1821)
    expect(store.get('one')?.category).toBe('E01')
  })
  it('holds subsequent events and reports behind unfinished text', () => {
    const store = live()
    const snapshot = match([output(), output('two')])
    store.ingest(snapshot, 10)
    expect(store.cutoff(snapshot)).toBe(0)
    store.tick(360)
    store.tick(760)
    expect(store.cutoff(snapshot)).toBe(1)
    store.tick(1160)
    expect(store.cutoff(snapshot)).toBe(Infinity)
  })
  it('plays a parallel ballot reveal concurrently', () => {
    const store = new EmotionPlayback()
    store.ingest(match([]), 0)
    const snapshot = match([output(), output('two')])
    snapshot.turns = [{
      seq: 0,
      channel: 'verdict',
      kind: 'event',
      speaker: 'event',
      finalText: '',
      event: {
        type: 'final_vote_reveal',
        votes: [{ outputRef: 'one' }, { outputRef: 'two' }],
      },
    }]
    store.ingest(snapshot, 0)
    store.tick(350)
    expect(store.get('one')?.waiting).toBe(false)
    expect(store.get('two')?.waiting).toBe(false)
    store.tick(750)
    expect(store.busy).toBe(false)
  })
  it('uses an on-time result even when a private conversation is only published later', () => {
    const store = new EmotionPlayback()
    store.ingest(match([]), 0)
    store.ingest(
      match([{ ...output('one', 'ready'), waitMs: 0, updateMs: 0 }]),
      5000,
    )
    expect(store.get('one')?.waiting).toBe(true)
    store.prepare('one', 'E06', 5020)
    expect(store.get('one')).toMatchObject({
      category: 'E06',
      end: 3,
      waiting: false,
    })
  })
  it('retains an accepted classification while its row waits behind a longer replay', () => {
    const store = new EmotionPlayback()
    store.ingest(match([]), 0)
    const first = {
      ...output(),
      playback: {
        text: '先说。再说。',
        frames: [{ atMs: 0, end: 3 }, { atMs: 3000, end: 6 }],
      },
    }
    const snapshot = match([first, output('two')])
    store.ingest(snapshot, 0)
    store.tick(350)
    store.update([{ ...output('two', 'ready'), waitMs: 0, updateMs: 500 }], 500)
    store.tick(1500)
    store.tick(3350)
    expect(store.get('two')?.waiting).toBe(true)
    store.prepare('two', 'E06', 3360)
    expect(store.get('two')).toMatchObject({
      category: 'E06',
      waiting: false,
      end: 3,
    })
  })
})
