import crypto from "crypto";

// Slug corto (6 chars) para que el link de tracking sea presentable en redes:
// ezeti.pro/go/x7k2p9
export function generateSlug(): string {
  return crypto.randomBytes(4).toString("base64url").slice(0, 6).toLowerCase();
}
