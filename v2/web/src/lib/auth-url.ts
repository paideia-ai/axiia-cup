import { loginReturnPath } from './login-return'

export function inviteFromSearch(search: string): string {
  return new URLSearchParams(search).get('invite')?.trim() ?? ''
}

/** Carry poster invites and the existing safe return path between auth pages. */
export function authUrl(
  path: '/login' | '/register',
  search: string,
): string {
  const params = new URLSearchParams()
  const invite = inviteFromSearch(search)
  if (invite) params.set('invite', invite)
  if (new URLSearchParams(search).has('next')) {
    params.set('next', loginReturnPath(search))
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
