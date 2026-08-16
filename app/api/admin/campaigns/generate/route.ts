import { NextRequest, NextResponse } from "next/server";
import { getCampaignsCol } from "@/lib/firebaseAdmin";
import { generarCampania } from "@/lib/generateCampaign";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const campaign = await generarCampania(body);
    const doc = await getCampaignsCol().add(campaign);
    return NextResponse.json({ id: doc.id, ...campaign });
  } catch (err) {
    console.error("Error en /api/admin/campaigns/generate:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
