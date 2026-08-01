// Lee lo necesario de un repo público (o privado si el token tiene acceso)
// para que la IA pueda extraer de qué trata el negocio: descripción del
// repo, README, y el archivo de la página principal si lo encuentra.

const GITHUB_API = "https://api.github.com";

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("github.com")) return null;
    const [, owner, repoRaw] = u.pathname.split("/");
    if (!owner || !repoRaw) return null;
    return { owner, repo: repoRaw.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) return null;
  return res.json();
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  const data = await fetchJson(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`);
  if (!data?.content) return null;
  try {
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

// Candidatos típicos de "página principal" en proyectos Next.js / React /
// Vite -- probamos en orden hasta encontrar uno que exista.
const LANDING_CANDIDATES = [
  "app/page.tsx",
  "app/page.jsx",
  "src/app/page.tsx",
  "src/app/page.jsx",
  "pages/index.tsx",
  "pages/index.jsx",
  "pages/index.js",
  "src/App.tsx",
  "src/App.jsx",
  "src/pages/Home.tsx",
  "src/pages/Home.jsx",
];

export async function analyzeGithubRepo(repoUrl: string) {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error("Esa no parece una URL de GitHub válida (ej: https://github.com/usuario/repo)");
  }
  const { owner, repo } = parsed;

  const repoInfo = await fetchJson(`${GITHUB_API}/repos/${owner}/${repo}`);
  if (!repoInfo) {
    throw new Error(
      "No pude leer ese repositorio. Puede ser privado (necesitás cargar GITHUB_TOKEN en las env vars), no existir, o haber alcanzado el límite de rate de GitHub."
    );
  }

  const readme = await fetchFileContent(owner, repo, "README.md");

  let landingSource: string | null = null;
  let landingPath: string | null = null;
  for (const candidate of LANDING_CANDIDATES) {
    const content = await fetchFileContent(owner, repo, candidate);
    if (content) {
      landingSource = content;
      landingPath = candidate;
      break;
    }
  }

  return {
    nombreRepo: repoInfo.name as string,
    descripcionRepo: (repoInfo.description as string) || "",
    readme: readme ? readme.slice(0, 6000) : null, // recorte para no explotar el prompt
    landingPath,
    landingSource: landingSource ? landingSource.slice(0, 6000) : null,
  };
}
