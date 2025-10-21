"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importKey, saveKey, validateKeyFormat } from '@/lib/key-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportPage() {
  const router = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);

    // Validate input
    if (!keyInput.trim()) {
      setError('Please enter your key');
      return;
    }

    if (!validateKeyFormat(keyInput.trim())) {
      setError('That key doesn\'t look right. Please check and try again.');
      return;
    }

    setIsImporting(true);

    try {
      const keyPair = await importKey(keyInput.trim());
      await saveKey(keyPair);
      toast.success('Key imported successfully');
      router.push('/auth/done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import key');
    } finally {
      setIsImporting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isImporting) {
      handleImport();
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600 shadow-lg">
          <KeyRound className="h-10 w-10 text-white" />
        </div>

        {/* Headline */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Import your key
          </h1>
          <p className="text-gray-600">
            We store it only on this device
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="key" className="block text-sm font-medium text-gray-700">
              Paste your key here
            </label>
            <Input
              id="key"
              type="password"
              placeholder="nsec1..."
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              className={`w-full ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isImporting}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <p className="text-xs text-gray-500">
              Accepts nsec or hex format
            </p>
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-white/60 p-4 backdrop-blur-sm">
            <p className="text-sm text-gray-700">
              🔒 <strong>Privacy at a glance:</strong> We don't store your key. It never leaves your device.
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-4 pt-4">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-lg font-semibold shadow-lg hover:from-orange-600 hover:to-purple-700 disabled:opacity-50"
              onClick={handleImport}
              disabled={isImporting || !keyInput.trim()}
            >
              {isImporting ? (
                'Importing...'
              ) : (
                <>
                  Use this key
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <button
              onClick={() => router.push('/auth/welcome')}
              className="w-full text-sm text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
              disabled={isImporting}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
