import sharp from "sharp";

// Presets pensados para lo que ya generás en /api/admin/campaigns/[id]/poster
// (Feed 4:5 y Story/Reel 9:16), más un cuadrado clásico y un modo que solo
// comprime sin recortar -- por si la foto ya viene con el encuadre que querés.
const PRESETS: Record<string, { width: number; height: number } | null> = {
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  cuadrado: { width: 1080, height: 1080 },
  original: null,
};

export async function optimizeImage(buffer: Buffer, preset: string) {
  const target = PRESETS[preset] ?? null;
  let pipeline = sharp(buffer).rotate(); // rotate() sin argumentos = auto-orienta según EXIF

  if (target) {
    pipeline = pipeline.resize(target.width, target.height, { fit: "cover", position: "attention" });
  }

  // WebP calidad 82: en la práctica es el punto justo entre "se ve nítido"
  // y "pesa poco" para fotos que van a Instagram/redes -- no hace falta más.
  const optimized = await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });

  return {
    buffer: optimized.data,
    width: optimized.info.width,
    height: optimized.info.height,
    sizeBytes: optimized.info.size,
  };
}
