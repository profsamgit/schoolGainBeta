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
  RotateCcw 
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Encerramentos
          </CardTitle>
          <CardDescription>Consulte os dados de ciclos que já foram finalizados.</CardDescription>
        </CardHeader>
        <CardContent>
          {resetHistory.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl space-y-3">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-muted-foreground font-medium">Nenhum ciclo foi encerrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resetHistory.map((snapshot) => (
                <Card key={snapshot.id} className="bg-slate-50/50 border-none shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-tight">
                          Ciclo Finalizado {snapshot.schoolId ? `- ${schools.find(s => s.id === snapshot.schoolId)?.name || 'Escola Removida'}` : '(Global)'}
                        </CardTitle>
                        <CardDescription className="text-xs">Data: {new Date(snapshot.endDate).toLocaleString('pt-BR')}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-white">ID: {snapshot.id.split('-')[1]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Coleta Total</p>
                        <p className="text-xl font-black">{snapshot.totalWasteKg.toFixed(1)} kg</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pontos Gerados</p>
                        <p className="text-xl font-black text-primary">{snapshot.totalPoints} pts</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Líder do Ciclo</p>
                        <p className="text-sm font-bold truncate">{snapshot.topStudents[0]?.name || '---'}</p>
                      </div>
                      <div className="flex items-end justify-end">
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold uppercase">
                          <Download className="h-3 w-3" /> Relatório CSV
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white rounded-lg border border-primary/5">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" /> Top 3 Estudantes
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {snapshot.topStudents.slice(0, 3).map((s: any, idx: number) => (
                          <div key={s.ra} className="text-center p-2 rounded bg-amber-50/30 border border-amber-100/50">
                            <p className="text-[10px] font-bold truncate">{s.name}</p>
                            <p className="text-xs font-black text-amber-700">{s.points} pts</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200 shadow-lg bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription className="text-red-800/70 font-medium">Ações irreversíveis que impactam toda a rede SchoolGain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white border border-red-100 rounded-xl space-y-4">
            <div>
              <h4 className="font-bold text-red-950 flex items-center gap-2 uppercase tracking-tighter">
                <RotateCcw className="h-4 w-4" /> Reiniciar Ciclo de Sustentabilidade
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Esta ação irá zerar todos os Bio-Coins, ecossistemas virtuais e coletas da unidade selecionada. 
                Os dados serão arquivados e não poderão ser editados.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Selecione a Unidade</Label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                value={selectedSchoolForReset}
                onChange={(e) => setSelectedSchoolForReset(e.target.value)}
              >
                <option value="all">🌐 TODA A REDE (GLOBAL)</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>🏫 {school.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Digite <span className="text-red-600">REINICIAR</span> para confirmar</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="REINICIAR" 
                  className="border-red-200 focus-visible:ring-red-500 uppercase font-black tracking-widest"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                />
                <Input 
                  type="password"
                  placeholder="Sua Senha" 
                  className="border-red-200 focus-visible:ring-red-500 font-black tracking-widest"
                  value={adminPasswordForAction}
                  onChange={(e) => setAdminPasswordForAction(e.target.value)}
                />
                <Button 
                  variant="destructive" 
                  className="font-black uppercase tracking-tighter gap-2 px-6 shrink-0"
                  disabled={resetConfirm !== 'REINICIAR' || !adminPasswordForAction || isResetting}
                  onClick={handleCycleReset}
                >
                  {isResetting ? 'Processando...' : 'Zerar Tudo'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
