import pb from '@/lib/pocketbase/client'
import type { UserAccount } from '@/types/mindmap'

function toUser(record: Record<string, unknown> | null): UserAccount | null {
  if (!record) return null
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    email: String(record.email ?? ''),
  }
}

export function getCurrentUser(): UserAccount | null {
  return toUser(pb.authStore.record as Record<string, unknown> | null)
}

export function subscribeToAuth(callback: (user: UserAccount | null) => void) {
  return pb.authStore.onChange(() => callback(getCurrentUser()), true)
}

export async function signIn(email: string, password: string) {
  const result = await pb.collection('users').authWithPassword(email, password)
  return toUser(result.record as unknown as Record<string, unknown>)
}

export async function signUp(name: string, email: string, password: string) {
  await pb.collection('users').create(
    {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      passwordConfirm: password,
      emailVisibility: true,
    },
    { requestKey: null },
  )
  return signIn(email, password)
}

export function signOut() {
  pb.authStore.clear()
}
