import { NextRequest, NextResponse } from "next/server";
import { getCampaignsCol, getSitesCol } from "@/lib/firebaseAdmin";
import { publicarEnFacebook } from "@/lib/facebook";
import type { Campaign, Site } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { postIndex } = await req.json();

    const doc = await getCampaignsCol().doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "No encontramos esa campaña." }, { status: 404 });
    }
    const campaign = { id: doc.id, ...doc.data() } as Campaign;
    const post = campaign.posts?.[postIndex];
    if (!post) {
      return NextResponse.json({ error: "No encontramos ese post dentro de la campaña." }, { status: 404 });
    }
    if (post.facebookPostId) {
      return NextResponse.json({ error: "Este post ya fue publicado antes." }, { status: 400 });
    }
    if (!campaign.siteId) {
      return NextResponse.json(
        { error: "Esta campaña no está vinculada a ningún sitio, así que no sabemos a qué Página de Facebook publicar. Regenerala eligiendo un sitio desde el formulario." },
        { status: 400 }
      );
    }

    const siteDoc = await getSitesCol().doc(campaign.siteId).get();
    if (!siteDoc.exists) {
      return NextResponse.json({ error: "El sitio de esta campaña ya no existe." }, { status: 404 });
    }
    const site = siteDoc.data() as Site;
    if (!site.facebookPageId || !site.facebookPageAccessToken) {
      return NextResponse.json(
        { error: `"${site.nombre}" todavía no tiene una Página de Facebook conectada. Configurala en la pestaña 🌐 Sitios.` },
        { status: 400 }
      );
    }

    // Preferimos el link de tracking "Facebook — Post" que ya generó la
    // campaña (tiene el UTM correcto); si no está, caemos a cualquiera.
    const utmLink =
      campaign.utmLinks?.find((l) => l.label.toLowerCase().includes("facebook") && l.label.toLowerCase().includes("post")) ||
      campaign.utmLinks?.[0];

    const hashtags = (post.hashtags || []).map((h) => `#${h}`).join(" ");
    const partes = [post.texto];
    if (utmLink) partes.push(utmLink.url);
    if (hashtags) partes.push(hashtags);
    const mensaje = partes.join("\n\n");

    const { facebookPostId } = await publicarEnFacebook(mensaje, campaign.imagenFondo || undefined, {
      pageId: site.facebookPageId,
      accessToken: site.facebookPageAccessToken,
    });

    const nuevosPosts = [...campaign.posts];
    nuevosPosts[postIndex] = { ...post, facebookPostId };
    await getCampaignsCol().doc(id).update({ posts: nuevosPosts });

    return NextResponse.json({ ok: true, facebookPostId, posts: nuevosPosts });
  } catch (err) {
    console.error("Error en POST /api/admin/campaigns/[id]/publish-facebook:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
