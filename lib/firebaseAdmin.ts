import admin from "firebase-admin";

// Mismo patrón que usás en JobTrack AI: credenciales de Service Account
// vía variables de entorno, nunca hardcodeadas.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = admin.firestore();
export const campaignsCol = db.collection("campaigns");
export { admin };
