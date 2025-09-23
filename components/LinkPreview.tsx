"use client"

import { useState, useEffect } from "react"
import { LinkPreview as LinkPreviewType } from "@/lib/links"
import { ExternalLink, Globe, Image as ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LinkPreviewProps {
  url: string
  className?: string
}

interface PreviewData {
  url: string
  title?: string
  description?: string
  image?: string
  domain: string
  favicon?: string
}

export function LinkPreview({ url, className = "" }: LinkPreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setIsLoading(true)
        setError(false)
        
        // For now, we'll create a simple preview
        // In a production app, you'd want to use a link preview service
        const domain = new URL(url).hostname
        
        const preview: PreviewData = {
          url,
          domain,
          title: domain,
          description: `Visit ${domain}`,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        }
        
        // Try to fetch basic metadata
        try {
          const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
          if (response.ok) {
            const data = await response.json()
            if (data.title) preview.title = data.title
            if (data.description) preview.description = data.description
            if (data.image) preview.image = data.image
          }
        } catch (error) {
          console.log('Link preview API not available, using basic preview')
        }
        
        setPreviewData(preview)
      } catch (error) {
        console.error('Error fetching link preview:', error)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [url])

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !previewData) {
    return (
      <div className={className}>
        <Card 
          className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={handleClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {url}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Click to visit
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card 
        className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Favicon */}
            <div className="flex-shrink-0">
              {previewData.favicon ? (
                <img
                  src={previewData.favicon}
                  alt=""
                  className="w-4 h-4 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <Globe className="w-4 h-4 text-gray-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {previewData.title || previewData.domain}
              </h4>
              
              {previewData.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {previewData.description}
                </p>
              )}
              
              <p className="text-xs text-gray-400 mt-1 truncate">
                {previewData.domain}
              </p>
            </div>

            {/* External link icon */}
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
          </div>

          {/* Preview image */}
          {previewData.image && (
            <div className="mt-3 rounded overflow-hidden">
              <img
                src={previewData.image}
                alt={previewData.title || 'Preview'}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
