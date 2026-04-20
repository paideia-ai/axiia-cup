# UX Loop Progress

## Iteration 4 — 2026-04-21

### Score: 82/100 (up from 74)

### Fixes Implemented
- [x] Workshop mobile order: editor appears first (order-1), reference material below (order-2)
- [x] Character counter: shows "还剩 X 字" only when <200 remaining; hidden otherwise

### Estimated post-fix score: ~85/100

### Remaining P2/P3 (nice-to-haves, not blockers)
- Judge prompt summary when collapsed (Fix 2c) — P2
- Scoring example with real match data (Fix 4) — P2
- Landing page featured match replay (Fix 1) — P2
- Playground transcript not collapsed (inconsistent with MatchDetail) — P3
- Toast save → playground connection could be more direct — P3
- Mobile pairing card text overflow on narrow screens — P3

---

## Iteration 3 — 2026-04-21

### Score: 74/100 (up from 66)

### Fixes Implemented
- [x] Mobile leaderboard: card layout on <md screens (rank + name + win% + record)
- [x] Mobile pairings: vertical stack on small screens (was cramped 2-col grid)
- [x] Match detail: transcript collapsed by default with turn count + toggle
- [x] Match detail: judge QA collapsed by default with toggle
- [x] Match detail: breadcrumb back link ("← 返回排行榜")
- [x] Playground: rich first-use empty state with explanation, inline CTA, mode descriptions

### Estimated post-fix score: ~85/100

---

## Iteration 2 — 2026-04-21

### Score: 66/100 (up from 58)

### Fixes Implemented
- [x] Match Detail: reorder sections — verdict/reasoning moved above transcript (outcome-first)
- [x] Workshop subtitle: "写一段策略让你的 AI 在辩论中胜出" (outcome, not mechanism)
- [x] Workshop editor description: simplified to "保存后可在试炼场测试效果"
- [x] Quick Start card: dismissible callout with game mechanic summary + example link
- [x] Example match link (#277) in 3 locations: dashboard, workshop quick-start, landing page
- [x] 小分 tooltip text improved

### Estimated post-fix score: ~76/100

### Next Steps for Iteration 3
- Mobile leaderboard card view (table unusable on small screens)
- Mobile workshop layout improvements
- Match detail transcript collapse (show only first 3 turns, expand rest)
- Judge prompt summary when collapsed (Fix 2c)
- Scoring example with real match data (Fix 4)
- Playground first-use guidance
- Re-audit and re-score

---

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
