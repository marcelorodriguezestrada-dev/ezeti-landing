import { NextRequest, NextResponse } from "next/server";
import { getSitesCol } from "@/lib/firebaseAdmin";

function paginaError(mensaje: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
      <h2>⚠ No se pudo conectar Facebook</h2>
      <p>${mensaje}</p>
      <a href="/admin">← Volver al admin</a>
    </body></html>`,
    { headers: { "Content-Type": "text/html" }, status: 400 }
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const siteId = req.nextUrl.searchParams.get("state");
  const errorFromFacebook = req.nextUrl.searchParams.get("error_description");

  if (errorFromFacebook) return paginaError(`Facebook dijo: ${errorFromFacebook}`);
  if (!code || !siteId) return paginaError("Faltó el código de autorización o el sitio de destino.");
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return paginaError("Falta configurar FACEBOOK_APP_ID / FACEBOOK_APP_SECRET en el servidor.");
  }

  const redirectUri = `${req.nextUrl.origin}/api/admin/facebook/callback`;

  try {
    // 1) Code → token de usuario de corta duración
    const shortRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`
    );
    const shortData = await shortRes.json();
    if (shortData.error) throw new Error(shortData.error.message);

    // 2) Token corto → token de usuario de larga duración (~60 días)
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortData.access_token}`
    );
    const longData = await longRes.json();
    if (longData.error) throw new Error(longData.error.message);

    // 3) Token largo → lista de Páginas administradas (cada una con su Page Token,
    //    que al salir de un token largo, no vence solo por el paso del tiempo)
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${longData.access_token}&limit=100`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) throw new Error(pagesData.error.message);

    const pages = (pagesData.data || []) as Array<{ id: string; name: string; access_token: string }>;
    if (pages.length === 0) {
      return paginaError("Tu cuenta de Facebook no administra ninguna Página. Necesitás ser admin de al menos una para conectarla.");
    }

    // Si solo tiene una Página, la conectamos directo sin preguntar nada.
    if (pages.length === 1) {
      return await guardarYRedirigir(req, siteId, pages[0]);
    }

    // Si tiene varias, mostramos un selector simple para que elija cuál va con este sitio.
    const opciones = pages
      .map(
        (p) => `
      <form method="POST" action="/api/admin/facebook/finalize" style="margin-bottom:12px;">
        <input type="hidden" name="siteId" value="${siteId}" />
        <input type="hidden" name="pageId" value="${p.id}" />
        <input type="hidden" name="pageToken" value="${p.access_token}" />
        <button type="submit" style="padding:12px 20px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;cursor:pointer;font-size:14px;">
          Conectar "${p.name}"
        </button>
      </form>`
      )
      .join("");

    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;">
        <h2>Elegí qué Página conectar</h2>
        <p style="color:#666;">Tu cuenta administra varias Páginas de Facebook. Elegí cuál va a publicar las campañas de este sitio.</p>
        ${opciones}
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    return paginaError((err as Error).message);
  }
}

async function guardarYRedirigir(req: NextRequest, siteId: string, page: { id: string; name: string; access_token: string }) {
  await getSitesCol().doc(siteId).update({
    facebookPageId: page.id,
    facebookPageAccessToken: page.access_token,
  });
  return NextResponse.redirect(`${req.nextUrl.origin}/admin?tab=sitios&fbConectado=${encodeURIComponent(page.name)}`);
}
