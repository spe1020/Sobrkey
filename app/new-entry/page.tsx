"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

export default function NewEntryPage() {
  const [content, setContent] = useState("")
  const router = useRouter()

  const handleSave = () => {
    if (!content.trim()) return

    const entries = JSON.parse(localStorage.getItem("journalEntries") || "[]")
    const newEntry = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: Date.now(),
    }

    localStorage.setItem(
      "journalEntries",
      JSON.stringify([newEntry, ...entries])
    )

    router.push("/journal")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/journal")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">New Journal Entry</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="min-h-[300px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!content.trim()}>
                Save Entry
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 