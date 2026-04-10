import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "i-SMARTLUPUS MEDI",
  description: "Sistem Pengurusan Pelupusan Aset Perubatan",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
