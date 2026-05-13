'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { WasteChart } from '@/components/ecosystem/WasteChart';
import { AdminAnalytics } from '@/components/ecosystem/AdminAnalytics';
import { AuditFeed } from '@/components/ecosystem/AuditFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { 
    LayoutDashboard, 
    Expand, 
    Minimize, 
    RefreshCw, 
    Clock, 
    MapPin, 
    Users, 
    Zap, 
    UserPlus, 
    TrendingUp 
} from 'lucide-react';
import type { User } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const { 
        users, 
        currentUser, 
        wasteEntries, 
        terminals, 
        registrationRequests 
    } = useEcosystem();
    
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const schoolId = currentUser?.schoolId;

    // Filtros de Segurança e Escopo
    const filteredUsers = users.filter(u => isSuperAdmin ? true : u.schoolId === schoolId);
    const filteredWasteEntries = wasteEntries.filter(entry => isSuperAdmin ? true : entry.schoolId === schoolId);
    const filteredTerminals = terminals.filter(t => isSuperAdmin ? true : t.schoolId === schoolId);
    const pendingRequests = registrationRequests.filter(r => (isSuperAdmin ? true : r.schoolId === schoolId) && r.status === 'pending');

    const [refreshInterval, setRefreshInterval] = useState<string>('0');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    const { open: isSidebarOpen, setOpen: setSidebarOpen } = useSidebar();
    const sidebarWasOpen = useRef(isSidebarOpen);

    useEffect(() => {
        setCurrentTime(new Date());
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        setLastUpdated(new Date());
        const interval = parseInt(refreshInterval, 10);
        if (interval > 0) {
            const timer = setInterval(() => setLastUpdated(new Date()), interval * 1000);
            return () => clearInterval(timer);
        }
    }, [refreshInterval]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            sidebarWasOpen.current = isSidebarOpen;
            if (isSidebarOpen) setSidebarOpen(false);
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
            <LayoutDashboard className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Acesso Restrito</h2>
            <p className="text-muted-foreground">Área exclusiva para gestores autorizados.</p>
          </div>
          <Button asChild size="lg"><Link href="/dashboard">Voltar para o Painel</Link></Button>
        </div>
      );
    }

    const totalKg = filteredWasteEntries.reduce((acc, curr) => acc + curr.collected, 0);
    const activeTerminals = filteredTerminals.filter(t => t.status === 'active').length;

    return (
        <div className="space-y-8 pb-10">
            {/* Header Moderno */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-2xl">
                            <LayoutDashboard className="h-8 w-8 text-primary" />
                        </div>
                        Painel de Gestão
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Monitoramento inteligente da unidade <span className="text-primary font-bold">SchoolGain</span>.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold tabular-nums">
                            {currentTime ? currentTime.toLocaleTimeString('pt-BR') : '--:--:--'}
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-xl border border-slate-200/50">
                        <RefreshCw className={cn("h-3 w-3 text-slate-400", refreshInterval !== '0' && "animate-spin-slow")} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {lastUpdated ? `Atualizado ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Sincronizando...'}
                        </span>
                    </div>

                    <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                        <SelectTrigger className="w-[140px] border-none bg-transparent hover:bg-slate-100 transition-colors h-9">
                            <SelectValue placeholder="Atualização" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Manual</SelectItem>
                            <SelectItem value="5">5s</SelectItem>
                            <SelectItem value="15">15s</SelectItem>
                            <SelectItem value="60">1 min</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-xl h-9 w-9">
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* KPI Ribbon (Faixa de Métricas) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-emerald-600 text-white group hover:scale-[1.02] transition-transform duration-300">
                    <CardContent className="p-6 relative overflow-hidden">
                        <TrendingUp className="absolute -right-2 -bottom-2 h-20 w-20 opacity-10" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Resíduos Coletados</p>
                        <div className="text-3xl font-black tracking-tighter">{totalKg.toFixed(1)} <span className="text-lg opacity-80">kg</span></div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            +12% vs ciclo anterior
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-md border border-slate-100 hover:scale-[1.02] transition-transform duration-300">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alunos Ativos</p>
                            <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-black tracking-tighter text-slate-800">{filteredUsers.length}</div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[75%] rounded-full" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-md border border-slate-100 hover:scale-[1.02] transition-transform duration-300">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Terminais</p>
                            <Zap className={cn("h-5 w-5", activeTerminals > 0 ? "text-amber-500" : "text-slate-300")} />
                        </div>
                        <div className="text-3xl font-black tracking-tighter text-slate-800">
                            {activeTerminals} <span className="text-lg text-muted-foreground">/ {filteredTerminals.length}</span>
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Sistema Operacional
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-md border border-slate-100 hover:scale-[1.02] transition-transform duration-300">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cadastros</p>
                            <UserPlus className={cn("h-5 w-5", pendingRequests.length > 0 ? "text-red-500" : "text-slate-300")} />
                        </div>
                        <div className="text-3xl font-black tracking-tighter text-slate-800">{pendingRequests.length}</div>
                        <Link href="/admin?tab=requests" className="mt-4 text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                            Ver solicitações pendentes →
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Grid Principal: Analytics + Auditoria */}
            <div className="grid gap-8 lg:grid-cols-3 items-stretch">
                <div className="lg:col-span-2 space-y-8">
                    <AdminAnalytics />
                    <div className="grid gap-6 md:grid-cols-2">
                        <WasteChart />
                        <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Metas do Ciclo</CardTitle>
                                <CardDescription className="text-slate-400">Objetivos de sustentabilidade da unidade.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span>Meta de Coleta (1000kg)</span>
                                        <span>{(totalKg / 1000 * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(totalKg / 1000 * 100)}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span>Engajamento Alunos (50%)</span>
                                        <span>{(filteredUsers.length / 200 * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 transition-all duration-1000" style={{ width: `${(filteredUsers.length / 200 * 100)}%` }} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                
                <div className="h-full">
                    <AuditFeed />
                </div>
            </div>
        </div>
    )
}
