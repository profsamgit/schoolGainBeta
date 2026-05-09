'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ADMIN_MOCK, STUDENT_MOCK } from '@/lib/data';
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

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, currentUser, getGlobalLeader } = useEcosystem();
  const isAdminView = pathname.startsWith('/admin');
  
  const isLeader = useMemo(() => {
    if (!currentUser) return false;
    const leader = getGlobalLeader();
    return leader?.ra === (currentUser as any)?.ra;
  }, [getGlobalLeader, currentUser]);

  const displayUser = currentUser || STUDENT_MOCK;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <Leaf className="h-7 w-7 text-primary" />
            <span className="font-black tracking-tighter group-data-[collapsible=icon]:hidden">
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
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                      tooltip={{ children: item.label }}
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
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{ children: item.label }}
                      className="group/btn"
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
              {currentUser?.role === 'super_admin' && superAdminMenuItems.map((item: any) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{ children: item.label }}
                      className="text-red-600 font-bold bg-red-50/50 hover:bg-red-50"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarContent>
        <Separator />
        <SidebarFooter>
          <SidebarMenu>
            {isAdminView && (
              <SidebarMenuItem>
                <Link href="/admin?tab=hardware" className="w-full">
                  <SidebarMenuButton tooltip={{ children: 'Configurações de Hardware' }}>
                    <Settings />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
            <Link href="/" onClick={() => logout()} className="w-full">
                <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Trocar Perfil' }}>
                    <LogOut />
                    <span>Sair / Trocar</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
            </Link>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
