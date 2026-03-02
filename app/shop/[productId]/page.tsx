"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PRODUCT_CATALOG_DATA } from "@/lib/productCatalogData";
import { useCartStore } from "@/lib/cartStore";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ productId: string }>();
  const productId = params?.productId;
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();

  const decodedId = decodeURIComponent(Array.isArray(productId) ? productId[0] : productId || "");
  
  const product = PRODUCT_CATALOG_DATA.find(
    (p) => (p.sku && p.sku === decodedId) || p.name === decodedId
  );

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4EFE6] text-[#1F3D2B]">
        <h1 className="text-2xl font-bold">Formulation Not Found</h1>
        <Link href="/shop" className="mt-4 text-[#2F6F57] hover:underline">
          Return to Apothecary
        </Link>
      </div>
    );
  }

  const fallbackImage = "/images/report-fallback.svg";
  const [imageSrc, setImageSrc] = useState(product.imageUrl || fallbackImage);

  useEffect(() => {
    setImageSrc(product.imageUrl || fallbackImage);
  }, [product.imageUrl]);

  const handleAddToCart = () => {
    addItem({
      id: product.sku || product.name,
      name: product.name,
      price: 24.00,
      quantity,
      usageDays: 30,
    });
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] pb-20 pt-24 text-[#1F3D2B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link 
          href="/shop" 
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6B665D] hover:text-[#1F3D2B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Apothecary
        </Link>
        
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-sm border border-[#E2DDD4]">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              onError={() => setImageSrc(fallbackImage)}
              unoptimized
            />
            {product.tags && product.tags.includes("active") && (
              <span className="absolute left-6 top-6 rounded-full bg-[#2F6F57] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                Clinical Strength
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B665D]">
                {product.brand || "Alpha Focus"}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#6B665D]" />
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[#C9A227] text-[#C9A227]" />
                <span className="text-sm font-bold text-[#1F3D2B]">4.8</span>
                <span className="text-xs text-[#6B665D]">(124 Reviews)</span>
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold text-[#1F3D2B] md:text-4xl">
              {product.name}
            </h1>
            
            <p className="mb-6 text-lg leading-relaxed text-[#6B665D]">
              Advanced {product.type.toLowerCase()} engineered to support skin barrier integrity and deliver targeted actives. 
              Formulated for optimal absorption and minimal irritation.
            </p>

            <div className="mb-8 space-y-3 rounded-2xl bg-white/60 p-6 border border-[#E2DDD4]">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8EFEA] text-[#2F6F57]">
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-sm text-[#4A453E]">Dermatologist tested & approved.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8EFEA] text-[#2F6F57]">
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-sm text-[#4A453E]">Free from parabens, sulfates, and synthetic fragrances.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8EFEA] text-[#2F6F57]">
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-sm text-[#4A453E]">Clinical-grade concentration of active ingredients.</p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl border border-[#E2DDD4] bg-white p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-[#6B665D] hover:text-[#1F3D2B]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-bold text-[#1F3D2B]">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-[#6B665D] hover:text-[#1F3D2B]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1F3D2B]">${(24.00 * quantity).toFixed(2)}</p>
                  <p className="text-xs text-[#6B665D]">Includes Tax</p>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1F3D2B] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#1F3D2B]/20 hover:bg-[#2A5239] transition-all hover:scale-[1.02]"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Regimen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
