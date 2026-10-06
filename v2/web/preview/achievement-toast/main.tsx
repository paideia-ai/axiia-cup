import { useCallback, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import type {
  AchievementEventDTO,
  EarnedAchievementDTO,
} from '../../src/api/types'
import { AchievementToast } from '../../src/components/achievement-toast'
import { getSoundPreferences, unlockAudio } from '../../src/lib/sound'
import '../../src/styles.css'

type Sample = Omit<EarnedAchievementDTO, 'unlockedAt' | 'matchID'> & {
  label: string
}

const samples: Sample[] = [
  {
    id: 'philosopher',
    tier: 'gold',
    unlocked: true,
    title: '大哲学家',
    flavor: '还有下一题吗？',
    description: '在一场电车难题 PvP 中，赢下全部三个案件。',
    iconURL: '/achievements/philosopher.webp',
    label: '大哲学家 · 主样例',
  },
  {
    id: 'devils-advocate',
    tier: 'gold',
    unlocked: true,
    title: '我也可以反过来说',
    flavor: '反方，请开始你的表演。',
    description: '分别以一人侧和五人侧，在电车难题 PvP 中各取得一次 3∶0。',
    iconURL: '/achievements/devils-advocate.webp',
    label: '我也可以反过来说 · 长标题',
  },
  {
    id: 'four-endings',
    tier: 'gold',
    unlocked: true,
    title: '戏里戏外',
    flavor: '同一句愿意，可以有四种故事。',
    description:
      '在凤仪亭 PvP 中，分别以董卓、吕布赢得“继续连环计”和“放弃连环计”两种结局。',
    iconURL: '/achievements/four-endings.webp',
    label: '戏里戏外 · 长趣味文案',
  },
  {
    id: 'hundred-losses',
    tier: 'bronze',
    unlocked: true,
    title: '百折，尚未不挠',
    flavor: '',
    description: '累计输掉 100 场对局。',
    iconURL: '/achievements/hundred-losses.webp',
    label: '百折，尚未不挠 · 无趣味文案',
  },
]

function Preview() {
  const [selected, setSelected] = useState(samples[0].id)
  const [event, setEvent] = useState<AchievementEventDTO | null>(null)
  const sequence = useRef(Date.now())
  const dismiss = useCallback(() => setEvent(null), [])
  const preferences = getSoundPreferences()

  const replay = () => {
    // Unlock during the user's gesture; the actual toast owns sound playback.
    unlockAudio()
    const sample = samples.find((item) => item.id === selected) ?? samples[0]
    sequence.current = Math.max(Date.now(), sequence.current + 1)
    const occurredAt = Date.now() / 1000
    setEvent({
      id: sequence.current,
      achievement: { ...sample, unlockedAt: occurredAt, matchID: null },
      notificationID: null,
      source: 'live',
      occurredAt,
    })
  }

  return (
    <MemoryRouter>
      <main className='achievement-preview'>
        <p className='achievement-preview-brand'>AXIIA CUP</p>
        <p className='achievement-preview-kicker'>已选方案 · 实际效果</p>
        <h1>02 全幅封面 · 原版三音</h1>
        <p className='achievement-preview-intro'>
          完整成就画配上一句趣味文案，伴随最初的三声上行轻铃。
          点击回放，在右下角查看这次选定的提示。
        </p>
        <section className='achievement-preview-controls' aria-label='回放设置'>
          <label htmlFor='achievement-sample'>选择样例</label>
          <div className='achievement-preview-row'>
            <select
              id='achievement-sample'
              value={selected}
              onChange={(change) => {
                setSelected(change.target.value)
                dismiss()
              }}
            >
              {samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.label}
                </option>
              ))}
            </select>
            <button
              type='button'
              className='achievement-preview-play'
              onPointerDown={unlockAudio}
              onKeyDown={(key) => {
                if (key.key === 'Enter' || key.key === ' ') unlockAudio()
              }}
              onClick={replay}
            >
              {event ? '重新回放' : '回放成就提示'}
            </button>
          </div>
          <p className='achievement-preview-note'>
            {preferences.enabled && preferences.volume > 0
              ? '声音沿用你当前的平台音量。'
              : '当前平台声音已关闭，回放会保持静音。'}{' '}
            这里的样例不会记入你的成就。
          </p>
        </section>
        <ul className='achievement-preview-guide'>
          <li>提示约 7 秒后收起；悬停或键盘聚焦时暂停。</li>
          <li>点击提示，在新标签页打开成就中心。</li>
          <li>系统开启「减少动态效果」时，提示直接显示。</li>
        </ul>
        <nav className='achievement-preview-links' aria-label='预览导航'>
          <a href='/settings/achievements'>打开成就中心</a>
          <a href='/_preview/achievement-toasts'>返回全部设计方案</a>
        </nav>
      </main>
      {event && (
        <AchievementToast
          key={event.id}
          event={event}
          accountID='achievement-toast-preview'
          onDismiss={dismiss}
        />
      )}
    </MemoryRouter>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
