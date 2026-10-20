import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TibiaTracker — Boss Rotation Profit Tracker",
    template: "%s · TibiaTracker",
  },
  description:
    "Rastreador de profit de rotações de boss no Tibia. Cole o texto do Hunt Analyser e acompanhe histórico, gráficos e top itens.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-night-950 font-sans text-ink antialiased">
        <Sidebar />
        <div className="min-h-screen pt-16 lg:pl-64 lg:pt-0">
          <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
