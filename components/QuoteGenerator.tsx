"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const quotes = [
  "You are stronger than you think",
  "Every day is a new beginning",
  "Your journey is unique and valuable",
  "Small steps lead to big changes",
  "You are not alone in this journey",
  "Recovery is possible, one day at a time",
  "Your strength inspires others",
  "Every moment is a chance to start fresh",
  "You are worthy of a happy, healthy life",
  "Progress, not perfection, is the goal",
  "Healing is not linear, and that's okay",
  "Your feelings are valid and important",
  "Take it one moment at a time",
  "You've survived 100% of your bad days",
  "The only way out is through",
  "You are more than your struggles",
  "Hope is a powerful force",
  "Your story isn't over yet",
  "Courage doesn't always roar",
  "You are enough, just as you are"
]

export function QuoteGenerator() {
  const [currentQuote, setCurrentQuote] = useState(quotes[0])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        const nextIndex = (quotes.indexOf(currentQuote) + 1) % quotes.length
        setCurrentQuote(quotes[nextIndex])
        setIsVisible(true)
      }, 1000) // Wait for fade out before changing quote
    }, 10000) // Show each quote for 10 seconds

    return () => clearInterval(interval)
  }, [currentQuote])

  return (
    <div className="w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : -20
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 1,
            ease: "easeInOut"
          }}
          className="text-center"
        >
          <p className="text-lg font-serif text-gray-700 italic">
            {currentQuote}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 