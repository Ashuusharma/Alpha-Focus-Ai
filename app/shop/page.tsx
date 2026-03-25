"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import CartDrawer from "@/components/shop/CartDrawer";
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

return (
  <div className="af-page-shell flex flex-col h-full w-full min-h-screen animate-in fade-in duration-700 relative">
      <CartDrawer />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-[#A9CBB7]/20 blur-[120px] rounded-full opacity-40" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-[#d8b55f]/14 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full">
        {/* Header Hero */}
          <div className="af-surface-card overflow-hidden p-8 lg:p-12 mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#A9CBB7]/20 blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-bold text-[#2F6F57] uppercase tracking-widest bg-[#E8EFEA] px-3 py-1 rounded inline-block mb-3 border border-[#C8DACF]">Protocol Dispensary</span>
              <h1 className="text-clinical-heading text-4xl sm:text-5xl font-extrabold text-[#1F3D2B] leading-tight tracking-tight mb-4">Clinical Apothecary</h1>
              <p className="text-[#6B665D] text-sm leading-relaxed">
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
                  className="af-input w-full rounded-2xl px-5 py-4 pl-12 text-sm outline-none transition-all"
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
                  ? "bg-[#2F6F57] text-white shadow-[0_14px_30px_rgba(47,111,87,0.24)] hover:bg-[#275c48]"
                  : "af-pill text-[#6B665D] hover:text-[#1F3D2B]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-16">
            <section>
              <div className="mb-6">
                <p className="text-xs font-bold text-[#2F6F57] uppercase tracking-widest mb-1 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> High Urgency</p>
                <h2 className="text-2xl font-bold text-[#1F3D2B] mb-2">Protocol Prescriptions</h2>
                <p className="text-sm text-[#6B665D]">Foundation components mathematically mapped to your current recovery phase.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(protocolProducts.length > 0 ? protocolProducts : filteredProducts).map((product) => (
                  <ProductCard key={product.name} product={product} />
                ))}
              </div>
            </section>

            {advancedProducts.length > 0 && (
              <section className="pt-8 border-t border-[#e2d8ca]">
                <div className="mb-6">
                  <p className="text-xs font-bold text-[#8C6A5A] uppercase tracking-widest mb-1">Optimization Layer</p>
                  <h2 className="text-2xl font-bold text-[#1F3D2B] mb-2">Advanced Modules</h2>
                  <p className="text-sm text-[#6B665D]">Optional high-impact add-ons for targeted symptom resolution and accelerated timelines.</p>
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
            <div className="mb-6 rounded-2xl bg-[#f5efe5] border border-[#e2d8ca] p-5 shadow-inner">
              <Sparkles className="h-10 w-10 text-[#8C6A5A]" />
            </div>
            <h3 className="text-xl font-bold text-[#1F3D2B] mb-2">No formulations isolated</h3>
            <p className="max-w-md text-sm text-[#6B665D]">
              The query matrix returned zero compatible matches within the current clinical restrictions.
            </p>
            <button 
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              className="mt-8 px-6 py-2.5 rounded-full border border-[#C8DACF] text-[#2F6F57] font-semibold hover:bg-[#E8EFEA] transition-colors text-sm flex items-center gap-2"
            >
              Reset Protocol Parameters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
