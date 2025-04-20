"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-center text-gray-900">
            About Sobrkey
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              Sobrkey is a decentralized community built on the Nostr protocol. It's a space for individuals navigating sobriety, recovery, and personal growth — powered by connection, anonymity, and support.
            </p>
            
            <p>
              The platform is inspired by the principles of the 12-step program but reimagined for an open, peer-driven world. Here, you can journal privately, reflect publicly, or just listen. Whether you're at day one or year ten, you're welcome here.
            </p>
            
            <p>
              We believe in permissionless support, personal agency, and building tools that heal. You're not alone.
            </p>
            
            <div className="mt-8 space-y-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-lg">💬</span>
                <span>Powered by Nostr + Mira, the AI companion</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚡</span>
                <span>Zaps optional, support is free</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🛠️</span>
                <span>Built with care, not for profit</span>
              </div>
            </div>
          </div>
          
          <div className="pt-8 text-center">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 