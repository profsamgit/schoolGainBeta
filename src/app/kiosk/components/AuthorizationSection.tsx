'use client';

import { School, Terminal } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Clock, 
  MonitorOff, 
  School as SchoolIcon, 
  Trash2, 
  Recycle, 
  ArrowLeft 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface AuthorizationSectionProps {
  isBlocked: boolean;
  isPending: boolean;
  terminalExists: boolean;
  currentTerminal: Terminal | undefined;
  schools: School[];
  selectedSchoolId: string;
  setSelectedSchoolId: (id: string) => void;
  requestedLocation: string;
  setRequestedLocation: (loc: string) => void;
  generatedTerminalId: string;
  isRequestingAuth: boolean;
  handleRequestAuth: () => void;
  deleteTerminal: (id: string) => void;
  terminalIdSetting: string;
  toast: any;
}

export function AuthorizationSection({
  isBlocked,
  isPending,
  terminalExists,
  currentTerminal,
  schools,
  selectedSchoolId,
  setSelectedSchoolId,
  requestedLocation,
  setRequestedLocation,
  generatedTerminalId,
  isRequestingAuth,
  handleRequestAuth,
  deleteTerminal,
  terminalIdSetting,
  toast
}: AuthorizationSectionProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background items-center justify-center p-4">
      <Card className="w-full max-w-lg border-primary/20 shadow-xl overflow-hidden">
        <div className={`h-2 ${isBlocked ? 'bg-red-500' : isPending ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
        <CardHeader className="text-center">
           <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isBlocked ? 'bg-red-100 text-red-600' : isPending ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              {isBlocked ? <Lock className="h-8 w-8" /> : isPending ? <Clock className="h-8 w-8" /> : <MonitorOff className="h-8 w-8" />}
           </div>
           <CardTitle className="text-2xl font-black uppercase tracking-tighter">
              {isBlocked ? 'Terminal Bloqueado' : isPending ? 'Aguardando Aprovação' : 'Terminal não Cadastrado'}
           </CardTitle>
           <CardDescription>
              {isBlocked ? 'Este dispositivo foi desativado por um administrador.' : 
               isPending ? 'Sua solicitação de acesso está sendo analisada.' : 
               'Este totem precisa ser autorizado para operar o sistema.'}
           </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {isPending ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-700 uppercase">ID do Terminal:</span>
                    <code className="bg-white px-2 py-1 rounded border font-mono font-black text-amber-900">{currentTerminal?.id}</code>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-700 uppercase">Localização Informada:</span>
                    <span className="text-amber-900">{currentTerminal?.location}</span>
                 </div>
                 <p className="text-[10px] text-amber-600 text-center font-medium">
                    Por favor, contate o administrador da escola para liberar este terminal.
                 </p>
              </div>
           ) : isBlocked ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                 <p className="text-sm font-bold text-red-800">O acesso deste terminal foi revogado.</p>
                 <p className="text-xs text-red-600 mt-1 font-bold">ID: {currentTerminal?.id || terminalIdSetting}</p>
              </div>
           ) : (
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unidade Escolar</Label>
                     <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                        <SelectTrigger className="h-12 bg-slate-900/90 dark:bg-slate-950/60 text-white border border-slate-200/60 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 text-left">
                           <SelectValue placeholder="Selecione a instituição..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white text-slate-900 dark:bg-white dark:text-slate-900 shadow-xl z-50">
                           {schools.filter(s => s.status === 'active').map(school => (
                              <SelectItem key={school.id} value={school.id} className="rounded-lg text-slate-800 dark:text-slate-800 focus:bg-slate-100 dark:focus:bg-slate-100 focus:text-slate-900 dark:focus:text-slate-900 cursor-pointer">
                                 <div className="flex items-center gap-2 uppercase font-bold text-[10px] tracking-tighter">
                                    <SchoolIcon className="h-3 w-3 text-indigo-500" />
                                    {school.name}
                                 </div>
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Localização do Terminal (Ex: Pátio, Entrada)</Label>
                      <Input 
                        placeholder="Ex: Pátio Principal" 
                        value={requestedLocation}
                        onChange={(e) => setRequestedLocation(e.target.value)}
                        className="h-12 text-lg bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl"
                      />
                   </div>

                   {generatedTerminalId && (
                     <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">ID do Terminal Gerado pelo Sistema</Label>
                        <div className="flex items-center justify-between">
                           <code className="text-xl font-black font-mono text-primary">{generatedTerminalId}</code>
                           <Badge className="bg-primary text-white">Único & Imutável</Badge>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-2 font-medium uppercase tracking-wider italic">Este ID será a identidade permanente deste totem no ecossistema.</p>
                     </div>
                   )}
               </div>
           )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
           {!terminalExists && (
              <Button 
                 className="w-full h-14 text-lg font-bold" 
                 disabled={!requestedLocation || !selectedSchoolId || isRequestingAuth}
                 onClick={handleRequestAuth}
              >
                 {isRequestingAuth ? 'Enviando...' : 'Solicitar Autorização'}
              </Button>
           )}
           
           {isPending && (
              <Button 
                variant="destructive" 
                className="w-full h-12 font-bold gap-2"
                onClick={() => {
                  if (currentTerminal) {
                    deleteTerminal(currentTerminal.id);
                    toast({ title: "Solicitação Cancelada", description: "O pedido de acesso foi removido." });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Cancelar Solicitação
              </Button>
           )}

           <div className="grid grid-cols-2 gap-3 w-full">
              {(isPending || isBlocked) && (
                <Button variant="outline" className="h-12 font-bold gap-2" onClick={() => window.location.reload()}>
                  <Recycle className="h-4 w-4" /> Recarregar
                </Button>
              )}
              <Button variant="ghost" className={`h-12 gap-2 ${(isPending || isBlocked) ? '' : 'col-span-2'}`} asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" /> Sair / Voltar
                </Link>
              </Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
