/**
 * 🎯 Header component
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Moverz</h1>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link
              href="/upload"
              className={`text-sm font-medium transition-colors ${
                isActive('/upload')
                  ? 'text-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload
            </Link>
            <Link
              href="/inventory"
              className={`text-sm font-medium transition-colors ${
                isActive('/inventory')
                  ? 'text-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventaire
            </Link>
            <Link
              href="/estimate"
              className={`text-sm font-medium transition-colors ${
                isActive('/estimate')
                  ? 'text-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Estimation
            </Link>
            <Link
              href="/quote"
              className={`text-sm font-medium transition-colors ${
                isActive('/quote')
                  ? 'text-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Devis
            </Link>
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'text-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}



