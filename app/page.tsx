"use client";
import React from "react";

export default function LandingPage() {
  const email = "mailto:hola@ezeti.pro";
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans">
      <header className="border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-mono font-bold text-white">ezeti<span className="text-cyan-500">.pro</span></span>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#auditoria" className="hover:text-white transition-colors">Contacto</a>
          </nav>
          <a href="#auditoria" className="bg-slate-900 border border-slate-800 text-xs uppercase tracking-wider font-mono px-4 py-2 rounded text-cyan-400 hover:bg-slate-800 transition-all">Contactar Consultor</a>
        </div>
      </header>
      <section className="py-24 lg:py-32 border-b border-slate-900">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">Ingeniería de Datos y Arquitectura Analítica</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">Optimizamos pipelines de datos y transformamos infraestructuras complejas en almacenes rápidos y deterministas.</p>
          <a href="#auditoria" className="inline-block bg-cyan-500 text-slate-950 font-semibold px-8 py-4 rounded hover:bg-cyan-400 transition-colors">Solicitar Diagnóstico</a>
        </div>
      </section>
      <section id="servicios" className="py-24 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-16">Servicios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Data Warehouse</h3>
              <p className="text-slate-400 text-sm">Diseño e implementación en AWS, GCP o Azure con modelos dimensionales y gobernanza.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Optimización de Pipelines</h3>
              <p className="text-slate-400 text-sm">Refactorización de ETL/ELT, reducción de costos y eliminación de deuda técnica.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Analytics Engineering</h3>
              <p className="text-slate-400 text-sm">Modelos dbt, métricas unificadas y capa semántica para datos confiables y auditables.</p>
            </div>
          </div>
        </div>
      </section>
      <section id="auditoria" className="py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Diagnóstico gratuito</h2>
          <p className="text-slate-400 mb-10">Agendá una llamada de 30 minutos sin compromiso.</p>
          <a href={email} className="inline-block bg-cyan-500 text-slate-950 font-semibold px-10 py-4 rounded hover:bg-cyan-400 transition-colors">hola@ezeti.pro</a>
        </div>
      </section>
      <footer className="border-t border-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-xl font-mono font-bold text-white">ezeti<span className="text-cyan-500">.pro</span></span>
        </div>
      </footer>
    </div>
  );
}