"use client";

import { useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { AuthContext } from "@/contexts/AuthProvider";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/assessment",
  "/result",
  "/alpha-credits",
  "/challenges",
  "/profile",
  "/settings",
  "/saved-scans",
  "/image-analyzer",
  "/compare-results",
];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(true);

  const isProtected = useMemo(() => {
    if (!pathname) return false;
    return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }, [pathname]);

  if (!isProtected) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#6B665D] text-sm">
        Verifying secure session...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            router.replace("/");
          }}
        />
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-center px-6">
          <h2 className="text-xl font-semibold text-[#1F3D2B]">Sign in required</h2>
          <p className="text-sm text-[#6B665D] max-w-md">
            This page is protected. Please sign in to continue.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-[#1F3D2B] px-4 py-2 text-sm font-semibold text-white"
          >
            Open Sign In
          </button>
        </div>
      </>
    );
  }

  return <>{children}</>;
}