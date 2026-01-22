"use client";

export default function StickyProgressWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 bg-white">
      {children}
    </div>
  );
}
