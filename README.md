This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 👥 Facebook — crear una Página nueva y conectarla (referencia rápida)

### 1. Crear la Página
1. [facebook.com/pages/create](https://www.facebook.com/pages/create)
2. Nombre del negocio + categoría real (ojo con dejarla en una categoría al azar)
3. "Crear página"

### 2. Completar el perfil
Foto de perfil, portada, descripción, sitio web — en "Editar información de la Página".

### 3. Sos admin automático
No hace falta nada extra, ya administrás la Página que acabás de crear.

### 4. Conectarla en `/admin`
1. [Graph API Explorer](https://developers.facebook.com/tools/explorer) → app "Ezeti Marketing" → generá un **token corto** (permisos `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`)
2. `/admin` → pestaña 🌐 Sitios → herramienta **"🔧 Canjear token corto por token de larga duración"**
3. Pegás el token corto (el App ID/Secret quedan guardados de la vez anterior) → **Canjear token**
4. En la lista de Páginas que aparece, elegís a qué sitio corresponde la nueva → **Guardar**

Esta misma guía está disponible dentro de la app, en `/admin` → 🌐 Sitios → "📖 Ayuda: cómo crear una Página de Facebook nueva".

### App ID / App Secret
Están en [developers.facebook.com/apps](https://developers.facebook.com/apps) → "Ezeti Marketing" → Configuración → Básica. Se guardan solos en Firestore la primera vez que canjeás un token, no hace falta configurarlos como variable de entorno (aunque `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET` también funcionan como respaldo si preferís esa vía).

