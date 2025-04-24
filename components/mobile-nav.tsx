"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, MessageSquare, BookOpen, User } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === "/dashboard" ? "text-purple-600" : "text-gray-500"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link
            href="/dashboard?tab=public"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === "/dashboard" && pathname.includes("public") ? "text-purple-600" : "text-gray-500"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Community</span>
          </Link>
          <Link
            href="/dashboard?tab=mira"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === "/dashboard" && pathname.includes("mira") ? "text-purple-600" : "text-gray-500"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Mira</span>
          </Link>
          <Link
            href="/journal"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === "/journal" ? "text-purple-600" : "text-gray-500"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs mt-1">Journal</span>
          </Link>
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === "/profile" ? "text-purple-600" : "text-gray-500"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  )
} 