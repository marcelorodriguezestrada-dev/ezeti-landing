import { NextResponse } from "next/server";
import { getCampaignsCol } from "@/lib/firebaseAdmin";
import type { Campaign } from "@/lib/types";

export async function GET() {
  try {
    const snap = await getCampaignsCol().orderBy("createdAt", "desc").get();
    const campaigns = snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })) as Campaign[];
    return NextResponse.json(campaigns);
  } catch (err) {
    console.error("Error en GET /api/admin/campaigns:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
