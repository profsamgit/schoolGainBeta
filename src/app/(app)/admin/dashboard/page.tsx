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
    TrendingUp,
    Globe,
    ShieldAlert
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#070913] text-center p-6 space-y-6 relative overflow-hidden rounded-[2rem]">
          {/* Background decorative neon blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="h-24 w-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.1)] relative z-10">
            <ShieldAlert className="h-12 w-12" />
          </div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Acesso Restrito</h2>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs max-w-xs mx-auto">Esta área é exclusiva para gestores e administradores da rede SchoolGain.</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white border border-rose-400/20 font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl shadow-xl relative z-10"><Link href="/dashboard">Voltar para o Dashboard</Link></Button>
        </div>
      );
    }

    const totalKg = filteredWasteEntries.reduce((acc, curr) => acc + curr.collected, 0);
    const activeTerminals = filteredTerminals.filter(t => t.status === 'active').length;

    return (
        <div className="min-h-screen bg-[#070913] text-white relative overflow-hidden font-sans pb-12">
            {/* Background decorative neon blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />
            {/* Fine futuristic digital grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="p-6 space-y-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
                {/* Header Moderno */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-6 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">Painel de Gestão</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mt-1">Monitoramento inteligente da unidade <span className="text-white font-bold">SchoolGain</span></p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-1.5 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl">
                        {isSuperAdmin && (
                            <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-9 px-4 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-indigo-500/10 mr-1">
                                <Link href="/super-admin" className="flex gap-2 items-center"><Globe className="h-4 w-4" /> Rede Global</Link>
                            </Button>
                        )}
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-inner">
                            <Clock className="h-4 w-4 text-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400 tabular-nums">
                                {currentTime ? currentTime.toLocaleTimeString('pt-BR') : '--:--:--'}
                            </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/30 rounded-xl border border-white/5">
                            <RefreshCw className={cn("h-3 w-3 text-indigo-400", refreshInterval !== '0' && "animate-spin-slow")} />
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                                {lastUpdated ? `Sincronizado ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Sincronizando...'}
                            </span>
                        </div>

                        <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                            <SelectTrigger className="w-[120px] border-none bg-transparent hover:bg-white/5 transition-colors h-9 text-slate-300 font-bold uppercase text-[9px] tracking-wider">
                                <SelectValue placeholder="Atualização" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/10 text-white">
                                <SelectItem value="0">Manual</SelectItem>
                                <SelectItem value="5">5s</SelectItem>
                                <SelectItem value="15">15s</SelectItem>
                                <SelectItem value="60">1 min</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-xl h-9 w-9 text-slate-300 hover:bg-white/5 hover:text-white">
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* KPI Ribbon (Faixa de Métricas) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 hover:border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.05)] text-white hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden rounded-[2rem]">
                        <CardContent className="p-6 relative overflow-hidden">
                            <TrendingUp className="absolute -right-2 -bottom-2 h-20 w-20 text-emerald-500 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Resíduos Coletados</p>
                            <div className="text-3xl font-black tracking-tighter">{totalKg.toFixed(1)} <span className="text-lg text-emerald-400 opacity-80">kg</span></div>
                            <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 w-fit px-3 py-1 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                +12% vs ciclo anterior
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-xl hover:scale-[1.02] hover:border-white/20 transition-all duration-300 rounded-[2rem]">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alunos Ativos</p>
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Users className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-white">{filteredUsers.length}</div>
                            <div className="mt-4 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-xl hover:scale-[1.02] hover:border-white/20 transition-all duration-300 rounded-[2rem]">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminais IoT</p>
                                <div className={cn("p-2 rounded-xl border", activeTerminals > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-slate-800/10 text-slate-400 border-white/5")}>
                                    <Zap className={cn("h-4 w-4", activeTerminals > 0 && "animate-pulse")} />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-white">
                                {activeTerminals} <span className="text-lg text-slate-500">/ {filteredTerminals.length}</span>
                            </div>
                            <p className="mt-4 text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Sistema Operacional
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-xl hover:scale-[1.02] hover:border-white/20 transition-all duration-300 rounded-[2rem]">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cadastros Pendentes</p>
                                <div className={cn("p-2 rounded-xl border", pendingRequests.length > 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-800/10 text-slate-400 border-white/5")}>
                                    <UserPlus className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-white">{pendingRequests.length}</div>
                            <Link href="/admin?tab=requests" className="mt-4 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1">
                                Gerenciar Solicitações →
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Grid Principal: Analytics + Auditoria */}
                <div className="grid gap-8 lg:grid-cols-3 items-stretch">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-[2rem]">
                            <AdminAnalytics />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-[2rem]">
                                <WasteChart />
                            </div>
                            <Card className="border-none shadow-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl text-white rounded-[2rem]">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-100">Metas do Ciclo</CardTitle>
                                    <CardDescription className="text-slate-400">Objetivos de sustentabilidade da unidade.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                                            <span>Meta de Coleta (1000kg)</span>
                                            <span className="text-emerald-400">{(totalKg / 1000 * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (totalKg / 1000 * 100))}%` }} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                                            <span>Engajamento Alunos (50%)</span>
                                            <span className="text-blue-400">{(filteredUsers.length / 200 * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (filteredUsers.length / 200 * 100))}%` }} />
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
        </div>
    );
}
