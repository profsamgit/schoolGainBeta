'use client';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import Link from 'next/link';
import { useEcosystem } from './ecosystem-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isPreviewMode, displayUser, isInitializing, service } = useEcosystem();
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const { toast } = useToast();

  // Monitoramento de Conexão e Sessão
  useEffect(() => {
    // Só agimos após o sistema terminar de inicializar
    if (isInitializing) return;
    // 1. Lidar com perda de internet (Conexão Física)
    const handleOffline = () => {
      toast({
        title: "Conexão perdida",
        description: "Você está offline. Algumas funcionalidades podem não funcionar corretamente.",
        variant: "destructive",
      });
      // Redireciona para a home em caso de queda total de conexão conforme solicitado
      router.push('/'); 
    };

    window.addEventListener('offline', handleOffline);

    // 2. Lidar com perda de sessão (Logout/Desconexão do Banco)
    // Se o usuário sumir e não estivermos em modo preview, voltamos para a home de seleção
    // Nota: Para rotas /admin, somos mais tolerantes para dar tempo ao Firebase Auth
    if (!currentUser && !isPreviewMode) {
      const isDashboardRoute = window.location.pathname.includes('/admin') || window.location.pathname.includes('/leaderboard');
      
      if (isDashboardRoute) {
          // Se for uma rota crítica, damos um "respiro" extra de 1 segundo antes de expulsar
          const timeout = setTimeout(() => {
            if (!service.currentUserRa && !isPreviewMode) {
                router.push('/');
            }
          }, 1000);
          return () => clearTimeout(timeout);
      } else {
          router.push('/');
      }
    }

    // 3. Bloqueio de Visitantes
    if (currentUser?.role === 'visitor') {
      router.push('/kiosk');
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, isPreviewMode, isInitializing, router, toast]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando Ecossistema...</p>
        </div>
      </div>
    );
  }

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
                onClick={() => {
                  const effectiveSchoolId = schoolId || displayUser?.schoolId;
                  const target = effectiveSchoolId ? `/admin?schoolId=${effectiveSchoolId}&tab=academic` : '/admin?tab=academic';
                  router.push(target);
                }}
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
