import { NextResponse } from "next/server";
import { listUserRepos } from "@/lib/github";

export async function GET() {
  try {
    const repos = await listUserRepos();
    return NextResponse.json(repos);
  } catch (err) {
    console.error("Error en GET /api/admin/github/repos:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
