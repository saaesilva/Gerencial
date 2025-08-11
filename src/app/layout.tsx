import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { DataProvider } from "@/contexts/DataContext";

export const metadata: Metadata = {
  title: "Gerencial Alfa - Dashboard Atacadão",
  description: "Sistema de gestão e análise de dados para o Atacadão",
  keywords: ["Gerencial Alfa", "Dashboard", "Atacadão", "Análise de Dados", "Gestão"],
  authors: [{ name: "Gerencial Alfa Team" }],
  openGraph: {
    title: "Gerencial Alfa - Dashboard Atacadão",
    description: "Sistema de gestão e análise de dados para o Atacadão",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gerencial Alfa - Dashboard Atacadão",
    description: "Sistema de gestão e análise de dados para o Atacadão",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased bg-background text-foreground">
        <DataProvider>
          {children}
          <Toaster />
        </DataProvider>
      </body>
    </html>
  );
}
