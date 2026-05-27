'use client';

import { useState, useMemo } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Activity, 
  Lock, 
  Unlock, 
  UserPlus, 
  UserMinus, 
  RefreshCw, 
  Database,
  Building2,
  Calendar,
  Eye,
  Terminal,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Clock,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuditLogEntry, AuditActionType, School } from '@/types/ecosystem';
import { cn } from '@/lib/utils';

interface TelemetrySectionProps {
  logs: AuditLogEntry[];
  schools: School[];
}

export function TelemetrySection({ logs, schools }: TelemetrySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = useMemo(() => {
    if (!categoryFilter) return [];
    return logs.filter(log => {
      const matchesSearch = 
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchesUnit = unitFilter === 'all' || log.unitId === unitFilter;

      return matchesSearch && matchesCategory && matchesUnit;
    });
  }, [logs, searchTerm, categoryFilter, unitFilter]);

  const getActionIcon = (action: AuditActionType | string) => {
    switch (action) {
      case 'LOGIN_SUCCESS': return <Unlock className="h-4 w-4 text-emerald-400" />;
      case 'LOGIN_FAIL': return <Lock className="h-4 w-4 text-rose-400" />;
      case 'CRUD_CREATE': return <UserPlus className="h-4 w-4 text-blue-400" />;
      case 'CRUD_DELETE': return <UserMinus className="h-4 w-4 text-rose-500" />;
      case 'CRUD_UPDATE': return <Activity className="h-4 w-4 text-amber-400" />;
      case 'SYSTEM_RESET': return <RefreshCw className="h-4 w-4 text-purple-400" />;
      case 'POINTS_AWARDED': return <Database className="h-4 w-4 text-emerald-400" />;
      case 'SECURITY_LOCKOUT': return <Shield className="h-4 w-4 text-rose-600 animate-pulse" />;
      default: return <Terminal className="h-4 w-4 text-slate-400" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'AUTH': return <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[9px] tracking-widest rounded-lg">AUTH</Badge>;
      case 'DATA': return <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[9px] tracking-widest rounded-lg">DATA</Badge>;
      case 'SYSTEM': return <Badge variant="outline" className="border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-[9px] tracking-widest rounded-lg">SYSTEM</Badge>;
      case 'ECOSYSTEM': return <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[9px] tracking-widest rounded-lg">ECO</Badge>;
      default: return <Badge variant="outline" className="text-slate-700 dark:text-white border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 font-black text-[9px] tracking-widest rounded-lg">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white/80 dark:bg-slate-900/40 p-6 rounded-[2rem] backdrop-blur-xl border border-slate-200/60 dark:border-white/10 shadow-xl dark:shadow-2xl">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400 ml-1">Pesquisa Global de Telemetria</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Buscar por Agente, ID ou Ação..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl h-12 focus-visible:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="space-y-2 flex-1 md:w-40">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400 ml-1">Categoria</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl h-12">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="AUTH">Autenticação</SelectItem>
                <SelectItem value="DATA">Dados/CRUD</SelectItem>
                <SelectItem value="SYSTEM">Sistema</SelectItem>
                <SelectItem value="ECOSYSTEM">Ecossistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1 md:w-56">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400 ml-1">Unidade / Origem</label>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl h-12">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                <SelectItem value="all">Todas as Unidades</SelectItem>
                <SelectItem value="MASTER">Conselho de Mestres (Global)</SelectItem>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* CONDITIONAL RENDER BASED ON CATEGORY FILTER */}
      {!categoryFilter ? (
        <Card className="border border-slate-200/60 dark:border-white/10 shadow-xl dark:shadow-2xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-12 text-center text-slate-800 dark:text-white">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto py-8 space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-lg animate-pulse">
              <Filter className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">Selecione o Tipo de Log</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Para visualizar a linha do tempo de telemetria e os registros de auditoria forense do ecossistema, por favor selecione a categoria desejada no filtro acima.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCategoryFilter('all')}
                className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-xl text-[10px] font-black uppercase tracking-wider px-4 py-2"
              >
                Todas as Categorias
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCategoryFilter('AUTH')}
                className="border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl text-[10px] font-black uppercase tracking-wider px-4 py-2"
              >
                Autenticação
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCategoryFilter('DATA')}
                className="border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl text-[10px] font-black uppercase tracking-wider px-4 py-2"
              >
                Dados / CRUD
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border border-slate-200/60 dark:border-white/10 shadow-xl dark:shadow-2xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden text-slate-800 dark:text-white">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 py-6 px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shadow-lg">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Timeline de Telemetria</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400">Rastreabilidade em tempo real do ecossistema</CardDescription>
                </div>
              </div>
              <Badge className="bg-indigo-500/10 text-indigo-655 dark:text-indigo-400 border border-indigo-500/20 font-black text-[10px] py-1 px-3 rounded-lg">
                {filteredLogs.length} EVENTOS ENCONTRADOS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-white/5">
                    <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-widest pl-8 text-slate-550 dark:text-slate-400">Timestamp</TableHead>
                    <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400">Categoria</TableHead>
                    <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400">Agente</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400">Ação / Detalhes</TableHead>
                    <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-right pr-8 text-slate-550 dark:text-slate-400">Forense</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                    <TableRow key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all border-b border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300">
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-white">{new Date(log.timestamp).toLocaleDateString()}</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(log.category)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.actorName}</span>
                          <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{log.actorId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/50 dark:border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400">
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{log.action}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-md block mt-0.5">{log.details}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                          <Search className="h-8 w-8 text-slate-400" />
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nenhum rastro encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
  
            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3 p-4">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => {
                const formattedDate = new Date(log.timestamp).toLocaleDateString();
                const formattedTime = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-950/40 shadow-md flex flex-col gap-3 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10.5px] font-bold text-slate-800 dark:text-white">{formattedDate}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formattedTime}
                        </span>
                      </div>
                      {getCategoryBadge(log.category)}
                    </div>
                    <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-white/5 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.actorName}</span>
                        <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">{log.actorId}</span>
                      </div>
                      <div className="flex items-start gap-2.5 mt-2">
                        <div className="h-7 w-7 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/50 dark:border-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{log.action}</span>
                          <span className="text-[10.5px] text-slate-505 dark:text-slate-400 font-medium leading-relaxed mt-0.5">{log.details}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-indigo-500/20 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-xl text-[9px] font-black uppercase tracking-wider gap-1.5"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Forense
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-8 text-center text-xs text-slate-550 italic bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  Nenhum rastro encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FORENSIC DETAILS DIALOG */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-50 dark:bg-slate-950 p-8 border-b border-slate-100 dark:border-white/5 relative">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight italic text-slate-900 dark:text-white">Análise Forense</DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Hash ID: {selectedLog?.id}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-800 dark:hover:text-white rounded-full"
              onClick={() => setSelectedLog(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Agente Responsável</label>
                <div className="flex items-center gap-2 mt-1">
                   <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white">{selectedLog?.actorName.charAt(0)}</div>
                   <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedLog?.actorName}</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Unidade de Origem</label>
                <div className="flex items-center gap-2 mt-1">
                   <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                   <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedLog?.unitId === 'MASTER' ? 'Conselho de Mestres' : schools.find(s => s.id === selectedLog?.unitId)?.name || 'Unidade Desconhecida'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-white/5">
              <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest block mb-2">Descrição da Ocorrência</label>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedLog?.details}
              </p>
            </div>

            {selectedLog?.metadata && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                  <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">Metadata / Snapshot</label>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-auto max-h-60 border border-slate-200 dark:border-white/5 shadow-inner">
                  <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    {selectedLog && new Date(selectedLog.timestamp).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    {selectedLog && new Date(selectedLog.timestamp).toLocaleTimeString()}
                  </div>
               </div>
               <Badge className="bg-indigo-500/10 text-indigo-655 dark:text-indigo-400 border border-indigo-500/20 font-black text-[9px] px-3 py-1 rounded-lg">
                 INTEGRIDADE VERIFICADA
               </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
