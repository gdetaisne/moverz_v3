import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SafeBoundary } from '../components/SafeBoundary';
import { Header } from '../components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Moverz v4 - Estimation de déménagement',
  description: 'Estimez votre déménagement automatiquement grâce à l\'IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <SafeBoundary>
          <Header />
          <main className="pt-20 min-h-screen">{children}</main>
        </SafeBoundary>
      </body>
    </html>
  );
}
