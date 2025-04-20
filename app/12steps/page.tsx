"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Lock, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useNostr } from "@/hooks/useNostr"

const steps = [
  {
    number: 1,
    title: "We admitted we were powerless over alcohol—that our lives had become unmanageable.",
  },
  {
    number: 2,
    title: "Came to believe that a Power greater than ourselves could restore us to sanity.",
  },
  {
    number: 3,
    title: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
  },
  {
    number: 4,
    title: "Made a searching and fearless moral inventory of ourselves.",
  },
  {
    number: 5,
    title: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
  },
  {
    number: 6,
    title: "Were entirely ready to have God remove all these defects of character.",
  },
  {
    number: 7,
    title: "Humbly asked Him to remove our shortcomings.",
  },
  {
    number: 8,
    title: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
  },
  {
    number: 9,
    title: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
  },
  {
    number: 10,
    title: "Continued to take personal inventory and when we were wrong promptly admitted it.",
  },
  {
    number: 11,
    title: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
  },
  {
    number: 12,
    title: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.",
  },
]

export default function TwelveStepsPage() {
  const router = useRouter()
  const { publicKey } = useNostr()
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    if (!publicKey) return
    const savedProgress = localStorage.getItem(`sobr-12step-progress-${publicKey}`)
    if (savedProgress) {
      setCompletedSteps(JSON.parse(savedProgress))
    } else {
      // Clear completed steps if no progress exists for this key
      setCompletedSteps([])
    }
  }, [publicKey])

  const isStepCompleted = (stepNumber: number) => completedSteps.includes(stepNumber)
  const isStepAvailable = (stepNumber: number) => {
    if (stepNumber === 1) return true
    return completedSteps.includes(stepNumber - 1)
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
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    12-Step Journey
                  </h1>
                  <p className="mt-2 text-lg text-gray-600">
                    Take the next step in your recovery journey
                  </p>
                </div>

                <div className="space-y-4">
                  {steps.map((step) => (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: step.number * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          completedSteps.includes(step.number)
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Step {step.number}
                        </h3>
                        <p className="mt-1 text-gray-600">{step.title}</p>
                      </div>
                      <Button
                        onClick={() => router.push(`/12steps/${step.number}`)}
                        className="flex-shrink-0"
                      >
                        {completedSteps.includes(step.number) ? 'Review' : 'Begin'}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 