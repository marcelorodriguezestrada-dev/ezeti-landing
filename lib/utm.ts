import type { Plataforma, UtmLink } from "./types";

// Distintos "lugares" donde se pega el link dentro de cada red -- así
// después en las métricas de tu sitio (Google Analytics, Vercel Analytics,
// etc.) podés ver de cuál placement viene más gente, no solo de cuál red.
const PLACEMENTS: Record<Plataforma, { medium: string; label: string }[]> = {
  instagram: [
    { medium: "bio", label: "Instagram — Bio" },
    { medium: "story", label: "Instagram — Story" },
    { medium: "reel", label: "Instagram — Reel" },
    { medium: "post", label: "Instagram — Post" },
  ],
  linkedin: [
    { medium: "post", label: "LinkedIn — Post" },
    { medium: "article", label: "LinkedIn — Artículo" },
  ],
  facebook: [
    { medium: "post", label: "Facebook — Post" },
    { medium: "story", label: "Facebook — Story" },
  ],
  tiktok: [
    { medium: "bio", label: "TikTok — Bio" },
    { medium: "video", label: "TikTok — Video" },
  ],
};

export function buildUtmLinks(destinoUrl: string, plataforma: Plataforma, campaignSlug: string): UtmLink[] {
  const placements = PLACEMENTS[plataforma] || PLACEMENTS.instagram;
  const separator = destinoUrl.includes("?") ? "&" : "?";

  return placements.map(({ medium, label }) => ({
    label,
    url: `${destinoUrl}${separator}utm_source=${plataforma}&utm_medium=${medium}&utm_campaign=${campaignSlug}`,
  }));
}
