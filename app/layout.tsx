import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LİNBA — Eğitim çalışma alanı',
  description: 'Eğitim öncesi, canlı oturum ve sonrası için LİNBA tasarım önizlemesi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
