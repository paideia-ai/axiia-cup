import type { ScenarioModule } from './types'

export const honnojiDecision: ScenarioModule = {
  slotID: 'honnoji-decision',
  roles: [
    {
      key: 'chosokabe',
      name: '长宗我部元亲的密使',
      side: 'a',
      pitch: '带着四国的存亡而来，以外部压力和事后策应劝光秀今夜动手。',
    },
    {
      key: 'yoshiaki',
      name: '足利义昭的使者',
      side: 'a',
      pitch: '不带一兵一卒，只带名分：奉公方归洛，把兵变说成拨乱反正。',
    },
    {
      key: 'hosokawa',
      name: '细川藤孝',
      side: 'b',
      pitch:
        '与光秀交谊多年，逐一点名近畿诸将与公家的现实反应，问杀后谁承认你。',
    },
    {
      key: 'ashigaru',
      name: '明智军中的足轻',
      side: 'b',
      pitch: '身份低微，只说自己看得见的军令、夜行与军心，劝光秀不要夜袭。',
    },
  ],
  laneLabels: {
    chosokabe: '长宗我部元亲的密使',
    yoshiaki: '足利义昭的使者',
    hosokawa: '细川藤孝',
    ashigaru: '明智军中的足轻',
    judge: '明智光秀',
  },
}
