# Sound provenance

The save, dispatch, output, completion, hover and click cues preserve the
approved **清透轻点** synthesis, including the 65 ms low output tap. The
reference is
[the complete journey demo](https://axiia-sound-journey-demo.vercel.app/),
including its subsequent background-completion correction.

The reward is the exact selected **B · 原速 · 收高频** stereo WAV, with playback
at three times the master gain, capped at unity (75% at the default 25% master
volume). It is not resynthesized, filtered again or normalized. Its SHA-256 is
`43ee4c05e2b9a9837c7050ad871a53db1cedd25dd4bf4112770be95309d81b63`. See
[the asset attribution](../../public/sounds/ATTRIBUTION.md) for its Balatro
sample origin and processing. This derivative game sample is not original Axiia
or CC0 audio. The user explicitly requested this approved demo asset for PR #174
on 2026-09-14, superseding the PR's synthesized replacement.

`typing/audio.ts`, `typing/feedback.ts`, `typing/typing.css` and
`components/typing-feedback.tsx` incorporate the selected **弹性短线 + 柔音**
experience from session `01a08acd-b96b-7512-93ee-9aebd8d69e30` via the complete
journey demo. The typing renderer is extracted without changing its samples: 75
ms typing/deletion/paste, softer paste, and a longer lower enter cue. The
builder retains the native textarea and adds its decorative underline, workspace
styling and separate typing mute/volume controls under the global master.

`approved-sounds.test.ts` checks the WAV hash and frozen typing waveform hashes.
The Gherkin browser tests check actual audio starts, reward channels/gain,
background completion, mute, IME, caret and button interactions. Human listening
and Safari/iOS verification remain separate from these automated checks.
