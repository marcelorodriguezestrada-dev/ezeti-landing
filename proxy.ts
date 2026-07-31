import { NextRequest, NextResponse } from "next/server";

// Next.js 16 renombró "middleware" a "proxy" -- misma función, nuevo nombre
// de archivo y de export. Ver: https://nextjs.org/docs/messages/middleware-to-proxy
//
// Gate simple por cookie + password compartido (ADMIN_PASSWORD en .env).
// Correcto para un panel interno de una sola persona/equipo chico. Si más
// adelante hay varios usuarios con roles distintos, esto habría que
// reemplazarlo por un auth real (NextAuth, Firebase Auth, etc).
const SESSION_COOKIE = "ezeti_admin_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = session === process.env.ADMIN_SESSION_SECRET;

  if (!valid) {
    if (isAdminApi) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
