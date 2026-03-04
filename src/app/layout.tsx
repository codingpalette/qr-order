import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Providers } from "@/shared/providers";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QR-Order Pro",
  description: "B2B2B 다중 테넌트 QR 주문/결제 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSans.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
