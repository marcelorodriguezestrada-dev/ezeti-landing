import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { getCampaignsCol } from "@/lib/firebaseAdmin";
import type { Campaign } from "@/lib/types";

// next/og (Satori) necesita los bytes de la tipografía -- no puede usar
// fuentes del sistema como en el navegador. Las tenemos guardadas en el
// repo (assets/fonts) para no depender de internet en tiempo de request.
async function loadFonts() {
  const dir = path.join(process.cwd(), "assets/fonts");
  const [mono, bold, regular] = await Promise.all([
    readFile(path.join(dir, "DejaVuSansMono-Bold.ttf")),
    readFile(path.join(dir, "Poppins-Bold.ttf")),
    readFile(path.join(dir, "Poppins-Regular.ttf")),
  ]);
  return { mono, bold, regular };
}

const PLATFORM_ICON: Record<string, string> = {
  instagram: "📸",
  linkedin: "💼",
  facebook: "👥",
  tiktok: "🎵",
};

// El lienzo se adapta al formato real del post: Story/Reel son verticales
// 9:16, todo lo demás (Feed, Carrusel) usa el clásico 4:5 de feed.
function sizeForFormato(formato: string) {
  const f = (formato || "").toLowerCase();
  if (f.includes("story") || f.includes("reel")) return { width: 1080, height: 1920 };
  return { width: 1080, height: 1350 };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const postIndex = Number(url.searchParams.get("post") || 0);

  const doc = await getCampaignsCol().doc(id).get();
  if (!doc.exists) {
    return new Response("Campaña no encontrada", { status: 404 });
  }
  const campaign = doc.data() as Campaign;
  const post = campaign.posts?.[postIndex] || campaign.posts?.[0];
  if (!post) {
    return new Response("La campaña no tiene posts generados todavía", { status: 400 });
  }

  const isTecnologia = campaign.tipoCampana === "tecnologia";
  const accent = isTecnologia ? "#22D3EE" : "#F5A623";
  const accentSoft = isTecnologia ? "rgba(34,211,238,0.16)" : "rgba(245,166,35,0.16)";
  const ctaText = isTecnologia ? "#062024" : "#1A1206";

  // El titular sale del propio texto del post (que SÍ está escrito para el
  // público), no de "objetivo" -- ese campo es una nota interna de
  // planificación ("qué querés lograr con la campaña"), pensada para guiar
  // a la IA al generar el contenido, no para mostrarla como si fuera copy.
  const primerCorte = post.texto.search(/(?<=[.!?])\s+/);
  const tieneGancho = primerCorte > 15 && primerCorte < 110;
  const rawHeadline = tieneGancho ? post.texto.slice(0, primerCorte).trim() : post.texto;
  const rawResto = tieneGancho ? post.texto.slice(primerCorte).trim() : "";

  const headline = rawHeadline.length > 100 ? rawHeadline.slice(0, 97).trim() + "…" : rawHeadline;
  const resto = rawResto || post.texto;
  const subcopy = resto.length > 165 ? resto.slice(0, 162).trim() + "…" : resto;
  const hashtags = (post.hashtags || []).slice(0, 5);

  const { mono, bold, regular } = await loadFonts();
  const { width, height } = sizeForFormato(post.formato);
  const platformIcon = PLATFORM_ICON[campaign.plataforma] || "✨";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0B1120",
          padding: "64px",
          position: "relative",
          fontFamily: "Body",
        }}
      >
        {/* fondo: foto real si la campaña tiene una cargada, si no queda el fondo liso + glow */}
        {campaign.imagenFondo && (
          <img
            src={campaign.imagenFondo}
            alt=""
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, objectFit: "cover", width: "100%", height: "100%" }}
          />
        )}
        {campaign.imagenFondo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background: "linear-gradient(180deg, rgba(11,17,32,0.55) 0%, rgba(11,17,32,0.75) 55%, rgba(11,17,32,0.97) 100%)",
            }}
          />
        )}

        {/* glow ambiental -- solo cuando no hay foto real de fondo */}
        {!campaign.imagenFondo && (
          <div
            style={{
              position: "absolute",
              top: -160,
              left: 220,
              width: 700,
              height: 700,
              borderRadius: 350,
              background: `radial-gradient(circle, ${accentSoft} 0%, rgba(11,17,32,0) 70%)`,
              display: "flex",
            }}
          />
        )}

        {/* eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: accent, display: "flex" }} />
          <div style={{ fontFamily: "Mono", fontSize: 22, color: accent, letterSpacing: 2, fontWeight: 700, display: "flex" }}>
            EZETI · {campaign.producto.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "center" }}>
          {!campaign.imagenFondo && <div style={{ display: "flex", fontSize: 220, opacity: 0.14 }}>{platformIcon}</div>}
        </div>

        {/* cuerpo */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Mono", fontWeight: 700, fontSize: 54, color: "#F1F5F9", lineHeight: 1.18 }}>
            {headline}
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 27, color: "#94A3B8", lineHeight: 1.5, maxWidth: 900 }}>
            {subcopy}
          </div>

          {hashtags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              {hashtags.map((h) => (
                <div
                  key={h}
                  style={{
                    display: "flex",
                    fontFamily: "Mono",
                    fontSize: 17,
                    color: "#64748B",
                    border: "1px solid #232E47",
                    borderRadius: 20,
                    padding: "8px 16px",
                  }}
                >
                  {h.startsWith("#") ? h : `#${h}`}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 40,
            backgroundColor: accent,
            borderRadius: 18,
            padding: "28px 36px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#0B1120",
              fontSize: 24,
            }}
          >
            ⚡
          </div>
          <div style={{ display: "flex", fontSize: 27, fontWeight: 700, color: ctaText, lineHeight: 1.35 }}>{post.cta}</div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, fontFamily: "Mono", fontSize: 18, color: "#48526B" }}>
          <div style={{ display: "flex" }}>ezeti.pro</div>
          <div style={{ display: "flex" }}>
            {campaign.plataforma.toUpperCase()} · {post.formato.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "Mono", data: mono, weight: 700, style: "normal" },
        { name: "Body", data: bold, weight: 700, style: "normal" },
        { name: "Body", data: regular, weight: 400, style: "normal" },
      ],
    }
  );
}
