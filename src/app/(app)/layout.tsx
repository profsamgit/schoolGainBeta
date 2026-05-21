'use client';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import Link from 'next/link';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


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

  const pathname = usePathname();
  /**
   * isAdminView: Controle de Tema de Layout
   *
   * Todas as rotas autenticadas (aluno, gestor, super admin) compartilham este layout.
   * A variável é mantida como `true` para garantir o tema espacial/escuro full-bleed
   * em toda a área autenticada, diferenciando do layout público (landng page).
   */
  const isAdminView = true;

  return (
    <AppSidebar>
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        <div className="flex-none sticky top-0 z-40 flex flex-col bg-background border-b shadow-sm">
          {/* Banner de Modo de Auditoria
               Exibido quando um gestor está visualizando a conta de um aluno
               via parâmetro ?preview={id}. Permite sair sem perder o contexto. */}
          {isPreviewMode && (
            <div className="bg-amber-500 text-white px-4 sm:px-6 py-1.5 shadow-lg animate-in slide-in-from-top duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div className="space-y-0 text-left">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 leading-none">Modo de Auditoria</p>
                    <p className="text-xs font-bold tracking-tight leading-none mt-1">Lendo: <span className="underline decoration-1 underline-offset-2">{displayUser?.name}</span></p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white text-amber-600 hover:bg-slate-50 font-black uppercase text-[9px] tracking-widest h-7 px-4 rounded-md shadow-md transition-all active:scale-95"
                  onClick={() => {
                    const effectiveSchoolId = schoolId || displayUser?.schoolId;
                    const target = effectiveSchoolId ? `/admin?schoolId=${effectiveSchoolId}&tab=academic` : '/admin?tab=academic';
                    router.push(target);
                  }}
                >
                  Sair
                </Button>
              </div>
            </div>
          )}

          {/* Indicador de Contexto de Rede (Super Admin)
               Exibido quando o Super Admin está gerenciando uma unidade específica
               via parâmetro ?schoolId={id}. Mostra o nome da escola selecionada. */}
          {currentUser?.role === 'super_admin' && searchParams.has('schoolId') && (
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-1.5 border-t border-white/5 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center">
                <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Rede: <span className="text-red-400">{(service as any).schools?.find((s: any) => s.id === schoolId)?.name || 'Unidade'}</span>
                </div>
              </div>
            </div>
          )}

          <Header />
        </div>

        <main className={cn("flex-1 overflow-y-auto", isAdminView ? "bg-[#070913]" : "p-4 sm:p-6 lg:p-8")}>
          <div className="mx-auto w-full max-w-7xl">
            <div className={cn(isAdminView ? "bg-transparent border-none shadow-none flex flex-col w-full" : "bg-white border border-slate-200/50 dark:border-slate-800/60 rounded-[2rem] shadow-sm overflow-hidden flex flex-col")}>
              <div className={cn(isAdminView ? "p-0" : "p-4 sm:p-10")}>
                {children}
              </div>
              
              <footer className={cn("w-full border-t py-8 text-center text-xs", isAdminView ? "border-white/5 bg-slate-950/40 text-slate-500 mt-12 rounded-[2rem]" : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30")}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <Link href="/about" className={cn("font-bold tracking-tight transition-colors", isAdminView ? "text-slate-400 hover:text-emerald-400" : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400")}>
                      TDS 2B 2026 — CETI Frei José Apicella
                    </Link>
                  </div>
                  <p className={cn("font-medium tracking-wider text-[10px]", isAdminView ? "text-slate-500" : "text-slate-400 dark:text-slate-500")}>
                    SCHOOLGAIN HUB &copy; 2026 &bull; TECNOLOGIA E SUSTENTABILIDADE
                  </p>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </AppSidebar>
  );
}
