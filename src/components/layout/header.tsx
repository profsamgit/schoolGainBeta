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

function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const { currentUser } = useEcosystem();
  const isAdminView = pathname.startsWith('/admin');
  const homeHref = currentUser?.role === 'super_admin' ? '/super-admin' : currentUser?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={homeHref}>
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/');
          const isLast = index === segments.length - 1;
          const title = pathToTitle[segment] || segment;

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-semibold text-foreground">
                    {title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

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

  return (
    <header className="relative z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-14 sm:bg-background sm:px-6">
      <BreadcrumbNav />
      <h1 className="text-lg font-semibold md:hidden">{title}</h1>

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
                  className="overflow-hidden rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
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
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <p className="font-semibold">{displayUser.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {displayUser.email || (displayUser.ra ? `RA: ${displayUser.ra}` : '')}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {isAdminView ? (
                  adminMenuItems.map((item) => (
                    <Link key={item.href} href={getLink(item.href)}>
                      <DropdownMenuItem>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))
                ) : (
                  studentMenuItems.map((item) => (
                    <Link key={item.href} href={getLink(item.href)}>
                      <DropdownMenuItem>
                        <item.icon className={cn(
                          "mr-2 h-4 w-4 transition-all",
                          item.label === 'Meu Ecossistema' && isLeader && "text-yellow-500"
                        )} />
                        <span className={cn(
                          item.label === 'Meu Ecossistema' && isLeader && "text-yellow-600 font-bold"
                        )}>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))
                )}

                {currentUser?.role === 'super_admin' && superAdminMenuItems.map((item) => (
                  <Link key={item.href} href={getLink(item.href)}>
                    <DropdownMenuItem className="text-red-600 font-bold">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}

                <DropdownMenuSeparator />
                <Link href="/" onClick={() => logout()}>
                  <DropdownMenuItem className="text-muted-foreground hover:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
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
            className="overflow-hidden rounded-full"
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
