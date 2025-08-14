import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GPT Think Blog",
  description: "從 HackMD 取得的思考筆記部落格",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className} suppressHydrationWarning={true}>
        <main className="min-h-screen bg-white">{children}</main>
      </body>
    </html>
  );
}
