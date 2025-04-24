"use client"

import { useState } from "react"
import { useNostr } from "@/hooks/useNostr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Copy, Check, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false)
  const [isCopied, setIsCopied] = useState({ publicKey: false, privateKey: false })
  const { privateKey, publicKey, logout } = useNostr()
  const { toast } = useToast()
  const router = useRouter()

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

  if (!privateKey || !publicKey) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
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
                  value={publicKey || ""}
                  readOnly
                  className="pr-24 font-mono text-sm bg-gray-50"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-7"
                  onClick={() => publicKey && copyToClipboard(publicKey, 'publicKey')}
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
                  value={privateKey || ""}
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
                    onClick={() => privateKey && copyToClipboard(privateKey, 'privateKey')}
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