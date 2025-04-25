"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyRound, KeySquare, Copy, Check } from "lucide-react"
import { useNostr } from "@/lib/nostr"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("signup")
  const [signinKey, setSigninKey] = useState("")
  const [newKey, setNewKey] = useState("")
  const [copied, setCopied] = useState(false)
  const { generateKeypair, importKey } = useNostr()
  const router = useRouter()

  const handleSignIn = async () => {
    try {
      await importKey(signinKey)
      router.push("/dashboard")
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const handleGenerateKey = () => {
    try {
      const nsec = generateKeypair()
      setNewKey(nsec)
      
      // If we're on the signin tab, also set it as the signin key
      if (activeTab === "signin") {
        setSigninKey(nsec)
      }
    } catch (error) {
      console.error('Error generating key:', error)
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSignup = async () => {
    if (!newKey) {
      console.error('Please generate a key first')
      return
    }
    try {
      await importKey(newKey)
      router.push("/dashboard")
    } catch (error) {
      console.error('Error signing up:', error)
    }
  }

  return (
    <div className="flex h-screen w-full">
      {/* Gradient Background */}
      <div className="relative hidden w-1/2 bg-gradient-to-br from-orange-400 via-purple-500 to-orange-300 lg:block overflow-hidden">
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-sm"></div>
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/30 backdrop-blur-sm"></div>
        <div className="absolute bottom-1/4 left-1/3 h-[200px] w-[200px] rounded-full bg-orange-500/40 backdrop-blur-sm"></div>
      </div>

      {/* Auth Container */}
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600">
              <KeySquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">sobrkey</h1>
            <div className="mt-2 space-y-2 text-center">
              <p className="text-gray-600">We're glad you're here. It works if you work it.</p>
              <p className="text-gray-600">This is a safe, anonymous space to share, heal, and grow.</p>
              <p className="text-gray-600">Your key is your identity — protect it like your story.</p>
            </div>
          </div>

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
                      className="w-full pr-32"
                      placeholder="Your new key will appear here"
                      value={newKey}
                    />
                    <div className="absolute right-1 top-1 flex space-x-1">
                      {newKey && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={handleCopyKey}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 text-xs text-purple-600"
                        onClick={handleGenerateKey}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-amber-600 font-medium">This key is your unique password and cannot be changed. Save this key securely. It cannot be recovered if lost.</p>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  onClick={handleSignup}
                  disabled={!newKey}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Signup for sobrkey
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
