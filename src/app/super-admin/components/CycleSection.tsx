'use client';

import { School, CycleSnapshot } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  History, 
  Calendar, 
  Download, 
  Trophy, 
  ShieldAlert, 
  RotateCcw,
  Leaf,
  Droplets,
  Package,
  Zap,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface CycleSectionProps {
  schools: School[];
  resetHistory: CycleSnapshot[];
  resetConfirm: string;
  setResetConfirm: (val: string) => void;
  selectedSchoolForReset: string;
  setSelectedSchoolForReset: (val: string) => void;
  adminPasswordForAction: string;
  setAdminPasswordForAction: (val: string) => void;
  handleCycleReset: () => void;
  isResetting: boolean;
}

const WasteIcon = ({ type }: { type: string }) => {
  const t = type.toLowerCase();
  if (t.includes('plástico')) return <Package className="h-3.5 w-3.5 text-blue-400" />;
  if (t.includes('papel')) return <Leaf className="h-3.5 w-3.5 text-green-400" />;
  if (t.includes('metal')) return <Zap className="h-3.5 w-3.5 text-amber-400" />;
  if (t.includes('vidro')) return <Droplets className="h-3.5 w-3.5 text-emerald-400" />;
  return <TrendingUp className="h-3.5 w-3.5 text-slate-400" />;
};

export function CycleSection({
  schools,
  resetHistory,
  resetConfirm,
  setResetConfirm,
  selectedSchoolForReset,
  setSelectedSchoolForReset,
  adminPasswordForAction,
  setAdminPasswordForAction,
  handleCycleReset,
  isResetting
}: CycleSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HISTÓRICO DE CICLOS (LADO ESQUERDO/CENTRO) */}
      <div className="lg:col-span-2 space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <History className="h-6 w-6 text-indigo-400" /> Arquivo de Impacto
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Memória de ciclos de sustentabilidade finalizados.</p>
          </div>
        </header>

        {resetHistory.length === 0 ? (
          <Card className="border-2 border-dashed border-white/10 bg-slate-950/40 shadow-none rounded-[2rem]">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 border border-white/5 shadow-inner">
                <Calendar className="h-8 w-8 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-white font-black uppercase text-sm tracking-widest">Vazio Absoluto</p>
                <p className="text-xs text-slate-500 font-bold mt-1">Nenhum ciclo foi encerrado na rede global ainda.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {resetHistory.map((snapshot) => (
              <Card key={snapshot.id} className="relative border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl overflow-hidden group hover:scale-[1.01] transition-all duration-300 rounded-[2rem]">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                
                <CardHeader className="pb-4 pl-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-lg">Ciclo #{snapshot.id.split('-')[1]}</Badge>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(snapshot.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <CardTitle className="text-lg font-black uppercase tracking-tight text-white mt-1">
                        {snapshot.schoolId ? `${schools.find(s => s.id === snapshot.schoolId)?.name || 'Unidade Removida'}` : 'Impacto Global da Rede'}
                      </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pl-8">
                  {/* MÉTRICAS PRINCIPAIS */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Massa Total</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">{snapshot.totalWasteKg.toFixed(1)}</span>
                        <span className="text-[10px] font-black text-slate-500">KG</span>
                      </div>
                    </div>
                    <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Bio-Coins</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-400">{snapshot.totalPoints}</span>
                        <span className="text-[10px] font-black text-indigo-500">PTS</span>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-1">Líder</p>
                      <p className="text-sm font-black text-emerald-400 truncate">{snapshot.topStudents[0]?.name || '---'}</p>
                    </div>
                  </div>

                  {/* DETALHAMENTO DE RESÍDUOS */}
                  {snapshot.wasteByType && Object.keys(snapshot.wasteByType).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Composição do Ciclo</Label>
                        <div className="h-[1px] flex-1 mx-3 bg-white/5" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(snapshot.wasteByType).map(([type, weight]) => (
                          <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 rounded-full border border-white/5">
                            <WasteIcon type={type} />
                            <span className="text-[10px] font-bold text-slate-300 capitalize">{type}</span>
                            <span className="text-[10px] font-black text-white">{weight.toFixed(1)}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TOP RANKING */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Elite Sustentável</span>
                      </div>
                      <Button variant="link" className="h-auto p-0 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300">Ver Ranking Completo <ArrowRight className="ml-1 h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {snapshot.topStudents.slice(0, 3).map((s: any, idx: number) => (
                        <div key={s.ra} className="relative p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center overflow-hidden">
                          <span className="absolute top-1 right-2 text-[10px] font-black text-slate-800">#{idx + 1}</span>
                          <p className="text-[10px] font-bold text-slate-300 truncate mb-1">{s.name}</p>
                          <p className="text-xs font-black text-indigo-400">{s.points} PTS</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ZONA DE PERIGO / CONTROLES (LADO DIREITO) */}
      <div className="space-y-6">
        <div className="sticky top-6">
          <Card className="border border-rose-500/20 bg-rose-950/10 backdrop-blur-xl text-white overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(239,68,68,0.05)]">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 pointer-events-none">
              <ShieldAlert className="h-32 w-32" />
            </div>
            
            <CardHeader className="relative z-10 p-8">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.1)] animate-pulse">
                <RotateCcw className="h-6 w-6 animate-spin [animation-duration:10s]" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-rose-400">Reset de Ciclo</CardTitle>
              <CardDescription className="text-rose-200/70 font-bold uppercase text-[9px] tracking-widest leading-relaxed mt-1">
                Esta ação irá zerar todos os Bio-Coins e estados de vitalidade da unidade. Os dados serão arquivados permanentemente.
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-rose-300/80 ml-1">Âmbito do Reset</Label>
                  <Select value={selectedSchoolForReset} onValueChange={setSelectedSchoolForReset}>
                    <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white font-bold rounded-xl focus:border-rose-500/50">
                      <SelectValue placeholder="Selecione o alvo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 text-white">
                      <SelectItem value="all">🌐 TODA A REDE (GLOBAL)</SelectItem>
                      {schools.map(school => (
                        <SelectItem key={school.id} value={school.id}>🏫 {school.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-rose-300/80 ml-1">Confirmação Crítica</Label>
                  <Input 
                    placeholder="REINICIAR" 
                    className="h-12 bg-slate-950 border-white/10 text-white font-black tracking-widest uppercase placeholder:text-white/10 rounded-xl focus:border-rose-500/50"
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-rose-300/80 ml-1">Sua Senha Master</Label>
                  <Input 
                    type="password"
                    placeholder="SENHA DE AUTORIZAÇÃO" 
                    className="h-12 bg-slate-950 border-white/10 text-white font-bold rounded-xl focus:border-rose-500/50"
                    value={adminPasswordForAction}
                    onChange={(e) => setAdminPasswordForAction(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleCycleReset}
                  disabled={resetConfirm !== 'REINICIAR' || !adminPasswordForAction || isResetting}
                  className="w-full h-14 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white border border-rose-400/20 font-black uppercase tracking-widest text-xs rounded-xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {isResetting ? (
                    <RotateCcw className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Executar Reinicialização</span>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                <p className="text-[9px] text-rose-200/50 font-bold leading-relaxed italic text-center">
                  "O reset gera um snapshot imutável para auditoria futura e histórico de impacto da rede."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
