import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: '로봇 운영 실습 시스템',
  description:
    '휴머노이드 로봇의 부위를 클릭하면 실제 MQTT 왕복이 일어나는 풀스택 실습 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', inter.variable)}>
      <body>{children}</body>
    </html>
  );
}
