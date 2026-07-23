import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const SITE_URL = "https://verticecube.com";
const SITE_TITLE = "Vértice Cube — Diseños vector gratis para sublimación";
const SITE_DESCRIPTION =
  "Diseños vector gratis y PRO para sublimación: kits de fútbol, básquet y vóley en AI, PSD y PDF, listos para imprimir. Descargá gratis o suscribite para acceso ilimitado.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Vértice Cube",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "vector gratis",
    "diseños deportivos vector",
    "kits de fútbol vector",
    "camisetas sublimación vector",
    "diseños para sublimar",
    "plantillas camisetas fútbol",
    "vector básquet",
    "vector vóley",
  ],
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: SITE_URL,
    siteName: "Vértice Cube",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logo-full.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logo-full.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
