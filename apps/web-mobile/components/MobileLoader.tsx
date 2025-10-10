interface MobileLoaderProps {
  message?: string
}

export default function MobileLoader({ message = 'Chargement...' }: MobileLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary rounded-full opacity-20 animate-pulse"></div>
        </div>
      </div>
      {message && (
        <p className="mt-4 text-gray-600 text-center font-medium">{message}</p>
      )}
    </div>
  )
}

