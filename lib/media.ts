// Utility functions for handling media in Nostr notes

export interface MediaItem {
  type: 'image' | 'video'
  url: string
  alt?: string
}

/**
 * Extract images and videos from note content
 * Supports common image and video URL patterns
 */
export function extractMediaFromContent(content: string): {
  media: MediaItem[]
  cleanContent: string
} {
  const media: MediaItem[] = []
  let cleanContent = content

  // Common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i
  
  // Common video extensions
  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i
  
  // URL pattern that captures most HTTP/HTTPS URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g
  
  const urls = content.match(urlPattern) || []
  
  for (const url of urls) {
    try {
      // Clean URL by removing any trailing punctuation
      const cleanUrl = url.replace(/[.,;:!?]+$/, '')
      
      if (imageExtensions.test(cleanUrl)) {
        media.push({
          type: 'image',
          url: cleanUrl,
          alt: `Image from ${new URL(cleanUrl).hostname}`
        })
        // Remove the URL from content
        cleanContent = cleanContent.replace(url, '').trim()
      } else if (videoExtensions.test(cleanUrl)) {
        media.push({
          type: 'video',
          url: cleanUrl,
          alt: `Video from ${new URL(cleanUrl).hostname}`
        })
        // Remove the URL from content
        cleanContent = cleanContent.replace(url, '').trim()
      }
    } catch (error) {
      // Skip invalid URLs
      console.warn('Invalid URL found in content:', url)
    }
  }
  
  return { media, cleanContent }
}

/**
 * Check if a URL is a valid image
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i
  return imageExtensions.test(url)
}

/**
 * Check if a URL is a valid video
 */
export function isVideoUrl(url: string): boolean {
  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i
  return videoExtensions.test(url)
}

/**
 * Get a thumbnail or preview for a video URL
 * This could be enhanced to support video thumbnails from various services
 */
export function getVideoThumbnail(videoUrl: string): string | null {
  // For now, return null - could be enhanced to support video thumbnails
  return null
}
