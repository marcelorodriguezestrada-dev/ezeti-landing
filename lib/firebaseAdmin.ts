import admin from "firebase-admin";

// OJO: la inicialización es LAZY (a propósito). Next.js ejecuta este import
// durante "Collecting page data" en el build, sin que haya una request real
// todavía -- si inicializáramos Firebase a nivel módulo (como se hacía
// antes), el build falla ahí mismo aunque la app nunca vaya a necesitar
// Firebase en ese momento. Por eso todo queda adentro de funciones que se
// llaman recién cuando una request de verdad las usa.
function ensureInitialized() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
}

export function getDb() {
  ensureInitialized();
  return admin.firestore();
}

export function getCampaignsCol() {
  return getDb().collection("campaigns");
}

export function getSitesCol() {
  return getDb().collection("sites");
}

export function getVisitsCol() {
  return getDb().collection("visits");
}

export function getCronLogsCol() {
  return getDb().collection("cronLogs");
}

export function getLeadsCol() {
  return getDb().collection("leads");
}

export function getProspectosCol() {
  return getDb().collection("prospectos");
}

export function getImagesCol() {
  return getDb().collection("images");
}

export function getCouponsCol() {
  return getDb().collection("coupons");
}

export function getSettingsDoc() {
  return getDb().collection("settings").doc("general");
}

export { admin };
