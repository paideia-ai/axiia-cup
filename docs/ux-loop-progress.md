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

### Fixes Implementing This Iteration
- [ ] Mobile bottom tab navigation
- [ ] Post-register redirect to `/dashboard`
- [ ] Post-login redirect to `/dashboard` for new users
- [ ] 邀请码 helper text
- [ ] Landing page hero CTA for logged-out users
- [ ] Collapse template accordion by default
- [ ] Leaderboard empty state redesign
- [ ] Landing page copy rewrite

### Next Steps for Iteration 2
- Quick Start Card component (Fix 2b from remaining doc)
- Example match link (Fix 5b)
- Match detail transcript collapse
- Mobile-responsive workshop layout
- Re-score after all fixes applied

### Files Modified
(to be updated after implementation)
