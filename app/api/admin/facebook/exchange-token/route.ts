import { NextRequest, NextResponse } from "next/server";
import { getSettingsDoc } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { shortToken, appId, appSecret } = await req.json();
    if (!shortToken || !shortToken.trim()) {
      return NextResponse.json({ error: "Pegá el token corto que sacaste del Graph API Explorer." }, { status: 400 });
    }

    let FACEBOOK_APP_ID = appId?.trim() || process.env.FACEBOOK_APP_ID;
    let FACEBOOK_APP_SECRET = appSecret?.trim() || process.env.FACEBOOK_APP_SECRET;

    // Si no vinieron en el request ni hay env vars, buscamos lo último guardado.
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      const settingsSnap = await getSettingsDoc().get();
      const settings = settingsSnap.exists ? settingsSnap.data()! : {};
      FACEBOOK_APP_ID = FACEBOOK_APP_ID || settings.facebookAppId;
      FACEBOOK_APP_SECRET = FACEBOOK_APP_SECRET || settings.facebookAppSecret;
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return NextResponse.json({ error: "Faltan el App ID y/o el App Secret (pegalos en el formulario, o configuralos como variables de entorno)." }, { status: 400 });
    }

    // Guardamos lo que nos pasaron para la próxima vez -- así no hay que
    // volver a tipearlo cada vez que se abre la herramienta.
    if (appId?.trim() || appSecret?.trim()) {
      await getSettingsDoc().set(
        { ...(appId?.trim() ? { facebookAppId: appId.trim() } : {}), ...(appSecret?.trim() ? { facebookAppSecret: appSecret.trim() } : {}) },
        { merge: true }
      );
    }

    // Corto → largo (~60 días, sin fecha fija de vencimiento en la práctica)
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${encodeURIComponent(shortToken.trim())}`
    );
    const longData = await longRes.json();
    if (longData.error) {
      return NextResponse.json({ error: `Facebook rechazó el canje: ${longData.error.message}` }, { status: 400 });
    }

    // Con el token largo, sacamos las Páginas y sus tokens (estos son los
    // que realmente vas a usar -- no vencen solo por el paso del tiempo).
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${longData.access_token}&limit=100`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) {
      return NextResponse.json({ error: `No pudimos traer tus páginas: ${pagesData.error.message}` }, { status: 400 });
    }

    const pages = (pagesData.data || []).map((p: { id: string; name: string; access_token: string }) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
    }));

    return NextResponse.json({
      longLivedUserToken: longData.access_token,
      expiresInDays: longData.expires_in ? Math.round(longData.expires_in / 86400) : null,
      pages,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
