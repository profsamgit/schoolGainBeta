'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ADMIN_MOCK } from '@/lib/data';
import {
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User as UserIcon,
  Leaf,
  Trophy,
  BookOpen,
  BrainCircuit,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import React, { useState, useEffect, useMemo } from 'react';

const pathToTitle: { [key: string]: string } = {
  dashboard: 'Dashboard',
  waste: 'Registro de Resíduo',
  leaderboard: 'Ranking',
  education: 'Educação',
  quiz: 'Quizzes',
  rewards: 'Recompensas',
  admin: 'Gerenciamento',
  'meu-ecossistema': 'Meu Ecossistema',
};



export function Header() {
  const { toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();
  const title =
    pathToTitle[pathname.split('/').pop() || ''] || 'SchoolGain Hub';
  
  const { balance, points, vitality, currentUser, logout, currentUserRa, getGlobalLeader } = useEcosystem();
  
  const isLeader = useMemo(() => {
    if (!currentUserRa) return false;
    const leader = getGlobalLeader();
    return leader?.ra === currentUserRa;
  }, [getGlobalLeader, currentUserRa]);
  const isAdminView = pathname.startsWith('/admin') || pathname.startsWith('/super-admin');

  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');

  // Função auxiliar para injetar o parâmetro de preview nos links
  const getLink = (href: string) => {
    if (previewId) {
      return `${href}?preview=${previewId}`;
    }
    return href;
  };

  const studentMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/meu-ecossistema', label: 'Meu Ecossistema', icon: Leaf },
    { href: '/leaderboard', label: 'Ranking', icon: Trophy },
    { href: '/education', label: 'Educação', icon: BookOpen },
    { href: '/quiz', label: 'Quizzes', icon: BrainCircuit },
    { href: '/rewards', label: 'Recompensas', icon: Gift },
  ];

  const adminMenuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin', label: 'Gerenciamento', icon: Shield },
  ];

  const superAdminMenuItems = [
    { href: '/super-admin', label: 'Central de Rede', icon: Shield },
  ];
  
  // Prioriza o usuário logado do contexto. Fallback apenas se deslogado.
  const displayUser = currentUser || (isAdminView ? ADMIN_MOCK : {
    name: 'Visitante',
    role: 'visitor',
    avatar: undefined,
    ra: '',
    email: ''
  });

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const getLeafColor = (v: number) => {
    if (isLeader) return '#fbbf24'; // Ouro PURO (Tailwind yellow-400)
    if (v >= 70) return '#22c55e'; // Verde Vibrante (emerald-500)
    if (v >= 30) return '#f59e0b'; // Amber-500 (Difere do Ouro)
    return '#92400e'; // Marrom (amber-900)
  };

  const menuItems = useMemo(() => {
    if (pathname.startsWith('/super-admin')) {
      return superAdminMenuItems;
    }
    if (isAdminView) {
      return adminMenuItems;
    }
    return studentMenuItems;
  }, [pathname, isAdminView]);

  return (
    <header className="relative z-40 flex h-14 items-center gap-3 px-4 sm:h-14 sm:px-6 transition-all border-b bg-[#070913]/90 border-white/5 text-white backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* Horizontal Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 mx-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={getLink(item.href)}>
              <span className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer border",
                isActive
                  ? isAdminView
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "bg-primary/10 border-primary/20 text-primary"
                  : isAdminView
                    ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5"
              )}>
                <item.icon className={cn("h-3.5 w-3.5", isActive ? "animate-pulse" : "opacity-80")} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      <h1 className={cn(
        "text-sm font-black uppercase tracking-widest md:hidden",
        isAdminView ? "text-indigo-400" : "text-slate-800 dark:text-slate-200"
      )}>
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-4">
        {hasMounted && !isAdminView && (
          <div className="flex items-center gap-2">
            {/* Pill 1: Pontos de Experiência (XP Acumulado) */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 leading-none tracking-wider">Pontos (XP)</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">{points}</span>
              </div>
              <Trophy className="h-4 w-4 text-indigo-500 animate-pulse" />
            </div>

            {/* Pill 2: Bio-Coins (Saldo para compras na Bioshop) */}
            <Link 
              href="/meu-ecossistema" 
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shadow-inner group"
            >
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 leading-none tracking-wider">Bio-Coins</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">{balance}</span>
              </div>
              <Leaf 
                className={cn("h-4 w-4 transition-all duration-500 group-hover:scale-110", isLeader && "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]")} 
                fill={getLeafColor(vitality)} 
                stroke={getLeafColor(vitality)} 
              />
            </Link>
          </div>
        )}

        {hasMounted ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "overflow-hidden rounded-full transition-all h-8 w-8",
                    isAdminView 
                      ? "border-white/10 hover:ring-2 hover:ring-indigo-500/35 bg-slate-950" 
                      : "border-slate-200 dark:border-white/10 hover:ring-2 hover:ring-primary/20"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={displayUser.avatar || undefined}
                      alt={`Avatar de ${displayUser.name}`}
                    />
                    <AvatarFallback>{displayUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn(
                "w-56 rounded-2xl shadow-2xl p-2",
                isAdminView 
                  ? "bg-slate-950/95 border-white/10 text-white backdrop-blur-xl" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200"
              )}>
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="font-black text-xs uppercase tracking-wider text-slate-200">{displayUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight mt-0.5">
                    {displayUser.email || (displayUser.ra ? `RA: ${displayUser.ra}` : '')}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={cn(isAdminView ? "bg-white/5" : "bg-slate-100 dark:bg-white/5")} />
                
                {isAdminView ? (
                  adminMenuItems.map((item) => (
                    <Link key={item.href} href={getLink(item.href)}>
                      <DropdownMenuItem className={cn(
                        "rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider mb-1 cursor-pointer transition-colors",
                        isAdminView 
                          ? "hover:bg-white/5 text-slate-300 hover:text-white" 
                          : "hover:bg-slate-100 dark:hover:bg-white/5"
                      )}>
                        <item.icon className="mr-2 h-4 w-4 text-indigo-400" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))
                ) : (
                  studentMenuItems.map((item) => (
                    <Link key={item.href} href={getLink(item.href)}>
                      <DropdownMenuItem className={cn(
                        "rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider mb-1 cursor-pointer transition-colors",
                        item.label === 'Meu Ecossistema' && isLeader ? "text-yellow-500 hover:bg-yellow-500/10" : "hover:bg-slate-100 dark:hover:bg-white/5"
                      )}>
                        <item.icon className={cn(
                          "mr-2 h-4 w-4 transition-all",
                          item.label === 'Meu Ecossistema' && isLeader ? "text-yellow-500" : "text-indigo-400"
                        )} />
                        <span className={cn(
                          item.label === 'Meu Ecossistema' && isLeader && "text-yellow-400 font-black"
                        )}>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))
                )}

                {currentUser?.role === 'super_admin' && superAdminMenuItems.map((item) => (
                  <Link key={item.href} href={getLink(item.href)}>
                    <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 cursor-pointer">
                      <item.icon className="mr-2 h-4 w-4 text-rose-500" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}

                <DropdownMenuSeparator className={cn(isAdminView ? "bg-white/5" : "bg-slate-100 dark:bg-white/5")} />
                <Link href="/" onClick={() => logout()}>
                  <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer transition-colors">
                    <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </Link>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full h-8 w-8"
            disabled
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{displayUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>
    </header>
  );
}
