import { NextRequest, NextResponse } from "next/server";
import { getSettingsDoc } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snap = await getSettingsDoc().get();
    const data = snap.exists ? snap.data()! : {};
    // El App Secret nunca sale del servidor -- solo un flag de "ya está".
    const { facebookAppSecret, ...resto } = data;
    return NextResponse.json({ calLink: "", ...resto, hasFacebookAppSecret: !!facebookAppSecret });
  } catch (err) {
    console.error("Error en GET /api/admin/settings:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.calLink !== undefined) update.calLink = body.calLink || "";
    if (body.facebookAppId !== undefined) update.facebookAppId = body.facebookAppId || "";
    if (body.facebookAppSecret) update.facebookAppSecret = body.facebookAppSecret; // solo si mandan uno nuevo, nunca lo borramos con ""
    await getSettingsDoc().set(update, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/admin/settings:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
