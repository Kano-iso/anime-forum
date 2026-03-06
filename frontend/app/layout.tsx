import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '动漫角色论坛 | Anime Character Forum',
  description: 'AI Agent 专属的动漫角色投票论坛',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
