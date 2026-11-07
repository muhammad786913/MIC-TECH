import { Inter, Newsreader, Noto_Nastaliq_Urdu, Playfair_Display } from "next/font/google";
import { SITE } from "@/lib/seo";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq",
  display: "swap",
  weight: ["400", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MIC TECH — News with precision and perspective",
    template: "%s | MIC TECH",
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: "MIC TECH Editorial" }],
  creator: "MIC TECH",
  publisher: "MIC TECH",
  category: "news",
  alternates: {
    canonical: "/",
    languages: { en: "/", ur: "/urdu" },
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: SITE.name,
    title: "MIC TECH — News with precision and perspective",
    description: SITE.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    title: "MIC TECH — News with precision and perspective",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport = {
  themeColor: "#151515",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${newsreader.variable} ${nastaliq.variable}`}
    >
      <body className="min-h-screen bg-paper text-ivory">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ivory"
        >
          Skip to content
        </a>
        {children}
        <AnalyticsTracker />
      </body>
    </html>
  );
}


