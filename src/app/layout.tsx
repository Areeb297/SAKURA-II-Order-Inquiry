import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAKURA-II Order Inquiry | Ebttikar Technology × EdgeCortix",
  description:
    "Submit your order inquiry for SAKURA-II AI accelerator products. Partnership between Ebttikar Technology and EdgeCortix.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
