"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import { PRODUCT_CATALOG_DATA } from "@/lib/productCatalogData";

const CATEGORIES = [
  { id: "all", label: "All Products" },
  { id: "Cleanser", label: "Cleansers" },
  { id: "Moisturizer", label: "Moisturizers" },
  { id: "Serum", label: "Serums & Actives" },
  { id: "Sunscreen", label: "Sun Protection" },
  { id: "Tool", label: "Tools" },
];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeIssue = typeof window !== "undefined" ? window.sessionStorage.getItem("analysisCategory") : null;

  const filteredProducts = useMemo(() => {
    return PRODUCT_CATALOG_DATA.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.type === activeCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags?.some((tag) => tag.includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const protocolProducts = filteredProducts.filter((product) =>
    ["Cleanser", "Serum", "Sunscreen", "Moisturizer"].includes(product.type)
  );

  const advancedProducts = filteredProducts.filter((product) => !protocolProducts.some((p) => p.name === product.name));
  const featuredProduct = (protocolProducts.length > 0 ? protocolProducts : filteredProducts)[0];

return (
  <div className="af-page-shell flex flex-col h-full w-full min-h-screen animate-in fade-in duration-700 relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-[var(--accent-blue-soft)]/20 blur-[120px] rounded-full opacity-40" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-[var(--accent-amber)]/14 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full">
        {/* Header Hero */}
          <div className="nv-section-white overflow-hidden mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-blue-soft)]/20 blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-bold text-[var(--accent-blue)] uppercase tracking-widest bg-[var(--bg-wash-start)] px-3 py-1 rounded inline-block mb-3 border border-[var(--border-hairline)]">Protocol Dispensary</span>
              <h1 className="text-clinical-heading text-4xl sm:text-5xl font-extrabold text-[var(--ink)] leading-tight tracking-tight mb-4">Clinical Apothecary</h1>
              <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
                Dermatologist-approved formulations targeted to your specific protocol signals.
                Every product is vetted for strict adherence to clinical standards and zero-interference.
              </p>
           </div>
           
           <div className="relative z-10 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Query protocol treatments..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="af-input w-full px-5 py-4 pl-12 text-sm outline-none transition-all"
                />
              </div>
           </div>
        </div>

        {/* Categories */}
        <div className="no-scrollbar mb-10 flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-[var(--accent-blue)] text-white shadow-[0_14px_30px_rgba(47,111,87,0.24)] hover:bg-[var(--accent-blue)]"
                  : "af-pill text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-16">
            {featuredProduct && (
              <section className="nv-section-white">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-blue)]">Recommended for YOU</p>
                <h2 className="mt-2 text-2xl font-bold text-black">Priority Product</h2>
                <p className="mt-1 text-sm text-[var(--ink)]">Based on your current protocol signals, start here before adding optional modules.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ProductCard product={featuredProduct} />
                </div>
              </section>
            )}

            <section>
              <div className="mb-6">
                <p className="text-xs font-bold text-[var(--accent-blue)] uppercase tracking-widest mb-1 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> High Urgency</p>
                <h2 className="text-2xl font-bold text-[var(--ink)] mb-2">Protocol Prescriptions</h2>
                <p className="text-sm text-[var(--ink-soft)]">{activeIssue ? `Based on your issue: ${activeIssue.replace(/_/g, " ")}` : "Based on your issue profile and recovery phase."}</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(protocolProducts.length > 0 ? protocolProducts : filteredProducts).map((product) => (
                  <ProductCard key={product.name} product={product} />
                ))}
              </div>
            </section>

            {advancedProducts.length > 0 && (
              <section className="pt-8 border-t border-[var(--border-hairline)]">
                <div className="mb-6">
                  <p className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-widest mb-1">Optimization Layer</p>
                  <h2 className="text-2xl font-bold text-[var(--ink)] mb-2">Advanced Modules</h2>
                  <p className="text-sm text-[var(--ink-soft)]">Optional high-impact add-ons for targeted symptom resolution and accelerated timelines.</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {advancedProducts.map((product) => (
                    <ProductCard key={`adv-${product.name}`} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="af-surface-card flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-2xl bg-[var(--tint-warm)] border border-[var(--border-hairline)] p-5 shadow-inner">
              <Sparkles className="h-10 w-10 text-[var(--ink-soft)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--ink)] mb-2">No formulations isolated</h3>
            <p className="max-w-md text-sm text-[var(--ink-soft)]">
              The query matrix returned zero compatible matches within the current clinical restrictions.
            </p>
            <button 
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              className="mt-8 px-6 py-2.5 rounded-full border border-[var(--border-hairline)] text-[var(--accent-blue)] font-semibold hover:bg-[var(--bg-wash-start)] transition-colors text-sm flex items-center gap-2"
            >
              Reset Protocol Parameters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

