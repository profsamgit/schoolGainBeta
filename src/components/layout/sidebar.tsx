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
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ADMIN_MOCK, STUDENT_MOCK, LEADERBOARD_MOCK } from '@/lib/data';
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

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, currentUser, getGlobalLeader } = useEcosystem();
  const isAdminView = pathname.startsWith('/admin');
  
  const isLeader = useMemo(() => {
    if (!currentUser) return false;
    const leader = getGlobalLeader();
    return leader?.ra === (currentUser as any)?.ra;
  }, [getGlobalLeader, currentUser]);

  const displayUser = isAdminView ? ADMIN_MOCK : (currentUser || STUDENT_MOCK);

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-primary group-data-[collapsible=icon]:hidden">
              School
            </span>
            <span className="font-light group-data-[collapsible=icon]:hidden">
              Gain
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
                        item.label === 'Meu Ecossistema' && isLeader && "text-yellow-500 font-black italic tracking-tighter"
                      )}>{item.label}</span>
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
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={{ children: 'Configurações' }}>
                <Settings />
                <span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Link href="/" onClick={() => logout()}>
                <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Trocar Perfil' }}>
                    <LogOut />
                    <span>Trocar Perfil</span>
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
