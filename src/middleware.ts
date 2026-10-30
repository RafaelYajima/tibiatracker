import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

const PUBLIC_PAGES = new Set(["/login", "/register", "/"]);
const PUBLIC_API_EXACT = new Set([
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
]);
/** Prefixos de API pública (para rotas dinâmicas como /api/hunts/:id/share). */
const PUBLIC_API_PREFIXES = ["/api/hunts/", "/api/auth/"];

/**
 * Proteção rápida por cookie para páginas e APIs privadas.
 * A validação real da sessão continua no servidor, consultando o banco.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_EXACT.has(pathname)) return NextResponse.next();
    // Rota de share é pública: /api/hunts/UUID/share
    if (pathname.match(/^\/api\/hunts\/[^/]+\/share$/)) return NextResponse.next();
    if (!hasSessionCookie) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PAGES.has(pathname)) {
    // Se está logado, não deixa acessar login/register, mas permite a home (/)
    if (hasSessionCookie && pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
