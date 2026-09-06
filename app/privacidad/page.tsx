export default function PoliticaDePrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/" className="inline-flex items-center gap-3 mb-10">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500 text-xs font-black text-slate-950">E</div>
          <span className="font-mono font-bold text-white">
            ezeti<span className="text-cyan-400">.pro</span>
          </span>
        </a>

        <h1 className="text-3xl font-black text-white mb-2">Política de Privacidad</h1>
        <p className="text-sm text-slate-500 mb-10">Última actualización: septiembre de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">1. Quiénes somos</h2>
            <p>
              Ezeti es un estudio de soluciones con inteligencia artificial para empresas y proyectos propios (entre ellos Tierra Viva,
              TraceLink, ArquitectIA y Seti). Esta política describe qué datos recolectamos a través de nuestros sitios web, formularios
              y herramientas conectadas (incluidas nuestras Páginas de Facebook), y cómo los tratamos.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">2. Qué datos recolectamos</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Datos de contacto que nos dejás voluntariamente: nombre, email y/o número de WhatsApp, al completar un formulario.</li>
              <li>Información que compartís en formularios guiados sobre tu negocio o proyecto (rubro, objetivo, notas de contexto).</li>
              <li>Datos de navegación básicos: qué campaña o link te trajo a nuestro sitio (parámetros UTM), y visitas a páginas concretas.</li>
              <li>
                Si interactuás con nuestras Páginas de Facebook, datos públicos de esa interacción (comentarios, reacciones) según lo que
                permite la propia plataforma de Meta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">3. Para qué usamos tus datos</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Para responder tu consulta y coordinar una propuesta o presupuesto.</li>
              <li>Para armar contenido y campañas de comunicación más relevantes (por ejemplo, saber qué canal te trajo hasta nosotros).</li>
              <li>Para mejorar nuestros productos y la experiencia de nuestros sitios.</li>
            </ul>
            <p className="mt-2">Nunca vendemos tus datos a terceros.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">4. Dónde se almacenan</h2>
            <p>
              Tus datos se guardan en Firebase/Firestore (Google Cloud), con acceso restringido a nuestro equipo. Algunas funciones usan
              proveedores externos para procesar información puntual (por ejemplo, un modelo de lenguaje de Groq para generar contenido, o
              la API de Meta para publicar en nuestras Páginas de Facebook) — estos proveedores procesan la información necesaria para esa
              tarea específica y no la usan con otros fines.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">5. Tus derechos</h2>
            <p>
              Podés pedirnos en cualquier momento que te contemos qué datos tuyos tenemos, que los corrijamos, o que los eliminemos por
              completo. Alcanza con escribirnos por los medios de contacto de este sitio.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">6. Cookies y analítica</h2>
            <p>
              Usamos identificadores técnicos simples (por ejemplo, parámetros de campaña en la URL) para entender qué contenido
              funciona mejor. No usamos cookies de seguimiento publicitario de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">7. Contacto</h2>
            <p>Para cualquier consulta sobre esta política o tus datos, escribinos por WhatsApp desde este mismo sitio.</p>
          </section>

          <p className="text-xs text-slate-600 pt-4 border-t border-slate-800">
            Este documento es una política general y puede actualizarse. No reemplaza asesoramiento legal específico para tu situación.
          </p>
        </div>

        <a href="/" className="inline-block mt-10 text-cyan-400 text-sm hover:text-cyan-300">
          ← Volver al inicio
        </a>
      </div>
    </div>
  );
}
