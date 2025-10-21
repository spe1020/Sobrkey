"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { KeySquare, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600 shadow-lg">
          <KeySquare className="h-10 w-10 text-white" />
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Welcome to Sobrkey
          </h1>
          <p className="text-lg text-gray-600">
            Your private space to connect. You own your data.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="space-y-3 rounded-2xl bg-white/60 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-700">
              Your key lives on this device. We never see it.
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-700">
              You control what you share. No tracking.
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-700">
              Connect with others safely and anonymously.
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="space-y-4 pt-4">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-lg font-semibold shadow-lg hover:from-orange-600 hover:to-purple-700"
            onClick={() => router.push('/auth/create-key')}
          >
            Create my key
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Secondary link */}
          <button
            onClick={() => router.push('/auth/import')}
            className="w-full text-sm text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
          >
            I already have a key
          </button>
        </div>
      </div>
    </div>
  );
}
