import { useEffect, useState } from 'react'

// 发码节流的默认冷却：服务端两次发送之间的最小间隔。只在服务端没给出预算
// （成功发送，或 429 不带头）时用。
export const SEND_CODE_COOLDOWN_SECONDS = 60

// 短信发码节流答 429 + Retry-After（秒）。这是服务端为该号码算出的预算——
// 小时级封顶时它远大于 60，照固定 60 起倒计时会怂恿一次注定被拒的重发。
export function retryAfterSeconds(headers: Headers): number | null {
  const header = headers.get('Retry-After')
  if (!header) return null
  const seconds = Number.parseInt(header, 10)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

export function useCooldown() {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  return {
    remaining,
    start: (seconds: number = SEND_CODE_COOLDOWN_SECONDS) =>
      setRemaining(seconds),
  }
}
