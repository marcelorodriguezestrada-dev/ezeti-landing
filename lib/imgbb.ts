// Helper para subir imágenes a ImgBB (api.imgbb.com). Solo se llama
// server-side -- la API key nunca se expone al navegador.
export async function uploadToImgbb(buffer: Buffer, filename: string) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar IMGBB_API_KEY en las variables de entorno del servidor.");
  }

  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(buffer)]), filename);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || `ImgBB respondió ${res.status}`);
  }

  return {
    url: data.data.url as string,
    thumbUrl: (data.data.thumb?.url || data.data.url) as string,
    deleteUrl: data.data.delete_url as string,
    width: Number(data.data.width),
    height: Number(data.data.height),
    sizeBytes: Number(data.data.size),
  };
}
