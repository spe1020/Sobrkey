"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Check, MessageCircle, Send } from "lucide-react"
import { use } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { chatWithMira, Message } from "@/lib/mira"
import { useNostr } from "@/hooks/useNostr"
import { publishNote } from "@/lib/nostr"
import { useToast } from "@/components/ui/use-toast"

const steps = [
  {
    number: 1,
    title: "We admitted we were powerless over alcohol—that our lives had become unmanageable.",
    prompt: "What does powerlessness mean to you? How has alcohol affected your life?",
  },
  {
    number: 2,
    title: "Came to believe that a Power greater than ourselves could restore us to sanity.",
    prompt: "What does a 'Power greater than ourselves' mean to you? How might this power help in your recovery?",
  },
  {
    number: 3,
    title: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
    prompt: "What does surrendering control mean to you? How might this help in your recovery?",
  },
  {
    number: 4,
    title: "Made a searching and fearless moral inventory of ourselves.",
    prompt: "What patterns or behaviors would you like to examine? What have you noticed about your actions and their consequences?",
  },
  {
    number: 5,
    title: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
    prompt: "What does honesty mean to you? How might sharing your story help in your recovery?",
  },
  {
    number: 6,
    title: "Were entirely ready to have God remove all these defects of character.",
    prompt: "What changes would you like to see in yourself? How might these changes improve your life?",
  },
  {
    number: 7,
    title: "Humbly asked Him to remove our shortcomings.",
    prompt: "What does humility mean to you? How might asking for help strengthen your recovery?",
  },
  {
    number: 8,
    title: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
    prompt: "Who have you affected with your actions? How might making amends help in your recovery?",
  },
  {
    number: 9,
    title: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
    prompt: "What does making amends mean to you? How might this help heal relationships?",
  },
  {
    number: 10,
    title: "Continued to take personal inventory and when we were wrong promptly admitted it.",
    prompt: "How do you recognize when you're wrong? What does taking responsibility mean to you?",
  },
  {
    number: 11,
    title: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
    prompt: "What does spiritual connection mean to you? How might this strengthen your recovery?",
  },
  {
    number: 12,
    title: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.",
    prompt: "What have you learned through this journey? How might you help others in their recovery?",
  },
]

export default function StepPage({ params }: { params: Promise<{ stepNumber: string }> }) {
  const router = useRouter()
  const { stepNumber } = use(params)
  const step = steps[parseInt(stepNumber) - 1]
  const [reflection, setReflection] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `I'm here to help you reflect on Step ${step.number}. What would you like to know about "${step.title}"?`
    }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const { privateKey } = useNostr()
  const { toast } = useToast()

  useEffect(() => {
    const savedProgress = localStorage.getItem('sobr-12step-progress')
    const progress = savedProgress ? JSON.parse(savedProgress) : []
    setIsCompleted(progress.includes(parseInt(stepNumber)))
  }, [stepNumber])

  const handleCompleteStep = async () => {
    if (!reflection.trim()) {
      toast({
        title: "Reflection Required",
        description: "Please take a moment to reflect on this step before completing it.",
        variant: "destructive",
      })
      return
    }

    try {
      // Save progress to localStorage
      const savedProgress = localStorage.getItem('sobr-12step-progress')
      const progress = savedProgress ? JSON.parse(savedProgress) : []
      
      if (!progress.includes(parseInt(stepNumber))) {
        const newProgress = [...progress, parseInt(stepNumber)]
        localStorage.setItem('sobr-12step-progress', JSON.stringify(newProgress))
      }

      // Publish reflection to Nostr with enhanced context
      if (privateKey) {
        const noteContent = `Step ${step.number} of 12: ${step.title}\n\nReflection:\n${reflection}\n\n#sobrkey-12stepjourney #step${step.number}`
        await publishNote(noteContent, privateKey)
        toast({
          title: "Step Completed",
          description: "Your reflection has been saved and shared with the community.",
        })
      }

      router.push('/12steps')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your reflection. Please try again.",
        variant: "destructive",
      })
    }
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
      console.error('Failed to get response from Mira:', error)
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/12steps')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Steps
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Step {step.number}
                  </h1>
                  <p className="mt-2 text-lg text-gray-600">{step.title}</p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Reflection Prompt
                  </h2>
                  <p className="text-gray-600">{step.prompt}</p>
                  
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Take your time to reflect..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    onClick={handleCompleteStep}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    disabled={isCompleted}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isCompleted ? 'Step Completed' : 'Complete Step'}
                  </Button>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    className="text-purple-600 hover:text-purple-700"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ask Mira about this step
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ask Mira about Step {step.number}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
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
          </div>

          <div className="border-t p-4">
            <div className="relative">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Ask Mira about this step..."
                className="pr-12 min-h-[60px]"
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
        </DialogContent>
      </Dialog>
    </div>
  )
} 