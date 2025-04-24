export interface Note {
  id: string
  content: string
  created_at: number
  pubkey: string
  tags?: string[][]
  comments?: Comment[]
}

export interface Comment {
  id: string
  content: string
  created_at: number
  pubkey: string
  tags?: string[][]
  replies?: Comment[]
} 