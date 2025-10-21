"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';
import { hasCompletedBackup } from '@/lib/key-manager';
import { useRouter } from 'next/navigation';

export function BackupReminder() {
  const router = useRouter();
  const [hasBackup, setHasBackup] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    async function checkBackup() {
      const backup = await hasCompletedBackup();
      setHasBackup(backup);
      
      // Check if user has dismissed the reminder in this session
      const dismissed = sessionStorage.getItem('backup_reminder_dismissed');
      setIsDismissed(dismissed === 'true');
    }
    checkBackup();
  }, []);

  const handleBackup = () => {
    router.push('/auth/backup');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('backup_reminder_dismissed', 'true');
  };

  // Don't show if user has backed up or dismissed
  if (hasBackup || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="relative rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-purple-50 p-4 shadow-lg backdrop-blur-sm">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3 pr-6">
          <div className="flex-shrink-0 rounded-full bg-orange-100 p-2">
            <Shield className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Back up your key
            </p>
            <p className="text-xs text-gray-600">
              Protect your account by saving your key in a safe place
            </p>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
              onClick={handleBackup}
            >
              Back up now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
