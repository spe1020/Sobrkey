"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Zap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CommentThread } from "./CommentThread"
import { Note, Comment } from "@/types/nostr"

interface NoteCardProps {
  note: Note
  onComment: (noteId: string, content: string, parentCommentId?: string) => Promise<void>
  onZap: (noteId: string, amount: number, comment?: string) => Promise<void>
  expandedComments: { [key: string]: boolean }
  onToggleComments: (noteId: string) => void
  aggregatedNotes: { [key: string]: { comments: number, zaps: number } }
}

export function NoteCard({
  note,
  onComment,
  onZap,
  expandedComments,
  onToggleComments,
  aggregatedNotes
}: NoteCardProps) {
  const [zapAmount, setZapAmount] = useState("")
  const [zapComment, setZapComment] = useState("")
  const [commentInput, setCommentInput] = useState("")

  const handleZap = async () => {
    const amount = parseInt(zapAmount)
    if (isNaN(amount) || amount <= 0) return
    await onZap(note.id, amount, zapComment)
    setZapAmount("")
    setZapComment("")
  }

  const handleComment = async () => {
    if (!commentInput.trim()) return
    await onComment(note.id, commentInput)
    setCommentInput("")
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div 
        className="p-6 cursor-pointer"
        onClick={() => onToggleComments(note.id)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="text-xs text-gray-500">
            {new Date(note.created_at * 1000).toLocaleString()}
          </div>
          <div className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            {note.pubkey.slice(-4)}
          </div>
        </div>
        <p className="text-gray-900 whitespace-pre-wrap text-base mb-4">{note.content}</p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600" onClick={e => e.stopPropagation()}>
          <div className="flex items-center space-x-1.5">
            <MessageCircle className="h-4 w-4" />
            <span>{aggregatedNotes[note.id]?.comments || 0}</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors">
                <Zap className="h-4 w-4" />
                <span>{aggregatedNotes[note.id]?.zaps || 0}</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Zap</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount (sats)</label>
                  <Input
                    type="number"
                    value={zapAmount}
                    onChange={(e) => setZapAmount(e.target.value)}
                    placeholder="Enter amount in sats"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Comment (optional)</label>
                  <Input
                    value={zapComment}
                    onChange={(e) => setZapComment(e.target.value)}
                    placeholder="Add a comment with your zap"
                    className="mt-1"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleZap}
                  disabled={!zapAmount || parseInt(zapAmount) <= 0}
                >
                  Send Zap
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {expandedComments[note.id] && (
        <div className="border-t border-gray-100">
          <div className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment..."
                  className="text-sm pr-12"
                  onClick={e => e.stopPropagation()}
                />
                <Button 
                  size="sm"
                  className="absolute right-1 top-1 h-7"
                  onClick={handleComment}
                  disabled={!commentInput.trim()}
                >
                  Post
                </Button>
              </div>
              <CommentThread
                note={note}
                onComment={(content, parentId) => onComment(note.id, content, parentId)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 