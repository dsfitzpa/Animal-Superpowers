import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animal Superpowers — A Therapeutic Mammal Tree",
  description:
    "An interactive phylogeny of mammals with extreme adaptations — longevity, cancer resistance, viral tolerance, regeneration — mapped to human therapeutic targets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-slate-200 antialiased">{children}</body>
    </html>
  );
}
