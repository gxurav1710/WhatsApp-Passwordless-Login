import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WhatsApp Auth | Self-Hosted Developer Console',
  description: 'Open-Source Self-Hosted Passwordless WhatsApp Authentication System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
