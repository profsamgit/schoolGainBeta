'use client';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import Link from 'next/link';
import { useEcosystem } from './ecosystem-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useEcosystem();
  const router = useRouter();

  // Proteção Global: Visitantes NÃO têm acesso à interface interna (Dashboard, Bio-Shop, etc)
  // Se um visitante for detectado em qualquer rota protegida, ele é enviado ao Kiosk.
  useEffect(() => {
    if (currentUser?.role === 'visitor') {
      router.push('/kiosk');
    }
  }, [currentUser, router]);

  return (
    <AppSidebar>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        <footer className="p-4 text-center text-xs text-muted-foreground border-t">
          <Link href="/about" className="hover:text-primary hover:underline">
            TDS 2B 2026 - CETI Frei José Apicella
          </Link>
        </footer>
      </div>
    </AppSidebar>
  );
}
