"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function NewEntryPage() {
  const [content, setContent] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSave = () => {
    if (!content.trim()) return

    try {
      // Get existing entries with error handling
      let entries = []
      try {
        const savedEntries = localStorage.getItem("journalEntries")
        if (savedEntries) {
          entries = JSON.parse(savedEntries)
        }
      } catch (error) {
        console.error("Failed to load existing entries:", error)
        entries = []
      }

      // Create new entry
      const newEntry = {
        id: Date.now().toString(),
        content: content.trim(),
        timestamp: Date.now(),
      }

      // Save to localStorage with error handling
      try {
        localStorage.setItem(
          "journalEntries",
          JSON.stringify([newEntry, ...entries])
        )
        toast({
          title: "Success",
          description: "Journal entry saved successfully",
        })
        router.push("/journal")
      } catch (error) {
        console.error("Failed to save entry:", error)
        toast({
          title: "Error",
          description: "Failed to save journal entry. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
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