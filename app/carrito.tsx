'use client';

import React, { useState, useEffect } from 'react';

const WHATSAPP_NUMBER = "5491100000000"; // ← Cambia por tu número real
const FREE_SHIPPING_THRESHOLD = 25000;

interface Tier {
  label: string;
  qty: number;
  price: number;
  best?: boolean;
}

interface Product {
  id: number;
  name: string;
  cat: 'juguetes' | 'libreria' | 'bijou';
  emoji: string;
  resale: number;
  stock: number;
  stockMax: number;
  buyers: number;
  tiers: Tier[];
}

const CATS = {
  juguetes: { color: 'var(--rojo)', label: 'Juguetes' },
  libreria: { color: 'var(--azul)', label: 'Librería' },
  bijou: { color: 'var(--amarillo)', label: 'Bijou / Cotillón' },
} as const;

const PRODUCTS: Product[] = [
  {
    id: 1, name: "Muñeca Bebota 35cm", cat: "juguetes", emoji: "🧸",
    resale: 2500, stock: 14, stockMax: 20, buyers: 37,
    tiers: [
      { label: "Unidad", qty: 1, price: 1500 },
      { label: "Media doc.", qty: 6, price: 8100 },
      { label: "Docena", qty: 12, price: 15300, best: true },
    ]
  },
  {
    id: 2, name: "Auto a Fricción x1", cat: "juguetes", emoji: "🚗",
    resale: 1800, stock: 6, stockMax: 24, buyers: 22,
    tiers: [
      { label: "Unidad", qty: 1, price: 1050 },
      { label: "Media doc.", qty: 6, price: 5700 },
      { label: "Docena", qty: 12, price: 10800, best: true },
    ]
  },
  {
    id: 3, name: "Cuaderno Universo A4 T.Dura", cat: "libreria", emoji: "📓",
    resale: 3200, stock: 22, stockMax: 30, buyers: 54,
    tiers: [
      { label: "Unidad", qty: 1, price: 1900 },
      { label: "Media doc.", qty: 6, price: 9600, best: true },
      { label: "Docena", qty: 12, price: 18200 },
    ]
  },
  {
    id: 4, name: "Set 12 Lápices de Colores", cat: "libreria", emoji: "✏️",
    resale: 2100, stock: 9, stockMax: 30, buyers: 41,
    tiers: [
      { label: "Unidad", qty: 1, price: 1250 },
      { label: "Media doc.", qty: 6, price: 6600, best: true },
      { label: "Docena", qty: 12, price: 12600 },
    ]
  },
  {
    id: 5, name: "Pulsera Strass Surtida x12", cat: "bijou", emoji: "💎",
    resale: 900, stock: 4, stockMax: 15, buyers: 63,
    tiers: [
      { label: "Docena", qty: 12, price: 6200, best: true },
      { label: "x2 Docenas", qty: 24, price: 11800 },
      { label: "Bulto x60", qty: 60, price: 27000 },
    ]
  },
  {
    id: 6, name: "Cotillón Cumple Temático x10", cat: "bijou", emoji: "🎉",
    resale: 1600, stock: 11, stockMax: 20, buyers: 29,
    tiers: [
      { label: "Pack x10", qty: 10, price: 5400 },
      { label: "Pack x30", qty: 30, price: 14700, best: true },
      { label: "Bulto x100", qty: 100, price: 44000 },
    ]
  },
];

const fmt = (n: number) => "$" + n.toLocaleString('es-AR');

export default function MayoristaPilita() {
  const [cart, setCart] = useState<Record<number, { tierIndex: number }>>({});
  const [selectedTier, setSelectedTier] = useState<Record<number, number>>({});
  const [activeCat, setActiveCat] = useState<'all' | 'juguetes' | 'libreria' | 'bijou'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const gainFor = (product: Product, tier: Tier) => {
    const perUnitCost = Math.round(tier.price / tier.qty);
    return Math.max(0, Math.round((product.resale - perUnitCost) * tier.qty));
  };

  const cartTotals = () => {
    let total = 0, gain = 0, count = 0;
    Object.keys(cart).forEach(idStr => {
      const id = Number(idStr);
      const p = PRODUCTS.find(pp => pp.id === id)!;
      const tier = p.tiers[cart[id].tierIndex];
      total += tier.price;
      gain += gainFor(p, tier);
      count += 1;
    });
    return { total, gain, count };
  };

  const addToCart = (id: number) => {
    const tIdx = selectedTier[id] ?? PRODUCTS.find(p => p.id === id)!.tiers.findIndex(t => t.best) ?? 0;
    setCart(prev => ({ ...prev, [id]: { tierIndex: tIdx } }));
    setIsDrawerOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const selectTier = (id: number, idx: number) => {
    setSelectedTier(prev => ({ ...prev, [id]: idx }));
  };

  const filterCat = (cat: 'all' | 'juguetes' | 'libreria' | 'bijou') => {
    setActiveCat(cat);
  };

  const sendWhatsapp = () => {
    const { total, count } = cartTotals();
    if (count === 0) {
      alert('Agregá al menos un producto antes de confirmar.');
      return;
    }

    let msg = "🧾 *Hoja de Pedido Mayorista — Pilita*\\n\\n";
    Object.keys(cart).forEach(idStr => {
      const id = Number(idStr);
      const p = PRODUCTS.find(pp => pp.id === id)!;
      const tier = p.tiers[cart[id].tierIndex];
      msg += `• ${p.name} — ${tier.label} — ${fmt(tier.price)}\\n`;
    });
    msg += `\\n*Total: ${fmt(total)}*\\n\\nQuedo atento/a a confirmación de stock y forma de pago. ¡Gracias!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const { total, gain, count } = cartTotals();
  const pct = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  const goalMsg = remaining > 0
    ? `Llevás <strong>${fmt(total)}</strong> — te faltan <strong>${fmt(remaining)}</strong> para envío gratis.`
    : `<strong>¡Envío gratis desbloqueado!</strong>`;

  return (
    <>
      <style jsx global>{`
        :root {
          --kraft: #FAF7F0;
          --kraft-dark: #EFE9DC;
          --ink: #1D1B16;
          --ink-soft: #5C574B;
          --rojo: #E8402C;
          --azul: #1F6FEB;
          --amarillo: #F5B700;
          --plata: #1B8A5A;
          --plata-bg: #E4F3EB;
          --line: #DCD4C0;
          --white: #FFFDF9;
          --radius: 14px;
          --shadow: 0 2px 0 rgba(29,27,22,0.06), 0 8px 24px rgba(29,27,22,0.06);
        }
        /* (El resto del CSS original se mantiene igual) */
        ${/* Pega aquí todo el <style> del HTML original */ ''}
      `}</style>

      {/* Header, Hero, Filters, Grid, etc. */}
      <header>
        {/* ... (mismo HTML pero convertido a JSX) */}
        {/* Recomiendo copiar el HTML y adaptarlo sección por sección */}
      </header>

      {/* Ejemplo de sección completa (Grid) */}
      <div className="filters" id="filters">
        {(['all', 'juguetes', 'libreria', 'bijou'] as const).map(cat => (
          <button
            key={cat}
            className={`chip ${activeCat === cat ? 'active' : ''}`}
            onClick={() => filterCat(cat)}
          >
            {cat !== 'all' && <span className="dot" style={{ background: CATS[cat].color }}></span>}
            {cat === 'all' ? 'Todo' : CATS[cat].label}
          </button>
        ))}
      </div>

      <div className="grid" id="grid">
        {PRODUCTS
          .filter(p => activeCat === 'all' || p.cat === activeCat)
          .map(p => {
            const tIdx = selectedTier[p.id] ?? p.tiers.findIndex(t => t.best) ?? 0;
            const tier = p.tiers[tIdx];
            const catInfo = CATS[p.cat];
            const stockPct = Math.min(100, Math.round((p.stock / p.stockMax) * 100));
            const stockColor = p.stock <= p.stockMax * 0.25 ? 'var(--rojo)' : p.stock <= p.stockMax * 0.5 ? 'var(--amarillo)' : 'var(--plata)';
            const gain = gainFor(p, tier);
            const perUnitCost = Math.round(tier.price / tier.qty);

            return (
              <div key={p.id} className="card">
                <div className="card-img" style={{ background: `${catInfo.color}22` }}>
                  <span className="card-tag" style={{ background: catInfo.color }}>{catInfo.label}</span>
                  {p.emoji}
                </div>
                <div className="card-body">
                  <div className="card-title">{p.name}</div>
                  <div className="social-proof"><span className="flame">🔥</span> {p.buyers} kiosqueros lo pidieron este mes</div>
                  {/* ... resto del contenido de la tarjeta */}
                  <button className="add-btn" onClick={() => addToCart(p.id)}>
                    Agregar a la hoja de pedido
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Drawer del carrito */}
      <div className={`overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        {/* Contenido del drawer (similar conversión) */}
        <button className="wa-btn" onClick={sendWhatsapp}>
          📲 Confirmar por WhatsApp
        </button>
      </div>
    </>
  );
}