"use client"

import { useState } from "react"
import { MediaItem } from "@/app/types/nostr"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { X, Play, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MediaDisplayProps {
  media: MediaItem[]
  className?: string
}

export function MediaDisplay({ media, className = "" }: MediaDisplayProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (!media || media.length === 0) {
    return null
  }

  const handleMediaClick = (mediaItem: MediaItem) => {
    setSelectedMedia(mediaItem)
    setIsDialogOpen(true)
  }

  const handleDownload = (mediaItem: MediaItem) => {
    const link = document.createElement('a')
    link.href = mediaItem.url
    link.download = mediaItem.url.split('/').pop() || 'media'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {media.map((mediaItem, index) => (
        <div key={index} className="relative group">
          {mediaItem.type === 'image' ? (
            <div className="relative">
              <img
                src={mediaItem.url}
                alt={mediaItem.alt || `Image ${index + 1}`}
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleMediaClick(mediaItem)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(mediaItem)
                    }}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                src={mediaItem.url}
                className="max-w-full h-auto rounded-lg cursor-pointer"
                onClick={() => handleMediaClick(mediaItem)}
                controls={false}
                preload="metadata"
                onError={(e) => {
                  const target = e.target as HTMLVideoElement
                  target.style.display = 'none'
                }}
              >
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2">
                  <Play className="h-6 w-6 text-gray-800" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(mediaItem)
                    }}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Full-screen media dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedMedia && (
              <div className="flex items-center justify-center min-h-[400px]">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.alt || 'Full size image'}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    className="max-w-full max-h-[80vh]"
                    controls
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
