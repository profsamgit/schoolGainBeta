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
import { useEcosystem } from '@/contexts/EcosystemContext';
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
import type { User } from '@/types/ecosystem';
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
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { 
        users, 
        currentUser, 
        wasteEntries, 
        terminals, 
        registrationRequests 
    } = useEcosystem();

    // Redireciona o usuário para /admin se ele precisar alterar a senha temporária
    useEffect(() => {
        if (currentUser?.mustChangePassword) {
            router.push('/admin');
        }
    }, [currentUser, router]);
    
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const schoolId = currentUser?.schoolId;

    // Filtros de Segurança e Escopo
    const filteredUsers = users.filter(u => isSuperAdmin ? true : u.schoolId === schoolId);
    const filteredWasteEntries = wasteEntries.filter(entry => isSuperAdmin ? true : entry.schoolId === schoolId);
    const filteredTerminals = terminals.filter(t => isSuperAdmin ? true : t.schoolId === schoolId);
    const pendingRequests = registrationRequests.filter(r => (isSuperAdmin ? true : r.schoolId === schoolId) && r.status === 'pending');

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    const { open: isSidebarOpen, setOpen: setSidebarOpen } = useSidebar();
    const sidebarWasOpen = useRef(isSidebarOpen);

    useEffect(() => {
        setCurrentTime(new Date());
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            sidebarWasOpen.current = isSidebarOpen;
            if (isSidebarOpen) setSidebarOpen(false);
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white/80 dark:bg-[#070913] text-slate-800 dark:text-white border border-slate-200/65 dark:border-white/5 text-center p-6 space-y-6 relative overflow-hidden rounded-[2rem] shadow-xl">
          {/* Background decorative neon blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="h-24 w-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.1)] relative z-10">
            <ShieldAlert className="h-12 w-12" />
          </div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Acesso Restrito</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs max-w-xs mx-auto">Esta área é exclusiva para gestores e administradores da rede SchoolGain.</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white border border-rose-400/20 font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl shadow-xl relative z-10"><Link href="/student/dashboard">Voltar para o Dashboard</Link></Button>
        </div>
      );
    }

    const totalKg = filteredWasteEntries.reduce((acc, curr) => acc + curr.collected, 0);
    const activeTerminals = filteredTerminals.filter(t => t.status === 'active').length;

    return (
        <div className="min-h-screen bg-[#EFF7EF] dark:bg-[#070913] text-slate-800 dark:text-white relative overflow-hidden font-sans pb-12 transition-colors duration-300">
            {/* Background decorative neon blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />
            {/* Fine futuristic digital grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="p-6 space-y-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
                {/* Header Moderno */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/80 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shadow-lg">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 dark:from-white dark:via-indigo-100 dark:to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">Painel de Gestão</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mt-1">Monitoramento inteligente da unidade <span className="text-slate-800 dark:text-white font-bold">SchoolGain</span></p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 bg-slate-100/90 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200/40 dark:border-white/5 shadow-2xl backdrop-blur-xl">
                        {isSuperAdmin && (
                            <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-9 px-4 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-indigo-500/10 mr-1">
                                <Link href="/super-admin" className="flex gap-2 items-center"><Globe className="h-4 w-4" /> Rede Global</Link>
                            </Button>
                        )}
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-250 dark:border-white/5 shadow-inner">
                            <Clock className="h-4 w-4 text-emerald-605 dark:text-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {currentTime ? currentTime.toLocaleTimeString('pt-BR') : '--:--:--'}
                            </span>
                        </div>

                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-xl h-9 w-9 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white">
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* KPI Ribbon (Faixa de Métricas) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none bg-white/80 dark:bg-emerald-500/10 border border-slate-200/60 dark:border-emerald-500/20 hover:border-emerald-500/35 hover:scale-[1.02] shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden rounded-[2rem] text-slate-800 dark:text-white">
                        <CardContent className="p-6 relative overflow-hidden">
                            <TrendingUp className="absolute -right-2 -bottom-2 h-20 w-20 text-emerald-555 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Resíduos Coletados</p>
                            <div className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{totalKg.toFixed(1)} <span className="text-lg text-emerald-600 dark:text-emerald-400 opacity-80">kg</span></div>
                            <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 w-fit px-3 py-1 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-550 dark:bg-emerald-400 animate-pulse" />
                                +12% vs ciclo anterior
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-xl hover:scale-[1.02] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 rounded-[2rem] text-slate-800 dark:text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Alunos Ativos</p>
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-605 border border-blue-500/20">
                                    <Users className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{filteredUsers.length}</div>
                            <div className="mt-4 h-1.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-xl hover:scale-[1.02] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 rounded-[2rem] text-slate-800 dark:text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Terminais IoT</p>
                                <div className={cn("p-2 rounded-xl border", activeTerminals > 0 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-slate-100 dark:bg-slate-800/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5")}>
                                    <Zap className={cn("h-4 w-4", activeTerminals > 0 && "animate-pulse")} />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                                {activeTerminals} <span className="text-lg text-slate-500">/ {filteredTerminals.length}</span>
                            </div>
                            <p className="mt-4 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Sistema Operacional
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-xl hover:scale-[1.02] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 rounded-[2rem] text-slate-800 dark:text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cadastros Pendentes</p>
                                <div className={cn("p-2 rounded-xl border", pendingRequests.length > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-slate-100 dark:bg-slate-800/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5")}>
                                    <UserPlus className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{pendingRequests.length}</div>
                            <Link href="/admin?tab=requests" className="mt-4 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline flex items-center gap-1">
                                Gerenciar Solicitações →
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* ♻️ STATUS DAS LIXEIRAS IOT EM TEMPO REAL */}
                {filteredTerminals.length > 0 && (
                  <Card className="border-none bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-xl rounded-[2rem] text-slate-800 dark:text-white">
                    <CardHeader className="p-6">
                      <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Níveis das Lixeiras IoT (Tempo Real)
                      </CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">Acompanhe a capacidade de armazenamento de cada coletor da unidade.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <div className="grid gap-6 md:grid-cols-2">
                         {filteredTerminals.map((terminal) => {
                           const hasFullBin = terminal.binLevels && Object.values(terminal.binLevels).some(lvl => lvl >= 85);
                           return (
                             <div key={terminal.id} className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                               <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                                 <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                   📍 {terminal.location}
                                   {hasFullBin && (
                                     <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase animate-pulse">
                                       ⚠️ Cheia
                                     </span>
                                   )}
                                 </span>
                                 {terminal.lastBinUpdate && (
                                   <span className="text-[9px] text-slate-450 dark:text-slate-500 font-mono">
                                     Atualizado: {new Date(terminal.lastBinUpdate).toLocaleTimeString('pt-BR')}
                                   </span>
                                 )}
                               </div>

                               {/* Informações da ESP de Descarte */}
                               <div className="space-y-1.5 p-3 rounded-xl border border-slate-100/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/10 text-[10px]">
                                 <div className="flex items-center justify-between font-bold text-slate-550 dark:text-slate-400">
                                   <span className="flex items-center gap-1.5 uppercase tracking-wide">
                                     <span className={cn("h-1.5 w-1.5 rounded-full", terminal.settings?.discardEspIp ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                     ♻️ ESP Descarte
                                   </span>
                                   <span className="font-mono text-slate-700 dark:text-slate-350">
                                     {terminal.settings?.discardEspIp ? (
                                       `${terminal.settings.discardEspIp} (${terminal.settings.discardEspSource === 'esp32_https' ? 'HTTPS' : 'HTTP'})`
                                     ) : (
                                       'Não configurada'
                                     )}
                                   </span>
                                 </div>
                                 <div className="flex items-center justify-between font-bold text-slate-550 dark:text-slate-400 border-t border-slate-100/30 dark:border-white/5 pt-1.5">
                                   <span className="flex items-center gap-1.5 uppercase tracking-wide">
                                     💳 Leitor RFID
                                   </span>
                                   <span className="font-mono text-slate-700 dark:text-slate-350">
                                     {terminal.settings?.lastRfidRead ? (
                                       <span className="text-emerald-600 dark:text-emerald-450 font-black">
                                         Ativo (Lido: {terminal.settings.lastRfidRead.uid} às {new Date(terminal.settings.lastRfidRead.timestamp).toLocaleTimeString('pt-BR')})
                                       </span>
                                     ) : (
                                       'Aguardando aproximação...'
                                     )}
                                   </span>
                                 </div>
                               </div>
                               
                               {terminal.binLevels ? (
                                 <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                                   {(['plastico', 'papel', 'vidro', 'metal'] as const).map((material) => {
                                     const level = terminal.binLevels?.[material] ?? 0;
                                     
                                     // Determina as cores e gradientes de preenchimento específicos por material
                                     let fillGradientClass = 'from-emerald-500 to-teal-600';
                                     let materialLabel = '';
                                     
                                     if (material === 'plastico') {
                                       fillGradientClass = 'from-rose-500 to-red-600 shadow-[0_4px_15px_rgba(239,68,68,0.25)]';
                                       materialLabel = '🧴 Plástico';
                                     } else if (material === 'papel') {
                                       fillGradientClass = 'from-blue-500 to-indigo-600 shadow-[0_4px_15px_rgba(59,130,246,0.25)]';
                                       materialLabel = '📄 Papel';
                                     } else if (material === 'vidro') {
                                       fillGradientClass = 'from-emerald-500 to-green-600 shadow-[0_4px_15px_rgba(16,185,129,0.25)]';
                                       materialLabel = '🍾 Vidro';
                                     } else if (material === 'metal') {
                                       fillGradientClass = 'from-amber-400 to-amber-600 shadow-[0_4px_15px_rgba(245,158,11,0.25)]';
                                       materialLabel = '⚙️ Metal';
                                     }

                                     let statusText = 'Disponível';
                                     let statusColorClass = 'text-emerald-600 dark:text-emerald-450';
                                     let containerBorderClass = 'border-slate-100/85 dark:border-white/5 bg-white/40 dark:bg-slate-900/10';

                                     if (level >= 85) {
                                       statusText = 'Cheia!';
                                       statusColorClass = 'text-rose-600 dark:text-rose-400 font-extrabold animate-pulse';
                                       containerBorderClass = 'border-rose-500/40 bg-rose-500/5 dark:border-rose-500/20 animate-pulse';
                                     } else if (level >= 50) {
                                       statusText = 'Nível Médio';
                                       statusColorClass = 'text-amber-600 dark:text-amber-400';
                                       containerBorderClass = 'border-amber-500/30 bg-amber-500/5 dark:border-amber-500/10';
                                     }

                                     return (
                                       <div key={material} className={cn("p-3 border rounded-2xl flex flex-col items-center justify-between space-y-3 transition-all duration-300", containerBorderClass)}>
                                         
                                         {/* Rótulo da Lixeira */}
                                         <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 text-center">
                                           {materialLabel}
                                         </span>

                                         {/* Barra Vertical (Simulando uma Lixeira Física) */}
                                         <div className="relative w-full max-w-[55px] h-36 bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-end">
                                           {/* Nível do resíduo subindo de baixo para cima */}
                                           <div 
                                             className={cn("w-full rounded-b-[15px] transition-all duration-1000 bg-gradient-to-t", fillGradientClass)}
                                             style={{ height: `${level}%` }}
                                           >
                                             {/* Efeito visual da borda de preenchimento */}
                                             {level > 0 && (
                                               <div className="w-full h-1 bg-white/20 blur-[1px] absolute" style={{ bottom: `calc(${level}% - 2px)` }} />
                                             )}
                                           </div>
                                           
                                           {/* Porcentagem flutuando sobre a barra */}
                                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                             <span className={cn(
                                               "font-mono font-black text-xs px-1 rounded-md backdrop-blur-[2px]",
                                               level > 40 ? "text-white bg-black/10" : "text-slate-800 dark:text-white"
                                             )}>
                                               {level}%
                                             </span>
                                           </div>
                                         </div>

                                          {/* Rodapé: Status do sensor */}
                                          <div className="w-full text-center space-y-1">
                                            <div className={`text-[9px] font-black uppercase tracking-wider ${statusColorClass}`}>
                                              {statusText}
                                            </div>
                                            {terminal.binDistances?.[material] !== undefined && (
                                              <div className="text-[9px] text-slate-450 dark:text-slate-500 font-mono flex items-center justify-center gap-0.5 border-t border-slate-150/40 dark:border-white/5 pt-1 mt-1">
                                                <span>📡 {terminal.binDistances[material].toFixed(1)} cm</span>
                                              </div>
                                            )}
                                          </div>

                                       </div>
                                     );
                                   })}
                                 </div>
                               ) : (
                                 <div className="py-6 text-center">
                                   <span className="text-[10px] text-slate-450 dark:text-slate-500 italic uppercase tracking-wider">Aguardando telemetria inicial...</span>
                                 </div>
                               )}
                             </div>
                           );
                         })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Grid Principal: Analytics + Auditoria */}
                <div className="grid gap-8 lg:grid-cols-3 items-stretch">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-[2rem] text-slate-800 dark:text-white">
                            <AdminAnalytics />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 shadow-2xl backdrop-blur-xl p-6 rounded-[2rem] text-slate-800 dark:text-white">
                                <WasteChart />
                            </div>
                            <Card className="border-none shadow-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl text-slate-850 dark:text-white rounded-[2rem]">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Metas do Ciclo</CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400">Objetivos de sustentabilidade da unidade.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                            <span>Meta de Coleta (1000kg)</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">{(totalKg / 1000 * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (totalKg / 1000 * 100))}%` }} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                            <span>Engajamento Alunos (50%)</span>
                                            <span className="text-blue-600 dark:text-blue-400">{(filteredUsers.length / 200 * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
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
