'use client';

import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  History, 
  ShieldCheck, 
  UserPlus, 
  Database, 
  Settings, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AuditFeed() {
  const { auditLogs, currentUser } = useEcosystem();
  const schoolId = currentUser?.schoolId;
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Filtrar logs por escola
  const filteredLogs = auditLogs
    .filter(log => isSuperAdmin ? true : log.unitId === schoolId || log.unitId === 'MASTER')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const getIcon = (action: string) => {
    if (action.includes('LOGIN')) return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
    if (action.includes('CREATE')) return <UserPlus className="h-4 w-4 text-blue-500" />;
    if (action.includes('UPDATE')) return <Database className="h-4 w-4 text-amber-500" />;
    if (action.includes('CONFIG')) return <Settings className="h-4 w-4 text-slate-500" />;
    if (action.includes('SECURITY')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <History className="h-4 w-4 text-primary" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AUTH': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]';
      case 'DATA': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]';
      case 'ECOSYSTEM': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.05)]';
      case 'SYSTEM': return 'bg-slate-500/10 text-slate-400 border border-white/5';
      default: return 'bg-slate-500/10 text-slate-400 border border-white/5';
    }
  };

  return (
    <Card className="border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl h-full flex flex-col overflow-hidden text-white rounded-[2rem]">
      <CardHeader className="flex-none">
        <CardTitle className="text-xl font-black uppercase tracking-wider flex items-center gap-2 text-slate-100">
          <History className="h-5 w-5 text-indigo-400" />
          Atividade do Sistema
        </CardTitle>
        <CardDescription className="text-slate-400">Registro recente de ações e auditoria técnica.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar pl-6 pr-8 pb-6">
          <div className="space-y-6 pt-2">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="relative pl-12 pb-6 last:pb-0">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-2 bottom-0 w-[2px] bg-white/5 last:hidden" />
                  
                  {/* Icon Dot */}
                  <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center shadow-md z-10 transition-transform hover:scale-110">
                    {getIcon(log.action)}
                  </div>
 
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border",
                      getCategoryColor(log.category)
                    )}>
                      {log.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  
                  <p className="text-sm font-bold text-slate-200">
                    {log.actorName}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
              <History className="h-12 w-12 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">Nenhum registro de atividade encontrado.</p>
            </div>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
