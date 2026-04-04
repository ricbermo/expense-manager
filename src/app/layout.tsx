import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogoutButton } from "@/components/layout/logout-button";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gastos - Expense Tracker",
  description: "Personal expense tracker and budget manager",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gastos",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LogoutButton />
        <main className="flex-1">{children}</main>
        <BottomNav />
        <Toaster position="top-center" richColors closeButton duration={3000} />
      </body>
    </html>
  );
}
