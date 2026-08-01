export interface Site {
  id: string;
  emoji: string;
  nombre: string;
  descripcion: string; // se usa como "producto" al generar la campaña
  publico: string;
  objetivoSugerido: string;
  url: string;
  activo: boolean;
  createdAt: number;
}

export type Plataforma = "instagram" | "linkedin" | "facebook" | "tiktok";

export interface CampaignPost {
  texto: string;
  hashtags: string[];
  formato: string; // "Feed", "Story", "Reel", "Carrusel", "Video corto"...
  horaOptima: string; // "09:00"
  cta: string;
  tipVisual: string;
}

export interface CalendarioItem {
  dia: number; // offset en días desde la creación de la campaña
  postIndex: number;
  nota: string;
}

export interface UtmLink {
  label: string;
  url: string;
}

export interface Campaign {
  id: string;
  producto: string;
  objetivo: string;
  publico: string;
  tono: string;
  plataforma: Plataforma;
  posts: CampaignPost[];
  calendario: CalendarioItem[];
  utmLinks: UtmLink[];
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
