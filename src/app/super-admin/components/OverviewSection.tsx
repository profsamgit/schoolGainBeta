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
      color: log.action === 'POINTS_AWARDED' ? 'bg-primary' : 'bg-slate-900'
    }));

    const wastes = (wasteEntries || []).slice(0, 10).map((w: WasteEntry) => ({
      id: w.id || Math.random().toString(),
      title: 'Coleta Realizada',
      description: `Descarte de ${w.collected || 0}kg de ${w.type || 'Resíduo'} registrado.`,
      date: new Date(w.date || Date.now()),
      color: 'bg-emerald-500'
    }));

    return [...logs, ...wastes]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  }, [auditLogs, wasteEntries]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* MÉTRICAS DE REDE */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Escolas Parceiras</p>
                <h3 className="text-4xl font-black mt-1">{activeSchools.length}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg"><SchoolIcon className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/90">
              <TrendingUp className="h-3 w-3" /> Expansão de rede ativa
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white border-none shadow-lg overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio-Coins na Rede</p>
                <h3 className="text-3xl font-black mt-1 text-emerald-400">{(totalPoints / 1000).toFixed(1)}k</h3>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Zap className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              Moeda global estabilizada
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Agentes Ativos</p>
                <h3 className="text-3xl font-black mt-1">{studentsCount}</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Users className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600">
              Alunos engajados na causa
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Totens Ativos</p>
                <h3 className="text-3xl font-black mt-1">{terminals.filter(t => t.status === 'active').length}</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Zap className="h-5 w-5" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-600">
              Hardware IoT operando
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* SOLICITAÇÕES PENDENTES */}
        <Card className="lg:col-span-1 border-amber-100 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Novas Solicitações
            </CardTitle>
            <CardDescription>Aprovação de novos parceiros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSchools.map(school => (
              <div key={school.id} className="p-4 bg-white border border-amber-200 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <SchoolIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{school.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{school.city}, {school.state}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-[10px] font-bold text-red-600 hover:bg-red-50"
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
                    className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700"
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
              <div className="text-center py-12 text-slate-400 text-sm">
                Nenhuma solicitação aguardando.
              </div>
            )}
          </CardContent>
        </Card>

        {/* ÚLTIMOS EVENTOS DE REDE */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Atividade Recente da Rede</CardTitle>
            <CardDescription>Monitoramento em tempo real de novos ingressos e coletas.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                {recentActivities.length > 0 ? recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                     <div className={`mt-1 h-2 w-2 rounded-full ${activity.color} shrink-0`}></div>
                     <div className="space-y-1">
                        <p className="text-sm font-bold">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{formatTime(activity.date)}</p>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aguardando primeiras atividades da rede...
                  </div>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
