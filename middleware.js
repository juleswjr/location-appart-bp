import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  // 1. On prépare la réponse (pour pouvoir y écrire des cookies si besoin)
  const res = NextResponse.next()
  
  // 2. On crée le client Supabase adapté au Middleware
  const supabase = createMiddlewareClient({ req, res })

  // 3. On vérifie si l'utilisateur est connecté
  // (Cela rafraîchit automatiquement la session si elle est vieille)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 4. LA SÉCURITÉ :
  // Si l'utilisateur essaie d'aller sur une page qui commence par "/admin"
  if (req.nextUrl.pathname.startsWith('/admin')) {
    
    // Et qu'il n'est PAS connecté...
    if (!session) {
      // ... On le redirige vers la page de Login
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Si tout est bon, on laisse passer la requête avec les cookies mis à jour
  return res
}

// 5. Configuration : On dit à Next.js de ne lancer ce vigile que sur les routes admin
export const config = {
  matcher: ['/admin/:path*'],
}