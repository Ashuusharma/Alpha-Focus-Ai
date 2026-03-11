import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import CartDrawer from "./result/_components/CartDrawer";
import ProductComparison from "./result/_components/ProductComparison";
import { ToastProvider } from "./toast/ToastContext";
import ToastContainer from "./toast/ToastContainer";
import { ThemeProvider } from "@/lib/themeContext";
import { LanguageProvider as LegacyLangProvider } from "../lib/languageContext";
import I18nProvider from "./_components/I18nProvider"; 
import RouteTransition from "./_components/RouteTransition";
import AuthProvider from "@/contexts/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CoreUserHydrator from "@/components/providers/CoreUserHydrator";

import { AppShell } from "@/components/ui/layout/AppShell";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair"
});

export const metadata: Metadata = {
  title: "Alpha Focus",
  description: "Alpha Focus — Premium grooming intelligence platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
    shortcut: [
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/favicon.ico" },
    ],
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
        {/* Theme Script - prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}

              try {
                if ('serviceWorker' in navigator && location.hostname === 'localhost') {
                  navigator.serviceWorker.getRegistrations().then(function (registrations) {
                    registrations.forEach(function (registration) {
                      registration.unregister();
                    });
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body className={`${inter.variable} ${playfair.variable} bg-[#071318]`}>
        <I18nProvider>
          <AuthProvider>
            <CoreUserHydrator />
            <ThemeProvider>
              <LegacyLangProvider>
                <ToastProvider>
                  
                  {/* MAIN CONTENT WRAPPED IN NEW APP SHELL */}
                  <AppShell>
                    <ProtectedRoute>
                      <RouteTransition>{children}</RouteTransition>
                    </ProtectedRoute>
                  </AppShell>

              {/* GLOBAL CART — ALWAYS MOUNTED */}
                  <CartDrawer />
              
              {/* GLOBAL PRODUCT COMPARISON */}
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
