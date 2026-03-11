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
    <div className="min-h-screen bg-[#F4EFE6] pb-20 pt-24 text-[#1F3D2B]">
      <CartDrawer />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-center md:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F3D2B]">Clinical Apothecary</h1>
            <p className="mt-2 max-w-xl text-[#6B665D]">
              Dermatologist-approved formulations targeted to your specific skin concerns.
              Every product is vetted for efficacy and safety.
            </p>
          </div>
          
          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B665D]" />
              <input 
                type="text" 
                placeholder="Search treatments..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E2DDD4] bg-white px-4 py-2.5 pl-10 text-sm outline-none transition-all placeholder:text-[#6B665D]/60 focus:border-[#2F6F57] focus:ring-1 focus:ring-[#2F6F57]"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-[#2F6F57] text-white shadow-md shadow-[#2F6F57]/20"
                  : "bg-white text-[#6B665D] hover:bg-[#E8EFEA] hover:text-[#1F3D2B]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-10">
            <section>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6B665D]">Recommended For You</p>
                <h2 className="text-2xl font-bold text-[#1F3D2B]">Protocol Products</h2>
                <p className="text-sm text-[#6B665D]">Foundation products mapped to cleanser-treatment-protect sequence.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(protocolProducts.length > 0 ? protocolProducts : filteredProducts).map((product) => (
                  <ProductCard key={product.name} product={product} />
                ))}
              </div>
            </section>

            {advancedProducts.length > 0 && (
              <section>
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#6B665D]">Optimization Layer</p>
                  <h2 className="text-2xl font-bold text-[#1F3D2B]">Advanced Products</h2>
                  <p className="text-sm text-[#6B665D]">High-impact add-ons for targeted correction and maintenance phases.</p>
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
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 border border-[#E2DDD4] py-20 text-center">
            <div className="mb-4 rounded-full bg-[#E2DDD4] p-4 text-[#8C6A5A]">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#1F3D2B]">No formulations found</h3>
            <p className="mt-2 text-sm text-[#6B665D]">
              Try adjusting your search filters or browse all categories.
            </p>
            <button 
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              className="mt-6 font-semibold text-[#2F6F57] hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
