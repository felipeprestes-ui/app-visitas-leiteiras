import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'CRV LAGOA — Portal Gestor',
  description: 'Portal de gestao de visitas leiteiras',
  manifest: '/manifest.json',
  themeColor: '#1f6b52',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Visitas Leiteiras',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="application-name" content="App Visitas Leiteiras" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Visitas Leiteiras" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#1f6b52" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
      <ServiceWorkerRegister />
    </html>
  );
}
