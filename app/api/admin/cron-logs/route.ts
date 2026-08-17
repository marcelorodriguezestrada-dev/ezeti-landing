import { NextResponse } from "next/server";
import { getCronLogsCol } from "@/lib/firebaseAdmin";

export async function GET() {
  const snap = await getCronLogsCol().orderBy("ejecutadoEn", "desc").limit(30).get();
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(logs);
}
