'use client';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import Link from 'next/link';
import { useEcosystem } from './ecosystem-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isPreviewMode, displayUser } = useEcosystem();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Proteção Global: Visitantes NÃO têm acesso à interface interna
  useEffect(() => {
    if (currentUser?.role === 'visitor') {
      router.push('/kiosk');
    }
  }, [currentUser, router]);

  return (
    <AppSidebar>
      <div className="flex flex-1 flex-col">
        <Header />
        
        {isPreviewMode && (
          <div className="sticky top-0 z-[100] bg-amber-500 text-white px-6 py-3 shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Modo de Visualização Administrativa</p>
                  <p className="text-sm font-bold tracking-tight leading-none mt-1">Auditando: <span className="underline decoration-2 underline-offset-4">{displayUser?.name}</span></p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white text-amber-600 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest h-9 px-5 rounded-lg shadow-lg transition-all active:scale-95"
                onClick={() => router.push('/admin?tab=academic')}
              >
                Encerrar Auditoria
              </Button>
            </div>
          </div>
        )}

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
