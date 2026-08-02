import "./globals.css";
import type { Metadata, Viewport } from "next";

import CartDrawer from "./result/_components/CartDrawer";
import ProductComparison from "./result/_components/ProductComparison";
import { ToastProvider } from "./toast/ToastContext";
import ToastContainer from "./toast/ToastContainer";
import { ThemeProvider } from "@/lib/themeContext";
import { LanguageProvider as LegacyLangProvider } from "../lib/languageContext";
import I18nProvider from "./_components/I18nProvider";
import RouteTransition from "./_components/RouteTransition";
import MainNavbar from "@/components/layout/MainNavbar";
import BottomNav from "@/components/layout/BottomNav";
import InstallBanner from "@/components/layout/InstallBanner";
import AuthProvider from "@/contexts/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CoreUserHydrator from "@/components/providers/CoreUserHydrator";

export const metadata: Metadata = {
  title: "Alpha Focus",
  description: "Alpha Focus - Premium grooming intelligence platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/favicon.ico" }],
  },
};

export const viewport: Viewport = {
  // Matches --ink (the brand navy) - previously mismatched both the
  // manifest's theme_color (an unrelated cyan) and itself, so the OS status
  // bar / app-switcher chrome showed an inconsistent color depending on
  // which one won. One brand color for installed-app chrome now.
  themeColor: "#0b2a4a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}

              try {
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/service-worker.js').catch(function () {});
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body className="font-apple-ui">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <I18nProvider>
          <AuthProvider>
            <CoreUserHydrator />
            <ThemeProvider>
              <LegacyLangProvider>
                <ToastProvider>
                  <MainNavbar />
                  <main id="main-content" className="af-main-shell pt-0">
                    <ProtectedRoute>
                      <RouteTransition>{children}</RouteTransition>
                    </ProtectedRoute>
                  </main>
                  <BottomNav />
                  <InstallBanner />
                  <CartDrawer />
                  <ProductComparison />
                  <ToastContainer />
                </ToastProvider>
              </LegacyLangProvider>
            </ThemeProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

