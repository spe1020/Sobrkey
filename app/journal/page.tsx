"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface JournalEntry {
  id: string
  content: string
  timestamp: number
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const router = useRouter()

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("journalEntries")
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries)
        setEntries(parsedEntries)
      } catch (error) {
        console.error("Failed to parse journal entries:", error)
        // If parsing fails, reset to empty array
        setEntries([])
      }
    }
  }, []) // Empty dependency array means this only runs once on mount

  const handleNewEntry = () => {
    router.push("/new-entry")
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
          <Button onClick={handleNewEntry}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>

        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No journal entries yet. Start writing!
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
              >
                <div className="text-sm text-gray-500 mb-2">
                  {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                </div>
                <p className="text-gray-900 whitespace-pre-wrap">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 