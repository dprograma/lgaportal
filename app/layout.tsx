import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LGA Citizen Portal — Nigeria's Local Government Transparency Platform",
    template: "%s | LGA Citizen Portal",
  },
  description:
    "Track federal allocations, monitor LGA projects, and engage with your local government across all 774 LGAs in Nigeria. Real transparency, real accountability.",
  keywords: [
    "LGA",
    "Local Government Area",
    "Nigeria",
    "citizen portal",
    "federal allocation",
    "government transparency",
    "LGA projects",
    "accountability",
    "Nigerian governance",
    "774 LGAs",
  ],
  authors: [{ name: "LGA Citizen Portal" }],
  creator: "LGA Citizen Portal",
  publisher: "LGA Citizen Portal",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://lgaportal.ng",
    siteName: "LGA Citizen Portal",
    title: "LGA Citizen Portal — Nigeria's Local Government Transparency Platform",
    description:
      "Track federal allocations, monitor LGA projects, and engage with your local government across all 774 LGAs in Nigeria.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LGA Citizen Portal",
    description: "Nigeria's leading platform for local government transparency.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased bg-white text-slate-900" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          richColors
          expand
          toastOptions={{
            style: { fontFamily: "Inter, system-ui, sans-serif" },
          }}
        />
      </body>
    </html>
  );
}
