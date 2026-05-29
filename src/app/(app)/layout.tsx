'use client';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';
import Link from 'next/link';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Eye, LayoutDashboard, Leaf, Trophy, BrainCircuit, Gift, Shield, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isPreviewMode, displayUser, isInitializing, service, systemSettings } = useEcosystem();
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
      <div className="flex min-h-screen items-center justify-center bg-[#EFF7EF] dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando Ecossistema...</p>
        </div>
      </div>
    );
  }

  // Intercepta e bloqueia o portal do aluno se estiver sob manutenção
  if (currentUser?.role === 'student' && systemSettings?.studentAreaMaintenance) {
    return (
      <div className="flex min-h-screen flex-col bg-[#EFF7EF] dark:bg-[#070913] items-center justify-center p-6 text-slate-800 dark:text-white relative overflow-hidden font-sans">
        {/* Background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-8 border border-amber-500/20 bg-white/80 dark:bg-slate-900/40 rounded-[2.5rem] backdrop-blur-xl shadow-2xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-bounce">
            <Shield className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Portal em Manutenção</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full inline-block">
              Acesso Web Suspenso Temporariamente
            </p>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Desculpe o transtorno! O portal web do aluno está passando por atualizações e manutenção pela equipe de gestão escolar.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-white/5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-550 mb-1">♻️ Totens Físicos</p>
            <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              Os totens físicos de pesagem e descarte instalados na escola continuam funcionando <strong>normalmente</strong>.
            </p>
          </div>
          <Button 
            onClick={() => service.logout()}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg transition-all"
          >
            Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  const pathname = usePathname();
  const previewId = searchParams.get('preview');

  const getLink = (href: string) => {
    if (previewId) {
      return `${href}?preview=${previewId}`;
    }
    return href;
  };

  const bottomMenuItems = useMemo(() => {
    if (pathname.startsWith('/super-admin')) {
      return [
        { href: '/super-admin', label: 'Central', icon: Shield },
      ];
    }
    if (pathname.startsWith('/admin')) {
      return [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin', label: 'Gestão', icon: Shield },
      ];
    }
    return [
      { href: '/student/dashboard', label: 'Início', icon: LayoutDashboard },
      { href: '/student/meu-ecossistema', label: 'Ecossistema', icon: Leaf },
      { href: '/student/leaderboard', label: 'Ranking', icon: Trophy },
      { href: '/student/education', label: 'Educação', icon: BookOpen },
      { href: '/student/quiz', label: 'Quizzes', icon: BrainCircuit },
      { href: '/student/rewards', label: 'Bioshop', icon: Gift },
    ];
  }, [pathname]);

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
      <div className="flex flex-1 flex-col h-screen max-h-screen min-w-0 overflow-hidden">
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

        <main className={cn("flex-1 overflow-y-auto pb-20 md:pb-0 transition-colors duration-300", isAdminView ? "bg-[#EFF7EF] dark:bg-[#070913]" : "p-4 sm:p-6 lg:p-8")}>
          <div className="mx-auto w-full max-w-7xl">
            <div className={cn(isAdminView ? "bg-transparent border-none shadow-none flex flex-col w-full" : "bg-white border border-slate-200/50 dark:border-slate-800/60 rounded-[2rem] shadow-sm overflow-hidden flex flex-col")}>
              <div className={cn(isAdminView ? "p-0" : "p-4 sm:p-10")}>
                {children}
              </div>
              
              <footer className={cn("w-full border-t py-6 md:py-8 text-center text-[10px] md:text-xs transition-colors duration-300", isAdminView ? "border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 mt-6 md:mt-12 rounded-t-[1.5rem] md:rounded-[2rem]" : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30")}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <Link href="/about" className={cn("font-bold tracking-tight transition-colors", isAdminView ? "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400" : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400")}>
                      TDS 2B 2026 — CETI Frei José Apicella
                    </Link>
                  </div>
                  <p className={cn("font-medium tracking-wider text-[9px] md:text-[10px] transition-colors duration-300", isAdminView ? "text-slate-400 dark:text-slate-500" : "text-slate-400 dark:text-slate-500")}>
                    SCHOOLGAIN HUB &copy; 2026 &bull; TECNOLOGIA E SUSTENTABILIDADE
                  </p>
                </div>
              </footer>
            </div>
          </div>
        </main>

        {/* Dynamic Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/90 dark:bg-[#070913]/90 border-t border-slate-200/60 dark:border-white/5 backdrop-blur-xl md:hidden flex items-center justify-around px-2 text-slate-800 dark:text-white shadow-[0_-4px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)] transition-colors duration-300">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={getLink(item.href)} className="flex-1 flex flex-col items-center justify-center h-full py-1">
                <div className="relative flex flex-col items-center gap-1 group">
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive 
                      ? pathname.startsWith('/admin') || pathname.startsWith('/super-admin')
                        ? "text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.2)] dark:drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] scale-110"
                        : "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)] dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-110"
                      : "text-slate-450 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-250"
                  )} />
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider transition-colors",
                    isActive
                      ? pathname.startsWith('/admin') || pathname.startsWith('/super-admin')
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-450 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-350"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className={cn(
                      "absolute -bottom-1.5 w-1 h-1 rounded-full",
                      pathname.startsWith('/admin') || pathname.startsWith('/super-admin')
                        ? "bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                        : "bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    )} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </AppSidebar>
  );
}
