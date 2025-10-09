/**
 * ⏳ Loader component
 */

'use client';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loader({ size = 'md', text }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
      />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
}



