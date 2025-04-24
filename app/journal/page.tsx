"use client"

import { BookOpen } from "lucide-react"

export default function JournalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">Private Journal</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Coming soon: A private journal that only you can access using your secure key.
                Your entries will be encrypted and stored securely, ensuring complete privacy.
              </p>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  Your journal entries will be:
                </p>
                <ul className="mt-2 space-y-2 text-sm text-purple-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>End-to-end encrypted using your private key</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Accessible only through your secure authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Stored securely with zero-knowledge encryption</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 