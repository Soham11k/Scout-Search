/** Shared shapes for /api/search and the results UI */

export type SearchResult = {
  title: string
  url: string
  description: string
  displayUrl: string
  favicon: string
  /** Page preview image from Google pagemap / og:image, or demo placeholder */
  image?: string
}

export type ImageStripItem = {
  /** Full-size image URL (open in new tab) */
  url: string
  /** Thumbnail for the strip */
  thumbnail: string
  title: string
  source: string
}
