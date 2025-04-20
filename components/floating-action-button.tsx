"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <motion.div 
      className="fixed bottom-20 right-4 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white border-none"
        onClick={onClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </motion.div>
  )
} 