"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportKey, markBackupCompleted } from '@/lib/key-manager';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupPage() {
  const router = useRouter();
  const [privateKey, setPrivateKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    async function loadKey() {
      try {
        const key = await exportKey();
        setPrivateKey(key);
      } catch (error) {
        toast.error('Failed to load your key');
        router.push('/auth/welcome');
      }
    }
    loadKey();
  }, [router]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      toast.success('Key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy key');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sobrkey-backup.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Key downloaded');
  };

  const handleContinue = async () => {
    if (!isConfirmed) {
      toast.error('Please confirm you\'ve saved your key');
      return;
    }
    await markBackupCompleted();
    router.push('/auth/done');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Your key
          </h1>
          <p className="text-sm text-gray-600">
            Save this in a safe place. You'll need it to access your account.
          </p>
        </div>

        {/* Key display */}
        <div className="space-y-4 rounded-2xl bg-white/60 p-6 backdrop-blur-sm">
          <div className="relative">
            <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
              <p className="break-all font-mono text-sm text-gray-900">
                {isRevealed ? privateKey : '•'.repeat(63)}
              </p>
            </div>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="absolute right-2 top-2 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label={isRevealed ? 'Hide key' : 'Show key'}
            >
              {isRevealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-xl bg-amber-50 p-4 text-left">
          <p className="text-sm font-medium text-amber-900">
            ⚠️ Important
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Anyone with this key can access your account. Keep it private and secure.
          </p>
        </div>

        {/* Confirmation */}
        <div className="flex items-start gap-3 rounded-xl bg-white/60 p-4 backdrop-blur-sm">
          <input
            type="checkbox"
            id="confirm"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="confirm" className="text-sm text-gray-700 cursor-pointer">
            I've saved my key in a safe place
          </label>
        </div>

        {/* Continue button */}
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-lg font-semibold shadow-lg hover:from-orange-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleContinue}
          disabled={!isConfirmed}
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Back link */}
        <button
          onClick={() => router.push('/auth/backup-offer')}
          className="w-full text-sm text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
