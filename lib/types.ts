export interface Site {
  id: string;
  emoji: string;
  nombre: string;
  descripcion: string; // pitch de "vender la tecnología/servicio"
  temaNegocio: string; // pitch de "vender el rubro en sí" (contenido, sin mencionar la tech)
  publico: string;
  objetivoSugerido: string;
  url: string;
  activo: boolean;
  createdAt: number;
}

export type LeadStatus = "nuevo" | "quiere_agendar" | "contactado" | "reunion_agendada" | "cliente" | "descartado";

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  whatsapp: string;
  mensaje: string;
  producto: string; // denormalizado de la campaña que lo trajo, si vino de una
  campaignId: string | null;
  origen: string; // utm_source o "directo"
  status: LeadStatus;
  guionGenerado: string | null;
  createdAt: number;
}

export type Plataforma = "instagram" | "linkedin" | "facebook" | "tiktok";

export interface CampaignPost {
  titulo: string; // gancho/titular corto pensado para la pieza gráfica (NO el objetivo interno de la campaña)
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

export interface MediaImage {
  id: string;
  url: string;
  thumbUrl: string;
  deleteUrl: string; // link que da ImgBB para borrarla desde ahí (best-effort, ver nota en el endpoint DELETE)
  width: number;
  height: number;
  sizeBytes: number;
  preset: string; // "feed" | "story" | "cuadrado" | "original"
  createdAt: number;
}

export interface Campaign {
  id: string;
  producto: string;
  objetivo: string;
  publico: string;
  tono: string;
  plataforma: Plataforma;
  tipoCampana: "tecnologia" | "negocio";
  posts: CampaignPost[];
  calendario: CalendarioItem[];
  utmLinks: UtmLink[];
  destinoUrl: string;
  imagenFondo?: string; // URL de una foto real para usar de fondo en las piezas de marketing generadas
  slug: string;
  status: "borrador" | "activa" | "pausada" | "finalizada";
  visitas: number;
  likes: number;
  comentarios: number;
  compartidos: number;
  createdAt: number;
  publishedAt: number | null;
}
