'use client';

import { School, Terminal } from '@/types/ecosystem';
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
  ArrowLeft,
  ShieldAlert,
  ServerCrash,
  Leaf
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
    <div className="relative flex min-h-screen flex-col bg-[#070913] items-center justify-center p-4 text-slate-100 overflow-hidden font-sans">
      
      {/* Estilos e Grids de Fundo */}
      <style>{`
        .cyber-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
      `}</style>

      {/* Orbes e Grids de Fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-slate-500/5 blur-[120px] animate-pulse" />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full ${isBlocked ? 'bg-red-500/10' : isPending ? 'bg-amber-500/10' : 'bg-indigo-600/10'} blur-[120px] animate-pulse`} />
        <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <Card className="w-full backdrop-blur-3xl bg-slate-950/40 border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/5 overflow-hidden animate-in zoom-in duration-500">
          
          {/* Top Line Glowing Indicator */}
          <div className={`h-2 bg-gradient-to-r ${isBlocked ? 'from-red-600 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : isPending ? 'from-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'from-indigo-500 to-cyan-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`} />
          
          <CardHeader className="text-center pb-5 pt-8">
            <div className="flex items-center gap-2 mb-3 select-none justify-center">
              <Leaf className="h-4 w-4 text-indigo-400 fill-indigo-500/20 animate-pulse shrink-0" />
              <span className="text-xs font-black tracking-[0.3em] uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text">
                SchoolGain Kiosk
              </span>
            </div>
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 border shadow-inner ${
              isBlocked 
                ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse' 
                : isPending 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse' 
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-pulse'
            }`}>
              {isBlocked ? <Lock className="h-9 w-9" /> : isPending ? <Clock className="h-9 w-9" /> : <MonitorOff className="h-9 w-9" />}
            </div>
            
            <CardTitle className="text-2xl font-black uppercase tracking-wider text-white">
              {isBlocked ? 'Terminal Bloqueado' : isPending ? 'Aguardando Aprovação' : 'Terminal não Cadastrado'}
            </CardTitle>
            
            <CardDescription className="text-slate-400 text-xs font-semibold px-4 mt-2">
              {isBlocked ? 'Este dispositivo foi desativado temporariamente por um administrador.' : 
               isPending ? 'Sua solicitação de acesso foi enviada e está sendo analisada.' : 
               'Este totem de autoatendimento físico precisa ser autorizado para operar.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5 px-8 pb-6">
            {isPending ? (
              <div className="p-5 bg-slate-950/60 border border-white/5 rounded-2xl space-y-4 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">ID do Terminal:</span>
                  <code className="bg-[#090b14] px-3 py-1.5 rounded-lg border border-white/5 font-mono font-black text-amber-400 tracking-wider">
                    {currentTerminal?.id}
                  </code>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Localização:</span>
                  <span className="text-white font-bold">{currentTerminal?.location}</span>
                </div>
                
                <p className="text-[10px] text-amber-400/80 text-center font-bold uppercase tracking-wider bg-amber-500/5 py-2.5 rounded-xl border border-amber-500/10 animate-pulse">
                  Contate o administrador da escola para aprovação
                </p>
              </div>
            ) : isBlocked ? (
              <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl text-center space-y-3 shadow-inner">
                <p className="text-sm font-extrabold text-red-400 uppercase tracking-wide">O acesso deste terminal foi revogado.</p>
                <div className="flex justify-center items-center gap-2 text-xs">
                  <span className="text-slate-400 uppercase tracking-widest text-[9px]">ID Físico:</span>
                  <code className="bg-[#090b14] px-2.5 py-1 rounded-lg border border-white/5 font-mono font-black text-red-400">
                    {currentTerminal?.id || terminalIdSetting}
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">Unidade Escolar</Label>
                  <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                    <SelectTrigger className="h-12 bg-[#090b14] text-white border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-indigo-500/10 focus:ring-4 transition-all text-left">
                      <SelectValue placeholder="Selecione a instituição..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-white/10 bg-[#0c0f1d] text-white shadow-2xl z-50">
                      {schools.filter(s => s.status === 'active').map(school => (
                        <SelectItem 
                          key={school.id} 
                          value={school.id} 
                          className="rounded-lg text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer uppercase font-bold text-[10px] tracking-tight p-3"
                        >
                          <div className="flex items-center gap-2">
                            <SchoolIcon className="h-3.5 w-3.5 text-indigo-400" />
                            {school.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
                    Localização (Ex: Pátio Principal, Cantina)
                  </Label>
                  <Input 
                    placeholder="Ex: Pátio Principal" 
                    value={requestedLocation}
                    onChange={(e) => setRequestedLocation(e.target.value)}
                    className="h-12 text-sm bg-[#090b14] text-white placeholder:text-slate-600 border border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/10 focus:ring-4 rounded-xl transition-all font-semibold"
                  />
                </div>

                {generatedTerminalId && (
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl animate-in fade-in slide-in-from-top-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">
                      ID do Terminal Gerado pelo Sistema
                    </Label>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <code className="text-xl font-black font-mono text-indigo-400 tracking-wider">
                        {generatedTerminalId}
                      </code>
                      <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest text-[8px] font-black">
                        IMUTÁVEL
                      </Badge>
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider italic">
                      Este ID identificará permanentemente este hardware.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 px-8 pb-8">
            {!terminalExists && (
              <Button 
                className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:scale-[1.01] active:scale-95 border border-indigo-400/20" 
                disabled={!requestedLocation || !selectedSchoolId || isRequestingAuth}
                onClick={handleRequestAuth}
              >
                {isRequestingAuth ? 'Enviando Solicitação...' : 'Solicitar Autorização'}
              </Button>
            )}
            
            {isPending && (
              <Button 
                variant="destructive" 
                className="w-full h-12 font-black uppercase tracking-wider gap-2 rounded-xl bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 hover:text-rose-300 transition-all"
                onClick={() => {
                  if (currentTerminal) {
                    deleteTerminal(currentTerminal.id);
                    toast({ title: "Solicitação Cancelada", description: "O pedido de acesso foi removido." });
                  }
                }}
              >
                <Trash2 className="h-4.5 w-4.5" /> 
                Cancelar Solicitação
              </Button>
            )}

            <div className="grid grid-cols-2 gap-3 w-full">
              {(isPending || isBlocked) && (
                <Button 
                  variant="outline" 
                  className="h-12 font-black uppercase tracking-wider gap-2 bg-slate-900 border-white/5 rounded-xl text-slate-300 hover:text-white transition-all" 
                  onClick={() => window.location.reload()}
                >
                  <Recycle className="h-4.5 w-4.5 text-emerald-400 animate-spin [animation-duration:8s]" /> 
                  Recarregar
                </Button>
              )}
              <Button 
                variant="ghost" 
                className={`h-12 gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 rounded-xl ${(isPending || isBlocked) ? '' : 'col-span-2'}`} 
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" /> 
                  Sair / Voltar
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
