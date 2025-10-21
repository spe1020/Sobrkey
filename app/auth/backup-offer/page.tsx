"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';

export default function BackupOfferPage() {
  const router = useRouter();

  const handleBackupNow = () => {
    router.push('/auth/backup');
  };

  const handleSkip = () => {
    router.push('/auth/done');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600 shadow-lg">
          <Shield className="h-10 w-10 text-white" />
        </div>

        {/* Headline */}
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Back up your key
          </h1>
          <p className="text-lg text-gray-600">
            Recommended for safety
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 rounded-2xl bg-white/60 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
            <p className="text-sm text-gray-700">
              Write it down or save to a safe place
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
            <p className="text-sm text-gray-700">
              This protects you if you lose your device
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
            <p className="text-sm text-gray-700">
              No one can recover it for you—not even us
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-4 pt-4">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-lg font-semibold shadow-lg hover:from-orange-600 hover:to-purple-700"
            onClick={handleBackupNow}
          >
            Back up now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <button
            onClick={handleSkip}
            className="w-full text-sm text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
          >
            Do this later
          </button>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-gray-500">
          You can always backup your key later from Settings
        </p>
      </div>
    </div>
  );
}
