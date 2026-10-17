import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_Bengali, Noto_Sans_Devanagari, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const general = localFont({
  variable: "--font-general",
  display: "swap",
  src: [
    { path: "../fonts/GeneralSans-400.woff2", weight: "400" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500" },
    { path: "../fonts/GeneralSans-600.woff2", weight: "600" },
    { path: "../fonts/GeneralSans-700.woff2", weight: "700" },
  ],
});

const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["700"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
// Every Bengali and Hindi line renders in a real script font on every device.
const notoBn = Noto_Sans_Bengali({ variable: "--font-noto-bn", subsets: ["bengali"], weight: ["400", "500", "600", "700"], display: "swap" });
const notoDv = Noto_Sans_Devanagari({ variable: "--font-noto-dv", subsets: ["devanagari"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "MotherTongue — One ad. Every audience, in their own words.",
  description:
    "Upload your ad once. MotherTongue makes a version for each city and language you sell in — its own words, its own voice, its own feel — with your price and offer exactly as you set them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${general.variable} ${space.variable} ${jetbrains.variable} ${notoBn.variable} ${notoDv.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
