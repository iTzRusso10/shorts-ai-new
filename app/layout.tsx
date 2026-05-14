import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShortsAI — Crea video virali con l'intelligenza artificiale",
  description:
    "Genera short video con voiceover AI e immagini verticali coerenti con il parlato.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="it" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
