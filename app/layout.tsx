import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HS Representações | Crédito e Consórcio",
  description: "Encontre o caminho certo para seu financiamento ou consórcio com atendimento humano e especializado.",
  icons: {
    icon: "/assets/logo.svg",
    shortcut: "/assets/logo.svg",
    apple: "/assets/logo.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
