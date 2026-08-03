import { NextResponse } from "next/server";
import { getLeadsCol } from "@/lib/firebaseAdmin";
import type { Lead } from "@/lib/types";

export async function GET() {
  try {
    const snap = await getLeadsCol().orderBy("createdAt", "desc").get();
    const leads = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Lead[];
    return NextResponse.json(leads);
  } catch (err) {
    console.error("Error en GET /api/admin/leads:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
