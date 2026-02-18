"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Check, ShoppingCart, ArrowRight, AlertTriangle } from "lucide-react";
import { useComparisonStore, CompareProduct } from "@/lib/comparisonStore";
import { useCartStore } from "@/lib/cartStore";
import { useIngredientBlacklistStore } from "@/lib/ingredientBlacklistStore";

export default function ProductComparison() {
  const { products, isOpen, closeComparison, removeProduct, clearAll } = useComparisonStore();
  const addToCart = useCartStore((s) => s.addItem);
  const { isBlacklisted } = useIngredientBlacklistStore();

  if (!isOpen || products.length === 0) return null;

  const handleAddToCart = (product: CompareProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.replace("₹", "")),
      quantity: 1,
    });
  };

  // Get all unique ingredient names across products
  const allIngredients = Array.from(
    new Set(products.flatMap((p) => p.keyIngredients.map((i) => i.name)))
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={closeComparison}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl glass rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 p-6 border-b border-white/5 bg-[#0B0F19]/95 backdrop-blur-xl flex items-center justify-between z-10">
            <div>
              <h3 className="text-xl font-bold text-white">Compare Products</h3>
              <p className="text-sm text-gray-500">{products.length} products selected</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition"
              >
                Clear All
              </button>
              <button
                onClick={closeComparison}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Product Headers */}
          <div className="grid gap-4 p-6 border-b border-white/5" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
            {products.map((product) => (
              <div key={product.id} className="text-center relative">
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/30 transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-20 h-20 mx-auto mb-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-3xl">💧</span>
                </div>
                <h4 className="font-bold text-white text-sm leading-tight mb-1">{product.name}</h4>
                <p className="text-xs text-gray-500">{product.type}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="p-6 space-y-6">
            {/* Price & Rating */}
            <CompareRow label="Price" products={products}>
              {(product) => (
                <span className="text-xl font-bold text-primary">{product.price}</span>
              )}
            </CompareRow>

            <CompareRow label="Rating" products={products}>
              {(product) => (
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">{product.rating}</span>
                </div>
              )}
            </CompareRow>

            {/* Key Ingredients */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Key Ingredients</h4>
              {allIngredients.map((ingredientName) => {
                const blacklisted = isBlacklisted(ingredientName);
                return (
                  <div
                    key={ingredientName}
                    className={`grid gap-4 items-center p-3 rounded-lg ${
                      blacklisted ? "bg-red-500/10 border border-red-500/20" : "bg-white/5"
                    }`}
                    style={{ gridTemplateColumns: `120px repeat(${products.length}, minmax(0, 1fr))` }}
                  >
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      {blacklisted && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      {ingredientName}
                    </div>
                    {products.map((product) => {
                      const ingredient = product.keyIngredients.find(
                        (i) => i.name === ingredientName
                      );
                      return (
                        <div key={product.id} className="text-center">
                          {ingredient ? (
                            <div>
                              <div className="flex justify-center mb-1">
                                <Check className="w-5 h-5 text-green-400" />
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mx-4">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                                  style={{ width: `${ingredient.effectiveness}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500">
                                {ingredient.effectiveness}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Why It Helps */}
            <CompareRow label="Why It Helps" products={products}>
              {(product) => (
                <p className="text-xs text-gray-400 leading-relaxed">{product.whyItHelps}</p>
              )}
            </CompareRow>

            {/* How to Use */}
            <CompareRow label="How to Use" products={products}>
              {(product) => (
                <p className="text-xs text-gray-400 leading-relaxed">{product.howToUse}</p>
              )}
            </CompareRow>

            {/* When to Use */}
            <CompareRow label="When to Use" products={products}>
              {(product) => (
                <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                  {product.whenToUse}
                </span>
              )}
            </CompareRow>

            {/* Add to Cart */}
            <div
              className="grid gap-4 pt-4 border-t border-white/5"
              style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}
            >
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-black font-bold hover:bg-cyan-400 transition btn-glow"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper component for comparison rows
function CompareRow({
  label,
  products,
  children,
}: {
  label: string;
  products: CompareProduct[];
  children: (product: CompareProduct) => React.ReactNode;
}) {
  return (
    <div
      className="grid gap-4 items-start p-3 rounded-lg bg-white/5"
      style={{ gridTemplateColumns: `120px repeat(${products.length}, minmax(0, 1fr))` }}
    >
      <div className="text-sm font-medium text-gray-400">{label}</div>
      {products.map((product) => (
        <div key={product.id} className="text-center">
          {children(product)}
        </div>
      ))}
    </div>
  );
}
