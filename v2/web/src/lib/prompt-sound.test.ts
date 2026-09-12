import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PromptSoundObserver } from './prompt-sound'
import { playSound } from './sound'

vi.mock('./sound', () => ({ playSound: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

describe('U19-C17/C18 prompt editing sounds', () => {
  it('distinguishes insertion/paste from deletion/cut, and ignores undo/redo', () => {
    const observer = new PromptSoundObserver()
    observer.input('a', 'insertText')
    observer.input('a pasted', 'insertFromPaste')
    observer.input('a paste', 'deleteContentBackward')
    observer.input('a', 'deleteByCut')
    observer.input('a paste', 'historyUndo')
    observer.input('a', 'historyRedo')
    expect(vi.mocked(playSound).mock.calls.map(([cue]) => cue)).toEqual([
      'type',
      'type',
      'delete',
      'delete',
    ])
  })
  it('plays once for a committed IME edit, not the candidates or duplicate final input', () => {
    const observer = new PromptSoundObserver()
    observer.beginComposition('a')
    observer.input('azhong', 'insertCompositionText', true)
    observer.input('a中', 'insertCompositionText', true)
    expect(playSound).not.toHaveBeenCalled()
    observer.endComposition('a中')
    observer.input('a中', 'insertCompositionText', false)
    expect(playSound).toHaveBeenCalledExactlyOnceWith('type')
  })
  it('does not sound canceled composition or unchanged input', () => {
    const observer = new PromptSoundObserver()
    observer.beginComposition('unchanged')
    observer.input('candidate', 'insertCompositionText', true)
    observer.endComposition('unchanged')
    observer.input('unchanged', 'insertText')
    expect(playSound).not.toHaveBeenCalled()
  })
})
