import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "拾光档案馆｜我的生活记录",
  description: "收藏日常、照片、足迹与写给未来的信。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
