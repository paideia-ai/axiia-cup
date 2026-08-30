import { useMemo } from 'react'

import type { TokenKind } from '../lib/highlight'
import { tokenizeLines } from '../lib/highlight'
import { tm } from '../testmode/mark'

const tokenClass: Record<TokenKind, string> = {
  plain: 'text-(--foreground-subtle)',
  comment: 'text-(--foreground-muted) italic',
  string: 'text-(--success)',
  number: 'text-(--warning)',
  keyword: 'text-(--info)',
  punct: 'text-(--foreground-muted)',
}

export function ScriptView({ source }: { source: string }) {
  const lines = useMemo(() => tokenizeLines(source), [source])

  return (
    <div
      {...tm('ADM.slot-script-view')}
      className='overflow-x-auto rounded-lg border border-(--border-soft) bg-black/30'
    >
      <pre className='min-w-max py-3 font-mono text-[12px] leading-[1.6]'>
        {lines.map((tokens, number) => (
          <div key={number} className='flex'>
            <span className='sticky left-0 w-12 shrink-0 select-none bg-black/30 pr-3 text-right text-(--foreground-muted)'>
              {number + 1}
            </span>
            <code className='whitespace-pre pr-4'>
              {tokens.map((token, position) => (
                <span key={position} className={tokenClass[token.kind]}>
                  {token.text}
                </span>
              ))}
            </code>
          </div>
        ))}
      </pre>
    </div>
  )
}
