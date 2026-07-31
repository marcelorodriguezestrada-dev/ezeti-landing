export type Plataforma = "instagram" | "linkedin" | "facebook" | "tiktok";

export interface CampaignVariant {
  texto: string;
  hashtags: string[];
}

export interface Campaign {
  id: string;
  producto: string;
  objetivo: string;
  publico: string;
  tono: string;
  plataforma: Plataforma;
  variantes: CampaignVariant[];
  varianteElegida: number;
  destinoUrl: string;
  slug: string;
  status: "borrador" | "activa" | "pausada" | "finalizada";
  visitas: number;
  likes: number;
  comentarios: number;
  compartidos: number;
  createdAt: number;
  publishedAt: number | null;
}
