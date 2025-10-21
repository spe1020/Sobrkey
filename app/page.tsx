"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.push('/dashboard');
      } else {
        router.push('/auth/welcome');
      }
    }
  }, [isLoggedIn, isLoading, router]);

  // Show loading state while checking auth
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-orange-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600" />
        <p className="mt-4 text-gray-600">Loading Sobrkey...</p>
      </div>
    </div>
  );
}
