import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animal Superpowers",
  description:
    "An interactive phylogeny of mammals with extreme adaptations, and a companion tool that scores the likelihood those adaptations will translate to human therapeutics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-slate-200 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <div className="sticky top-0 z-30 bg-ink/90 backdrop-blur border-b border-rule">
      <div className="max-w-[1400px] mx-auto px-5 h-12 flex items-center gap-6 text-[13px]">
        <Link href="/" className="font-serif text-slate-100 hover:text-white">
          Animal Superpowers
        </Link>
        <nav className="flex items-center gap-5 text-slate-400">
          <Link href="/" className="hover:text-slate-100">
            Mammal tree
          </Link>
          <Link href="/translate" className="hover:text-slate-100">
            Translational Discovery
          </Link>
        </nav>
        <a
          href="https://github.com/dsfitzpa/Animal-Superpowers"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-slate-500 hover:text-slate-200 text-xs"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  );
}
