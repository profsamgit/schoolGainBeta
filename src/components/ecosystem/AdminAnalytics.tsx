'use client';

import React, { useMemo } from 'react';
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { Leaf, Users, Award, TrendingUp, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const chartConfig = {
  collected: {
    label: 'Coletado (kg)',
    color: 'hsl(var(--primary))',
  },
  engagement: {
    label: 'Engajamento',
    color: 'hsl(var(--primary))',
  }
} satisfies ChartConfig;

export function AdminAnalytics() {
  const { wasteEntries, currentUser, users, allTurmas: turmas, allCursos: cursos, auditLogs, userStates } = useEcosystem();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const schoolId = currentUser?.schoolId;
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // 1. Filtrar Entradas por Escola
  const filteredEntries = useMemo(() => {
    return wasteEntries.filter(e => isSuperAdmin ? true : e.schoolId === schoolId);
  }, [wasteEntries, isSuperAdmin, schoolId]);

  // 2. Agrupar por Data (Últimos 7 dias)
  const dailyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const total = filteredEntries
        .filter(e => e.date.startsWith(date))
        .reduce((sum, e) => sum + e.collected, 0);
      
      const dayName = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
      return { date: dayName, collected: total };
    });
  }, [filteredEntries]);

  // 3. Agrupar por Turma (Ranking)
  const turmaRanking = useMemo(() => {
    const schoolUsers = users.filter(u => isSuperAdmin ? true : u.schoolId === schoolId);
    const totals: Record<string, number> = {};

    schoolUsers.forEach(u => {
      if (u.turma) {
        const points = userStates[u.id]?.points || 0;
        totals[u.turma] = (totals[u.turma] || 0) + points;
      }
    });

    return Object.entries(totals)
      .map(([name, points]) => ({ name, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [users, isSuperAdmin, schoolId]);

  // 4. Cálculos de Impacto
  const totalKg = filteredEntries.reduce((sum, e) => sum + e.collected, 0);
  const co2Saved = (totalKg * 1.5).toFixed(1); // 1.5kg CO2 por kg de material (estimado)
  const treesSaved = Math.floor(totalKg / 20); // 20kg material = 1 árvore (estimado)

  // 5. Engajamento Pedagógico
  const pedagogicStats = useMemo(() => {
    const logs = auditLogs.filter(log => isSuperAdmin ? true : log.unitId === schoolId);
    const articles = logs.filter(l => l.action === 'ARTICLE_READ').length;
    const quizzes = logs.filter(l => l.action === 'QUIZ_COMPLETED').length;
    const rewards = logs.filter(l => l.action === 'REWARD_REDEEMED').length;
    
    return { articles, quizzes, rewards };
  }, [auditLogs, isSuperAdmin, schoolId]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Gráfico de Evolução */}
      <Card className="lg:col-span-2 border-none shadow-xl bg-white/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução Semanal
          </CardTitle>
          <CardDescription>Volume de resíduos coletados nos últimos 7 dias (kg).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full min-h-[300px]">
            {isMounted ? (
              <ChartContainer config={chartConfig} className="h-full w-full" height={300}>
                <BarChart data={dailyData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'hsl(var(--primary))', opacity: 0.1 }}
                />
                <Bar 
                  dataKey="collected" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                >
                  {dailyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === dailyData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.4)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            ) : (
              <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-xl" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Impacto e Ranking */}
      <div className="space-y-6">
        {/* Card Impacto Ambiental */}
        <Card className="border-none shadow-xl bg-emerald-600 text-white overflow-hidden relative">
          <Globe className="absolute -bottom-4 -right-4 h-24 w-24 opacity-20 rotate-12" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Impacto Ambiental
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-black">{co2Saved} kg</div>
              <p className="text-xs text-emerald-100">CO2 evitado na atmosfera</p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold">{treesSaved} Árvores</div>
                <p className="text-[10px] opacity-80 text-emerald-50">Equivalência em preservação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking de Turmas */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {turmaRanking.map((turma, index) => (
                <div key={turma.name} className="flex items-center gap-3">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    index === 0 ? "bg-yellow-400 text-yellow-900" : "bg-slate-100 text-slate-500"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold">{turma.name}</span>
                      <span className="text-xs font-bold text-primary">{turma.points} pts</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${(turma.points / (turmaRanking[0].points || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Engajamento Pedagógico */}
      <div className="lg:col-span-3 grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Artigos Lidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{pedagogicStats.articles}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total de leituras na unidade</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              Quizzes Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{pedagogicStats.quizzes}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Avaliações concluídas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Prêmios Resgatados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{pedagogicStats.rewards}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Trocas de Bio-Coins efetuadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
