"use client";
import React, { useEffect, useState } from "react";

export default function LandingPage() {
  const whatsapp = "https://wa.me/5491167076678?text=Hola%20EZETI%2C%20quiero%20conversar%20sobre%20una%20soluci%C3%B3n%20de%20IA%20para%20mi%20empresa";
  const linkedin = "https://www.linkedin.com/in/marcelo-rodriguez-estrada";
  const email = "mailto:marcelo.rodriguez.estrada@gmail.com";
  const paceia = "https://paceia.ezeti.pro";
  const auditiaDemo = "https://auditia-consorcial.onrender.com/overview";
  const jobtrack = "https://jobtrack-ai-frontend.onrender.com/";
  const incubadora = "https://incubadora-ai-frontend.onrender.com/";
  const semillai = "https://semillai-c0y1.onrender.com/dashboard";
  const consultorio = "https://consultorio-dra-veronica.vercel.app/";
  const tierraviva = "https://tierraviva.ezeti.pro/";

  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);
  const [count4, setCount4] = useState(0);

  useEffect(() => {
    const animate = (setter: (n: number) => void, target: number, duration: number) => {
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
    };
    animate(setCount1, 70, 1400);
    animate(setCount2, 15, 1200);
    animate(setCount3, 19, 1600);
    animate(setCount4, 2000, 1800);
  }, []);

  const services = [
    {
      icon: "⚡",
      title: "Arquitectura de datos y automatización",
      desc: "Diseñamos infraestructuras confiables para mover información, integrar sistemas y dejar procesos listos para crecer.",
      tags: ["ETL/ELT", "Data Platforms", "Orquestación"],
      link: null,
    },
    {
      icon: "🤖",
      title: "Agentes IA y workflows inteligentes",
      desc: "Creamos asistentes, automations y micro-agentes que reducen fricción, aceleran decisiones y liberan tiempo al equipo.",
      tags: ["N8N", "LLMs", "OCR", "Automatización"],
      link: null,
    },
    {
      icon: "📈",
      title: "Estrategia comercial y producto",
      desc: "Transformamos ideas en productos, experiencias y campañas con una lógica de crecimiento real, medible y escalable.",
      tags: ["Product Discovery", "Marketing IA", "Roadmaps"],
      link: null,
    },
  ];

  const products = [
    { title: "ArquitectIA", desc: "Analiza logs, métricas y stack para diagnosticar mejoras de arquitectura: costos, escalabilidad, datos y procesos.", link: "/productos/arquitectia", badge: "Arquitectura & Costos Cloud" },
    { title: "TraceLink", desc: "Agente de IA que correlaciona tickets de soporte con trazas del sistema y señala la causa raíz en segundos.", link: "/productos/tracelink", badge: "Infraestructura & Observabilidad" },
    { title: "AuditIA", desc: "Auditoría forense con IA para detectar irregularidades, fraude y pagos sospechosos en minutos.", link: auditiaDemo, badge: "Fintech & Consorcios" },
    { title: "PaceAI", desc: "Plataforma de coaching deportivo con planes personalizados, métricas y rutinas generadas por IA.", link: paceia, badge: "Product + IA" },
    { title: "SemillAI", desc: "Asistente para validar ideas, construir roadmaps y convertir una intuición en una propuesta accionable.", link: semillai, badge: "Ideación & estrategia" },
    { title: "Consultorio Dra. Verónica", desc: "Experiencia digital más clara y cercana para mejorar la comunicación con pacientes y reforzar la marca.", link: consultorio, badge: "Servicios & marca" },
    { title: "Tierra Viva", desc: "Experiencia de e-commerce con IA para vender productos y escalar la conversión sin perder la identidad del negocio.", link: tierraviva, badge: "E-commerce" },
    { title: "Incubadora AI", desc: "Herramienta para descubrir hipótesis, oportunidades y caminos de negocio que se pueden desarrollar con IA.", link: incubadora, badge: "Innovación" },
  ];

  const methodology = [
    { step: "01", title: "Descubrimos el problema real", desc: "No arrancamos con tecnología; empezamos con la fricción, la oportunidad y el impacto de negocio." },
    { step: "02", title: "Diseñamos la solución con IA", desc: "Armamos un sistema claro, útil y escalable, pensado para operar en el día a día del cliente." },
    { step: "03", title: "Lo convertimos en producto", desc: "De la idea a la experiencia, con un roadmap fuerte y una ejecución que genera confianza desde el inicio." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-sm font-black text-slate-950">
              E
            </div>
            <span className="text-lg font-mono font-bold text-white">
              ezeti<span className="text-cyan-400">.pro</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#servicios" className="transition-colors hover:text-white">Servicios</a>
            <a href="#productos" className="transition-colors hover:text-white">Productos</a>
            <a href="#metodologia" className="transition-colors hover:text-white">Metodología</a>
            <a href="#casosdeuso" className="transition-colors hover:text-white">Casos</a>
            <a href="#nosotros" className="transition-colors hover:text-white">Nosotros</a>
          </nav>
          <a
            href="/seti"
            className="hidden sm:flex items-center gap-2 rounded-full border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/10"
          >
            🌱 Probá tu idea gratis
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:scale-105 hover:bg-cyan-400"
          >
            💬 Hablemos
          </a>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden px-6 py-24 sm:py-28 lg:py-32">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #06b6d4 0%, transparent 40%), radial-gradient(circle at 85% 20%, #6366f1 0%, transparent 35%)" }} />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)", backgroundSize: "3.5rem 3.5rem" }} />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900/80 px-4 py-2 text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" style={{ animation: "pulse 2s infinite" }} />
                EZETI · IA aplicada para negocios reales
              </div>
              <h1 className="mb-6 text-4xl font-black leading-[0.95] text-white sm:text-5xl lg:text-7xl">
                Creamos productos,
                <br />
                experiencias y <span className="text-cyan-400">sistemas de crecimiento</span>
                <br />
                con IA de verdad.
              </h1>
              <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
                No vendemos tecnología por venderla. Diseñamos soluciones que convierten ideas en productos, procesos y resultados comprobables para empresas que quieren avanzar con velocidad y criterio.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="#productos" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-7 py-4 font-semibold text-slate-950 transition-all hover:scale-105 hover:bg-cyan-400">
                  Ver ejemplos reales
                  <span>→</span>
                </a>
                <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-7 py-4 font-semibold text-white transition-all hover:border-slate-500">
                  Agendar una conversación
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -translate-y-4 rounded-[2rem] bg-cyan-500/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-[0_30px_80px_rgba(2,132,199,0.14)]">
                <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs font-mono text-slate-500">ezeti.command / operating system</span>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="mb-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">Motor de crecimiento</div>
                    <div className="mt-2 text-2xl font-black text-white">IA + estrategia + producto + ejecución</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="text-sm text-slate-400">Diagnóstico rápido</div>
                      <div className="mt-2 text-3xl font-black text-cyan-400">24h</div>
                      <div className="text-sm text-slate-500">para priorizar la próxima mejora</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="text-sm text-slate-400">Roadmap de implementación</div>
                      <div className="mt-2 text-3xl font-black text-cyan-400">3 etapas</div>
                      <div className="text-sm text-slate-500">de descubrimiento a escala</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>Proyectos activos</span>
                      <span className="font-semibold text-white">+12</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800">
                      <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {['Marketing IA', 'Operaciones', 'Productos', 'Data'].map((item) => (
                        <span key={item} className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800/70 bg-slate-900/40">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: count1 + "%", label: "Reducción en tiempos de procesamiento", sub: "Data & automatización" },
              { value: count2 + "+", label: "Años de experiencia aplicada", sub: "Fintech · Banca · Product" },
              { value: "$" + count3 + "M+", label: "En activos auditados con IA", sub: "Fraude & control" },
              { value: "$" + count4, label: "Ahorro mensual en cloud", sub: "Optimización FinOps" },
            ].map((item, index) => (
              <div key={index} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 text-center">
                <div className="text-3xl font-black text-cyan-400">{item.value}</div>
                <div className="mt-2 text-sm font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-xs text-slate-500">{item.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="servicios" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-500">Servicios</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Soluciones que conectan estrategia, producto y ejecución</h2>
              <p className="mt-4 text-lg text-slate-400">Creamos los bloques que hacen crecer una empresa: datos, IA, experiencias y operaciones.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {services.map((service, index) => (
                <div key={index} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-6 transition-all hover:-translate-y-1 hover:border-cyan-500/40">
                  <div className="mb-5 text-3xl">{service.icon}</div>
                  <h3 className="text-xl font-bold text-white">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{service.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="productos" className="border-y border-slate-800/70 bg-slate-900/35 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-500">Productos & experiencias</span>
                <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Una empresa que no solo habla de IA, sino que la pone en marcha</h2>
              </div>
              <p className="max-w-xl text-slate-400">Estos ejemplos muestran cómo la misma lógica se puede replicar para diferentes negocios: vender mejor, comunicar mejor, automatizar mejor y hacer crecer más rápido.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-8">
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Plataforma EZETI</div>
                <h3 className="mt-4 text-3xl font-black text-white">El valor no está en la herramienta, sino en el sistema completo</h3>
                <p className="mt-4 text-lg leading-8 text-slate-300">Diseñamos desde el problema hasta la experiencia final: descubrimiento, producto, automatización, comunicación y métricas. Eso hace que una idea se convierta en un activo real para la empresa.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400">Quiero una propuesta</a>
                  <a href={linkedin} target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 px-5 py-2.5 font-semibold text-white transition hover:border-slate-500">Ver perfil</a>
                </div>
              </div>
              <div className="grid gap-4">
                {products.map((product, index) => (
                  <a key={product.title} href={product.link} target="_blank" rel="noreferrer" className="rounded-[1.25rem] border border-slate-800 bg-slate-950/70 p-5 transition-all hover:border-cyan-500/40 hover:bg-slate-900">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">{product.badge}</div>
                        <h4 className="mt-2 text-lg font-bold text-white">{product.title}</h4>
                      </div>
                      <span className="text-sm text-slate-500">0{index + 1}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{product.desc}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="suite-infra" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-3xl">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-400">Suite de Infraestructura & Observabilidad</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Un sistema, dos agentes: uno reacciona, el otro previene</h2>
              <p className="mt-4 text-slate-400 leading-7">
                Cuando algo falla, <span className="text-amber-400 font-semibold">TraceLink</span> encuentra la causa en segundos.
                Antes de que falle, <span className="text-indigo-400 font-semibold">ArquitectIA</span> audita queries, costos, escalabilidad
                y calidad de datos, y arma un plan priorizado. En los dos casos la IA diagnostica — el equipo técnico decide qué implementar.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              {/* TraceLink card */}
              <a href="/productos/tracelink" target="_blank" rel="noreferrer"
                 className="group rounded-[1.5rem] border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] to-slate-950 p-7 transition-all hover:border-amber-500/50">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400">Reactivo</span>
                </div>
                <h3 className="text-2xl font-black text-white">TraceLink</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Pegás un ticket de soporte, el agente lo cruza contra el log de trazas del sistema y señala
                  exactamente qué operación técnica falló — filtrando el ruido irrelevante.
                </p>
                <div className="mt-5 text-xs font-mono text-slate-600 group-hover:text-amber-400 transition-colors">
                  ver demo →
                </div>
              </a>

              {/* connector */}
              <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-2">
                <div className="h-full w-px bg-gradient-to-b from-amber-500/40 via-slate-700 to-indigo-500/40" />
                <span className="font-mono text-[10px] text-slate-600 rotate-90 whitespace-nowrap">+ combinado</span>
                <div className="h-full w-px bg-gradient-to-b from-amber-500/40 via-slate-700 to-indigo-500/40" />
              </div>

              {/* ArquitectIA card */}
              <a href="/productos/arquitectia" target="_blank" rel="noreferrer"
                 className="group rounded-[1.5rem] border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.07] to-slate-950 p-7 transition-all hover:border-indigo-500/50">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <span className="text-xs font-mono uppercase tracking-[0.25em] text-indigo-400">Proactivo</span>
                </div>
                <h3 className="text-2xl font-black text-white">ArquitectIA</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Describís tu stack, logs y métricas. El agente audita costos de queries, escalabilidad en la nube,
                  calidad de datos y procesos, y devuelve un plan de mejora priorizado.
                </p>
                <div className="mt-5 text-xs font-mono text-slate-600 group-hover:text-indigo-400 transition-colors">
                  ver demo →
                </div>
              </a>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-slate-800 bg-slate-900/40 p-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-slate-500">El resultado combinado</div>
                <p className="mt-2 text-slate-300 leading-7 max-w-2xl">
                  Menos tiempo diagnosticando incidentes, menos plata quemada en queries mal optimizadas, y un plan
                  claro de qué mejorar antes de que se convierta en un problema. Todo queda en manos del equipo técnico
                  para decidir e implementar — la IA nunca toca producción sola.
                </p>
              </div>
              <a href={whatsapp} target="_blank" rel="noreferrer"
                 className="shrink-0 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 text-center">
                Quiero esta suite para mi infraestructura
              </a>
            </div>
          </div>
        </section>

        <section id="metodologia" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-500">Metodología</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Una forma de trabajar que arma confianza desde el primer paso</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {methodology.map((item) => (
                <div key={item.step} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-6">
                  <div className="mb-4 text-sm font-mono font-semibold uppercase tracking-[0.3em] text-cyan-400">{item.step}</div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="casosdeuso" className="border-t border-slate-800/70 bg-slate-900/35 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-500">Casos de impacto</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">El mismo enfoque puede transformar una consulta, un producto o una operación completa</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-8">
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">AuditIA</div>
                <h3 className="mt-3 text-2xl font-black text-white">Control, trazabilidad y detección temprana</h3>
                <p className="mt-4 text-slate-400">Un sistema que cruza fuentes de información para detectar irregularidades de forma automática, con alertas y claridad para actuar.</p>
                <a href={auditiaDemo} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400">Ver demo <span>→</span></a>
              </div>
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-8">
                <div className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">SemillAI</div>
                <h3 className="mt-3 text-2xl font-black text-white">Ideas que se convierten en roadmap real</h3>
                <p className="mt-4 text-slate-400">Herramienta para descubrir oportunidades, estructurar propuestas y avanzar con una visión más sólida desde el comienzo.</p>
                <a href={semillai} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400">Abrir producto <span>→</span></a>
              </div>
            </div>
          </div>
        </section>

        <section id="nosotros" className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-500">Sobre EZETI</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Una empresa de ejecución, visión y diseño aplicado a la realidad del negocio</h2>
              <p className="mt-5 text-lg leading-8 text-slate-400">Trabajamos en la intersección entre IA, datos, producto y operaciones para que las empresas puedan avanzar con menos ruido y más impacto.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400">Hablar con EZETI</a>
                <a href={linkedin} target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 px-5 py-2.5 font-semibold text-white transition hover:border-slate-500">LinkedIn</a>
                <a href={email} className="rounded-full border border-slate-700 px-5 py-2.5 font-semibold text-white transition hover:border-slate-500">Email</a>
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-8">
              <div className="grid gap-4">
                {[
                  { title: "Pensamos en negocio, no solo en tecnología", desc: "Cada solución busca un resultado concreto: mayor eficiencia, más ventas, mejor experiencia o mejor control." },
                  { title: "Construimos con criterio y velocidad", desc: "Trabajamos con una mirada clara para validar rápido, iterar con intención y evitar sobreingeniería." },
                  { title: "La IA se vuelve útil cuando está integrada", desc: "No se trata de un demo aislado, sino de un sistema que se usa, se aprende y mejora con el tiempo." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-slate-900 p-10 text-center">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Empezá hoy</span>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Si una idea merece avanzar, la convertimos en una experiencia que se puede probar y escalar.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">Hablemos de tu negocio, tu producto o tu proceso y veamos cómo la IA puede ayudar a que todo funcione mejor.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-500 px-7 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">Escribir por WhatsApp</a>
              <a href={linkedin} target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 px-7 py-3 font-semibold text-white transition hover:border-slate-500">Ver LinkedIn</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/70 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-sm text-slate-500 md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500 text-xs font-black text-slate-950">E</div>
            <span className="font-mono font-bold text-white">
              ezeti<span className="text-cyan-400">.pro</span>
            </span>
          </div>
          <p>2026 · EZETI · IA aplicada para productos, operaciones y crecimiento</p>
          <div className="flex flex-wrap gap-4">
            <a href="#servicios" className="transition hover:text-white">Servicios</a>
            <a href="#productos" className="transition hover:text-white">Productos</a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="transition hover:text-white">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
