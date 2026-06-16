import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRV LAGOA — Portal Gestor',
  description: 'Portal de gestao de visitas leiteiras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
