'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  
  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex items-center justify-around py-2">
        <button
          onClick={() => router.push('/upload')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive('/upload') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">Photos</span>
        </button>

        <button
          onClick={() => router.push('/inventory')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive('/inventory') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs font-medium">Inventaire</span>
        </button>

        <button
          onClick={() => router.push('/estimate')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive('/estimate') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">Devis</span>
        </button>
      </div>
    </nav>
  )
}

