import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import CartDrawer from "./result/_components/CartDrawer";
import UserMenu from "./result/_components/UserMenu";
import ProductComparison from "./result/_components/ProductComparison";
import { ToastProvider } from "./toast/ToastContext";
import ToastContainer from "./toast/ToastContainer";
import { ThemeProvider } from "@/lib/themeContext";
import { LanguageProvider as LegacyLangProvider } from "@/lib/languageContext";
import I18nProvider from "./_components/I18nProvider"; 
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Alpha Focus",
  description: "Alpha Focus — Premium grooming intelligence platform",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#00f2ff",
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
                const theme = localStorage.getItem('oneman-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}

              try {
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/service-worker.js');
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body className={manrope.className}>
        <I18nProvider>
         <ThemeProvider>
          <LegacyLangProvider>
            <ToastProvider>
              {
                /* 
                  GLOBAL USER MENU 
                  Needs hydration boundary or client component wrapper if not already
                */
              }
              <UserMenu /> 

              {/* MAIN CONTENT */}
              <div className="pt-0 pb-24 md:pb-0">
                {children}
              </div>

              {/* GLOBAL CART — ALWAYS MOUNTED */}
              <CartDrawer />
              
              {/* GLOBAL PRODUCT COMPARISON */}
              <ProductComparison />
              
              <ToastContainer />
            </ToastProvider>
          </LegacyLangProvider>
         </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
