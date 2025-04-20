"use client"

import { MessageCircle, Users, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { name: "Mira", href: "/dashboard?tab=chat-with-mira", icon: MessageCircle },
  { name: "Community", href: "/dashboard?tab=public", icon: Users },
  { name: "Profile", href: "/profile", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900">
      <div className="grid h-16 grid-cols-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          
          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1",
                isActive ? "text-purple-600" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{tab.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
} 