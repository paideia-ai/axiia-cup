// Exact selected B asset from session 01a08aa3-7398-7fa2-b7c1-224e32a64388.
// See public/sounds/ATTRIBUTION.md for identity and provenance.
export const REWARD_SOUNDS = [{
  id: 'cashout-b',
  name: '原速 · 收高频',
  description: '已选 B：保留提现原声的速度和碰撞节奏，减弱高频。',
  times: [0.02],
  finalAt: 0.08,
  duration: 15613 / 44100,
  asset: '/sounds/reward-cashout-b.wav',
}] as const
export type RewardSoundID = typeof REWARD_SOUNDS[number]['id']
export const rewardSound = (_id: RewardSoundID) => REWARD_SOUNDS[0]
