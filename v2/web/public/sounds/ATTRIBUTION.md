# Selected reward audio

`reward-cashout-b.wav` is the exact **B · 原速 · 收高频** selected by the user
from session `01a08aa3-7398-7fa2-b7c1-224e32a64388`.

Copied unchanged from:
`/home/kesou/axiia-cup-sound-effects-plan-20260910/v2/web/src/demos/rewards/assets/coin7-B.wav`.

SHA-256: `43ee4c05e2b9a9837c7050ad871a53db1cedd25dd4bf4112770be95309d81b63`.
Stereo, 44.1 kHz, 16-bit PCM, 15,613 frames, 0.3540362811791383 seconds.

The source session processed the Balatro `coin7` sample from a third-party
[game-source mirror](https://github.com/Jofr3/balatro-source/blob/main/resources/sounds/coin7.ogg),
retrieved 2026-09-10. The mirrored
[cash_out callback](https://github.com/Jofr3/balatro-source/blob/main/functions/button_callbacks.lua)
triggers coin7. This mirror is not a publisher-verified release.

Source processing: original speed, Web Audio low-pass at 4,200 Hz with Q 0.5,
44-frame attack fade and 220-frame release fade, RMS matched to decoded original
with a 0.9 peak cap. This worktree applies no additional filtering, pitch shift,
resynthesis, or level normalization. Payout playback now uses three times the
master volume, capped at unity gain to preserve sample headroom; at the default
25% master volume it plays at 75%. Master mute still applies.

This is a derivative of game audio, not an original Axiia recording or a CC0
asset. Original audio remains attributed to its respective game/audio owners.
The previous generated reward candidates and their generators were removed.
