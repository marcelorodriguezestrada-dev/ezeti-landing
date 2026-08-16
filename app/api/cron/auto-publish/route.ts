import { NextRequest, NextResponse } from "next/server";
import { getCampaignsCol, getSitesCol } from "@/lib/firebaseAdmin";
import { generarCampania } from "@/lib/generateCampaign";
import { publicarEnFacebook } from "@/lib/facebook";
import type { Site } from "@/lib/types";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel manda esto automático en sus propios cron jobs. Si disparás esto
  // desde un scheduler externo (GitHub Actions, cron-job.org, etc.), tenés
  // que mandar el mismo header vos: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const sitesSnap = await getSitesCol().where("activo", "==", true).where("autoPublicarFacebook", "==", true).get();

  const resultados: Array<{ site: string; ok: boolean; detalle: string }> = [];

  for (const doc of sitesSnap.docs) {
    const site = { id: doc.id, ...doc.data() } as Site;
    try {
      if (!site.facebookPageId || !site.facebookPageAccessToken) {
        resultados.push({ site: site.nombre, ok: false, detalle: "Sin Página de Facebook conectada, se saltea." });
        continue;
      }

      // Generamos UN post nuevo, con criterio de contenido de rubro (no
      // "venta de tecnología") -- es lo que mejor funciona como contenido
      // orgánico recurrente sin sonar repetitivo o a folleto.
      const campaign = await generarCampania({
        producto: site.temaNegocio || site.descripcion,
        siteId: site.id,
        objetivo: site.objetivoSugerido || "generar consultas de nuevos clientes",
        publico: site.publico,
        tono: "cercano y auténtico",
        plataforma: "facebook",
        destinoUrl: site.url,
        cantPosts: 1,
        tipoCampana: "negocio",
      });

      const post = campaign.posts[0];
      const utmLink = campaign.utmLinks?.[0];
      const hashtags = (post.hashtags || []).map((h) => `#${h}`).join(" ");
      const mensaje = [post.texto, utmLink?.url, hashtags].filter(Boolean).join("\n\n");

      const { facebookPostId } = await publicarEnFacebook(mensaje, undefined, {
        pageId: site.facebookPageId,
        accessToken: site.facebookPageAccessToken,
      });

      campaign.posts[0] = { ...post, facebookPostId };
      campaign.status = "activa";
      campaign.publishedAt = Date.now();

      await getCampaignsCol().add(campaign);

      resultados.push({ site: site.nombre, ok: true, detalle: `Publicado (Facebook post ${facebookPostId}).` });
    } catch (err) {
      resultados.push({ site: site.nombre, ok: false, detalle: (err as Error).message });
    }
  }

  return NextResponse.json({ ejecutadoEn: new Date().toISOString(), sitios: resultados.length, resultados });
}
