'use client'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
}

export default function MobileHeader({ title, subtitle, showBack, onBack }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 safe-top">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Retour"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

