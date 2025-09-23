"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Note, Comment } from "@/types/nostr"
import { MediaDisplay } from "@/components/MediaDisplay"
import { LinkPreviews } from "@/components/LinkPreviews"

interface CommentThreadProps {
  note: Note
  onComment: (content: string, parentId?: string) => Promise<void>
}

export function CommentThread({ note, onComment }: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyInput, setReplyInput] = useState('')
  const [commentInput, setCommentInput] = useState('')

  const handleReply = async (content: string, parentId: string) => {
    await onComment(content, parentId)
    setReplyingTo(null)
    setReplyInput('')
  }

  const handleComment = async (content: string) => {
    await onComment(content)
    setCommentInput('')
  }

  const renderComment = (comment: Comment, depth = 0) => {
    const isReply = comment.tags?.some((tag: string[]) => tag[0] === 'e' && tag[2] === 'reply')
    const parentId = comment.tags?.find((tag: string[]) => tag[0] === 'e' && tag[2] === 'reply')?.[1]

    return (
      <div key={comment.id} className={`pl-${depth * 4} border-l-2 border-purple-200`}>
        <div className="flex items-start space-x-2 p-2">
          <div className="flex-1">
            <div className="text-sm text-gray-500">
              {comment.pubkey.slice(0, 8)}...{comment.pubkey.slice(-8)}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{comment.cleanContent || comment.content}</div>
            
            {/* Display media if present */}
            {comment.media && comment.media.length > 0 && (
              <div className="mt-2">
                <MediaDisplay media={comment.media} />
              </div>
            )}
            
            {/* Display link previews if present */}
            {comment.links && comment.links.length > 0 && (
              <div className="mt-2">
                <LinkPreviews urls={comment.links} />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => setReplyingTo(comment.id)}
            >
              Reply
            </Button>
          </div>
        </div>

        {replyingTo === comment.id && (
          <div className="ml-4 mt-2">
            <Input
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Write a reply..."
              className="mb-2"
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleReply(replyInput, comment.id)}
                disabled={!replyInput.trim()}
              >
                Post Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyInput('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {comment.tags?.filter(tag => tag[0] === 'e' && tag[2] === 'reply' && tag[1] === comment.id)
          .map(tag => comments.find(c => c.id === tag[3]))
          .filter(Boolean)
          .map((reply: Comment) => renderComment(reply, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder="Write a comment..."
        />
        <Button
          onClick={() => handleComment(commentInput)}
          disabled={!commentInput.trim()}
        >
          Post Comment
        </Button>
      </div>

      <div className="space-y-4">
        {note.comments?.map((comment: Comment) => renderComment(comment))}
      </div>
    </div>
  )
} 