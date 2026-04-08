import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LucroFy - Plataforma de Tracking de Vendas e Gestao de Lucro",
  description: "Acompanhe vendas, campanhas Meta Ads e calcule seu lucro em tempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased dark">
      <body className="min-h-full bg-zinc-950 text-zinc-100 font-sans">{children}</body>
    </html>
  );
}
