"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateKey, saveKey } from '@/lib/key-manager';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateKeyPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createKey() {
      try {
        // Add a slight delay for better UX (shows the loading state)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const keyPair = await generateKey();
        await saveKey(keyPair);
        
        setIsSuccess(true);
        
        // Auto-navigate to backup offer after showing success
        setTimeout(() => {
          router.push('/auth/backup-offer');
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setIsGenerating(false);
      }
    }

    createKey();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Oops!
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
          <Button
            onClick={() => router.push('/auth/welcome')}
            className="w-full"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {isGenerating && !isSuccess && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Setting up your secure key…
              </h1>
              <p className="text-gray-600">
                This will only take a moment
              </p>
            </div>
          </>
        )}

        {isSuccess && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                You're set! 🎉
              </h1>
              <p className="text-gray-600">
                Your key lives on this device. We never see it.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
