import type { Side } from '../api/types'
import type { ReplayBeatStep } from '../lib/replay'
import type { SpeakerLabels } from './timeline/labels'
import { sideName, speakerSide } from './timeline/labels'

// 裁判倾向轨迹小图（#24，P4 前端）：x＝节拍序（os-N），y＝带号强度——倾向
// A 侧向上、B 侧向下，幅度按强度档位离散取值。单序列折线：极性主要由位置
// （上/下）承载，点色沿用全站的侧别色（A=accent、B=info）作冗余强化；changed
// 节拍加同色空心外圈。零节拍不渲染（#18，不留空壳）；回放中传入 revealedKeys
// 只画已揭示的节拍——x 轴范围按全部节拍固定，图随回放逐点长满，兼作进度感。

const STRENGTH_MAGNITUDE: Record<string, number> = {
  胜负已定: 1,
  明显: 0.75,
  略偏: 0.5,
  均势: 0.25,
}
// 词汇外的强度文本按中档处理；favor 解析不出侧别时落在 0 线上。
const DEFAULT_MAGNITUDE = 0.5

// favor 是场景脚本的显示名词汇（商鞅/甘龙、董卓/吕布、角色名……），先走场景
// 模块的显式映射，再依次尝试：lane key 本身、模块角色名、对局 speakerLabels
// 的显示名、模块 laneLabels 的显示名。
function favorSide(labels: SpeakerLabels, favor: string | null): Side | null {
  if (!favor) return null
  const declared = labels.module?.favorSides?.[favor]
  if (declared) return declared
  const direct = speakerSide(labels, favor)
  if (direct) return direct
  const role = labels.module?.roles.find((entry) => entry.name === favor)
  if (role) return role.side
  for (const [key, label] of Object.entries(labels.lanes)) {
    if (label !== favor) continue
    const side = speakerSide(labels, key)
    if (side) return side
  }
  for (
    const [key, label] of Object.entries(labels.module?.laneLabels ?? {})
  ) {
    if (label !== favor) continue
    const side = speakerSide(labels, key)
    if (side) return side
  }
  return null
}

const SIDE_COLOR: Record<Side, string> = {
  a: 'var(--accent)',
  b: 'var(--info)',
}
const NEUTRAL_COLOR = 'var(--foreground-subtle)'

const HEIGHT = 120
const MID_Y = HEIGHT / 2
const AMPLITUDE = 42
const PAD_X = 18
const STEP_X = 44

function excerpt(text: string | null, limit = 60): string {
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

export function JudgeTrendChart({
  beats,
  labels,
  speakers,
  revealedKeys = null,
}: {
  beats: ReplayBeatStep[]
  labels: SpeakerLabels
  speakers: string[]
  // 回放揭示切片：null＝完整战报（全画）。
  revealedKeys?: ReadonlySet<string> | null
}) {
  if (beats.length === 0) return null
  const nameA = sideName(labels, 'a', speakers)
  const nameB = sideName(labels, 'b', speakers)

  const points = beats
    .filter((step) =>
      revealedKeys == null || revealedKeys.has(step.verdict.key)
    )
    .map((step) => {
      const side = favorSide(labels, step.beat.favor)
      const magnitude = side == null
        ? 0
        : STRENGTH_MAGNITUDE[step.beat.strength ?? ''] ?? DEFAULT_MAGNITUDE
      const y = side === 'a'
        ? MID_Y - magnitude * AMPLITUDE
        : side === 'b'
        ? MID_Y + magnitude * AMPLITUDE
        : MID_Y
      return {
        step,
        x: PAD_X + step.index * STEP_X,
        y,
        color: side ? SIDE_COLOR[side] : NEUTRAL_COLOR,
      }
    })

  const width = PAD_X * 2 + (beats.length - 1) * STEP_X
  const line = points
    .map((point, at) => `${at === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ')

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
          裁判倾向轨迹
        </p>
        <p className='text-[11px] text-(--foreground-muted)'>
          空心圈＝倾向变化 · 悬停查看心声
        </p>
      </div>
      <div className='flex items-stretch gap-3'>
        <div
          className='flex shrink-0 flex-col justify-between text-[11px] text-(--foreground-subtle)'
          style={{ height: HEIGHT }}
        >
          <span className='inline-flex items-center gap-1.5'>
            <span
              aria-hidden
              className='inline-block h-2 w-2 rounded-full'
              style={{ background: SIDE_COLOR.a }}
            />
            {nameA}
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <span
              aria-hidden
              className='inline-block h-2 w-2 rounded-full'
              style={{ background: SIDE_COLOR.b }}
            />
            {nameB}
          </span>
        </div>
        <div className='min-w-0 flex-1 overflow-x-auto'>
          <svg
            width={width}
            height={HEIGHT}
            role='img'
            aria-label={`裁判倾向轨迹：上为${nameA}，下为${nameB}，共 ${beats.length} 拍`}
            className='block'
          >
            <line
              x1={0}
              y1={MID_Y}
              x2={width}
              y2={MID_Y}
              stroke='var(--border)'
              strokeWidth={1}
            />
            {line
              ? (
                <path
                  d={line}
                  fill='none'
                  stroke='var(--foreground-muted)'
                  strokeWidth={2}
                  strokeLinejoin='round'
                  strokeLinecap='round'
                />
              )
              : null}
            {points.map((point) => (
              <g key={point.step.verdict.key}>
                <title>
                  {[
                    `${point.step.verdict.key} · 倾向：${
                      point.step.beat.favor ?? '—'
                    }${
                      point.step.beat.strength
                        ? `（${point.step.beat.strength}）`
                        : ''
                    }`,
                    point.step.beat.attention
                      ? `最挂心：${point.step.beat.attention}`
                      : '',
                    excerpt(point.step.beat.os ?? point.step.beat.fallbackText),
                  ].filter(Boolean).join('\n')}
                </title>
                {point.step.changed
                  ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={8}
                      fill='none'
                      stroke={point.color}
                      strokeWidth={1.5}
                    />
                  )
                  : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4.5}
                  fill={point.color}
                  stroke='var(--background)'
                  strokeWidth={2}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}
