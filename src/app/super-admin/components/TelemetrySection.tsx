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
  Clock
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
import { AuditLogEntry, AuditActionType, School } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TelemetrySectionProps {
  logs: AuditLogEntry[];
  schools: School[];
}

export function TelemetrySection({ logs, schools }: TelemetrySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = useMemo(() => {
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
      case 'LOGIN_SUCCESS': return <Unlock className="h-4 w-4 text-emerald-500" />;
      case 'LOGIN_FAIL': return <Lock className="h-4 w-4 text-rose-500" />;
      case 'CRUD_CREATE': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'CRUD_DELETE': return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'CRUD_UPDATE': return <Activity className="h-4 w-4 text-amber-500" />;
      case 'SYSTEM_RESET': return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case 'POINTS_AWARDED': return <Database className="h-4 w-4 text-emerald-400" />;
      case 'SECURITY_LOCKOUT': return <Shield className="h-4 w-4 text-red-600" />;
      default: return <Terminal className="h-4 w-4 text-slate-400" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'AUTH': return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-bold text-[10px]">AUTH</Badge>;
      case 'DATA': return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-bold text-[10px]">DATA</Badge>;
      case 'SYSTEM': return <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 font-bold text-[10px]">SYSTEM</Badge>;
      case 'ECOSYSTEM': return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px]">ECO</Badge>;
      default: return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white/40 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pesquisa Global de Telemetria</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por Agente, ID ou Ação..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-none shadow-inner rounded-2xl h-12 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="space-y-2 flex-1 md:w-40">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoria</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/80 border-none shadow-inner rounded-2xl h-12">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="AUTH">Autenticação</SelectItem>
                <SelectItem value="DATA">Dados/CRUD</SelectItem>
                <SelectItem value="SYSTEM">Sistema</SelectItem>
                <SelectItem value="ECOSYSTEM">Ecossistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1 md:w-56">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unidade / Origem</label>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="bg-white/80 border-none shadow-inner rounded-2xl h-12">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
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

      {/* LOG TABLE */}
      <Card className="border-none shadow-2xl bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-white/80 border-b border-slate-100 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tighter">Timeline de Telemetria</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rastreabilidade em tempo real do ecossistema</CardDescription>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] py-1 px-3">
              {filteredLogs.length} EVENTOS ENCONTRADOS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-widest pl-8">Timestamp</TableHead>
                  <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest">Categoria</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-widest">Agente</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Ação / Detalhes</TableHead>
                  <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-right pr-8">Forense</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-white/80 transition-all border-b border-slate-50">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-900">{new Date(log.timestamp).toLocaleDateString()}</span>
                        <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
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
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{log.actorName}</span>
                        <span className="text-[9px] font-mono text-primary font-bold">{log.actorId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{log.action}</span>
                          <span className="text-[11px] text-slate-600 font-medium line-clamp-1">{log.details}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
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
                        <Search className="h-8 w-8" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhum rastro encontrado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* FORENSIC DETAILS DIALOG */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-slate-950 text-white p-8">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Análise Forense</DialogTitle>
                  <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Hash ID: {selectedLog?.id}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Agente Responsável</label>
                <div className="flex items-center gap-2">
                   <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{selectedLog?.actorName.charAt(0)}</div>
                   <p className="font-bold text-sm">{selectedLog?.actorName}</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unidade de Origem</label>
                <div className="flex items-center gap-2">
                   <Building2 className="h-4 w-4 text-primary" />
                   <p className="font-bold text-sm">{selectedLog?.unitId === 'MASTER' ? 'Conselho de Mestres' : schools.find(s => s.id === selectedLog?.unitId)?.name || 'Unidade Desconhecida'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Descrição da Ocorrência</label>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {selectedLog?.details}
              </p>
            </div>

            {selectedLog?.metadata && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className="h-4 w-4 text-primary" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata / Snapshot</label>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-auto max-h-60">
                  <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {selectedLog && new Date(selectedLog.timestamp).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock className="h-3 w-3" />
                    {selectedLog && new Date(selectedLog.timestamp).toLocaleTimeString()}
                  </div>
               </div>
               <Badge className="bg-slate-900 text-white font-black text-[9px] px-3 py-1">
                 INTEGRIDADE VERIFICADA
               </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
