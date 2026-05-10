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
  if (t.includes('plástico')) return <Package className="h-3 w-3 text-blue-500" />;
  if (t.includes('papel')) return <Leaf className="h-3 w-3 text-green-500" />;
  if (t.includes('metal')) return <Zap className="h-3 w-3 text-amber-500" />;
  if (t.includes('vidro')) return <Droplets className="h-3 w-3 text-emerald-500" />;
  return <TrendingUp className="h-3 w-3 text-slate-400" />;
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
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <History className="h-6 w-6 text-primary" /> Arquivo de Impacto
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Memória de ciclos de sustentabilidade finalizados.</p>
          </div>
        </header>

        {resetHistory.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Calendar className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-slate-900 font-black uppercase text-sm tracking-tight">Vazio Absoluto</p>
                <p className="text-xs text-slate-500 font-medium">Nenhum ciclo foi encerrado na rede global ainda.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {resetHistory.map((snapshot) => (
              <Card key={snapshot.id} className="border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.01] transition-all duration-300">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">Ciclo #{snapshot.id.split('-')[1]}</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(snapshot.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <CardTitle className="text-lg font-black uppercase tracking-tighter text-slate-900">
                        {snapshot.schoolId ? `${schools.find(s => s.id === snapshot.schoolId)?.name || 'Unidade Removida'}` : 'Impacto Global da Rede'}
                      </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* MÉTRICAS PRINCIPAIS */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Massa Total</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{snapshot.totalWasteKg.toFixed(1)}</span>
                        <span className="text-[10px] font-black text-slate-400">KG</span>
                      </div>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Bio-Coins</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-primary">{snapshot.totalPoints}</span>
                        <span className="text-[10px] font-black text-primary/60">PTS</span>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Líder</p>
                      <p className="text-sm font-black text-emerald-900 truncate">{snapshot.topStudents[0]?.name || '---'}</p>
                    </div>
                  </div>

                  {/* DETALHAMENTO DE RESÍDUOS */}
                  {snapshot.wasteByType && Object.keys(snapshot.wasteByType).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Composição do Ciclo</Label>
                        <div className="h-px flex-1 mx-3 bg-slate-100" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(snapshot.wasteByType).map(([type, weight]) => (
                          <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                            <WasteIcon type={type} />
                            <span className="text-[10px] font-bold text-slate-600 capitalize">{type}</span>
                            <span className="text-[10px] font-black text-slate-900">{weight.toFixed(1)}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TOP RANKING */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Elite Sustentável</span>
                      </div>
                      <Button variant="link" className="h-auto p-0 text-[10px] font-black uppercase text-primary">Ver Ranking Completo <ArrowRight className="ml-1 h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {snapshot.topStudents.slice(0, 3).map((s: any, idx: number) => (
                        <div key={s.ra} className="relative p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-center overflow-hidden">
                          <span className="absolute top-1 right-2 text-[10px] font-black text-slate-200">#{idx + 1}</span>
                          <p className="text-[10px] font-bold text-slate-900 truncate mb-1">{s.name}</p>
                          <p className="text-xs font-black text-primary">{s.points} PTS</p>
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
          <Card className="border-none shadow-2xl bg-red-600 text-white overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <ShieldAlert className="h-32 w-32" />
            </div>
            
            <CardHeader className="relative z-10 p-8">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">Reset de Ciclo</CardTitle>
              <CardDescription className="text-red-100 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                Esta ação irá zerar todos os Bio-Coins e estados de vitalidade da unidade. Os dados serão arquivados permanentemente.
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-red-200">Âmbito do Reset</Label>
                  <Select value={selectedSchoolForReset} onValueChange={setSelectedSchoolForReset}>
                    <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white font-bold">
                      <SelectValue placeholder="Selecione o alvo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🌐 TODA A REDE (GLOBAL)</SelectItem>
                      {schools.map(school => (
                        <SelectItem key={school.id} value={school.id}>🏫 {school.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-red-200">Confirmação Crítica</Label>
                  <Input 
                    placeholder="REINICIAR" 
                    className="h-12 bg-white/10 border-white/20 text-white font-black tracking-widest uppercase placeholder:text-white/20"
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-red-200">Sua Senha Master</Label>
                  <Input 
                    type="password"
                    placeholder="SENHA DE AUTORIZAÇÃO" 
                    className="h-12 bg-white/10 border-white/20 text-white font-bold"
                    value={adminPasswordForAction}
                    onChange={(e) => setAdminPasswordForAction(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleCycleReset}
                  disabled={resetConfirm !== 'REINICIAR' || !adminPasswordForAction || isResetting}
                  className="w-full h-14 bg-white text-red-600 hover:bg-white/90 font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isResetting ? (
                    <RotateCcw className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Executar Reinicialização</span>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[9px] text-red-100 font-bold leading-relaxed italic text-center">
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
