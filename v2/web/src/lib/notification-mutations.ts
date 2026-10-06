import type { NotificationDTO } from '../api/types'

export interface NotificationMutations {
  readIDs: ReadonlySet<number>
  clearedIDs: ReadonlySet<number>
}

export function applyNotificationMutations(
  rows: NotificationDTO[],
  mutations: NotificationMutations,
): NotificationDTO[] {
  return rows.filter((row) => !mutations.clearedIDs.has(row.id)).map((row) =>
    !row.read && mutations.readIDs.has(row.id) ? { ...row, read: true } : row
  )
}
