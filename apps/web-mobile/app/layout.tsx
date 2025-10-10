import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Moverz - Déménagement Mobile',
  description: 'Estimez votre déménagement en quelques photos',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}

