type Entry = { at: number; payload: Record<string, unknown> }

const store = new Map<string, Entry>()
const TTL_MS = 5 * 60 * 1000

function keyOf(q: string) {
  return q.trim().toLowerCase()
}

export function getSearchCache(query: string): Record<string, unknown> | null {
  const k = keyOf(query)
  const e = store.get(k)
  if (!e) return null
  if (Date.now() - e.at > TTL_MS) {
    store.delete(k)
    return null
  }
  return e.payload
}

export function setSearchCache(query: string, payload: Record<string, unknown>) {
  store.set(keyOf(query), { at: Date.now(), payload })
}
