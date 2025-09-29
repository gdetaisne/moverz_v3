"use client"

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  if (!providers) {
    return <div>Chargement...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connectez-vous à votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choisissez votre méthode de connexion
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {Object.values(providers).map((provider: any) => (
            <div key={provider.name}>
              <button
                onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {provider.name === 'Google' && (
                    <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="h-5 w-5" />
                  )}
                  {provider.name === 'Facebook' && (
                    <img src="https://www.svgrepo.com/show/355013/facebook.svg" alt="Facebook" className="h-5 w-5" />
                  )}
                </span>
                Continuer avec {provider.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
