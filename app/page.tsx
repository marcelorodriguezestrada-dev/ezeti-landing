"use client";
import React, { useEffect, useState } from "react";

export default function LandingPage() {
  const email = "mailto:marcelo.rodriguez.estrada@gmail.com";
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);

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
    animate(setCount1, 70, 1500);
    animate(setCount2, 15, 1200);
    animate(setCount3, 2000, 1800);
  }, []);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">

      {/* HEADER */}
      <header className="border-b border-slate-800/50 sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-black text-sm">E</span>
            </div>
            <span className="text-lg font-mono font-bold text-white">
              ezeti<span className="text-cyan-400">.pro</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#casosdeuso" className="hover:text-white transition-colors">Casos de Uso</a>
            <a href="#stack" className="hover:text-white transition-colors">Stack</a>
            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
          </nav>
          
          <a 
            href={email}
            className="bg-cyan-500 text-slate-950 text-sm font-semibold px-5 py-2 rounded-lg hover:bg-cyan-400 transition-all hover:scale-105"
          >
            Agendar Diagnóstico
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "4rem 4rem",
          }}
        />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-cyan-500/30 px-4 py-2 rounded-full text-xs font-mono text-cyan-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400" style={{ animation: "pulse 2s infinite" }} />
            Senior Data & ML Engineer · Fintech Strategist · IA Aplicada
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-none">
            Transformamos{" "}
            <span className="text-transparent" style={{ WebkitTextStroke: "1px #06b6d4" }}>
              datos complejos
            </span>
            <br />
            en decisiones <span className="text-cyan-400">inteligentes</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mb-12 leading-relaxed">
            Arquitectura de datos de clase enterprise, microagentes de IA y pipelines deterministas para
            operaciones críticas en Fintech, Banca y Scale-ups. <span className="text-white font-medium">15 años</span> construyendo infraestructura que no falla.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="#casosdeuso"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 text-slate-950 font-bold px-8 py-4 rounded-xl hover:bg-cyan-400 transition-all hover:scale-105 text-base"
            >
              Ver AuditIA en acción
              <span>→</span>
            </a>
            
            <a 
              href={email}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 text-white font-semibold px-8 py-4 rounded-xl hover:border-slate-500 transition-all text-base"
            >
              Diagnóstico gratuito
            </a>
          </div>
        </div>
      </section>

      {/* MÉTRICAS */}
      <section className="border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: count1 + "%", label: "Reducción en tiempos de procesamiento ETL", sub: "Mercado Libre · Accenture" },
            { value: count2 + "+", label: "Años de experiencia en Data Engineering", sub: "Fintech · Banca · Insurtech" },
            { value: "$" + count2 + "M+", label: "En activos auditados con IA", sub: "AuditIA Consorcial" },
            { value: "$" + count3, label: "USD ahorro mensual en cómputo cloud", sub: "Optimización FinOps" },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-black text-cyan-400 mb-1">{m.value}</div>
              <div className="text-sm text-white font-medium mb-1">{m.label}</div>
              <div className="text-xs text-slate-500">{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Servicios</span>
            <h2 className="text-4xl font-black text-white mt-3 mb-4">
              Lo que construimos juntos
            </h2>
            <p className="text-slate-400 max-w-2xl">
              Desde la arquitectura base hasta agentes autónomos en producción. Cada engagement entrega resultados medibles desde la semana uno.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "⚡",
                tag: "Core",
                title: "Data Engineering & Pipelines",
                desc: "Diseño e implementación de arquitecturas medallón, ETL/ELT y warehouses en AWS Redshift, BigQuery y Snowflake. Eliminamos deuda técnica y reducimos costos de cómputo hasta 70%.",
                stack: ["Airflow", "dbt", "Python", "SQL"],
              },
              {
                icon: "🤖",
                tag: "IA Aplicada",
                title: "Microagentes & Automatización IA",
                desc: "Diseño de agentes autónomos con N8N y LLMs para automatización de procesos complejos: auditoría documental, síntesis de datos, detección de anomalías y orquestación de workflows.",
                stack: ["N8N", "LLMs", "Python", "OCR"],
              },
              {
                icon: "☁️",
                tag: "Cloud",
                title: "Arquitectura Cloud & MLOps",
                desc: "Infraestructura robusta en AWS y GCP con CI/CD para datos, gobernanza end-to-end y monitoreo continuo. Desde startup hasta escala enterprise.",
                stack: ["AWS", "GCP", "Terraform", "Docker"],
              },
              {
                icon: "🏦",
                tag: "Fintech",
                title: "Fintech & Cumplimiento BCRA",
                desc: "Asesoramiento en PSP, integración KYC/AML, onboarding digital y gestión de cuentas recaudadoras. Navegamos el ecosistema regulatorio argentino.",
                stack: ["KYC/AML", "APIs Financieras", "Nosis", "Comafi"],
              },
              {
                icon: "📊",
                tag: "Analytics",
                title: "BI & Analytics Engineering",
                desc: "Capa semántica con métricas unificadas, modelos dbt, dashboards ejecutivos y OKRs. Tu equipo de negocio toma decisiones con datos en los que puede confiar.",
                stack: ["Looker", "Power BI", "dbt", "LightGBM"],
              },
              {
                icon: "🔍",
                tag: "Nuevo",
                title: "AuditIA — Auditoría Forense IA",
                desc: "Sistema de auditoría automatizada con validación cruzada triple: Balance vs. Facturas OCR/CAE vs. Extractos Bancarios. Detecta fraude, pagos duplicados y retiros sin respaldo en minutos.",
                stack: ["OCR", "IA Forense", "Supabase", "Next.js"],
                highlight: true,
              },
            ].map((s, i) => (
              <div
                key={i}
                className={[
                  "rounded-2xl p-6 border transition-all hover:scale-[1.02] cursor-default",
                  s.highlight
                    ? "bg-cyan-500/10 border-cyan-500/50 hover:border-cyan-400"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-600",
                ].join(" ")}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{s.icon}</span>
                  <span
                    className={[
                      "text-xs font-mono px-2 py-1 rounded-full",
                      s.highlight
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-slate-800 text-slate-400",
                    ].join(" ")}
                  >
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{s.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {s.stack.map((t) => (
                    <span key={t} className="text-xs bg-slate-800/80 text-slate-300 px-2 py-1 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASO DE USO: AUDITIA */}
      <section id="casosdeuso" className="py-28 bg-slate-900/40 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-4">
            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Caso de Éxito · IA en Producción</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                AuditIA Consorcial —<br />
                <span className="text-cyan-400">Fraude detectado en minutos,</span>
                <br />no en meses
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Desarrollamos un sistema de auditoría forense con IA que procesa años de registros financieros en minutos. Lo que antes requería semanas de trabajo contable manual, hoy se resuelve automáticamente con validación cruzada triple.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  { label: "Irregularidades detectadas", value: "$19M+ ARS", color: "text-red-400" },
                  { label: "Documentos procesados", value: "300+ páginas / minuto", color: "text-cyan-400" },
                  { label: "Score de auditoría", value: "Automático · 0-100", color: "text-green-400" },
                  { label: "Tipo de fraude detectado", value: "Pagos duplicados · Sin CAE · Facturación cruzada", color: "text-amber-400" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/50">
                    <span className="text-slate-400 text-sm">{r.label}</span>
                    <span className={["font-bold text-sm", r.color].join(" ")}>{r.value}</span>
                  </div>
                ))}
              </div>
              
              <a 
                href={email}
                className="inline-flex items-center gap-2 bg-cyan-500 text-slate-950 font-bold px-8 py-4 rounded-xl hover:bg-cyan-400 transition-all hover:scale-105"
              >
                Quiero una demo
                <span>→</span>
              </a>
            </div>

            {/* DASHBOARD MOCKUP */}
            <div className="bg-slate-950 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs font-mono text-slate-500">auditia.consorcial — Octubre 2025</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Total gastos", value: "$4.941.610", sub: "Liquidación mensual" },
                    { label: "Score auditoría", value: "20/100", sub: "🔴 Crítico", red: true },
                    { label: "Alertas activas", value: "5", sub: "4 alta · 1 media" },
                    { label: "Sin factura", value: "$1.490.319", sub: "Monto en riesgo", red: true },
                  ].map((c, i) => (
                    <div key={i} className={["rounded-xl p-3 border", c.red ? "bg-red-950/30 border-red-800/50" : "bg-slate-900 border-slate-800"].join(" ")}>
                      <div className="text-xs text-slate-500 mb-1">{c.label}</div>
                      <div className={["text-lg font-black", c.red ? "text-red-400" : "text-white"].join(" ")}>{c.value}</div>
                      <div className="text-xs text-slate-500">{c.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { tipo: "ALTA", desc: "17 gastos sin factura ni débito bancario", monto: "$2.964" },
                    { tipo: "ALTA", desc: "Personal representa 128% del gasto total", monto: "$1.500.697" },
                    { tipo: "ALTA", desc: "Diferencia caja/banco detectada", monto: "$897.777" },
                    { tipo: "MEDIA", desc: "1 factura sin débito bancario", monto: "—" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-800/50">
                      <span className={["text-xs font-mono font-bold px-2 py-0.5 rounded", a.tipo === "ALTA" ? "bg-red-950 text-red-400" : "bg-amber-950 text-amber-400"].join(" ")}>
                        {g.tipo}
                      </span>
                      <span className="text-xs text-slate-300 flex-1">{a.desc}</span>
                      <span className="text-xs font-mono text-slate-500">{a.monto}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA AUDITIA */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Tecnología</span>
            <h2 className="text-4xl font-black text-white mt-3">Validación cruzada triple con IA</h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto">Tres fuentes de datos. Un motor de cruce. Fraude imposible de esconder.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { num: "01", title: "Liquidación de Expensas", desc: "OCR + parser determinístico extrae todos los rubros del formato MIS EXPENSAS (Ley 941 GCBA). Identifica totales, proveedores y CAEs.", icon: "📄" },
              { num: "02", title: "Facturas & Comprobantes", desc: "Validación automática de CAE en AFIP/ARCA, detección de CUITs falsos, facturas de otros consorcios y comprobantes sin respaldo fiscal.", icon: "🧾" },
              { num: "03", title: "Extracto Bancario", desc: "Parser específico para Banco Ciudad. Clasifica débitos, créditos e impuestos. Detecta pagos sin factura y diferencias entre lo liquidado y lo pagado.", icon: "🏦" },
            ].map((p, i) => (
              <div key={i} className="relative bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="text-4xl mb-4">{p.icon}</div>
                <div className="text-xs font-mono text-cyan-500 mb-2">{p.num}</div>
                <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-cyan-500 text-2xl z-10">→</div>
                )}
              </div>
            ))}
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 text-center">
            <p className="text-cyan-300 font-semibold text-lg">
              Resultado: Score 0–100 · Alertas priorizadas · Informe para propietarios · Informe técnico completo
            </p>
          </div>
        </div>
      </section>

      {/* STACK */}
      <section id="stack" className="py-28 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Stack Tecnológico</span>
            <h2 className="text-4xl font-black text-white mt-3">Herramientas de producción real</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                cat: "Inteligencia Artificial",
                items: ["Microagentes autónomos", "LightGBM", "Redes neuronales", "Detección anomalías", "OCR avanzado", "N8N Flows"],
              },
              {
                cat: "Data Engineering",
                items: ["Apache Airflow", "dbt", "ETL/ELT", "Star Schema", "CI/CD datos", "Modelado dimensional"],
              },
              {
                cat: "Cloud & DevOps",
                items: ["AWS S3 · Redshift", "GCP BigQuery", "Dataflow", "Data Catalog", "Microservicios", "Infraestructura código"],
              },
              {
                cat: "BI & Fintech",
                items: ["Looker · Power BI", "KYC/AML", "APIs BCRA/PSP", "Trading algorítmico", "QuantConnect", "OKRs ejecutivos"],
              },
            ].map((g, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-wide">{g.cat}</h3>
                <ul className="space-y-2">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCIA */}
      <section id="nosotros" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Quién está detrás</span>
              <h2 className="text-4xl font-black text-white mt-3 mb-6">
                Marcelo Rodriguez Estrada
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Senior Data & ML Engineer con más de 15 años en la intersección de Fintech, Arquitectura Cloud e Inteligencia Artificial. Doble Maestría en Data Mining (UBA) y Finanzas (UTDT).
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                Construí ecosistemas de datos para Mercado Libre (vía Accenture), KAVAK, MetLife y Telecom. Hoy dirijo EZETI, donde aplicamos IA a problemas reales con impacto directo en el bottom line.
              </p>
              <div className="flex flex-wrap gap-3">
                {["MSc. Data Mining · UBA", "MSc. Finanzas · UTDT", "Inglés C1+ Profesional"].map((b) => (
                  <span key={b} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { empresa: "Mandala Tech · Mercado Libre", rol: "Ingeniero de Datos & Analytics", periodo: "Jul 2024 – Feb 2026", logro: "70% reducción tiempos ETL · USD $2.000/mes ahorro · Migración Redshift" },
                { empresa: "UNIGO · Insurtech", rol: "Senior Data Engineer & BI Lead", periodo: "2018 – 2024", logro: "Arquitectura AWS desde cero · ML Lead Scoring · duplicó ventas diarias" },
                { empresa: "Dacodes · KAVAK", rol: "Ingeniero de Datos", periodo: "2017", logro: "Modern Data Stack · Airflow + Looker · KPIs en tiempo real" },
                { empresa: "Close-Up · Telecom · MSD", rol: "Consultor Senior BI", periodo: "2008 – 2015", logro: "Arquitectura QlikView enterprise · Oracle · múltiples clientes" },
              ].map((e, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{e.empresa}</div>
                      <div className="text-xs text-cyan-400">{e.rol}</div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap ml-4">{e.periodo}</span>
                  </div>
                  <p className="text-xs text-slate-400">{e.logro}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Empezá hoy</span>
          <h2 className="text-5xl font-black text-white mt-4 mb-6">
            ¿Tu infraestructura de datos<br />
            <span className="text-cyan-400">está frenando el negocio?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            30 minutos de diagnóstico sin compromiso. Analizamos tu stack, identificamos los cuellos de botella y te mostramos el roadmap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={email}
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 text-slate-950 font-black px-10 py-5 rounded-2xl hover:bg-cyan-400 transition-all hover:scale-105 text-lg"
            >
              Agendar diagnóstico gratuito
              <span>→</span>
            </a>
          </div>
          <p className="text-slate-600 text-sm mt-6">
            marcelo.rodriguez.estrada@gmail.com · Belgrano, CABA · +54 11 6707-6678
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/50 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-black text-xs">E</span>
            </div>
            <span className="font-mono font-bold text-white">
              ezeti<span className="text-cyan-400">.pro</span>
            </span>
          </div>
          <p className="text-xs text-slate-600">
            2026 · EZETI · Senior Data Engineering & IA Aplicada · Buenos Aires, Argentina
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#casosdeuso" className="hover:text-white transition-colors">AuditIA</a>
            <a href={email} className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

    </div>
  );
}