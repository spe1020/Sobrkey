"use client"

import { useState, useEffect, useRef } from "react"
import { useNostr } from "@/hooks/useNostr"
import { publishNote, publishReaction, publishComment, publishZapRequest, subscribeToTag, subscribeToComments, subscribeToZaps } from "@/lib/nostr"
import { chatWithMira, Message } from "@/lib/mira"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Send, KeySquare, ThumbsUp, MessageCircle, Zap, Plus, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QuoteGenerator } from "@/components/QuoteGenerator"
import { useRouter } from "next/navigation"

type Tab = "public" | "chat-with-mira" | "lets-talk" | "about" | "12steps" | "private-journal" | "emergency"

interface Note {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  reactions?: { [key: string]: number };
  comments?: any[];
  zaps?: { amount: number; comment?: string }[];
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("public")
  const [content, setContent] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})
  const [zapAmounts, setZapAmounts] = useState<{ [key: string]: string }>({})
  const [zapComments, setZapComments] = useState<{ [key: string]: string }>({})
  const [isPostingNote, setIsPostingNote] = useState(false)
  const { privateKey, publicKey, logout } = useNostr()
  const { toast } = useToast()
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi, I'm Mira! I'm here to listen and support you on your journey. How are you feeling today?"
    }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [isZapDialogOpen, setIsZapDialogOpen] = useState(false)
  const [zapAmount, setZapAmount] = useState("")
  const [zapComment, setZapComment] = useState("")
  const [localResources, setLocalResources] = useState<any[]>([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (!publicKey) return

    // Subscribe to #sobrkey tagged notes and reactions
    const unsubscribe = subscribeToTag("sobrkey", (event) => {
      if (event.kind === 1) {
        // It's a note
        setNotes(prevNotes => [{
          ...event,
          reactions: {},
          comments: []
        }, ...prevNotes])
      } else if (event.kind === 7) {
        // It's a reaction
        const reactedToId = event.tags.find(tag => tag[0] === 'e')?.[1]
        if (reactedToId) {
          setNotes(prevNotes => prevNotes.map(note => {
            if (note.id === reactedToId) {
              return {
                ...note,
                reactions: {
                  ...note.reactions,
                  [event.pubkey]: (note.reactions?.[event.pubkey] || 0) + 1
                }
              }
            }
            return note
          }))
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [publicKey])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handlePublish = async () => {
    if (!privateKey) return

    try {
      await publishNote(content, privateKey)
      toast({
        title: "Success",
        description: "Note published successfully!",
      })
      setContent("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish note: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleReaction = async (noteId: string) => {
    if (!privateKey) return

    try {
      await publishReaction(privateKey, noteId)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to react to note: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleComment = async (noteId: string) => {
    if (!privateKey) return

    const commentContent = commentInputs[noteId]
    if (!commentContent?.trim()) return

    try {
      await publishComment(privateKey, noteId, commentContent)
      setCommentInputs(prev => ({ ...prev, [noteId]: "" }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const toggleComments = (noteId: string) => {
    setExpandedComments(prev => ({ ...prev, [noteId]: !prev[noteId] }))
    if (!expandedComments[noteId]) {
      // Subscribe to comments when expanding
      const unsubscribe = subscribeToComments(noteId, (event) => {
        setNotes(prevNotes => prevNotes.map(note => {
          if (note.id === noteId) {
            return {
              ...note,
              comments: [...(note.comments || []), event]
            }
          }
          return note
        }))
      })
      return unsubscribe
    }
  }

  const handleZap = async (noteId: string) => {
    if (!privateKey) return

    const amount = parseInt(zapAmounts[noteId] || "0")
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      await publishZapRequest(privateKey, noteId, amount, zapComments[noteId])
      toast({
        title: "Success",
        description: "Zap request sent!",
      })
      setZapAmounts(prev => ({ ...prev, [noteId]: "" }))
      setZapComments(prev => ({ ...prev, [noteId]: "" }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send zap: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleZapUs = async () => {
    if (!privateKey) return

    const amount = parseInt(zapAmount || "0")
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      // Using a special note ID for the development zap
      await publishZapRequest(privateKey, "development", amount, zapComment)
      toast({
        title: "Thank You!",
        description: "Your support helps us continue building Sobrkey.",
      })
      setZapAmount("")
      setZapComment("")
      setIsZapDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send zap: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: chatInput
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")
    setIsTyping(true)

    try {
      const response = await chatWithMira([...chatMessages, userMessage])
      const miraMessage: Message = {
        role: 'assistant',
        content: response
      }
      setChatMessages(prev => [...prev, miraMessage])
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

  const fetchLocalResources = async () => {
    setIsLoadingLocal(true)
    try {
      // Using SAMHSA's treatment locator API
      const response = await fetch('https://findtreatment.samhsa.gov/locator/listing')
      const data = await response.json()
      setLocalResources(data.slice(0, 5)) // Get top 5 nearest resources
    } catch (error) {
      console.error('Failed to fetch local resources:', error)
    } finally {
      setIsLoadingLocal(false)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "chat-with-mira":
        return (
          <div className="max-w-2xl mx-auto h-[calc(100vh-7rem)]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
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
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
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
                    disabled={!chatInput.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      case "lets-talk":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Coming Soon: Let's Talk</h2>
                <p className="text-gray-600">
                  We're working on bringing you live audio spaces where you can connect with others in real-time.
                </p>
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Live Audio Spaces</h3>
                      <p className="text-sm text-gray-600">
                        Join moderated discussions and share your experiences in a safe, supportive environment.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Scheduled Events</h3>
                      <p className="text-sm text-gray-600">
                        Participate in regular meetings, workshops, and special guest sessions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Anonymous Participation</h3>
                      <p className="text-sm text-gray-600">
                        Join discussions while maintaining your privacy and anonymity.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Stay tuned for updates on this exciting new feature!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case "about":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold mb-4">About Sobrkey</h2>
              <div className="prose prose-gray max-w-none">
                <p className="mb-4">
                  Sobrkey is a decentralized community built on the Nostr protocol. It's a space for individuals navigating sobriety, recovery, and personal growth — powered by connection, anonymity, and support.
                </p>
                <p className="mb-4">
                  The platform is inspired by the principles of the 12-step program but reimagined for an open, peer-driven world. Here, you can journal privately, reflect publicly, or just listen.
                </p>
                <div className="mt-6 space-y-3 text-sm text-gray-600">
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
            </div>
          </div>
        )
      case "12steps":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Recovery Journey</h2>
                <p className="text-gray-600">
                  Take the next step in your recovery with our guided 12-step program.
                </p>
                <Button
                  onClick={() => router.push('/12steps')}
                  className="mt-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  Begin Your Journey
                </Button>
              </div>
            </div>
          </div>
        )
      case "private-journal":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Private Journal</h2>
                <p className="text-gray-600">
                  Coming soon: A private space for your personal reflections and thoughts.
                </p>
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">End-to-End Encryption</h3>
                      <p className="text-sm text-gray-600">
                        Your private thoughts will be encrypted and accessible only to you.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Daily Prompts</h3>
                      <p className="text-sm text-gray-600">
                        Receive personalized prompts to guide your reflection and growth.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Progress Tracking</h3>
                      <p className="text-sm text-gray-600">
                        Track your emotional and recovery journey over time.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Stay tuned for updates on this exciting new feature!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case "emergency":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Emergency Resources</h2>
                  <p className="text-gray-600">
                    Immediate help and support is available. You are not alone.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-900">National Suicide Prevention Lifeline</h3>
                        <p className="text-red-800 mb-2">Available 24/7</p>
                        <a href="tel:988" className="text-red-600 hover:text-red-700 font-medium">
                          Call or Text: 988
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900">SAMHSA National Helpline</h3>
                        <p className="text-purple-800 mb-2">Treatment Referral and Information</p>
                        <a href="tel:18006624357" className="text-purple-600 hover:text-purple-700 font-medium">
                          Call: 1-800-662-HELP (4357)
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Crisis Text Line</h3>
                        <p className="text-blue-800 mb-2">Text for immediate support</p>
                        <a href="sms:741741" className="text-blue-600 hover:text-blue-700 font-medium">
                          Text HOME to 741741
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Local Emergency Services</h3>
                        <p className="text-green-800 mb-2">For immediate medical assistance</p>
                        <a href="tel:911" className="text-green-600 hover:text-green-700 font-medium">
                          Call: 911
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900">Local Treatment Centers</h3>
                      <p className="text-yellow-800 mb-2">Find help near you</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLocalResources}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        {isLoadingLocal ? 'Loading...' : 'Find Local Help'}
                      </Button>
                      {localResources.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {localResources.map((resource, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium">{resource.name}</p>
                              <p className="text-yellow-700">{resource.address}</p>
                              <a href={`tel:${resource.phone}`} className="text-yellow-600 hover:text-yellow-700">
                                {resource.phone}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Additional Resources</h3>
                      <div className="mt-2 space-y-2">
                        <a href="https://www.aa.org" className="block text-gray-600 hover:text-gray-900">
                          Alcoholics Anonymous
                        </a>
                        <a href="https://www.na.org" className="block text-gray-600 hover:text-gray-900">
                          Narcotics Anonymous
                        </a>
                        <a href="https://www.smartrecovery.org" className="block text-gray-600 hover:text-gray-900">
                          SMART Recovery
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>These services are available 24/7. Please reach out if you need help.</p>
                  <p className="mt-2">Remember: Your life is valuable, and help is always available.</p>
                </div>
              </div>
            </div>
          </div>
        )
      case "public":
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="text-xs text-gray-500 mb-3">
                    {new Date(note.created_at * 1000).toLocaleString()}
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap text-base mb-4 leading-relaxed">{note.content}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <button
                      onClick={() => handleReaction(note.id)}
                      className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{Object.values(note.reactions || {}).reduce((a, b) => a + b, 0)}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(note.id)}
                      className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{note.comments?.length || 0}</span>
                    </button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors">
                          <Zap className="h-4 w-4" />
                          <span>{note.zaps?.reduce((sum, zap) => sum + zap.amount, 0) || 0}</span>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Zap</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Amount (sats)</label>
                            <Input
                              type="number"
                              value={zapAmounts[note.id] || ""}
                              onChange={(e) => setZapAmounts(prev => ({ ...prev, [note.id]: e.target.value }))}
                              placeholder="Enter amount in sats"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Comment (optional)</label>
                            <Input
                              value={zapComments[note.id] || ""}
                              onChange={(e) => setZapComments(prev => ({ ...prev, [note.id]: e.target.value }))}
                              placeholder="Add a comment with your zap"
                              className="mt-1"
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => handleZap(note.id)}
                            disabled={!zapAmounts[note.id] || parseInt(zapAmounts[note.id]) <= 0}
                          >
                            Send Zap
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {expandedComments[note.id] && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="relative">
                        <Input
                          value={commentInputs[note.id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [note.id]: e.target.value }))}
                          placeholder="Write a comment..."
                          className="text-sm pr-12"
                        />
                        <Button 
                          size="sm"
                          className="absolute right-1 top-1 h-7"
                          onClick={() => handleComment(note.id)}
                          disabled={!commentInputs[note.id]?.trim()}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {note.comments?.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded p-3">
                          <div className="text-xs text-gray-500 mb-1">
                            {new Date(comment.created_at * 1000).toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-900">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  if (!privateKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not logged in</h1>
          <Button onClick={() => window.location.href = "/"}>
            Go to login page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600">
                <KeySquare className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <QuoteGenerator />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isZapDialogOpen} onOpenChange={setIsZapDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Zap Sobrkey
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Support Sobrkey Development</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Amount (sats)</label>
                      <Input
                        type="number"
                        value={zapAmount}
                        onChange={(e) => setZapAmount(e.target.value)}
                        placeholder="Enter amount in sats"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Message (optional)</label>
                      <Input
                        value={zapComment}
                        onChange={(e) => setZapComment(e.target.value)}
                        placeholder="Add a message with your zap"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleZapUs}
                      disabled={!zapAmount || parseInt(zapAmount) <= 0}
                    >
                      Send Zap
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-6 -mb-px">
            <button
              onClick={() => setActiveTab("public")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "public"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Public Community
            </button>
            <button
              onClick={() => setActiveTab("chat-with-mira")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "chat-with-mira"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Chat with Mira
            </button>
            <button
              onClick={() => setActiveTab("12steps")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "12steps"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              12-Step Journey
            </button>
            <button
              onClick={() => setActiveTab("lets-talk")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "lets-talk"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Let's Talk
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "about"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("private-journal")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "private-journal"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Private Journal
            </button>
            <button
              onClick={() => setActiveTab("emergency")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "emergency"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Emergency
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-28 pb-16">
        {renderContent()}
      </main>

      {/* Floating Add Note Button - Only show on Recent tab */}
      {activeTab === "public" && (
        <Dialog open={isPostingNote} onOpenChange={setIsPostingNote}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
              />
              <Button
                className="w-full"
                onClick={() => {
                  handlePublish();
                  setIsPostingNote(false);
                }}
                disabled={!content.trim()}
              >
                Post Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 