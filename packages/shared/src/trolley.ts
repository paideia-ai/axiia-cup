export const TROLLEY_SCENARIO_ID = 'trolley-problem'

export const trolleyCases = [
  {
    id: 'A',
    title: '原始电车',
    description:
      '一辆失控电车正驶向主轨上的五个人。你是驾驶员，唯一能做的是把电车转向一条岔轨；岔轨上有一个人。若不转向，五人死；若转向，一人死。',
    imageSrc: '/scenario-assets/trolley-problem/trolley-original.png',
    isFixed: true,
  },
  {
    id: 'B',
    title: '器官移植',
    description:
      '五个病人分别需要不同器官才能活命；一个健康人恰好器官匹配。医生可以杀死这个健康人，取其器官救五人。若医生不这样做，五名病人会死亡。',
    imageSrc: '/scenario-assets/trolley-problem/hospital.png',
    isFixed: false,
  },
  {
    id: 'C',
    title: '地下室婴儿',
    description:
      '战争中，五名被搜捕者躲在地下室，地下室中另有一个哭泣的婴儿。外面的士兵正在搜查。如果婴儿继续哭，五名被搜捕者一定会被发现并处死。唯一确定能阻止哭声的方式是杀死婴儿。',
    imageSrc: '/scenario-assets/trolley-problem/army.png',
    isFixed: false,
  },
  {
    id: 'D',
    title: '自动驾驶车',
    description:
      '一辆自动驾驶车刹车失灵。它若保持直行，会撞死五名行人；若转向，会撞死车内的一名乘客。系统的选择是预先设置好的。',
    imageSrc: '/scenario-assets/trolley-problem/auto-driving.png',
    isFixed: false,
  },
  {
    id: 'E',
    title: '缸中之脑',
    description:
      '一辆电车刹车失灵，你必须在两条路线中选择一条。路线 A：电车撞向轨道上的一名维修工，他会死亡。路线 B：电车撞向缸中之脑的接口，使缸中之脑体验到五个人被电车撞死时的恐惧和疼痛，但没有真实身体死亡。',
    imageSrc: '/scenario-assets/trolley-problem/brain-in-vat.png',
    isFixed: false,
  },
] as const

export type TrolleyCaseId = (typeof trolleyCases)[number]['id']

export const trolleyFixedCaseIds = ['A'] as const satisfies TrolleyCaseId[]
export const trolleyRandomCaseIds = [
  'B',
  'C',
  'D',
  'E',
] as const satisfies TrolleyCaseId[]

export const trolleyCasesPerMatch = 3

export function getTrolleyCasesByIds(caseIds: readonly string[]) {
  return caseIds
    .map((caseId) => trolleyCases.find((item) => item.id === caseId))
    .filter((item): item is (typeof trolleyCases)[number] => Boolean(item))
}

export function getTrolleyCaseById(caseId: string) {
  return trolleyCases.find((item) => item.id === caseId) ?? null
}

export function formatTrolleyCasesForPrompt(caseIds: readonly string[]) {
  const cases = getTrolleyCasesByIds(caseIds)

  return cases
    .map((item) => `${item.id}. ${item.title}\n${item.description}`)
    .join('\n\n')
}

export function formatTrolleyCaseForPrompt(caseId: string) {
  const item = getTrolleyCaseById(caseId)

  return item ? `${item.id}. ${item.title}\n${item.description}` : ''
}
