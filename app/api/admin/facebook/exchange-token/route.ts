import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { shortToken } = await req.json();
    if (!shortToken || !shortToken.trim()) {
      return NextResponse.json({ error: "Pegá el token corto que sacaste del Graph API Explorer." }, { status: 400 });
    }
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      return NextResponse.json({ error: "Falta configurar FACEBOOK_APP_ID / FACEBOOK_APP_SECRET en el servidor." }, { status: 500 });
    }

    // Corto → largo (~60 días, sin fecha fija de vencimiento en la práctica)
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${encodeURIComponent(shortToken.trim())}`
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
