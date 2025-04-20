"use client"

import { useState, useRef, useEffect } from "react"
import { chatWithMira, Message } from "@/lib/mira"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function MiraPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi, I'm Mira! I'm here to listen and support you on your journey. How are you feeling today?"
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const response = await chatWithMira([...messages, userMessage])
      const miraMessage: Message = {
        role: 'assistant',
        content: response
      }
      setMessages(prev => [...prev, miraMessage])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from Mira. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Mira is typing...</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t p-4 bg-white">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Type your message..."
                className="pr-12"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1 h-7"
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 