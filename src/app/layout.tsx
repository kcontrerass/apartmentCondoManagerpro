import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CondoManager Pro",
  description: "Sistema Integral de Gestión de Condominios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
