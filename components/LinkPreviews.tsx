"use client"

import { LinkPreview } from "./LinkPreview"

interface LinkPreviewsProps {
  urls: string[]
  className?: string
}

export function LinkPreviews({ urls, className = "" }: LinkPreviewsProps) {
  if (!urls || urls.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {urls.map((url, index) => (
        <LinkPreview key={index} url={url} />
      ))}
    </div>
  )
}
