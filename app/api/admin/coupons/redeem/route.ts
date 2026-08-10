import { NextRequest, NextResponse } from "next/server";
import { getCouponsCol } from "@/lib/firebaseAdmin";

// Este es el "machear cliente con código" que describe el negocio: el
// dueño del local escribe acá el código que le mostró el cliente + el
// precio real del servicio, y el sistema arma la cuenta final.
//
// Modelo de ganancia (tal cual se definió):
// 1. montoConRecargo = montoOriginal * 1.10 -- el "precio de lista" ya viene
//    inflado un 10%, así el descuento que ve el cliente no le come margen
//    real al técnico.
// 2. montoFinalCliente = montoConRecargo con el descuento del cupón aplicado
//    (default 10%) -- en la práctica el cliente termina pagando ~99% del
//    precio original, pero SIENTE que tuvo un descuento real.
// 3. comisionEzeti = se calcula sobre el montoOriginal (no sobre el
//    recargo) -- el técnico no paga comisión sobre el "colchón" que se
//    agregó solo para sostener su margen. Si el negocio prefiere calcularla
//    sobre otro monto, este es el único lugar que hay que tocar.
export async function POST(req: NextRequest) {
  try {
    const { code, montoOriginal } = await req.json();

    if (!code || !montoOriginal || Number(montoOriginal) <= 0) {
      return NextResponse.json({ error: "Faltan el código y el monto original del servicio." }, { status: 400 });
    }

    const snap = await getCouponsCol().where("code", "==", String(code).toUpperCase().trim()).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ error: "Código inválido -- no existe ningún cupón con ese código." }, { status: 404 });
    }

    const doc = snap.docs[0];
    const cupon = doc.data();

    if (cupon.status === "canjeado") {
      return NextResponse.json({ error: "Este cupón ya fue canjeado anteriormente." }, { status: 409 });
    }

    const original = Number(montoOriginal);
    const descuentoPct = cupon.descuentoPct ?? 10;
    const comisionPct = cupon.comisionPct ?? 20;

    const montoConRecargo = Math.round(original * 1.1 * 100) / 100;
    const montoFinalCliente = Math.round(montoConRecargo * (1 - descuentoPct / 100) * 100) / 100;
    const comisionEzeti = Math.round(original * (comisionPct / 100) * 100) / 100;

    const update = {
      status: "canjeado" as const,
      canjeadoAt: Date.now(),
      montoOriginal: original,
      montoConRecargo,
      montoFinalCliente,
      comisionEzeti,
    };

    await doc.ref.update(update);

    return NextResponse.json({ id: doc.id, code: cupon.code, ...update });
  } catch (err) {
    console.error("Error en POST /api/admin/coupons/redeem:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
