// Códigos cortos y fáciles de leer/dictar en el local: EZT-XXXX.
// Evitamos 0/O y 1/I para que no se confundan al escribirlos a mano.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCouponCode() {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return `EZT-${code}`;
}
