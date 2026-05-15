import type { Metadata, Viewport } from "next";
import { Outfit, DM_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Kanjealo | Fidelización Digital · Honduras",
  description: "Tarjetas de fidelización digitales en Apple Wallet y Google Wallet. Sin app. Sin papel. Sin complicaciones.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logos/kanjealo-icon-1024.png",
    apple: "/logos/kanjealo-icon-1024.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2044",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
        <body
          className={`${outfit.variable} ${dmMono.variable} font-outfit antialiased bg-cream text-navy`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
