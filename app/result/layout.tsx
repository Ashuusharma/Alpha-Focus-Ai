"use client";

import CartBadge from "./_components/CartBadge";

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CartBadge />
    </>
  );
}
