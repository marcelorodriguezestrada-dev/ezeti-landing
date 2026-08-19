import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) {
    return NextResponse.json({ error: "Falta el siteId." }, { status: 400 });
  }
  if (!process.env.FACEBOOK_APP_ID) {
    return NextResponse.json({ error: "Falta configurar FACEBOOK_APP_ID en el servidor." }, { status: 500 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/admin/facebook/callback`;

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "pages_show_list,pages_read_engagement,pages_manage_posts");
  url.searchParams.set("state", siteId); // así sabemos, cuando vuelva, a qué sitio conectar la página elegida
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
