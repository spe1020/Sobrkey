"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function DonePage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Animated icon */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600 shadow-2xl animate-pulse">
          <Sparkles className="h-12 w-12 text-white" />
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            All set 🎉
          </h1>
          <p className="text-lg text-gray-600">
            You're ready to explore. You stay in control.
          </p>
        </div>

        {/* Trust reminders */}
        <div className="space-y-3 rounded-2xl bg-white/60 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-700">
              Your key is secure on this device
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-700">
              Connect, share, and support others safely
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-700">
              You can backup your key anytime from Settings
            </p>
          </div>
        </div>

        {/* Continue button */}
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-lg font-semibold shadow-lg hover:from-orange-600 hover:to-purple-700"
          onClick={handleContinue}
        >
          Continue to Sobrkey
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <p className="text-xs text-gray-500">
          Redirecting automatically in 3 seconds...
        </p>
      </div>
    </div>
  );
}
