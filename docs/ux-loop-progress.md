# UX Loop Progress

## Iteration 1 — 2026-04-21

### Score: 58/100

### Issues Found (by priority)
1. **P0 — MOBILE NAV BROKEN**: `<nav>` is `hidden md:flex` — no hamburger, no bottom tabs. Mobile users stuck.
2. **P0 — Post-register redirect**: Goes to `/scenarios` bypassing dashboard onboarding. Change to `/dashboard`.
3. **P0 — 邀请码 no context**: Registration field has no helper text. Users don't know where to find the code.
4. **P0 — Landing no CTA**: Logged-out users see no CTA in hero section body.
5. **P1 — Template accordion expanded**: `defaultValue={['template']}` in workshop shows dense prompt before user writes.
6. **P1 — Leaderboard empty states**: "暂无排行榜数据" and "暂无对阵数据" are dead ends with no guidance.
7. **P1 — Landing copy is mechanism-oriented**: "瑞士轮赛制" jargon, should be outcome-oriented.

### Fixes Implemented This Iteration
- [x] Mobile bottom tab navigation (`app-shell.tsx`)
- [x] Post-register redirect to `/dashboard` (`Register.tsx`, `app-router.tsx`)
- [x] Post-login redirect to `/dashboard` (`Login.tsx`, `app-router.tsx`)
- [x] 邀请码 helper text (`Register.tsx`)
- [x] Landing page hero CTA for logged-out users (`landing-page.tsx`)
- [x] Collapse template accordion by default (`ScenarioDetail.tsx`)
- [x] Leaderboard empty state redesign (`Leaderboard.tsx`)
- [x] Landing page copy rewrite — outcome-oriented (`landing-page.tsx`)

### PR
- PR #16: https://github.com/paideia-ai/axiia-cup/pull/16

### Next Steps for Iteration 2
- Quick Start Card component (Fix 2b from remaining doc)
- Example match link (Fix 5b)
- Match detail transcript collapse
- Mobile-responsive workshop layout
- Settings / user profile accessible from mobile bottom nav
- Re-score after all fixes deployed

### Files Modified
- `apps/web/src/app-router.tsx` — redirects to /dashboard
- `apps/web/src/components/layout/app-shell.tsx` — mobile bottom tabs
- `apps/web/src/pages/Leaderboard.tsx` — empty states
- `apps/web/src/pages/Login.tsx` — redirect
- `apps/web/src/pages/Register.tsx` — redirect + helper text
- `apps/web/src/pages/ScenarioDetail.tsx` — template accordion collapsed
- `apps/web/src/pages/landing-page.tsx` — CTA buttons + copy rewrite
