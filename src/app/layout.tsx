import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Sans_Devanagari, Noto_Sans_Kannada, Noto_Sans_Malayalam, Noto_Sans_Tamil, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";
import { MotionProvider, PaperGrain } from "@/components/motion";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"] });
// Indic scripts: not preloaded; the browser fetches each only when its glyphs appear (unicode-range).
const tamil = Noto_Sans_Tamil({ variable: "--font-tamil", subsets: ["tamil"], preload: false });
const telugu = Noto_Sans_Telugu({ variable: "--font-telugu", subsets: ["telugu"], preload: false });
const kannada = Noto_Sans_Kannada({ variable: "--font-kannada", subsets: ["kannada"], preload: false });
const malayalam = Noto_Sans_Malayalam({ variable: "--font-malayalam", subsets: ["malayalam"], preload: false });

export const metadata: Metadata = {
  title: "Saathi — care that adapts",
  description:
    "A shared medication & appointment platform for elders, caretakers and family that adapts to how independent the elder is.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${deva.variable} ${tamil.variable} ${telugu.variable} ${kannada.variable} ${malayalam.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <PaperGrain zIndex={-1} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
