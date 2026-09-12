# Sound provenance

The save, dispatch, output and completion cues retain Keso's original
synthesized **清透轻点** palette and 65 ms low output tap, reviewed in the
September 10 demo at
[commit c28c9a8](https://github.com/paideia-ai/axiia-cup/commit/c28c9a87d8519415809a26b5dc0cc378722a5238).
`sound.ts` generates and caches the buffers with no external audio assets.

The production reward flourish is an original synthesized four-note collection
cue. The demo's `reward-cashout-b.wav` is not included: its attribution
identifies a processed game sample from an unofficial Balatro source mirror.
Slay the Spire and Balatro remain references for tactile timing, not sources of
shipped audio.

The Storybook `v4/Sound feedback` story provides all nine auditions. Typing and
deletion add two original quiet taps; hover/click retain the demo’s clear tonal
family. There is no looping background music. Unit and browser tests verify
event policy, controls and buffer properties; headphone and phone-speaker
listening are separate subjective validation.
