import type { Metadata, Viewport } from "next";
import {
  Caveat,
  Fraunces,
  Inter,
  Kalam,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import "./globals.css";
import { MotionProvider, PaperGrain } from "@/components/motion";

// Display serif with optical sizing (the SOFT axis was dropped: it doubled the font file and slowed LCP).
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Script accent (Latin) and a handwritten Devanagari for "साथी" (Caveat has no Devanagari glyphs).
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["700"], preload: false });
const kalam = Kalam({ variable: "--font-kalam", subsets: ["devanagari"], weight: ["400", "700"], preload: false });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], preload: false });
// Indic scripts: not preloaded; the browser fetches each only when its glyphs appear (unicode-range).
const tamil = Noto_Sans_Tamil({ variable: "--font-tamil", subsets: ["tamil"], preload: false });
const telugu = Noto_Sans_Telugu({ variable: "--font-telugu", subsets: ["telugu"], preload: false });
const kannada = Noto_Sans_Kannada({ variable: "--font-kannada", subsets: ["kannada"], preload: false });
const malayalam = Noto_Sans_Malayalam({ variable: "--font-malayalam", subsets: ["malayalam"], preload: false });

export const viewport: Viewport = { themeColor: "#FBF7F0" };

export const metadata: Metadata = {
  title: "Saathi — care that adapts",
  description: "A shared medication & appointment platform for elders, caretakers and family that adapts to how independent the elder is.",
};

const fontVars = [fraunces, inter, caveat, kalam, deva, tamil, telugu, kannada, malayalam].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVars} h-full antialiased`}>
      <body className="relative min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <PaperGrain zIndex={-1} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
