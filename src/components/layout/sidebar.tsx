'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BookOpen,
  BrainCircuit,
  Gift,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Trash2,
  Trophy,
  Leaf,
  Info,
  PanelLeft,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ADMIN_MOCK } from '@/lib/data';
import { useEcosystem } from '@/contexts/EcosystemContext';

// Menu de navegação da Área do Aluno
const menuItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/meu-ecossistema', label: 'Meu Ecossistema', icon: Leaf },
  { href: '/student/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/student/education', label: 'Educação', icon: BookOpen },
  { href: '/student/quiz', label: 'Quizzes', icon: BrainCircuit },
  { href: '/student/rewards', label: 'Recompensas', icon: Gift },
];

// Menu de navegação da Área do Gestor (Admin)
const adminMenuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin', label: 'Gerenciamento', icon: Shield, exact: true },
];

// Menu exclusivo do Super Administrador (acesso à rede completa)
const superAdminMenuItems = [
  { href: '/super-admin', label: 'Central de Rede', icon: Shield, color: 'text-red-500' },
];

function SidebarCollapseButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip={{ children: 'Recolher Menu' }}
      className="w-full"
    >
      <PanelLeft className="h-5 w-5" />
      <span>Recolher</span>
    </SidebarMenuButton>
  );
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');
  const { logout, currentUser, getGlobalLeader } = useEcosystem();
  const isAdminView = pathname.startsWith('/admin');

  // Função auxiliar para injetar o parâmetro de preview nos links
  const getLink = (href: string) => {
    if (previewId) {
      return `${href}?preview=${previewId}`;
    }
    return href;
  };


  // Verifica se o aluno logado é o lder global (1º no ranking de toda a escola)
  // Se for, o ícone de "Meu Ecossistema" fica dourado como distinção visual
  const isLeader = useMemo(() => {
    if (!currentUser) return false;
    const leader = getGlobalLeader();
    return leader?.ra === (currentUser as any)?.ra;
  }, [getGlobalLeader, currentUser]);


  const isSuperAdminView = pathname.startsWith('/super-admin');

  // Rotas do Super Admin usam um layout diferente (sem sidebar lateral visível)
  // A sidebar é substituída por um wrapper simples para manter a consistência de roteamento
  if (!isSuperAdminView) {
    return (
      <SidebarProvider defaultOpen={false}>
        <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <Link
            href={getLink(
              currentUser?.role === 'super_admin' 
                ? '/super-admin' 
                : currentUser?.role === 'admin' 
                  ? '/admin/dashboard' 
                  : '/student/dashboard'
            )}
            className="flex items-center gap-2 font-semibold text-lg overflow-hidden group-data-[collapsible=icon]:justify-center transition-all"
          >
            <Leaf className="h-7 w-7 text-primary flex-shrink-0" />
            <span className="font-black tracking-tighter group-data-[collapsible=icon]:hidden whitespace-nowrap">
              <span className="text-primary">School</span>Gain
            </span>
          </Link>
        </SidebarHeader>
        <Separator />
        <SidebarContent>
          {isAdminView ? (
            <SidebarMenu>
              {adminMenuItems.map((item: any) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={getLink(item.href)}>

                    <SidebarMenuButton
                      isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                      tooltip={{ children: item.label }}
                      className="group-data-[collapsible=icon]:mx-auto"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          ) : (
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={getLink(item.href)}>

                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{ children: item.label }}
                      className="group/btn group-data-[collapsible=icon]:mx-auto"
                    >
                      <item.icon className={cn(
                        "transition-all duration-500",
                        item.label === 'Meu Ecossistema' && isLeader && "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] scale-110"
                      )} />
                      <span className={cn(
                        item.label === 'Meu Ecossistema' && isLeader && "text-yellow-500 font-black tracking-tighter"
                      )}>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}

              {/* Atalho de Gestão: visível para admins e super admins mesmo na área do aluno */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
                <SidebarMenuItem>
                  <Link href={getLink('/admin')}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/admin')}
                      tooltip={{ children: 'Gestão' }}
                      className="text-primary font-bold"
                    >
                      <Shield className="h-5 w-5" />
                      <span>Gestão</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}

              {currentUser?.role === 'super_admin' && superAdminMenuItems.map((item: any) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={getLink(item.href)}>

                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{ children: item.label }}
                      className="text-red-600 font-bold bg-red-50/50 hover:bg-red-50"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarContent>
        <Separator />
        <SidebarFooter className="p-4">
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarCollapseButton />
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/" onClick={() => logout()} className="w-full">
                <SidebarMenuButton tooltip={{ children: 'Sair' }}>
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
