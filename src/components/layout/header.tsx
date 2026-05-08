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
import { ADMIN_MOCK, STUDENT_MOCK } from '@/lib/data';
import {
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User as UserIcon,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useSidebar } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
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
  
  const { balance, vitality, currentUser, logout, currentUserRa, getGlobalLeader } = useEcosystem();
  
  const isLeader = useMemo(() => {
    if (!currentUserRa) return false;
    const leader = getGlobalLeader();
    return leader?.ra === currentUserRa;
  }, [getGlobalLeader, currentUserRa]);
  const isAdminView = pathname.startsWith('/admin');
  
  // Prioriza o usuário logado do contexto. Fallback apenas se deslogado.
  const displayUser = currentUser || (isAdminView ? ADMIN_MOCK : STUDENT_MOCK);

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile && (
        <Button
          size="icon"
          variant="outline"
          className="sm:hidden"
          onClick={toggleSidebar}
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}

      <BreadcrumbNav />
      <h1 className="text-lg font-semibold md:hidden">{title}</h1>

      <div className="ml-auto flex items-center gap-4">
        {hasMounted && !isAdminView && (
          <Link 
            href="/meu-ecossistema" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/50 hover:bg-accent transition-colors"
          >
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium text-muted-foreground uppercase leading-none">Pontos</span>
              <span className="text-sm font-bold text-primary">{balance}</span>
            </div>
            <Leaf 
              className={cn("h-5 w-5 transition-all duration-500", isLeader && "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-110")} 
              fill={getLeafColor(vitality)} 
              stroke={getLeafColor(vitality)} 
            />
          </Link>
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
                      src={displayUser.avatar}
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
                <Link href={displayUser.role === 'super_admin' ? '/super-admin' : displayUser.role === 'admin' ? '/admin' : '/dashboard'}>
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil / Painel</span>
                  </DropdownMenuItem>
                </Link>
                {isAdminView && (
                  <Link href="/admin?tab=hardware">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                {displayUser.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin/dashboard">
                      <DropdownMenuItem>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Painel do Gestor</span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <Link href="/" onClick={() => logout()}>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Trocar Perfil</span>
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
