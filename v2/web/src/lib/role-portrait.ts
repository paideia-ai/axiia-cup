import type { EmotionCategory } from '../api/types'
import type { SpeakerLabels } from '../components/timeline/labels'
import { speakerName } from '../components/timeline/labels'
import { roleByKey } from '../scenarios'
import { roleIdentity } from './role-identity'

// Vite fingerprints the 256px WebP artwork from PR #272.
const images = import.meta.glob<string>(
  '../assets/portraits/*/*.webp',
  { eager: true, query: '?url', import: 'default' },
)

const characters: Record<string, Record<string, string>> = {
  'shangyang-court': {
    '商鞅': 'shangyang',
    '甘龙': 'ganlong',
    '秦孝公': 'qin-xiaogong',
    'a': 'shangyang',
    'b': 'ganlong',
    'judge': 'qin-xiaogong',
  },
  'honnoji-decision': {
    '长宗我部元亲的密使': 'chosokabe-envoy',
    '长宗我部元亲阵营的密使': 'chosokabe-envoy',
    '足利义昭的使者': 'yoshiaki-envoy',
    '细川藤孝': 'hosokawa-fujitaka',
    '明智军中的足轻': 'ashigaru',
    '明智光秀': 'akechi-mitsuhide',
    'chosokabe': 'chosokabe-envoy',
    'yoshiaki': 'yoshiaki-envoy',
    'hosokawa': 'hosokawa-fujitaka',
    'ashigaru': 'ashigaru',
    'judge': 'akechi-mitsuhide',
  },
  'trolley-problem': {
    '奕仁': 'yiren',
    '武仁': 'wuren',
    '明理者': 'minglizhe',
    'a': 'yiren',
    'b': 'wuren',
    'judge': 'minglizhe',
  },
  'fengyiting-real': {
    '董卓': 'dongzhuo',
    '吕布': 'lvbu',
    '貂蝉': 'diaochan',
    '细作': 'spy',
    '董卓旧部': 'veteran',
    'a': 'dongzhuo',
    'b': 'lvbu',
    'judge': 'diaochan',
    'judge-aside': 'diaochan',
    'diaochan': 'diaochan',
    'spy': 'spy',
    'veteran': 'veteran',
  },
  'legal-harbor-murder-jury': {
    '林': 'lin',
    '苏': 'su',
    '陈岚': 'chen-lan',
    '魏笙': 'wei-sheng',
    '韩朔': 'han-shuo',
    '沈青': 'shen-qing',
    '杜临': 'du-lin',
    '孟遥': 'meng-yao',
    '方稚': 'fang-zhi',
    '蒋诚': 'jiang-cheng',
    '宁柏': 'ning-bai',
    '顾衡': 'gu-heng',
    '纪川': 'ji-chuan',
    'a': 'lin',
    'b': 'su',
    'j01': 'chen-lan',
    'j02': 'wei-sheng',
    'j03': 'han-shuo',
    'j04': 'shen-qing',
    'j05': 'du-lin',
    'j06': 'meng-yao',
    'j07': 'fang-zhi',
    'j08': 'jiang-cheng',
    'j09': 'ning-bai',
  },
}

const emotionNames: Record<EmotionCategory, string> = {
  E01: 'neutral',
  E02: 'resolute',
  E03: 'wary',
  E04: 'hesitant',
  E05: 'anxious',
  E06: 'angry',
  E07: 'scornful',
  E08: 'sad',
  E09: 'caring',
  E10: 'moved',
}

export function rolePortrait(
  labels: SpeakerLabels,
  speaker: string,
  category: EmotionCategory = 'E01',
): string | null {
  const scenario = labels.module?.slotID
  const roster = scenario ? characters[scenario] : null
  if (!roster) return null
  let key = speaker
  if (speaker === 'a' || speaker === 'b') {
    const identity = roleIdentity({
      scenarioID: scenario,
      side: speaker,
      role: labels.participants?.[speaker]?.role,
      speakers: labels.speakers,
      lanes: labels.lanes,
    })
    // A selectable faction alone cannot identify its portrait.
    if (!identity.resolved) return null
    key = identity.roleKey ?? speaker
  }
  key = roleByKey(labels.module, key)?.key ?? key
  const character = roster[key] ?? roster[speakerName(labels, speaker)]
  return character
    ? images[
      `../assets/portraits/${scenario}/${character}-${
        emotionNames[category]
      }.webp`
    ] ?? images[
      `../assets/portraits/${scenario}/${character}-neutral.webp`
    ] ?? null
    : null
}
