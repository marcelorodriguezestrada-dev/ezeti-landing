import { NextRequest, NextResponse } from "next/server";
import { getSettingsDoc } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snap = await getSettingsDoc().get();
    return NextResponse.json(snap.exists ? snap.data() : { calLink: "" });
  } catch (err) {
    console.error("Error en GET /api/admin/settings:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { calLink } = await req.json();
    await getSettingsDoc().set({ calLink: calLink || "" }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/admin/settings:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
