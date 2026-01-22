import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import CartDrawer from "./result/_components/CartDrawer";
import CartButton from "./result/_components/CartButton";
import UserMenu from "./result/_components/UserMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oneman",
  description: "Men’s grooming AI platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>

      <body className={inter.className}>
        {/* GLOBAL USER MENU */}
        <UserMenu />

        {/* ADD PADDING FOR HEADER */}
        <div className="pt-16">
          {children}
        </div>

        {/* GLOBAL CART — ALWAYS MOUNTED */}
        <CartDrawer />
        <CartButton />
      </body>
    </html>
  );
}
