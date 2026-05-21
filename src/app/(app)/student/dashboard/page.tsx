'use client';

/**
 * DashboardPage: A "Página Inicial" do Aluno
 * 
 * Esta é a tela que o aluno vê logo após fazer login. Ela resume seu progresso,
 * mostra seu nível atual, sua posição no ranking e suas missões pendentes.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Medal,
  Target,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sprout,
  Trees,
  ShieldCheck,
  Leaf,
  TreeDeciduous,
  Eye,
  Sparkles
} from 'lucide-react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { EcosystemService } from '@/lib/ecosystem.service';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * getLevelIcon: Retorna um ícone visual que representa o crescimento do aluno.
 * Note como o nível "Guardião da Lenda" tem uma animação extra (animate-pulse).
 */
const getLevelIcon = (level: string) => {
  switch (level) {
    case 'Semente':
      return <div className="p-2 bg-amber-100 rounded-full"><Target className="h-5 w-5 text-amber-600" /></div>;
    case 'Broto':
      return <div className="p-2 bg-lime-100 rounded-full"><Sprout className="h-5 w-5 text-lime-600" /></div>;
    case 'Folha':
      return <div className="p-2 bg-emerald-100 rounded-full"><Leaf className="h-5 w-5 text-emerald-600" /></div>;
    case 'Árvore':
      return <div className="p-2 bg-green-100 rounded-full"><TreeDeciduous className="h-5 w-5 text-green-700" /></div>;
    case 'Floresta':
      return <div className="p-2 bg-green-200 rounded-full"><Trees className="h-5 w-5 text-green-800" /></div>;
    case 'Guardião da Biosfera':
      return <div className="p-2 bg-indigo-100 rounded-full"><ShieldCheck className="h-5 w-5 text-indigo-600" /></div>;
    case 'Guardião da Lenda':
      return <div className="p-2 bg-amber-100 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"><Trophy className="h-5 w-5 text-amber-600 animate-pulse" /></div>;
    default:
      return <Medal className="text-orange-400" />;
  }
};

import StudentCard from '@/components/ecosystem/StudentCard';
import PhotoCaptureDialog from '@/components/ecosystem/PhotoCaptureDialog';
import { LevelJourney } from './components/LevelJourney';
import { POINTS_MAPPING } from '@/lib/constants';

export default function DashboardPage() {
  /**
   * CONSUMO DO CONTEXTO:
   * Aqui pegamos as informações que o EcosystemProvider está "espalhando" para o sistema.
   * balance: saldo atual
   * vitality: saúde do ecossistema
   * currentUser: dados do aluno logado
   */
  const { 
    balance, 
    points,
    vitality, 
    purchasedItems, 
    isMissionDone, 
    vitalityActivated,
    users, 
    currentUser, 
    currentUserRa, 
    level, 
    uploadUserAvatar, 
    isPreviewMode,
    getMonthlyLegends,
    legends,
    userStates,
    wasteEntries
  } = useEcosystem();

  // Filtra e ordena os descartes recentes do aluno logado
  const studentDiscards = useMemo(() => {
    if (!Array.isArray(wasteEntries) || !currentUser) return [];
    return wasteEntries
      .filter((entry: any) => entry.studentId === currentUser.id)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [wasteEntries, currentUser]);

  // Recupera o estado do ecossistema do aluno logado
  const studentState = useMemo(() => {
    if (!currentUser || !userStates) return null;
    return userStates[currentUser.id] || null;
  }, [currentUser, userStates]);

  // Filtra e ordena as transações do Ledger do aluno
  const pointTransactions = useMemo(() => {
    if (!studentState || !Array.isArray(studentState.pointTransactions)) return [];
    return [...studentState.pointTransactions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [studentState]);

  // Calcula a quantidade de pontos próximos da expiração (nos próximos 7 dias)
  const pointsExpiringSoon = useMemo(() => {
    if (!studentState || !Array.isArray(studentState.pointTransactions)) return 0;
    const now = new Date();
    const expiryThresholdDays = 30;
    const warningWindowDays = 7;
    let expiringTotal = 0;

    studentState.pointTransactions.forEach((tx: any) => {
      if (tx.amount > 0 && !tx.expired) {
        const txDate = new Date(tx.date);
        const diffTime = now.getTime() - txDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays >= (expiryThresholdDays - warningWindowDays) && diffDays <= expiryThresholdDays) {
          expiringTotal += tx.amount;
        }
      }
    });
    return expiringTotal;
  }, [studentState]);

  const router = useRouter();
  const currentLevel = level;


  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const url = await uploadUserAvatar(currentUser.id, file);
      if (url) {
        toast({ title: "Sucesso!", description: "Sua foto de perfil foi atualizada." });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao enviar foto.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Redireciona visitantes para o Kiosk (Visitantes não têm dashboard próprio)
  useEffect(() => {
    if (currentUser?.role === 'visitor') {
      router.push('/kiosk');
    }
  }, [currentUser, router]);

  // Score Global: Uma fórmula matemática que soma pontos + bônus por conquistas
  const globalScore = EcosystemService.calculateTotalScore(points, vitality, purchasedItems.length);
  
  // Lógica de Lenda: Verifica se o aluno atual está no Hall das Lendas deste mês
  const isLegend = useMemo(() => {
    const monthlyLegends = getMonthlyLegends();
    return monthlyLegends.some((l: any) => l.ra?.toUpperCase() === currentUserRa?.toUpperCase());
  }, [getMonthlyLegends, currentUserRa, legends, userStates]);

  /**

   * LÓGICA DE NÍVEL:
   * Define quantos pontos faltam para o próximo "título" do aluno.
   */
  const nextLevelScore =
    currentLevel === 'Semente' ? 5000 :
    currentLevel === 'Broto' ? 8000 :
    currentLevel === 'Folha' ? 11000 :
    currentLevel === 'Árvore' ? 14000 :
    currentLevel === 'Floresta' ? 17000 : 
    currentLevel === 'Guardião da Biosfera' ? 20000 : 25000;
  
  // Percentual para a barra de progresso
  const progressToNextLevel = Math.min(100, (globalScore / nextLevelScore) * 100);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto relative z-10 text-white">
      <div className="grid gap-6 flex-grow">
        
        {pointsExpiringSoon > 0 && (
          <Alert className="bg-amber-950/20 border border-amber-500/30 shadow-lg shadow-amber-500/5 text-amber-400 rounded-[2rem] mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-550 animate-bounce" />
            <AlertTitle className="text-lg font-black uppercase tracking-tight text-amber-450">Bio-Coins Próximos da Expiração</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-3 text-amber-300">
              <span className="text-base font-bold leading-relaxed">
                Você tem <b className="text-amber-500 underline decoration-amber-500/30 decoration-2">{pointsExpiringSoon} Bio-Coins</b> que expirarão em até 7 dias! Visite a Bioshop e aproveite-os antes do prazo.
              </span>
              <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white shadow-md border-none px-8 h-11 rounded-xl">
                <Link href="/student/meu-ecossistema">
                  Visitar Bioshop
                  <ArrowRight className="ml-2 h-5 w-5 animate-pulse" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!vitalityActivated && vitality <= 20 && (
          <Alert className="bg-red-950/20 border border-red-500/30 shadow-lg shadow-red-500/5 text-red-400 rounded-[2rem] mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <AlertTitle className="text-lg font-black uppercase tracking-tight text-red-450">Ecossistema Inativo</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-3 text-red-300">
              <span className="text-base font-bold leading-relaxed">
                Para ativar seu ecossistema e começar com 100% de vitalidade, você precisa completar um <b>Quiz de 10 perguntas</b> no nível <b>Médio</b>.
              </span>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white shadow-md border-none px-8 h-11 rounded-xl">
                <Link href="/student/quiz?topic=Reciclagem&autoStart=true&difficulty=medium&questions=10">
                  Ativar Agora
                  <BrainCircuit className="ml-2 h-5 w-5 animate-pulse" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* JORNADA DE NÍVEL PREMIUM */}
        <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-xl">
           <LevelJourney currentLevel={currentLevel} totalScore={globalScore} />
        </Card>
        
        {/* CARD DE BOAS-VINDAS E RESUMO */}
        <Card className="border border-white/5 rounded-[2rem] bg-slate-900/40 shadow-2xl backdrop-blur-xl text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="relative group/avatar">
                <Avatar className="h-16 w-16 rounded-2xl border-4 border-white/10 shadow-xl bg-slate-900 text-white flex items-center justify-center text-xl font-black uppercase transition-transform group-hover/avatar:scale-105">
                   <AvatarImage src={currentUser?.avatar || undefined} className="object-cover" />
                   <AvatarFallback className="bg-slate-900 text-white">{currentUser?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                  {!isPreviewMode && (
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-2xl cursor-pointer transition-opacity border-2 border-white/20 absolute inset-0 z-10">
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                      </label>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-white/10 shadow-lg z-20 opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                        onClick={() => setIsCameraOpen(true)}
                        disabled={isUploading}
                      >
                        <Camera className="h-4 w-4 text-slate-800" />
                      </Button>
                    </div>
                  )}
              </div>
              <div className="space-y-1">
                <CardTitle className={cn(
                  "text-2xl transition-all font-black uppercase tracking-tight",
                  isLegend ? "text-amber-400 flex items-center gap-2" : ""
                )}>
                  Olá, {currentUser?.name?.split(' ')[0] || 'Agente'}!
                  {isLegend && <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />}
                </CardTitle>
                <CardDescription className="font-semibold text-slate-400">
                  Seu progresso na jornada sustentável hoje.
                </CardDescription>
              </div>
            </div>
            <StudentCard />
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Bloco de Saldo */}
            <Card className="bg-emerald-550/10 border border-emerald-500/20 rounded-[1.5rem] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-emerald-400">Bio-Coins</CardTitle>
                <Target className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{balance.toLocaleString()}</div>
                <p className="text-xs text-slate-400 font-medium">Saldo disponível para upgrades</p>
              </CardContent>
            </Card>

            {/* Bloco de Ranking */}
            <Card className="bg-indigo-550/10 border border-indigo-500/20 rounded-[1.5rem] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-400">Sua Posição</CardTitle>
                <Trophy className="h-4 w-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">
                  #
                  {(() => {
                    if (!Array.isArray(users) || !currentUser) return 0;
                    const students = users.filter((u: any) => u.role === 'student');
                    const sorted = [...students].sort((a: any, b: any) => {
                      const pointsA = userStates[a.id]?.points ?? a.points ?? 0;
                      const pointsB = userStates[b.id]?.points ?? b.points ?? 0;
                      return pointsB - pointsA;
                    });
                    return sorted.findIndex((u: any) => u.ra?.toUpperCase() === currentUser?.ra?.toUpperCase()) + 1;
                  })()}
                </div>
                <p className="text-xs text-slate-400 font-medium">de {users.filter(u => u.role === 'student').length} alunos</p>
              </CardContent>
            </Card>

            {/* Bloco de Vitalidade */}
            <Card className="bg-rose-550/10 border border-rose-500/20 rounded-[1.5rem] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-rose-400">Vitalidade</CardTitle>
                <Activity className="h-4 w-4 text-rose-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{vitality}%</div>
                <p className="text-xs text-slate-400 font-medium">Saúde do seu ecossistema</p>
              </CardContent>
            </Card>

          </CardContent>
          
          {/* BARRA DE PROGRESSO DE NÍVEL */}
          <CardFooter>
            <div className="w-full">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Rumo ao próximo nível</span>
                <span className="text-emerald-400 font-black">
                  {globalScore.toLocaleString()} / {nextLevelScore.toLocaleString()} Score XP
                </span>
              </div>
              <Progress value={progressToNextLevel} className="h-2 bg-slate-950/60 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400" />
            </div>
          </CardFooter>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* CARD DE MISSÃO DIÁRIA */}
          {/* Ele muda de cor (fica laranja) se a vitalidade do aluno estiver baixa! */}
          <Card className={cn(
            "relative overflow-hidden transition-all duration-500 rounded-[2rem] border",
            isMissionDone 
              ? "opacity-65 bg-slate-950/20 border-white/5" 
              : (vitality < 70 
                  ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.05)] text-white" 
                  : "bg-slate-900/40 border-white/5 shadow-2xl backdrop-blur-xl text-white")
          )}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {isMissionDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-pulse" />
                ) : (
                  vitality < 70 ? <AlertTriangle className="h-5 w-5 text-amber-400" /> : <Target className="h-5 w-5 text-emerald-400 animate-pulse" />
                )}
                <CardTitle className="text-white font-black uppercase tracking-tight text-lg">Missão Diária</CardTitle>
              </div>
              <CardDescription className="text-slate-400 text-xs">
                {isMissionDone 
                  ? "Parabéns! Missão cumprida por hoje." 
                  : (vitality < 70 ? "Alerta! Seu ecossistema está fraco. Recupere vitalidade." : "Complete um desafio para ganhar Bio-Coins.")
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMissionDone && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-200">
                    {vitality < 70 
                      ? "O rio está poluído! Faça um Quiz sobre Reciclagem para limpar o ambiente." 
                      : "Aprenda sobre energia limpa para fortalecer sua base."
                    }
                  </p>
                  <Button asChild className={cn("w-full gap-2 rounded-xl border-none shadow-lg", vitality < 70 ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}>
                    {vitality < 70 ? (
                      <Link href="/student/quiz?topic=Reciclagem&autoStart=true&difficulty=medium&questions=5">
                        Fazer Quiz de Emergência
                        <BrainCircuit className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link href="/student/education">
                        Estudar e Ganhar Pontos
                        <BookOpen className="h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                </div>
              )}
              {isMissionDone && (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-2 animate-bounce">
                    <CheckCircle2 className="h-6 w-6 text-emerald-450" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-tight text-emerald-400">Missão Concluída</p>
                  <p className="text-xs text-slate-400 mt-1">Sua recompensa foi creditada.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD DE RANKING RÁPIDO */}
          <Card className="border border-white/5 rounded-[2rem] bg-slate-900/40 shadow-2xl backdrop-blur-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white font-black uppercase tracking-tight text-lg">Top 3 Alunos</CardTitle>
              <Button asChild size="sm" className="rounded-full text-slate-400 hover:text-white hover:bg-white/5" variant="ghost">
                <Link href="/student/leaderboard" className="gap-1 flex items-center">
                  Ver Ranking de XP
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-12 text-center text-slate-400 font-bold uppercase text-[9px] tracking-wider">Pos</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Nome</TableHead>
                    <TableHead className="text-right text-slate-400 font-bold uppercase text-[9px] tracking-wider">Score XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (!Array.isArray(users) || !currentUser) return null;
                    
                    // Lógica para ordenar a tabela em tempo real no dashboard
                    const calculateScore = (u: any) => {
                      const state = userStates[u.id] || {};
                      const p = state.points ?? u.points ?? 0;
                      const v = u.ra === currentUser?.ra ? vitality : (u.vitality || 0);
                      const items = u.ra === currentUser?.ra ? purchasedItems.length : (u.itemsCount || 0);
  
                      return EcosystemService.calculateTotalScore(p, v, items);
                    };
  
                    const dynamicLeaderboard = [...users]
                      .filter((u: any) => u.role === 'student')
                      .map((u: any) => ({
                        ...u,
                        totalScore: calculateScore(u)
                      }))
                      .sort((a: any, b: any) => b.totalScore - a.totalScore);
                    
                    return dynamicLeaderboard.slice(0, 3).map((user: any, index: number) => (
                      <TableRow key={user.id} className={cn(
                        "transition-colors border-white/5",
                        user.ra === currentUser?.ra 
                          ? "bg-emerald-500/10 hover:bg-emerald-500/15" 
                          : "hover:bg-white/5"
                      )}>
                        <TableCell className="font-bold text-center text-slate-200">{index + 1}º</TableCell>
                        <TableCell className="font-medium text-slate-200">{user.name}</TableCell>
                        <TableCell className="text-right font-black text-emerald-400">
                          {user.totalScore.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* CARD DE CÁLCULO DE PONTOS */}
          <Card className="border border-white/5 rounded-[2rem] bg-slate-900/40 shadow-2xl backdrop-blur-xl text-white flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2 text-emerald-400">
                <BrainCircuit className="h-5 w-5 text-emerald-400 animate-pulse" />
                <CardTitle className="text-white font-black uppercase tracking-tight text-lg">Cálculo de Pontos</CardTitle>
              </div>
              <CardDescription className="text-slate-400 text-xs">
                Entenda como é calculado o seu Score Global.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300 flex-1 flex flex-col justify-between">
              {/* Fórmula Visual */}
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-3 text-center shadow-inner">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-450">Fórmula do Score Global</p>
                <div className="text-xs font-black text-emerald-400 tracking-tight mt-1 flex flex-wrap items-center justify-center gap-1">
                  <span>Pontos XP</span>
                  <span className="text-slate-500 font-normal">+</span>
                  <span className="whitespace-nowrap font-black text-indigo-400">(Upgrades × 250)</span>
                  <span className="text-slate-500 font-normal">+</span>
                  <span className="font-black text-rose-450">Vitalidade</span>
                </div>
              </div>

              {/* Detalhes dos Fatores */}
              <div className="space-y-3 text-xs flex-1 py-1 text-slate-300">
                <div className="flex gap-2">
                  <span className="text-lg">♻️</span>
                  <div>
                    <p className="font-bold text-slate-100 leading-tight">Descarte no Totem</p>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Pontos ganhos por resíduo coletado:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="bg-slate-950 border border-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 shadow-sm">Metal: +15</span>
                      <span className="bg-slate-950 border border-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 shadow-sm">Vidro: +12</span>
                      <span className="bg-slate-950 border border-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 shadow-sm">Plástico: +10</span>
                      <span className="bg-slate-950 border border-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 shadow-sm">Papel: +8</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="text-lg">🛍️</span>
                  <div>
                    <p className="font-bold text-slate-100 leading-tight">Itens da Bioshop</p>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Cada upgrade adquirido no Bio-Shop adiciona <b className="text-emerald-450 font-bold">+250 pontos</b> permanentes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="text-lg">🌱</span>
                  <div>
                    <p className="font-bold text-slate-100 leading-tight">Saúde da Biosfera</p>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      A porcentagem de vitalidade entra como bônus direto de até <b className="text-emerald-450 font-bold">+100 pontos</b>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="w-full flex items-center justify-between text-[9px] bg-slate-950/40 px-3 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                <span className="font-bold text-slate-450 uppercase tracking-wider">Sua Conta (XP + Upgrades + Vit):</span>
                <span className="font-black text-emerald-400 text-[10px] tracking-tight">
                  {points} XP + ({purchasedItems.length} × 250) + {vitality}% = {globalScore} XP
                </span>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* CARD DE HISTÓRICO DE DESCARTES */}
        <Card className="border border-white/5 rounded-[2rem] bg-slate-900/40 shadow-2xl backdrop-blur-xl overflow-hidden mt-2 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <span className="text-xl">♻️</span>
                Histórico Recente de Descartes
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium mt-1 text-xs">
                Acompanhe suas pesagens e os Bio-Coins creditados em cada coleta válida.
              </CardDescription>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {studentDiscards.length} {studentDiscards.length === 1 ? 'Pesagem' : 'Pesagens'}
            </div>
          </CardHeader>
          <CardContent>
            {studentDiscards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
                <div className="h-16 w-16 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-center mb-4 text-3xl">
                  🍃
                </div>
                <p className="text-sm font-bold text-slate-200">Nenhum descarte registrado ainda</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
                  Seus descartes e pesagens aparecerão aqui em tempo real assim que você usar o Totem Kiosk da escola!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/20">
                <Table>
                  <TableHeader className="bg-slate-950/40">
                    <TableRow className="border-white/5">
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider">Data e Hora</TableHead>
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider">Material Descartado</TableHead>
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider text-center">Peso Coletado</TableHead>
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider text-right">Recompensa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentDiscards.slice(0, 5).map((entry: any) => {
                      const basePoints = POINTS_MAPPING[entry.type] || 0;
                      const earnedPoints = entry.points !== undefined ? entry.points : (entry.collected >= 1 ? Math.floor(entry.collected * basePoints) : basePoints);
                      const formattedDate = new Date(entry.date).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const materialColorMap: Record<string, string> = {
                        'Plástico': 'bg-red-500/10 text-red-400 border-red-500/20',
                        'Papel': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        'Vidro': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        'Metal': 'bg-amber-500/10 text-amber-450 border-amber-500/20',
                        'Orgânico': 'bg-stone-500/10 text-stone-400 border-stone-500/20',
                        'Eletrônico': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                        'Não reciclável': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                      };

                      const materialPillClass = materialColorMap[entry.type] || 'bg-slate-900 border-white/5 text-slate-350';

                      return (
                        <TableRow key={entry.id} className="hover:bg-white/5 transition-colors border-white/5">
                          <TableCell className="font-medium text-slate-300 text-xs">
                            {formattedDate}
                          </TableCell>
                          <TableCell>
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", materialPillClass)}>
                              {entry.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-200 text-xs">
                            {entry.collected.toFixed(3)} kg
                          </TableCell>
                          <TableCell className="text-right font-black text-emerald-400 text-xs">
                            +{earnedPoints} Bio-Coins
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* EXTRATO E LEDGER DE BIO-COINS */}
        <Card className="border border-white/5 rounded-[2rem] bg-slate-900/40 shadow-2xl backdrop-blur-xl mt-2 text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
                🪙 Extrato Detalhado de Bio-Coins
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium mt-1 text-xs">
                Acompanhe o histórico de créditos, resgates e a validade de suas moedas em tempo real.
              </CardDescription>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              Validade: 30 dias
            </div>
          </CardHeader>
          <CardContent>
            {pointTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-2xl bg-slate-950/20">
                <div className="h-16 w-16 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-center mb-4 text-3xl">
                  🪙
                </div>
                <p className="text-sm font-bold text-slate-200">Seu extrato está vazio</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
                  Seus créditos de moedas e movimentações aparecerão aqui assim que você realizar descartes ou missões!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/20">
                <Table>
                  <TableHeader className="bg-slate-950/40">
                    <TableRow className="border-white/5">
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider">Data</TableHead>
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider">Histórico / Origem</TableHead>
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider text-center">Validade / Estado</TableHead>
                      <TableHead className="font-bold text-slate-300 border-b border-white/5 text-[9px] uppercase tracking-wider text-right">Lançamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointTransactions.slice(0, 10).map((tx: any) => {
                      const formattedDate = new Date(tx.date).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const isDebit = tx.amount < 0;
                      
                      let statusBadge = null;
                      if (isDebit) {
                        if (tx.description.includes("Expiração")) {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-red-500/10 text-red-400 border-red-500/20">
                              Expirado
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-slate-950 text-slate-400 border-white/5">
                              Consumido / Resgate
                            </span>
                          );
                        }
                      } else if (tx.expired) {
                        statusBadge = (
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-slate-950 text-slate-555 border-white/5">
                            Amortizado
                          </span>
                        );
                      } else {
                        const txDate = new Date(tx.date);
                        const diffTime = new Date().getTime() - txDate.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        const daysLeft = Math.max(0, 30 - diffDays);

                        if (daysLeft <= 7) {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
                              Expira em {daysLeft}d
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-emerald-500/10 text-emerald-450 border-emerald-500/20">
                              Ativo ({daysLeft}d restantes)
                            </span>
                          );
                        }
                      }

                      return (
                        <TableRow key={tx.id} className="hover:bg-white/5 transition-colors border-white/5">
                          <TableCell className="font-medium text-slate-300 text-xs">
                            {formattedDate}
                          </TableCell>
                          <TableCell className="font-bold text-slate-200 text-xs">
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-center">
                            {statusBadge}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-black text-xs",
                            isDebit ? "text-red-400" : "text-emerald-400"
                          )}>
                            {isDebit ? "" : "+"}{tx.amount} Bio-Coins
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RODAPÉ INFORMATIVO */}
      <footer className="mt-8 border border-white/5 py-6 bg-slate-950/40 rounded-t-[2rem] shadow-inner text-white">
        <div className="container px-4 flex flex-col items-center text-center gap-3">
          <p className="text-xs text-slate-400 font-semibold flex items-center gap-2">
            <span className="text-xl">♻️</span>
            Dica: Ganhe Bio-Coins descartando materiais recicláveis nos totens da escola.
          </p>
          <p className="text-[9px] text-slate-400 px-4 py-1.5 bg-slate-950 border border-white/5 rounded-full uppercase tracking-widest font-black shadow-lg flex items-center justify-center">
            Powered by SchoolGain Technology
          </p>
        </div>
      </footer>

      <PhotoCaptureDialog 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handlePhotoUpload} 
      />
    </div>
  );
}
