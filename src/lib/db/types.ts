import type { Card } from '@/lib/gemini/curate'

export type DbBundle = {
  id: string
  bundle_date: string
  prompt_version: string
  source_count: number
  created_at: string
}

export type DbCard = {
  id: string
  bundle_id: string
  position: number
  category: Card['category']
  title: string
  summary: string[]
  why_matters: string
  url: string
  source_title: string | null
  created_at: string
}

/** Card with DB id, used for rendering + view tracking. */
export type ViewableCard = Card & { id: string }

export type BundleWithCards = {
  bundle: DbBundle
  cards: ViewableCard[]
}
