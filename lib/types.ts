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
  facebookPageId?: string; // Página de Facebook propia de ESTE negocio (no una global compartida)
  facebookPageAccessToken?: string; // token de larga duración -- nunca se envía al browser, ver /api/admin/sites
  autoPublicarFacebook?: boolean; // si está en true, el cron genera y publica solo, sin intervención manual
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
  texto: string;
  hashtags: string[];
  formato: string; // "Feed", "Story", "Reel", "Carrusel", "Video corto"...
  horaOptima: string; // "09:00"
  cta: string;
  tipVisual: string;
  facebookPostId?: string; // si está publicado en la Página de Facebook, el ID que devolvió Graph API
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

export interface Coupon {
  id: string;
  code: string;
  campaignId: string;
  leadId: string;
  producto: string;
  status: "pendiente" | "canjeado";
  descuentoPct: number; // % que ve el cliente final (default 10)
  comisionPct: number; // % que cobra ezeti sobre el valor original del servicio (default 20)
  createdAt: number;
  canjeadoAt?: number;
  montoOriginal?: number; // precio real del servicio, cargado por el técnico al canjear
  montoConRecargo?: number; // montoOriginal * 1.10 -- así el descuento no le come margen al técnico
  montoFinalCliente?: number; // lo que termina pagando el cliente (montoConRecargo con el descuento aplicado)
  comisionEzeti?: number; // montoOriginal * comisionPct/100
}

export interface Campaign {
  id: string;
  siteId?: string; // qué Site generó esta campaña -- define a qué Página de Facebook publica
  producto: string;
  objetivo: string;
  publico: string;
  miedoPrincipal?: string; // el miedo/objeción principal del cliente -- eje del mensaje, no un dato decorativo
  tono: string;
  plataforma: Plataforma;
  tipoCampana: "tecnologia" | "negocio";
  posts: CampaignPost[];
  calendario: CalendarioItem[];
  utmLinks: UtmLink[];
  destinoUrl: string;
  gastoPublicitario?: number; // inversión manual en pauta (FB/IG Ads) -- base para calcular el CAC
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
