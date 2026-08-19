import { NextRequest, NextResponse } from "next/server";
import { getSitesCol } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const siteId = form.get("siteId") as string;
  const pageId = form.get("pageId") as string;
  const pageToken = form.get("pageToken") as string;

  if (!siteId || !pageId || !pageToken) {
    return new NextResponse("Faltan datos.", { status: 400 });
  }

  await getSitesCol().doc(siteId).update({
    facebookPageId: pageId,
    facebookPageAccessToken: pageToken,
  });

  return NextResponse.redirect(`${req.nextUrl.origin}/admin?tab=sitios&fbConectado=1`);
}
