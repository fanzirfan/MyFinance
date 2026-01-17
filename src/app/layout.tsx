import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "MyFinance - Personal Finance Tracker",
  description: "Track your income and expenses with ease. Manage multiple wallets and visualize your spending habits.",
  keywords: ["finance", "money tracker", "budget", "expense tracker", "wallet"],
  authors: [{ name: "MyFinance" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyFinance",
  },
  openGraph: {
    title: "MyFinance - Personal Finance Tracker",
    description: "Track your income and expenses with ease. Manage multiple wallets and visualize your spending habits.",
    url: "https://myfinance.app",
    siteName: "MyFinance",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyFinance Apilcation Preview",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyFinance - Personal Finance Tracker",
    description: "Track your income and expenses with ease.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <main className="max-w-lg mx-auto min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
