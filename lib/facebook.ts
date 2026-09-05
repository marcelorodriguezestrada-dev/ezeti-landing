// lib/facebook.ts
// Publica posts en una Página de Facebook vía Graph API.
// Requiere FACEBOOK_PAGE_ID y FACEBOOK_PAGE_ACCESS_TOKEN (server-only, nunca
// deben llegar al cliente). Solo funciona con Páginas de Facebook, no con
// perfiles personales -- es una limitación de la propia API de Meta.

const GRAPH_VERSION = "v21.0";

export async function publicarEnFacebook(
  mensaje: string,
  imagenUrl?: string,
  credenciales?: { pageId?: string; accessToken?: string }
) {
  // Preferimos las credenciales del Site específico (cada negocio tiene su
  // propia Página). Si no vienen, caemos a variables de entorno globales
  // solo como compatibilidad para pruebas rápidas.
  const pageId = credenciales?.pageId || process.env.FACEBOOK_PAGE_ID;
  const token = credenciales?.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    throw new Error("Este sitio todavía no tiene una Página de Facebook conectada. Configurala en la pestaña 🌐 Sitios.");
  }

  // Si hay una imagen, publicamos vía /photos (queda como post con foto,
  // más atractivo). Si no, un post de texto plano vía /feed.
  const endpoint = imagenUrl
    ? `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`
    : `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`;

  const body = new URLSearchParams();
  if (imagenUrl) {
    body.append("url", imagenUrl);
    body.append("caption", mensaje);
  } else {
    body.append("message", mensaje);
  }
  // Clave: sin esto, Facebook puede tratar el post como "sin publicar"
  // (pensado para armar anuncios en Ads Manager), invisible en el timeline
  // normal de la Página aunque la llamada a la API haya salido bien.
  body.append("published", "true");
  body.append("access_token", token);

  const res = await fetch(endpoint, { method: "POST", body });
  const data = await res.json();

  if (data.error) {
    throw new Error(`Facebook rechazó la publicación: ${data.error.message} (código ${data.error.code})`);
  }

  // El endpoint /photos devuelve post_id, /feed devuelve id -- normalizamos.
  return { facebookPostId: data.post_id || data.id };
}
