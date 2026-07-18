import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Design token #2: display font — bold, expressive headlines across every screen.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
  title: "Delulu Detector 🔥 — are you cooked?",
  description:
    "Paste your talking stage. Find out if you're cooked. Screenshot the damage.",
  openGraph: {
    title: "Delulu Detector 🔥",
    description:
      "Paste your talking stage. Find out if you're cooked. Screenshot the damage.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delulu Detector 🔥",
    description: "Paste your talking stage. Find out if you're cooked.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
