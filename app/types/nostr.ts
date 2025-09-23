export interface MediaItem {
  type: 'image' | 'video'
  url: string
  alt?: string
}

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
  domain: string
  favicon?: string
}

export interface Note {
  id: string
  content: string
  created_at: number
  pubkey: string
  tags?: string[][]
  comments?: Comment[]
  media?: MediaItem[]
  links?: string[]
  cleanContent?: string
}

export interface Comment {
  id: string
  content: string
  created_at: number
  pubkey: string
  tags?: string[][]
  replies?: Comment[]
  media?: MediaItem[]
  links?: string[]
  cleanContent?: string
} 