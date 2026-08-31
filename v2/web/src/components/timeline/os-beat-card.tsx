import type { VerdictDTO } from '../../api/types'
import { cn } from '../../lib/cn'
import { parseOsBeat } from '../../lib/verdict'
import type { SpeakerLabels } from './labels'
import { speakerName } from './labels'
import { ReasoningFold } from './reasoning-fold'
import { tm } from '../../testmode/mark'

// 裁判心声卡（#22①）：the judge's generated aside beat, always visible — never
// behind 调试模式, which only governs model reasoning traces. Indented and dashed
// so it reads as an aside over the shoulder, not as a row of the script.
//
// 回放的教学锚点态（#24 U9）：倾向变化的节拍让回放自动停在这里——accent 实线
// 加环、最挂心一行放大，卡内给「继续」。

// os 节拍固定走 'judge-aside' 通道（商鞅/凤仪亭等脚本同一约定）：心声标题先
// 按通道 id、再按 judge lane 解析显示名（feishu 审计 #10）。
const OS_VOICE_LANES = ['judge-aside', 'judge'] as const

export function OsBeatCard({
  verdict,
  labels,
  highlight = false,
  onResume,
  trace,
  showTrace = false,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
  highlight?: boolean
  // 锚点停留时卡内的「继续」；不在回放锚点上时不渲染。
  onResume?: () => void
  // 裁判 OS ②（#22②）：这一拍生成时模型的真实推演轨迹——原本挂在被吸收的
  // act 行上，行不再渲染后随卡走。调试模式之外不出现。
  trace?: string | null
  showTrace?: boolean
}) {
  const beat = parseOsBeat(verdict.output)
  // 心声的「说话人」未必是 judge lane（feishu 审计 #10）：凤仪亭的 os 节拍由
  // 场上人物貂蝉在 'judge-aside' 通道亲声，judge lane 无标签，旧逻辑只会落到
  // 通用「裁判心声」。按 OS_VOICE_LANES 依次解析显示名——module laneLabels
  // 优先（作者随时可修），其次对局自带的 speakerLabels（'秦孝公' → 秦孝公
  // 心声的旧路径原样保留在 'judge' 键上）；都解析不出才用通名。
  const voice = OS_VOICE_LANES
    .map((lane) => labels.module?.laneLabels[lane] ?? labels.lanes[lane])
    .find((name) => name != null)
  const title = voice ? `${voice}心声` : '裁判心声'

  return (
    // F4：倾向轨迹图内联说明的「查看心声卡」按此 id scrollIntoView 直达。
    <div
      {...tm('FA.aside-card')}
      id={`beat-${verdict.key}`}
      className={cn(
        'mx-2 rounded-xl border border-dashed border-(--border) bg-[rgba(251,191,36,0.05)] px-4 py-3 sm:mx-6',
        highlight &&
          'border-solid border-(--accent) ring-2 ring-(--accent) bg-[rgba(224,74,47,0.06)]',
      )}
    >
      <div className='flex flex-wrap items-center gap-2 text-xs'>
        <span
          {...tm('FA.aside-title')}
          className='font-semibold text-(--warning)'
        >
          {title}
        </span>
        <span {...tm('FA.aside-model')} className='text-(--foreground-muted)'>
          {verdict.model}
        </span>
        {highlight
          ? (
            <span
              {...tm('FA.aside-anchor-badge')}
              className='rounded-full bg-[rgba(224,74,47,0.14)] px-2 py-0.5 text-[11px] font-semibold text-(--accent)'
            >
              倾向变化
            </span>
          )
          : null}
      </div>
      {beat.os
        ? (
          <p
            {...tm('FA.aside-text')}
            className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'
          >
            {beat.os}
          </p>
        )
        : null}
      {beat.fallbackText
        ? (
          <p
            {...tm('FA.aside-text')}
            className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'
          >
            {beat.fallbackText}
          </p>
        )
        : null}
      {beat.attention || beat.favor
        ? (
          <div
            {...tm('FA.aside-tendency')}
            className={cn(
              'mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--foreground-subtle)',
              highlight && 'items-baseline',
            )}
          >
            {beat.attention
              ? (
                <span
                  className={cn(
                    highlight &&
                      'text-sm font-semibold text-(--foreground)',
                  )}
                >
                  最挂心：{beat.attention}
                </span>
              )
              : null}
            {beat.favor
              ? (
                <span>
                  当前倾向：{speakerName(labels, beat.favor)}
                  {beat.strength ? `（${beat.strength}）` : ''}
                </span>
              )
              : null}
          </div>
        )
        : null}
      {showTrace && trace?.trim() ? <ReasoningFold text={trace} /> : null}
      {highlight && onResume
        ? (
          <div className='mt-3'>
            <button
              {...tm('FA.aside-resume-button')}
              type='button'
              onClick={onResume}
              className='inline-flex cursor-pointer items-center rounded-full bg-(--accent) px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90'
            >
              继续
            </button>
          </div>
        )
        : null}
    </div>
  )
}
