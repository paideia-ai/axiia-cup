/* 测试模式自带的样式：全部限定在 [data-tm-root] 下，青色（#22d3ee）是它唯一的品牌色——
   与产品的红色强调色一眼能分开。像一张压在深色产品上的青色透明片：淡青墨底、发丝线、等宽字号牌。 */
export const BASE_CSS = `
[data-tm-root]{
  --tm:#22d3ee;--tm-deep:#0e7490;--tm-ink:#07161a;--tm-ink2:#0b2227;--tm-ink3:#10303a;
  --tm-line:rgba(34,211,238,.32);--tm-line-soft:rgba(34,211,238,.14);
  --tm-text:#e6fbff;--tm-mute:#8fc5cf;--tm-dim:#5d8b93;--tm-gap:#9aa1aa;--tm-warn:#fbbf24;
  --tm-pass:#34d399;--tm-fail:#fb7185;--tm-skip:#a3aab5;
  --tm-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --tm-sans:'Noto Sans SC','Satoshi',system-ui,sans-serif;
  --tm-nav:0px; /* 产品移动端底栏的高度，index.tsx 量出来后写在行内 */
  --tm-dock:0px; /* 导测卡的高度，guided.tsx 量出来后写在行内；提示条贴在它上方 */
  position:fixed;top:0;left:0;width:0;height:0;z-index:9000;
  font-family:var(--tm-sans);font-size:13px;line-height:1.55;color:var(--tm-text);
  -webkit-font-smoothing:antialiased;
}
[data-tm-root] *{box-sizing:border-box}
[data-tm-root] button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
[data-tm-root] button:disabled{cursor:default;opacity:.5}
[data-tm-root] a{color:var(--tm);text-decoration:none}
[data-tm-root] a:hover{text-decoration:underline}
[data-tm-root] :focus-visible{outline:2px solid var(--tm);outline-offset:2px}
[data-tm-root] .tm-mono{font-family:var(--tm-mono);font-size:11.5px;letter-spacing:0}
[data-tm-root] .tm-eyebrow{font-family:var(--tm-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--tm-mute)}
[data-tm-root] .tm-muted{color:var(--tm-mute)}
[data-tm-root] .tm-dimt{color:var(--tm-dim)}
[data-tm-root] .tm-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* ── 药丸 ── */
[data-tm-root] .tm-pill{position:fixed;right:12px;bottom:calc(12px + var(--tm-nav));z-index:9030;display:flex;align-items:center;gap:2px;
  padding:4px 6px 4px 10px;border:1px solid var(--tm-line);border-radius:999px;background:rgba(7,22,26,.9);
  backdrop-filter:blur(10px);box-shadow:0 8px 30px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.4);max-width:calc(100vw - 24px)}
[data-tm-root] .tm-pill-dot{width:7px;height:7px;border-radius:50%;background:var(--tm);box-shadow:0 0 8px var(--tm);margin-right:6px;flex:none}
[data-tm-root] .tm-pill-name{font-family:var(--tm-mono);font-size:11px;letter-spacing:.1em;color:var(--tm);margin-right:6px;white-space:nowrap}
[data-tm-root] .tm-pill-btn{padding:4px 8px;border-radius:999px;font-size:12px;color:var(--tm-text);white-space:nowrap;line-height:1.2}
[data-tm-root] .tm-pill-btn:hover{background:var(--tm-line-soft)}
[data-tm-root] .tm-pill-btn[aria-pressed=true]{background:var(--tm);color:var(--tm-ink);font-weight:600}
[data-tm-root] .tm-pill-btn--who{color:var(--tm-mute);max-width:10em;overflow:hidden;text-overflow:ellipsis;margin-left:2px;border:1px solid var(--tm-line-soft)}
[data-tm-root] .tm-pill-who-k{font-size:10.5px;color:var(--tm-dim);margin-right:3px}
@media (min-width:640px){[data-tm-root] .tm-pill--drawer{right:calc(min(420px,100vw) + 12px)}}
[data-tm-root] .tm-pill-btn--x{color:var(--tm-mute);padding:4px 7px}
@media (max-width:420px){[data-tm-root] .tm-pill-name{display:none}[data-tm-root] .tm-pill-btn{padding:4px 6px}}
`

/* 其余（徽标层 / 弹层 / 清单 / 导测 / 身份）只随 overlay 分块加载 */
export const TM_CSS = `
/* ── 徽标层 ── */
[data-tm-root] .tm-layer{position:fixed;inset:0;pointer-events:none;z-index:9001;overflow:hidden}
[data-tm-root] .tm-badge{position:absolute;left:0;top:0;pointer-events:auto;display:inline-flex;align-items:baseline;gap:5px;
  height:16px;padding:0 5px;border:1px solid var(--tm-line);border-bottom-left-radius:0;border-radius:3px 3px 3px 0;
  background:rgba(7,22,26,.92);color:var(--tm);font-family:var(--tm-mono);font-size:11px;line-height:14px;white-space:nowrap;
  will-change:transform;opacity:.82}
[data-tm-root] .tm-badge:hover,[data-tm-root] .tm-badge:focus-visible,[data-tm-root] .tm-badge[aria-expanded=true]{opacity:1}
[data-tm-root] .tm-badge::after{content:'';position:absolute;left:-1px;top:100%;width:1px;height:5px;background:var(--tm)}
[data-tm-root] .tm-badge-n{font-size:10px;color:var(--tm-mute)}
[data-tm-root] .tm-badge:hover,[data-tm-root] .tm-badge[aria-expanded=true]{background:var(--tm);color:var(--tm-ink);border-color:var(--tm)}
[data-tm-root] .tm-badge:hover .tm-badge-n,[data-tm-root] .tm-badge[aria-expanded=true] .tm-badge-n{color:var(--tm-ink)}
[data-tm-root] .tm-badge:focus-visible{outline:2px solid #fff;outline-offset:1px}
[data-tm-root] .tm-badge--gap{color:var(--tm-gap);border-style:dashed;border-color:var(--tm-gap)}
[data-tm-root] .tm-badge--gap::after{background:var(--tm-gap)}
[data-tm-root] .tm-badge--gap:hover{background:var(--tm-gap);color:var(--tm-ink);border-color:var(--tm-gap)}
[data-tm-root] .tm-badge--unknown{color:var(--tm-warn);border-color:var(--tm-warn);border-style:dashed}
[data-tm-root] .tm-badge--unknown::after{background:var(--tm-warn)}
[data-tm-root] .tm-badge--unknown:hover{background:var(--tm-warn);color:var(--tm-ink)}
[data-tm-root] .tm-hl{position:absolute;pointer-events:none;border-radius:4px;outline:1px solid var(--tm);box-shadow:0 0 0 3px var(--tm-line-soft)}
[data-tm-root] .tm-hl--flash{animation:tmFlash 1.4s ease-out forwards}
@keyframes tmFlash{0%{box-shadow:0 0 0 10px rgba(34,211,238,.4);outline-color:#fff}100%{box-shadow:0 0 0 3px rgba(34,211,238,0);outline-color:rgba(34,211,238,0)}}
[data-tm-root] .tm-spot{position:fixed;z-index:9002;pointer-events:none;border:2px solid var(--tm);border-radius:8px;
  box-shadow:0 0 0 100vmax rgba(3,12,14,.58),0 0 24px rgba(34,211,238,.35);transition:top .18s ease,left .18s ease,width .18s ease,height .18s ease}
[data-tm-root] .tm-spot-tag{position:absolute;left:-2px;bottom:100%;margin-bottom:6px;padding:2px 7px;border-radius:4px;background:var(--tm);color:var(--tm-ink);
  font-family:var(--tm-mono);font-size:11px;font-weight:600;white-space:nowrap}

/* ── 面板共用 ── */
[data-tm-root] .tm-surface{background:rgba(7,22,26,.96);backdrop-filter:blur(14px);border:1px solid var(--tm-line);color:var(--tm-text);
  box-shadow:0 20px 60px rgba(0,0,0,.55)}
[data-tm-root] .tm-h{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--tm-line-soft)}
[data-tm-root] .tm-h-title{font-weight:600;font-size:13.5px;flex:1;min-width:0}
[data-tm-root] .tm-x{width:26px;height:26px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;color:var(--tm-mute);font-size:15px;flex:none}
[data-tm-root] .tm-x:hover{background:var(--tm-line-soft);color:var(--tm-text)}
[data-tm-root] .tm-body{padding:10px 14px 14px;overflow:auto;overscroll-behavior:contain}
[data-tm-root] .tm-sec{margin:12px 0 6px;display:flex;align-items:center;gap:8px}
[data-tm-root] .tm-sec:first-child{margin-top:2px}
[data-tm-root] .tm-sec-n{font-family:var(--tm-mono);font-size:10.5px;color:var(--tm-dim)}
[data-tm-root] .tm-rows{display:flex;flex-direction:column;gap:2px}
[data-tm-root] .tm-row{display:flex;gap:8px;align-items:flex-start;padding:5px 6px;border-radius:6px;font-size:12.5px;line-height:1.45}
[data-tm-root] .tm-row:hover{background:var(--tm-line-soft)}
[data-tm-root] .tm-row-id{font-family:var(--tm-mono);font-size:11.5px;color:var(--tm);flex:none;min-width:5.5em}
[data-tm-root] .tm-row-q{flex:1;min-width:0;color:var(--tm-text)}
[data-tm-root] .tm-row-q.tm-clamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
[data-tm-root] .tm-chips{display:flex;flex-wrap:wrap;gap:4px}
[data-tm-root] .tm-chip{display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 6px;border:1px solid var(--tm-line-soft);border-radius:4px;
  font-family:var(--tm-mono);font-size:10.5px;color:var(--tm-mute);white-space:nowrap;line-height:1}
[data-tm-root] a.tm-chip:hover{border-color:var(--tm);color:var(--tm);text-decoration:none}
[data-tm-root] .tm-chip--match{color:var(--tm-pass);border-color:rgba(52,211,153,.35)}
[data-tm-root] .tm-chip--gap_open,[data-tm-root] .tm-chip--gap_known{color:var(--tm-fail);border-color:rgba(251,113,133,.35)}
[data-tm-root] .tm-chip--pending_ruling,[data-tm-root] .tm-chip--fixed_unverified{color:var(--tm-warn);border-color:rgba(251,191,36,.35)}
[data-tm-root] .tm-chip--lack,[data-tm-root] .tm-chip--untestable{color:var(--tm-gap);border-style:dashed}
[data-tm-root] .tm-ext::after{content:' ↗';font-size:.85em;opacity:.7}
[data-tm-root] .tm-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 11px;border:1px solid var(--tm-line);border-radius:7px;
  font-size:12.5px;color:var(--tm-text);white-space:nowrap;transition:background .12s,border-color .12s}
[data-tm-root] .tm-btn:hover{background:var(--tm-line-soft);border-color:var(--tm)}
[data-tm-root] .tm-btn--primary{background:var(--tm);border-color:var(--tm);color:var(--tm-ink);font-weight:600}
[data-tm-root] .tm-btn--primary:hover{background:#5fe3f5}
[data-tm-root] .tm-btn--ghost{border-color:transparent;color:var(--tm-mute)}
[data-tm-root] .tm-btn--sm{height:24px;padding:0 8px;font-size:11.5px;border-radius:5px}
[data-tm-root] .tm-btn--pass{border-color:rgba(52,211,153,.5);color:var(--tm-pass)}
[data-tm-root] .tm-btn--pass:hover{background:rgba(52,211,153,.14);border-color:var(--tm-pass)}
[data-tm-root] .tm-btn--fail{border-color:rgba(251,113,133,.5);color:var(--tm-fail)}
[data-tm-root] .tm-btn--fail:hover{background:rgba(251,113,133,.14);border-color:var(--tm-fail)}
[data-tm-root] .tm-btn--skip{border-color:rgba(163,170,181,.5);color:var(--tm-skip)}
[data-tm-root] .tm-btn--skip:hover{background:rgba(163,170,181,.14);border-color:var(--tm-skip)}
[data-tm-root] .tm-input,[data-tm-root] .tm-textarea{width:100%;font:inherit;font-size:12.5px;color:var(--tm-text);background:rgba(255,255,255,.03);
  border:1px solid var(--tm-line);border-radius:7px;padding:7px 9px}
[data-tm-root] .tm-input:focus,[data-tm-root] .tm-textarea:focus{outline:none;border-color:var(--tm);box-shadow:0 0 0 3px var(--tm-line-soft)}
[data-tm-root] .tm-textarea{min-height:58px;resize:vertical;line-height:1.5}
[data-tm-root] .tm-label{display:block;font-size:12px;color:var(--tm-mute);margin:8px 0 4px}
[data-tm-root] .tm-err{margin-top:8px;padding:7px 9px;border-radius:6px;background:rgba(251,113,133,.12);border:1px solid rgba(251,113,133,.35);color:#ffd3da;font-size:12px}
[data-tm-root] .tm-ok{margin-top:8px;padding:7px 9px;border-radius:6px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:#c9f7e5;font-size:12px}
[data-tm-root] .tm-gapnote{padding:7px 9px;border:1px dashed var(--tm-gap);border-radius:6px;color:var(--tm-gap);font-size:12px}
[data-tm-root] .tm-kv{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px}
[data-tm-root] .tm-kv dt{color:var(--tm-dim)}
[data-tm-root] .tm-kv dd{margin:0}
[data-tm-root] .tm-seg{display:inline-flex;border:1px solid var(--tm-line);border-radius:6px;overflow:hidden}
[data-tm-root] .tm-seg button{padding:3px 9px;font-size:11.5px;color:var(--tm-mute)}
[data-tm-root] .tm-seg button[aria-pressed=true]{background:var(--tm);color:var(--tm-ink);font-weight:600}
[data-tm-root] .tm-copy{font-family:var(--tm-mono);font-size:10.5px;color:var(--tm-mute);border:1px solid var(--tm-line-soft);border-radius:4px;padding:1px 6px}
[data-tm-root] .tm-copy:hover{color:var(--tm);border-color:var(--tm)}

/* ── 弹层（徽标点开） ── */
[data-tm-root] .tm-pop{position:fixed;z-index:9010;width:min(400px,calc(100vw - 16px));max-height:min(70vh,560px);display:flex;flex-direction:column;border-radius:10px;overflow:hidden}
[data-tm-root] .tm-pop--sheet{left:8px;right:8px;bottom:calc(46px + var(--tm-nav));top:auto;width:auto;border-radius:12px}
[data-tm-root] .tm-pop .tm-body{flex:1}

/* ── 清单抽屉 ── */
[data-tm-root] .tm-drawer{position:fixed;top:0;right:0;bottom:0;z-index:9005;width:min(420px,100vw);display:flex;flex-direction:column;border-width:0 0 0 1px}
@media (max-width:639px){[data-tm-root] .tm-drawer{top:auto;left:0;bottom:calc(var(--tm-nav) + 46px);max-height:70vh;border-width:1px 0 0;border-radius:12px 12px 0 0}}
[data-tm-root] .tm-counts{display:flex;flex-wrap:wrap;gap:4px 10px;font-family:var(--tm-mono);font-size:11px;color:var(--tm-mute)}
[data-tm-root] .tm-counts b{color:var(--tm-text);font-weight:600}
[data-tm-root] .tm-marker-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 6px;border-radius:6px;font-size:12.5px}
[data-tm-root] .tm-marker-row:hover{background:var(--tm-line-soft)}
[data-tm-root] .tm-marker-row .tm-mono{color:var(--tm)}
[data-tm-root] .tm-marker-row--gap .tm-mono{color:var(--tm-gap)}
[data-tm-root] .tm-marker-row--unknown .tm-mono{color:var(--tm-warn)}
[data-tm-root] .tm-chip--out{border-style:dashed;color:var(--tm-dim)}
[data-tm-root] .tm-drawer .tm-body{padding-bottom:56px}
[data-tm-root] .tm-counts-gap{display:inline-flex;gap:3px;font:inherit;color:var(--tm-warn);border-bottom:1px dashed rgba(251,191,36,.5)}
[data-tm-root] .tm-counts-gap b{color:var(--tm-warn)}
[data-tm-root] .tm-counts-gap:hover{color:#fde68a}
[data-tm-root] .tm-tick{font-family:var(--tm-mono);flex:none;width:1.2em;text-align:center}
[data-tm-root] .tm-tick--ok{color:var(--tm-pass)}
[data-tm-root] .tm-tick--no{width:auto;font-size:10.5px;line-height:16px;padding:0 4px;color:var(--tm-warn);border:1px solid rgba(251,191,36,.45);border-radius:3px;margin-top:1px}
[data-tm-root] .tm-clause--no .tm-row{border:1px dashed rgba(251,191,36,.45);border-radius:6px}
[data-tm-root] .tm-clause--no .tm-row-q{color:var(--tm-text)}
[data-tm-root] .tm-details summary{display:flex;align-items:center;gap:8px;margin:12px 0 6px;cursor:pointer;list-style:none}
[data-tm-root] .tm-details summary::-webkit-details-marker{display:none}
[data-tm-root] .tm-details summary::before{content:'▸';font-size:10px;color:var(--tm-dim)}
[data-tm-root] .tm-details[open] summary::before{content:'▾'}
[data-tm-root] .tm-details--fold{margin-top:10px}
[data-tm-root] .tm-details--fold summary{margin:0 0 4px}
[data-tm-root] .tm-filter{display:flex;gap:6px;margin-left:auto}

/* ── 导测 ── */
[data-tm-root] .tm-dock{position:fixed;left:12px;bottom:12px;z-index:9006;width:min(440px,calc(100vw - 24px));max-height:min(80vh,720px);display:flex;flex-direction:column;border-radius:12px;overflow:hidden}
[data-tm-root] .tm-dock--right{left:auto;right:12px;bottom:56px}
@media (max-width:639px){[data-tm-root] .tm-dock{left:0;right:0;bottom:calc(var(--tm-nav) + 46px);width:100%;max-height:58vh;border-radius:12px 12px 0 0;border-width:1px 0 0}[data-tm-root] .tm-dock .tm-block-b{line-height:1.5}[data-tm-root] .tm-dock .tm-foot{flex-wrap:wrap}[data-tm-root] .tm-dock .tm-foot .tm-actions{margin-top:0}}
[data-tm-root] .tm-steps-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
[data-tm-root] .tm-steps-nav{display:flex;gap:2px}
[data-tm-root] .tm-jlist{display:flex;flex-direction:column;gap:2px}
[data-tm-root] .tm-jrow{display:grid;grid-template-columns:2.4em 1fr auto;gap:8px;align-items:center;width:100%;padding:6px 8px;border-radius:7px;font-size:12.5px}
[data-tm-root] .tm-jrow:hover{background:var(--tm-line-soft)}
[data-tm-root] .tm-jrow-n{font-family:var(--tm-mono);font-size:11px;color:var(--tm-mute)}
[data-tm-root] .tm-jrow-t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-tm-root] .tm-jrow-p{font-family:var(--tm-mono);font-size:10.5px;color:var(--tm-dim)}
[data-tm-root] .tm-jrow-p.tm-done{color:var(--tm-pass)}
[data-tm-root] .tm-bar{grid-column:2/4;height:2px;background:var(--tm-line-soft);border-radius:1px;overflow:hidden;margin-top:-2px}
[data-tm-root] .tm-bar i{display:block;height:100%;background:var(--tm)}
[data-tm-root] .tm-steps{display:flex;gap:4px;flex-wrap:wrap}
[data-tm-root] .tm-step{width:24px;height:22px;border-radius:5px;border:1px solid var(--tm-line-soft);font-family:var(--tm-mono);font-size:11px;display:inline-flex;align-items:center;justify-content:center;color:var(--tm-mute)}
[data-tm-root] .tm-step[aria-current=step]{border-color:var(--tm);color:var(--tm);font-weight:600}
[data-tm-root] .tm-step--pass{background:rgba(52,211,153,.18);color:var(--tm-pass)}
[data-tm-root] .tm-step--fail{background:rgba(251,113,133,.18);color:var(--tm-fail)}
[data-tm-root] .tm-step--skip{background:rgba(163,170,181,.18);color:var(--tm-skip)}
[data-tm-root] .tm-block{margin-top:10px}
[data-tm-root] .tm-block-t{font-size:11.5px;color:var(--tm-mute);margin-bottom:2px}
[data-tm-root] .tm-block-b{font-size:13px;line-height:1.6}
[data-tm-root] .tm-block--action .tm-block-b{font-weight:600;color:#fff}
[data-tm-root] .tm-block--aside{padding:7px 9px;border-left:2px solid var(--tm-line);background:var(--tm-line-soft);border-radius:0 6px 6px 0;font-size:12.5px}
[data-tm-root] .tm-block--known{border-left-color:var(--tm-warn)}
[data-tm-root] .tm-block--human{border-left-color:#c084fc}
[data-tm-root] .tm-hint{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;padding:7px 9px;border:1px dashed var(--tm-line);border-radius:7px;font-size:12px;color:var(--tm-mute)}
[data-tm-root] .tm-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
[data-tm-root] .tm-foot{display:flex;align-items:center;gap:6px;padding:8px 14px;border-top:1px solid var(--tm-line-soft)}
[data-tm-root] .tm-summary{display:flex;gap:14px;font-family:var(--tm-mono);font-size:12px;margin:8px 0}

/* ── 身份 / 提示 ── */
[data-tm-root] .tm-scrim{position:fixed;inset:0;z-index:9020;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}
[data-tm-root] .tm-modal{width:min(380px,100%);border-radius:12px;overflow:hidden}
[data-tm-root] .tm-toast{position:fixed;left:12px;bottom:calc(24px + var(--tm-dock,0px));z-index:9040;width:min(400px,calc(100vw - 24px));padding:10px 12px;border-radius:9px;font-size:12.5px;line-height:1.5}
@media (max-width:639px){[data-tm-root] .tm-toast{top:12px;bottom:auto;left:12px;right:12px;width:auto}}
[data-tm-root] .tm-toast--err{border-color:rgba(251,113,133,.5)}
@media (prefers-reduced-motion:reduce){[data-tm-root] *{transition:none!important;animation:none!important}}
`
