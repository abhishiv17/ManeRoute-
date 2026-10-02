import type { Metadata, Viewport } from "next";
import { Alegreya_Sans, Luckiest_Guy } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

// Storybook poster: Luckiest Guy is the hand-cut display lettering for headlines;
// Alegreya Sans is a warm humanist sans for everything you read.
const display = Luckiest_Guy({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const body = Alegreya_Sans({ subsets: ["latin"], weight: ["400", "500", "700", "800"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "ManeRoute",
  description: "From the hair you have to the hair you want. Try cuts on your own photo, see the route, and take a consultation document to your barber or stylist.",
  applicationName: "ManeRoute",
  appleWebApp: { capable: true, title: "ManeRoute", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  robots: { index: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1C4A45" },
    { media: "(prefers-color-scheme: dark)", color: "#0F201E" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
