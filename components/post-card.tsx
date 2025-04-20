"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react"

interface PostCardProps {
  content: string
  timestamp: number
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onSave: () => void
}

export function PostCard({ content, timestamp, onLike, onComment, onShare, onSave }: PostCardProps) {
  const [swipeX, setSwipeX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnd = () => {
    if (Math.abs(swipeX) > 100) {
      if (swipeX > 0) {
        onSave()
      } else {
        onShare()
      }
    }
    setSwipeX(0)
    setIsDragging(false)
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      animate={{ x: swipeX }}
      className="bg-white rounded-lg shadow-sm p-4 mb-4 touch-none"
    >
      <div className="space-y-4">
        <p className="text-gray-900 text-base leading-relaxed">{content}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="p-2" onClick={onLike}>
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2" onClick={onComment}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2" onClick={onSave}>
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
          >
            <motion.div
              className="bg-green-100 text-green-600 px-4 py-2 rounded-lg"
              animate={{ opacity: swipeX > 50 ? 1 : 0 }}
            >
              Save
            </motion.div>
            <motion.div
              className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg"
              animate={{ opacity: swipeX < -50 ? 1 : 0 }}
            >
              Share
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 