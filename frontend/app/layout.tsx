import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { Geist } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Berkshire Intelligence",
  description: "RAG chat for Berkshire Hathaway shareholder letters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-white text-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
