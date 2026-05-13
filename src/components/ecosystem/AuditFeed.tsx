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
      case 'AUTH': return 'bg-emerald-100 text-emerald-700';
      case 'DATA': return 'bg-blue-100 text-blue-700';
      case 'ECOSYSTEM': return 'bg-purple-100 text-purple-700';
      case 'SYSTEM': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-none">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Atividade do Sistema
        </CardTitle>
        <CardDescription>Registro recente de ações e auditoria técnica.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-[750px] overflow-y-auto custom-scrollbar px-6 pb-6">
          <div className="space-y-6 pt-2">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="relative pl-12 pb-6 last:pb-0">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-2 bottom-0 w-[2px] bg-slate-100 last:hidden" />
                  
                  {/* Icon Dot */}
                  <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm z-10 transition-transform hover:scale-110">
                    {getIcon(log.action)}
                  </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                      getCategoryColor(log.category)
                    )}>
                      {log.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  
                  <p className="text-sm font-semibold text-slate-800">
                    {log.actorName}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
              <History className="h-12 w-12" />
              <p className="text-sm font-medium">Nenhum registro de atividade encontrado.</p>
            </div>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
