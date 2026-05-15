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
import { useEcosystem } from '@/app/(app)/ecosystem-context';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/meu-ecossistema', label: 'Meu Ecossistema', icon: Leaf },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/education', label: 'Educação', icon: BookOpen },
  { href: '/quiz', label: 'Quizzes', icon: BrainCircuit },
  { href: '/rewards', label: 'Recompensas', icon: Gift },
];

const adminMenuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin', label: 'Gerenciamento', icon: Shield, exact: true },
];

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


  const isLeader = useMemo(() => {
    if (!currentUser) return false;
    const leader = getGlobalLeader();
    return leader?.ra === (currentUser as any)?.ra;
  }, [getGlobalLeader, currentUser]);


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
                  : '/dashboard'
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
