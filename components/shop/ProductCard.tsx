"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ProductCatalogItem } from "@/lib/productCatalogData";
import { useCartStore } from "@/lib/cartStore";

interface ProductCardProps {
  product: ProductCatalogItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, openCart } = useCartStore();
  const isInCart = items.some((item) => item.id === product.sku);
  const fallbackImage = "/images/report-fallback.svg";
  const [imageSrc, setImageSrc] = useState(product.imageUrl || fallbackImage);

  useEffect(() => {
    setImageSrc(product.imageUrl || fallbackImage);
  }, [product.imageUrl]);

  const handleAddToCart = () => {
    addItem({
      id: product.sku || product.name,
      name: product.name,
      price: 24.00, // Placeholder price if not in catalog
      quantity: 1,
      usageDays: 30,
    });
    openCart();
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2DDD4] bg-white transition-all hover:border-[#2F6F57]/30 hover:shadow-lg">
      <Link href={`/shop/${encodeURIComponent(product.sku || product.name)}`} className="relative block h-64 overflow-hidden bg-[#F4EFE6]">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImageSrc(fallbackImage)}
          unoptimized
        />
        {product.tags && product.tags.includes("active") && (
          <span className="absolute left-3 top-3 rounded-full bg-[#2F6F57] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Clinical Strength
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B665D]">
            {product.brand || "Alpha Focus"}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-[#C9A227] text-[#C9A227]" />
            <span className="text-xs font-semibold text-[#1F3D2B]">4.8</span>
          </div>
        </div>

        <Link href={`/shop/${encodeURIComponent(product.sku || product.name)}`}>
          <h3 className="mb-1 text-lg font-bold text-[#1F3D2B] transition-colors group-hover:text-[#2F6F57]">
            {product.name}
          </h3>
        </Link>
        
        <p className="mb-4 line-clamp-2 text-sm text-[#6B665D]">
          {product.type} formulation designed for optimal skin barrier repair and maintenance.
        </p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#1F3D2B]">$24.00</span>
            <span className="text-[10px] text-[#6B665D]">Free Shipping</span>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={isInCart}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              isInCart
                ? "cursor-default bg-[#E8EFEA] text-[#2F6F57]"
                : "bg-[#1F3D2B] text-white hover:bg-[#2A5239] shadow-md shadow-[#1F3D2B]/10 hover:shadow-lg hover:shadow-[#1F3D2B]/20"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isInCart ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
