import type { Metadata } from "next";
import { Hanken_Grotesk, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

// The three faces the design mocks use: Hanken Grotesk for display/headings,
// Source Sans 3 for body copy, IBM Plex Mono for the small uppercase eyebrow labels.
const displayFont = Hanken_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono-label",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "MedSim",
  description: "Simulador clínico por IA para estudantes e residentes.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-app font-sans text-foreground">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
