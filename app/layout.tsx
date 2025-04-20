import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MobileNav } from '@/components/mobile-nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sobrkey',
  description: 'A decentralized community for recovery and personal growth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
          <main className="pb-16">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  )
}
