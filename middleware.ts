import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers pour permettre l'intégration iframe
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://moverz.fr https://*.moverz.fr https://www.moverz.fr https://moverz-bordeaux.gslv.cloud https://*.gslv.cloud https://www.bordeaux-demenageur.fr https://bordeaux-demenageur.fr file://; frame-src 'self' https://moverz.fr https://*.moverz.fr https://moverz-bordeaux.gslv.cloud https://*.gslv.cloud https://www.bordeaux-demenageur.fr https://bordeaux-demenageur.fr file://;"
  );
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Gérer les requêtes OPTIONS pour CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
