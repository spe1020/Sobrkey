"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyRound, KeySquare, Copy, Check } from "lucide-react"
import { useNostr } from "@/hooks/useNostr"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { QuoteGenerator } from "@/components/QuoteGenerator"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin")
  const [signinKey, setSigninKey] = useState("")
  const [newKey, setNewKey] = useState("")
  const [showSaveKey, setShowSaveKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const { privateKey, generateKeypair, loginWithGeneratedKey, importKey, isLoggedIn } = useNostr()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard")
    }
  }, [isLoggedIn, router])

  const handleSignIn = async () => {
    try {
      await importKey(signinKey)
      toast({
        title: "Success",
        description: "Successfully signed in!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleGenerateKey = () => {
    try {
      const nsec = generateKeypair()
      setNewKey(nsec)
      setShowSaveKey(true)
      toast({
        title: "Important!",
        description: "Please save your key before continuing",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate key: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied!",
      description: "Key copied to clipboard. Please save it securely.",
    })
  }

  const handleLogin = () => {
    loginWithGeneratedKey()
    toast({
      title: "Success",
      description: "You're now logged in!",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Overview Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Sobrkey
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              A decentralized community for sobriety and recovery, built on Nostr.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-2xl mb-3">💬</div>
                <h3 className="font-semibold mb-2">Connect</h3>
                <p className="text-sm text-gray-600">
                  Share your journey, find support, and connect with others in recovery.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-2xl mb-3">🔒</div>
                <h3 className="font-semibold mb-2">Private</h3>
                <p className="text-sm text-gray-600">
                  Your identity is protected. Share as much or as little as you want.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-2xl mb-3">🤖</div>
                <h3 className="font-semibold mb-2">AI Support</h3>
                <p className="text-sm text-gray-600">
                  Chat with Mira, your AI companion, anytime you need support.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quote Generator */}
          <div className="mb-12">
            <QuoteGenerator />
          </div>

          {/* Existing Auth Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
          >
            {showSaveKey ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-center">⚠️ Save Your Key ⚠️</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium mb-2">This is your only chance to save your key!</p>
                  <p className="text-yellow-700 text-sm">
                    If you lose this key, you will lose access to your account permanently.
                    There is no way to recover it.
                  </p>
                </div>
                <div className="relative">
                  <Input
                    value={newKey}
                    readOnly
                    className="w-full pr-20 font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute right-1 top-1 h-7"
                    onClick={handleCopyKey}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    onClick={handleLogin}
                  >
                    I've saved my key, log me in
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    By clicking this button, you confirm that you have securely saved your key
                  </p>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="signin-key" className="block text-sm font-medium text-gray-700">
                        Nostr Private Key
                      </label>
                      <Input 
                        id="signin-key" 
                        type="password" 
                        placeholder="nsec1..." 
                        className="w-full"
                        value={signinKey}
                        onChange={(e) => setSigninKey(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Enter your private key to sign in</p>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      onClick={handleSignIn}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Sign into sobrkey
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Button variant="outline" type="button" onClick={handleGenerateKey}>
                        Generate Temporary Key
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <Input id="username" type="text" placeholder="Your username" className="w-full" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="new-key" className="block text-sm font-medium text-gray-700">
                          Generate New Key
                        </label>
                      </div>
                      <div className="relative">
                        <Input
                          id="new-key"
                          type="text"
                          readOnly
                          className="w-full pr-20"
                          placeholder="Your new key will appear here"
                          value={newKey}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="absolute right-1 top-1 h-7 text-xs text-purple-600"
                          onClick={handleGenerateKey}
                        >
                          Generate
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Save this key securely. It cannot be recovered if lost.</p>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      onClick={handleGenerateKey}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Signup for sobrkey
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
