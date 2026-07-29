import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "SEO Copilot",
    template: "%s | SEO Copilot",
  },
  description:
    "Audit SEO actionnable : technique, contenu, performance — chaque problème expliqué et corrigeable avec l'IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
