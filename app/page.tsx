cat > app/page.tsx << 'ENDOFFILE'
"use client";
import React from "react";

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans">

      {/* HEADER */}
      <header className="border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-mono font-bold text-white">
            ezeti<span className="text-cyan-500">.pro</span>
          </span>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#auditoria" className="hover:text-white transition-colors">Contacto</a>
          </nav>
          <a href="#auditoria" className="bg-slate-900 border border-slate-800 text-xs uppercase tracking-wider font-mono px-4 py-2 rounded text-cyan-400 hover:bg-slate-800 transition-all">
            Contactar Consultor
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden py-24 lg:py-32 border-b border-slate-900">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-400 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Consultoría de Datos Senior</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Ingeniería de Datos y Arquitectura Analítica para Operaciones Críticas
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Optimizamos pipelines de datos, reducimos costos de cómputo en la nube y transformamos infraestructuras complejas en almacenes de datos rápidos, limpios y deterministas.
          </p>
          <a href="#auditoria" className="inline-block bg-cyan-500 text-slate-950 font-semibold px-8 py-4 rounded hover:bg-cyan-400 transition-colors">
            Solicitar Diagnóstico de Infraestructura
          </a>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-24 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Servicios</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">Lo que construimos juntos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors">
              <div className="text-xs font-mono text-cyan-500 mb-3">01</div>
              <h3 className="text-lg font-semibold text-white mb-3">Arquitectura de Data Warehouse</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Diseño e implementación de almacenes de datos escalables en AWS, GCP o Azure. Modelos dimensionales, capas medallón y gobernanza desde el día uno.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors">
              <div className="text-xs font-mono text-cyan-500 mb-3">02</div>
              <h3 className="text-lg font-semibold text-white mb-3">Optimización de Pipelines</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Diagnóstico y refactorización de ETL/ELT existentes. Reducción de costos de cómputo, mejora de latencias y eliminación de deuda técnica en datos.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors">
              <div className="text-xs font-mono text-cyan-500 mb-3">03</div>
              <h3 className="text-lg font-semibold text-white mb-3">Analytics Engineering</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Construcción de modelos dbt, métricas unificadas y capa semántica para que tu equipo tenga datos confiables y auditables.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="auditoria" className="py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Diagnóstico gratuito</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-6">
            ¿Tu infraestructura de datos está frenando el negocio?
          </h2>
          <p className="text-slate-400 mb-10">
            Agendá una llamada de 30 minutos. Analizamos tu stack actual y te damos un diagnóstico honesto sin compromiso.
          </p>
          
            href={"mailto:hola@ezeti.pro"}
            className="inline-block bg-cyan-500 text-slate-950 font-semibold px-10 py-4 rounded hover:bg-cyan-400 transition-colors"
          >
            Escribir a hola@ezeti.pro
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xl font-mono font-bold text-white">
            ezeti<span className="text-cyan-500">.pro</span>
          </span>
          <p className="text-xs text-slate-600">2026 ezeti.pro — Ingeniería de Datos Senior</p>
        </div>
      </footer>

    </div>
  );
}
