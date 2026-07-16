import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gold Smith | Personalized Jewellery",
    template: "%s | Gold Smith",
  },
  description:
    "Premium personalized jewellery in Pakistan. Custom necklaces, bracelets, rings, cufflinks, wallets & Islamic jewellery. Cash on Delivery.",
  openGraph: {
    title: "Gold Smith | Personalized Jewellery",
    description:
      "Premium personalized jewellery. Custom pieces with Cash on Delivery across Pakistan.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
