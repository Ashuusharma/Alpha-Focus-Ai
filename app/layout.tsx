import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import CartDrawer from "./result/_components/CartDrawer";
import ProductComparison from "./result/_components/ProductComparison";
import { ToastProvider } from "./toast/ToastContext";
import ToastContainer from "./toast/ToastContainer";
import { ThemeProvider } from "@/lib/themeContext";
import { LanguageProvider as LegacyLangProvider } from "../lib/languageContext";
import I18nProvider from "./_components/I18nProvider";
import RouteTransition from "./_components/RouteTransition";
import MainNavbar from "@/components/layout/MainNavbar";
import AuthProvider from "@/contexts/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CoreUserHydrator from "@/components/providers/CoreUserHydrator";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Alpha Focus",
  description: "Alpha Focus — Premium grooming intelligence platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/favicon.ico" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2F6F57",
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
          content="width=device-width, initial-scale=1, maximum-scale=1"
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

      <body className={inter.variable}>
        <I18nProvider>
          <AuthProvider>
            <CoreUserHydrator />
            <ThemeProvider>
              <LegacyLangProvider>
                <ToastProvider>
                  <MainNavbar />
                  <main className="pt-0 pb-24 md:pb-0">
                    <ProtectedRoute>
                      <RouteTransition>{children}</RouteTransition>
                    </ProtectedRoute>
                  </main>
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
