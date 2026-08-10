import { NextResponse } from "next/server";
import { getCouponsCol } from "@/lib/firebaseAdmin";
import type { Coupon } from "@/lib/types";

export async function GET() {
  try {
    const snap = await getCouponsCol().orderBy("createdAt", "desc").limit(500).get();
    const coupons: Coupon[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Coupon, "id">) }));
    return NextResponse.json(coupons);
  } catch (err) {
    console.error("Error en GET /api/admin/coupons:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
