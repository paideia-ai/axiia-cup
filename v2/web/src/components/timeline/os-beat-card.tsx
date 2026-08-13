import type { VerdictDTO } from '../../api/types'
import { cn } from '../../lib/cn'
import { parseOsBeat } from '../../lib/verdict'
import type { SpeakerLabels } from './labels'
import { speakerName } from './labels'

// 裁判心声卡（#22①）：the judge's generated aside beat, always visible — never
// behind 调试模式, which only governs model reasoning traces. Indented and dashed
// so it reads as an aside over the shoulder, not as a row of the script.
//
// 回放的教学锚点态（#24 U9）：倾向变化的节拍让回放自动停在这里——accent 实线
// 加环、最挂心一行放大，卡内给「继续」。
export function OsBeatCard({
  verdict,
  labels,
  highlight = false,
  onResume,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
  highlight?: boolean
  // 锚点停留时卡内的「继续」；不在回放锚点上时不渲染。
  onResume?: () => void
}) {
  const beat = parseOsBeat(verdict.output)
  // The judge lane's scenario name when one resolves ('秦孝公' → 秦孝公心声);
  // the raw key falling through means no label exists, so the generic name.
  const judge = speakerName(labels, 'judge')
  const title = judge === 'judge' ? '裁判心声' : `${judge}心声`

  return (
    <div
      className={cn(
        'mx-2 rounded-xl border border-dashed border-(--border) bg-[rgba(251,191,36,0.05)] px-4 py-3 sm:mx-6',
        highlight &&
          'border-solid border-(--accent) ring-2 ring-(--accent) bg-[rgba(224,74,47,0.06)]',
      )}
    >
      <div className='flex flex-wrap items-center gap-2 text-xs'>
        <span className='font-semibold text-(--warning)'>{title}</span>
        <span className='text-(--foreground-muted)'>{verdict.model}</span>
        {highlight
          ? (
            <span className='rounded-full bg-[rgba(224,74,47,0.14)] px-2 py-0.5 text-[11px] font-semibold text-(--accent)'>
              倾向变化
            </span>
          )
          : null}
      </div>
      {beat.os
        ? (
          <p className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'>
            {beat.os}
          </p>
        )
        : null}
      {beat.fallbackText
        ? (
          <p className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'>
            {beat.fallbackText}
          </p>
        )
        : null}
      {beat.attention || beat.favor
        ? (
          <div
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
      {highlight && onResume
        ? (
          <div className='mt-3'>
            <button
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
