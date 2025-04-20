"use client"

import { useState, useEffect } from "react"
import { useNostr } from "@/hooks/useNostr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Eye, EyeOff, Copy, Check, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("")
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false)
  const [isCopied, setIsCopied] = useState({ publicKey: false, privateKey: false })
  const [isLoading, setIsLoading] = useState(true)
  const { privateKey, publicKey, logout } = useNostr()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check authentication after a brief delay to allow state to settle
    const timer = setTimeout(() => {
      if (!privateKey || !publicKey) {
        router.push("/")
      } else {
        setIsLoading(false)
        // Load display name from localStorage when component mounts
        const savedName = localStorage.getItem(`displayName-${publicKey}`)
        if (savedName) {
          setDisplayName(savedName)
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [privateKey, publicKey, router])

  const handleSaveDisplayName = () => {
    try {
      if (!publicKey) {
        throw new Error("No public key found")
      }

      if (!displayName.trim()) {
        toast({
          title: "Error",
          description: "Display name cannot be empty",
          variant: "destructive",
        })
        return
      }

      // Save with public key to ensure unique storage per user
      localStorage.setItem(`displayName-${publicKey}`, displayName.trim())
      
      toast({
        title: "Success",
        description: "Display name saved successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save display name: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (text: string, type: 'publicKey' | 'privateKey') => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(prev => ({ ...prev, [type]: true }))
      setTimeout(() => {
        setIsCopied(prev => ({ ...prev, [type]: false }))
      }, 2000)
      toast({
        title: "Copied!",
        description: `${type === 'publicKey' ? 'Public' : 'Private'} key copied to clipboard.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!privateKey || !publicKey) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Display Name Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Name</h2>
            <div className="space-y-4">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="max-w-md"
              />
              <Button 
                onClick={handleSaveDisplayName}
                disabled={!displayName.trim()}
              >
                Save Display Name
              </Button>
            </div>
          </div>

          {/* Keys Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Keys</h2>
            
            {/* Public Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Key
              </label>
              <div className="relative">
                <Input
                  value={publicKey}
                  readOnly
                  className="pr-24 font-mono text-sm bg-gray-50"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-7"
                  onClick={() => copyToClipboard(publicKey, 'publicKey')}
                >
                  {isCopied.publicKey ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Private Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private Key
              </label>
              <div className="relative">
                <Input
                  type={isPrivateKeyVisible ? "text" : "password"}
                  value={privateKey}
                  readOnly
                  className="pr-24 font-mono text-sm bg-gray-50"
                />
                <div className="absolute right-1 top-1 flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => setIsPrivateKeyVisible(!isPrivateKeyVisible)}
                  >
                    {isPrivateKeyVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => copyToClipboard(privateKey, 'privateKey')}
                  >
                    {isCopied.privateKey ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm text-red-600">
                Never share your private key with anyone!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 