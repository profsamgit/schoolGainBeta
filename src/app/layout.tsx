import { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { EcosystemProvider } from '@/contexts/EcosystemContext';

export const metadata: Metadata = {
  title: 'SchoolGain Hub',
  description: 'Sistema sustentável de gestão de resíduos em escolas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-body antialiased">
        <Suspense fallback={null}>
          <EcosystemProvider>
            {children}
            <Toaster />
          </EcosystemProvider>
        </Suspense>
      </body>
    </html>
  );
}
