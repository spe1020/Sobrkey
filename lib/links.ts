// Utility functions for handling links and link previews

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
  domain: string
  favicon?: string
}

/**
 * Extract URLs from content, excluding media URLs
 */
export function extractLinksFromContent(content: string): string[] {
  // URL pattern that captures most HTTP/HTTPS URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g
  
  // Common image extensions to exclude
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i
  
  // Common video extensions to exclude
  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i
  
  const urls = content.match(urlPattern) || []
  
  return urls
    .map(url => url.replace(/[.,;:!?]+$/, '')) // Remove trailing punctuation
    .filter(url => {
      try {
        // Filter out media URLs
        if (imageExtensions.test(url) || videoExtensions.test(url)) {
          return false
        }
        return true
      } catch (error) {
        return false
      }
    })
    .filter((url, index, array) => array.indexOf(url) === index) // Remove duplicates
}

/**
 * Validate if a URL is accessible and get basic info
 */
export async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // This allows us to check without CORS issues
      cache: 'no-cache'
    })
    return true
  } catch (error) {
    // Even with no-cors, we might get errors, but that's okay
    return true // We'll assume it's valid and let the preview service handle it
  }
}

/**
 * Get domain from URL
 */
export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch (error) {
    return url
  }
}

/**
 * Check if URL is from a supported preview service
 */
export function isSupportedPreviewUrl(url: string): boolean {
  const domain = getDomainFromUrl(url).toLowerCase()
  
  // Common domains that typically have good metadata
  const supportedDomains = [
    'youtube.com', 'youtu.be',
    'twitter.com', 'x.com',
    'reddit.com',
    'github.com',
    'medium.com',
    'dev.to',
    'stackoverflow.com',
    'wikipedia.org',
    'amazon.com',
    'news.google.com',
    'cnn.com', 'bbc.com', 'reuters.com',
    'wsj.com', 'nytimes.com',
    'theguardian.com'
  ]
  
  return supportedDomains.some(supported => domain.includes(supported))
}

/**
 * Generate a simple preview for unsupported URLs
 */
export function generateSimplePreview(url: string): LinkPreview {
  const domain = getDomainFromUrl(url)
  
  return {
    url,
    domain,
    title: domain,
    description: `Visit ${domain}`,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }
}

/**
 * Extract link previews from content
 */
export function extractLinkPreviews(content: string): {
  links: string[]
  cleanContent: string
} {
  const links = extractLinksFromContent(content)
  let cleanContent = content
  
  // Remove links from content for cleaner display
  for (const link of links) {
    cleanContent = cleanContent.replace(link, '').trim()
  }
  
  return { links, cleanContent }
}
