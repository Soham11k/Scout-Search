import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

export function getSql(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (!_sql) _sql = neon(url)
  return _sql
}

export function hasNeon() {
  return Boolean(process.env.DATABASE_URL)
}
