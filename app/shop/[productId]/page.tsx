"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PRODUCT_CATALOG_DATA } from "@/lib/productCatalogData";
import { trackRewardEvent } from "@/lib/rewardTracking";
import { useCartStore } from "@/lib/cartStore";
import { formatINR } from "@/lib/currency";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const productId = params?.productId;
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();

  const decodedId = decodeURIComponent(Array.isArray(productId) ? productId[0] : productId || "");
  const rewardDiscount = Number(searchParams?.get("reward") || 0);
  const rewardSource = searchParams?.get("source") || null;
  const unitPrice = 2400;
  
  const product = PRODUCT_CATALOG_DATA.find(
    (p) => (p.sku && p.sku === decodedId) || p.name === decodedId
  );

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7] text-[#1d1d1f]">
        <h1 className="text-2xl font-bold">Formulation Not Found</h1>
        <Link href="/shop" className="mt-4 text-[#0071e3] hover:underline">
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

  useEffect(() => {
    if (rewardSource !== "alpha-wallet" || rewardDiscount <= 0) return;
    trackRewardEvent("product_clicked_from_reward", {
      productId: product.sku || product.name,
      discountPercent: rewardDiscount,
      source: rewardSource,
    });
  }, [product.name, product.sku, rewardDiscount, rewardSource]);

  const handleAddToCart = () => {
    addItem({
      id: product.sku || product.name,
      name: product.name,
      price: unitPrice,
      quantity,
      usageDays: 30,
    });
    openCart();
  };

  return (
    <div className="af-page-shell min-h-screen pb-20 pt-24 text-[#ffffff]">
      <div className="af-page-frame mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <Link 
          href="/shop" 
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6e6e73] hover:text-[#1d1d1f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Apothecary
        </Link>

        {rewardSource === "alpha-wallet" && rewardDiscount > 0 && (
          <div className="mb-8 rounded-2xl border border-[#d9d9de] bg-[#eef5ff] px-5 py-4 text-sm text-[#1d1d1f] shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0071e3]">Alpha Wallet Unlock</p>
            <p className="mt-1 font-semibold">This product is the recommended conversion target for your {rewardDiscount}% reward tier.</p>
            <p className="mt-1 text-[#4A453E]">Add it now and move straight into checkout while the reward momentum is active.</p>
          </div>
        )}
        
        <section className="nv-section-white">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="af-page-kicker">Protocol Product</span>
              <h1 className="mt-3 text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">{product.name}</h1>
              <p className="mt-3 text-sm leading-7 text-[#6e6e73]">A product-detail page aligned with the new checkout flow, reward narrative, and protocol framing.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Unit price</p>
                <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">{formatINR(unitPrice)}</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Clinical fit</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">{product.type}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-[#d9d9de] bg-white shadow-sm">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              onError={() => setImageSrc(fallbackImage)}
              unoptimized
            />
            {product.tags && product.tags.includes("active") && (
              <span className="absolute left-6 top-6 rounded-full bg-[#0071e3] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                Clinical Strength
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                {product.brand || "Alpha Focus"}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#6e6e73]" />
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[#C9A227] text-[#C9A227]" />
                <span className="text-sm font-bold text-[#1d1d1f]">4.8</span>
                <span className="text-xs text-[#6e6e73]">(124 Reviews)</span>
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold text-[#1d1d1f] md:text-4xl">
              {product.name}
            </h1>
            
            <p className="mb-6 text-lg leading-relaxed text-[#6e6e73]">
              Advanced {product.type.toLowerCase()} engineered to support skin barrier integrity and deliver targeted actives. 
              Formulated for optimal absorption and minimal irritation.
            </p>

            <div className="mb-8 space-y-3 rounded-2xl border border-[#d9d9de] bg-white/60 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#eef5ff] text-[#0071e3]">
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-sm text-[#4A453E]">Dermatologist tested & approved.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#eef5ff] text-[#0071e3]">
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-sm text-[#4A453E]">Free from parabens, sulfates, and synthetic fragrances.</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#eef5ff] text-[#0071e3]">
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-sm text-[#4A453E]">Clinical-grade concentration of active ingredients.</p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl border border-[#d9d9de] bg-white p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-[#6e6e73] hover:text-[#1d1d1f]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-bold text-[#1d1d1f]">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-[#6e6e73] hover:text-[#1d1d1f]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1d1d1f]">{formatINR(unitPrice * quantity)}</p>
                  <p className="text-xs text-[#6e6e73]">Tax-inclusive pricing</p>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn-primary flex flex-1 items-center justify-center gap-2 px-8 py-4 text-base font-bold transition-all hover:scale-[1.02]"
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

