/**
 * 📍 Stepper component
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { STEPS } from '../lib/constants';

export function Stepper() {
  const pathname = usePathname();

  const currentStepIndex = STEPS.findIndex((step) => step.path === pathname);

  return (
    <div className="w-full bg-white border-b border-gray-200 py-6">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = step.path === pathname;
            const isCompleted = currentStepIndex > index;
            const isAccessible = currentStepIndex >= index;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <Link
                  href={isAccessible ? step.path : '#'}
                  className={`flex items-center space-x-3 ${
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white scale-110'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span
                    className={`font-medium ${
                      isActive
                        ? 'text-blue-500'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </Link>

                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



