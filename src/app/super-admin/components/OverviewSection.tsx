'use client';

import { School, Terminal, User, AuditLogEntry, WasteEntry } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  School as SchoolIcon, 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Zap 
} from 'lucide-react';
import { useMemo } from 'react';

interface OverviewSectionProps {
  activeSchools: School[];
  pendingSchools: School[];
  totalPoints: number;
  studentsCount: number;
  terminals: Terminal[];
  auditLogs: AuditLogEntry[];
  wasteEntries: WasteEntry[];
  deleteSchool: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateSchoolStatus: (id: string, status: 'active' | 'pending') => void | Promise<void>;
  toast: any;
}

export function OverviewSection({
  activeSchools,
  pendingSchools,
  totalPoints,
  studentsCount,
  terminals,
  auditLogs,
  wasteEntries,
  deleteSchool,
  updateSchoolStatus,
  toast
}: OverviewSectionProps) {

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours} h`;
    return date.toLocaleDateString('pt-BR');
  };

  const recentActivities = useMemo(() => {
    const logs = (auditLogs || []).slice(0, 10).map((log: AuditLogEntry) => ({
      id: log.id || Math.random().toString(),
      title: log.action === 'POINTS_AWARDED' ? 'Concessão de Bio-Coins' : (log.action as string).replace('_', ' '),
      description: log.details || `${log.adminName || log.actorName || 'Admin'} realizou uma ação.`,
      date: new Date(log.timestamp || Date.now()),
      color: log.action === 'POINTS_AWARDED' ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-slate-500'
    }));

    const wastes = (wasteEntries || []).slice(0, 10).map((w: WasteEntry) => ({
      id: w.id || Math.random().toString(),
      title: 'Coleta Realizada',
      description: `Descarte de ${w.collected || 0}kg de ${w.type || 'Resíduo'} registrado.`,
      date: new Date(w.date || Date.now()),
      color: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
    }));

    return [...logs, ...wastes]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  }, [auditLogs, wasteEntries]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* MÉTRICAS DE REDE */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-white shadow-2xl rounded-[2rem] overflow-hidden relative group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Escolas Parceiras</p>
                <h3 className="text-4xl font-black mt-1 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">{activeSchools.length}</h3>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-white"><SchoolIcon className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-200">
              <TrendingUp className="h-3.5 w-3.5" /> Expansão de rede ativa
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-[2rem] overflow-hidden relative group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio-Coins na Rede</p>
                <h3 className="text-3xl font-black mt-1 text-emerald-400">{(totalPoints / 1000).toFixed(1)}k</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400"><Zap className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              Moeda global estabilizada
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-[2rem] overflow-hidden relative group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agentes Ativos</p>
                <h3 className="text-3xl font-black mt-1 text-indigo-400">{studentsCount}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400"><Users className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              Alunos engajados na causa
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-[2rem] overflow-hidden relative group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Totens Ativos</p>
                <h3 className="text-3xl font-black mt-1 text-amber-400">{terminals.filter(t => t.status === 'active').length}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400"><Zap className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              Hardware IoT operando
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* SOLICITAÇÕES PENDENTES */}
        <Card className="lg:col-span-1 border-amber-500/20 bg-amber-500/5 backdrop-blur-lg rounded-[2rem] text-white">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 animate-pulse" /> Novas Solicitações
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">Aprovação de novos parceiros de rede.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSchools.map(school => (
              <div key={school.id} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl shadow-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">{school.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{school.city}, {school.state}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl"
                    onClick={async () => {
                      const res = await deleteSchool(school.id);
                      if (res.success) {
                        toast({ title: "Solicitação Recusada", description: "A escola foi removida da lista de espera." });
                      } else {
                        toast({ title: "Erro", description: res.error, variant: "destructive" });
                      }
                    }}
                  >
                    Recusar
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl"
                    onClick={async () => {
                      await updateSchoolStatus(school.id, 'active');
                      toast({ title: "Escola Aprovada", description: `${school.name} agora faz parte da rede.` });
                    }}
                  >
                    Aprovar
                  </Button>
                </div>
              </div>
            ))}
            {pendingSchools.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs font-bold uppercase tracking-wider">
                Nenhuma solicitação pendente
              </div>
            )}
          </CardContent>
        </Card>

        {/* ÚLTIMOS EVENTOS DE REDE */}
        <Card className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Atividade Recente da Rede</CardTitle>
            <CardDescription className="text-slate-400 text-xs">Monitoramento em tempo real de novos ingressos e coletas.</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
             <div className="space-y-6">
                {recentActivities.length > 0 ? recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500 items-start">
                     <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${activity.color} shrink-0`} />
                     <div className="space-y-1 flex-1">
                        <p className="text-sm font-bold text-slate-100">{activity.title}</p>
                        <p className="text-xs text-slate-400 font-medium">{activity.description}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> {formatTime(activity.date)}
                        </p>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    Aguardando atividades da rede...
                  </div>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
