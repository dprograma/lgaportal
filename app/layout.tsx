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
    default: "774ng.com — Invest in Nigeria's 774 LGAs",
    template: "%s | 774ng.com",
  },
  description:
    "Discover investment opportunities, natural endowments, and development projects across all 774 Local Government Areas in Nigeria. Connect with verified LGAs ready to grow.",
  keywords: [
    "LGA investment",
    "Nigeria investment opportunities",
    "Local Government Area Nigeria",
    "LGA endowments",
    "Nigerian governance",
    "774 LGAs",
    "LGA projects",
    "Nigeria development",
    "citizen portal Nigeria",
    "government transparency Nigeria",
  ],
  authors: [{ name: "774ng.com" }],
  creator: "774ng.com",
  publisher: "774ng.com",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://774ng.com",
    siteName: "774ng.com",
    title: "774ng.com — Invest in Nigeria's 774 LGAs",
    description:
      "Discover investment opportunities, natural endowments, and development projects across all 774 Local Government Areas in Nigeria. Connect with verified LGAs ready to grow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "774ng.com — Invest in Nigeria's 774 LGAs",
    description:
      "Discover investment opportunities and natural endowments across Nigeria's 774 LGAs. Connect with verified local governments ready to partner with investors.",
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
