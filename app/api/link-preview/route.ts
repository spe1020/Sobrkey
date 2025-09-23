import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // Validate URL
    new URL(url)
    
    // For now, return basic metadata
    // In production, you'd want to use a proper link preview service like:
    // - LinkPreview.net API
    // - Microlink.io
    // - OpenGraph.io
    // - Or implement your own scraper
    
    const domain = new URL(url).hostname
    
    // Basic response - can be enhanced with actual scraping
    const response = {
      url,
      title: domain,
      description: `Visit ${domain}`,
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing link preview request:', error)
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
}

// Handle CORS for client-side requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
