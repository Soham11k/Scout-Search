/** Shared bookmark row shape (Supabase `bookmarks` table). */
export type Bookmark = {
  id: string
  user_id: string
  title: string
  url: string
  description?: string
  favicon_url?: string
  created_at: string
}
