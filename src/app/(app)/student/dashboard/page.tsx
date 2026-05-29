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
  const [depreciationEvent, setDepreciationEvent] = useState<any>(null);
  const [showDepreciationModal, setShowDepreciationModal] = useState(false);

  useEffect(() => {
    if (studentState && Array.isArray(studentState.depreciationLog) && studentState.depreciationLog.length > 0) {
      const now = new Date().getTime();
      const recentEvent = studentState.depreciationLog.find((event: any) => {
        const eventTime = new Date(event.date).getTime();
        return (now - eventTime) < (24 * 60 * 60 * 1000);
      });
      if (recentEvent) {
        const sessionKey = `depreciation_acknowledged_${recentEvent.date}`;
        if (!sessionStorage.getItem(sessionKey)) {
          setDepreciationEvent(recentEvent);
          setShowDepreciationModal(true);
        }
      }
    }
  }, [studentState]);

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
  const isMaxLevel = currentLevel === 'Guardião da Lenda';

  const nextLevelScore =
    currentLevel === 'Semente' ? 2000 :
    currentLevel === 'Broto' ? 5000 :
    currentLevel === 'Folha' ? 10000 :
    currentLevel === 'Árvore' ? 15000 :
    currentLevel === 'Floresta' ? 20000 : 25000;
  
  // Percentual para a barra de progresso
  const progressToNextLevel = Math.min(100, (globalScore / nextLevelScore) * 100);

  // Missão Diária Dinâmica baseada no dia do mês e no estado do ecossistema
  const currentMission = useMemo(() => {
    // Se a vitalidade estiver baixa, a missão é sempre recuperar a vitalidade (emergência do ecossistema)
    if (vitality < 70) {
      return {
        type: 'ecosystem_emergency',
        title: 'Emergência Ecológica',
        description: 'Seu ecossistema está fraco! Faça um Quiz sobre Reciclagem para restabelecer a saúde.',
        link: '/student/quiz?topic=Reciclagem&autoStart=true&difficulty=medium&questions=5',
        buttonText: 'Fazer Quiz de Emergência',
        icon: AlertTriangle,
        buttonClass: 'bg-amber-605 hover:bg-amber-700'
      };
    }

    const day = new Date().getDate();
    // Seleção determinística baseada no dia do mês para variar entre Educação, Quizzes e Ecossistema
    const option = day % 3;

    if (option === 0) {
      return {
        type: 'education',
        title: 'Estudo Diário',
        description: 'Amplie seus conhecimentos ecológicos! Leia um artigo sobre sustentabilidade na aba de educação.',
        link: '/student/education',
        buttonText: 'Ler Artigo Educativo',
        icon: BookOpen,
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700'
      };
    } else if (option === 1) {
      return {
        type: 'quiz',
        title: 'Desafio Mental',
        description: 'Teste seus conhecimentos! Complete um Quiz temático para testar suas habilidades ambientais.',
        link: '/student/quiz',
        buttonText: 'Iniciar um Quiz',
        icon: BrainCircuit,
        buttonClass: 'bg-indigo-600 hover:bg-indigo-700'
      };
    } else {
      return {
        type: 'ecosystem',
        title: 'Expansão Vital',
        description: 'Fortaleça a sua biosfera! Adquira um novo bioma ou animal na Bioshop para somar multiplicadores.',
        link: '/student/rewards',
        buttonText: 'Ir para a Bioshop',
        icon: Leaf,
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700'
      };
    }
  }, [vitality]);

  const MissionIcon = currentMission.icon;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-8 max-w-7xl mx-auto relative z-10 text-slate-800 dark:text-white">
      <div className="grid gap-4 sm:gap-6 flex-grow">
        
        {pointsExpiringSoon > 0 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-500/5 text-amber-800 dark:text-amber-400 rounded-[2rem] mb-4">
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
          <Alert className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 shadow-lg shadow-red-500/5 text-red-800 dark:text-red-400 rounded-[2rem] mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <AlertTitle className="text-lg font-black uppercase tracking-tight text-red-700 dark:text-red-450">Ecossistema Inativo</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-3 text-red-655 dark:text-red-300">
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
        <Card className="overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 shadow-2xl backdrop-blur-xl">
           <LevelJourney currentLevel={currentLevel} totalScore={globalScore} />
        </Card>
        
        {/* CARD DE BOAS-VINDAS E RESUMO */}
        <Card className="border border-slate-200/60 dark:border-white/5 rounded-[2rem] bg-white/80 dark:bg-slate-900/40 shadow-2xl backdrop-blur-xl text-slate-800 dark:text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="relative group/avatar">
                <Avatar className="h-16 w-16 rounded-2xl border-4 border-slate-200/60 dark:border-white/10 shadow-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center text-xl font-black uppercase transition-transform group-hover/avatar:scale-105">
                  <AvatarImage src={currentUser?.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="bg-slate-105 dark:bg-slate-900 text-slate-800 dark:text-white">{currentUser?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                {!isPreviewMode && (
                  <>
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
                  </>
                )}
              </div>
              <div className="space-y-1">
                <CardTitle className={cn(
                  "text-2xl transition-all font-black uppercase tracking-tight text-slate-800 dark:text-white",
                  isLegend ? "text-amber-500 dark:text-amber-400 flex items-center gap-2" : ""
                )}>
                  Olá, {currentUser?.name?.split(' ')[0] || 'Agente'}!
                  {isLegend && <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400 animate-pulse" />}
                </CardTitle>
                <CardDescription className="font-semibold text-slate-500 dark:text-slate-400">
                  Seu progresso na jornada sustentável hoje.
                </CardDescription>
              </div>
            </div>
            <StudentCard />
          </CardHeader>
          <CardContent className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Bloco de Saldo */}
            <Card className="bg-emerald-500/5 dark:bg-emerald-555/10 border border-emerald-500/20 rounded-[1.5rem] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-emerald-650 dark:text-emerald-400">Bio-Coins</CardTitle>
                <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-850 dark:text-white">{balance.toLocaleString()}</div>
                <p className="text-xs text-slate-505 dark:text-slate-400 font-medium">Saldo disponível para upgrades</p>
              </CardContent>
            </Card>

            {/* Bloco de Ranking */}
            <Card className="bg-indigo-500/5 dark:bg-indigo-555/10 border border-indigo-500/20 rounded-[1.5rem] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-indigo-650 dark:text-indigo-400">Sua Posição</CardTitle>
                <Trophy className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-850 dark:text-white">
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
                <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">de {users.filter(u => u.role === 'student').length} alunos</p>
              </CardContent>
            </Card>

            {/* Bloco de Vitalidade */}
            <Card className="bg-rose-500/5 dark:bg-rose-555/10 border border-rose-500/20 rounded-[1.5rem] shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-rose-655 dark:text-rose-400">Vitalidade</CardTitle>
                <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-850 dark:text-white">{vitality}%</div>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">Saúde do seu ecossistema</p>
              </CardContent>
            </Card>

          </CardContent>
          
          {/* BARRA DE PROGRESSO DE NÍVEL */}
          <CardFooter>
            <div className="w-full">
              <div className="flex justify-between text-xs text-slate-550 dark:text-slate-400 mb-1">
                <span>{isMaxLevel ? "Nível Máximo Atingido" : "Rumo ao próximo nível"}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  {isMaxLevel 
                    ? `${globalScore.toLocaleString()} Score XP`
                    : `${globalScore.toLocaleString()} / ${nextLevelScore.toLocaleString()} Score XP`
                  }
                </span>
              </div>
              <Progress value={progressToNextLevel} className="h-2 bg-slate-200 dark:bg-slate-950/60 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400" />
            </div>
          </CardFooter>
        </Card>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* CARD DE MISSÃO DIÁRIA */}
          <Card className={cn(
            "relative overflow-hidden transition-all duration-500 rounded-[2rem] border flex flex-col justify-between h-full",
            isMissionDone 
              ? "opacity-65 bg-slate-105/50 dark:bg-slate-950/20 border-slate-200/60 dark:border-white/5" 
              : (vitality < 70 
                  ? "border-amber-350 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/5 dark:from-amber-500/10 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.05)] text-slate-850 dark:text-white" 
                  : "bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-white/5 shadow-2xl backdrop-blur-xl text-slate-800 dark:text-white")
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {isMissionDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                ) : (
                  <Target className="h-5 w-5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                )}
                <CardTitle className="text-slate-805 dark:text-white font-black uppercase tracking-tight text-lg">Missões Diárias</CardTitle>
              </div>
              <CardDescription className="text-slate-550 dark:text-slate-400 text-xs">
                {isMissionDone 
                  ? "Parabéns! Missões diárias cumpridas por hoje." 
                  : "Complete os desafios para impulsionar seu progresso."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between gap-4 pb-6">
              {/* Alerta de Vitalidade Baixa */}
              {vitality < 70 && (
                <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold leading-relaxed uppercase tracking-wide">
                  ⚠️ <strong>Emergência Ecológica:</strong> Seu ecossistema está fraco! Priorize realizar o Quiz de Reciclagem para recuperar a saúde dele.
                </div>
              )}

              <div className="flex-grow flex flex-col justify-between gap-4">
                {/* 1. Missão de Educação */}
                <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all duration-300 min-h-[105px]">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">Estudo Diário</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Amplie seus conhecimentos lendo artigos educativos sobre reciclagem e energia limpa.</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full h-8 mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none text-[9px] font-black uppercase tracking-widest px-3 transition-transform active:scale-95 shadow-md">
                    <Link href="/student/education">Ler Artigo</Link>
                  </Button>
                </div>

                {/* 2. Missão de Quiz */}
                <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all duration-300 min-h-[105px]">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-250 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">Desafio Mental</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Conclua um quiz ecológico na plataforma para acumular pontos de XP.</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full h-8 mt-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-none text-[9px] font-black uppercase tracking-widest px-3 transition-transform active:scale-95 shadow-md">
                    <Link href="/student/quiz">Responder Quiz</Link>
                  </Button>
                </div>

                {/* 3. Missão de Ecossistema */}
                <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all duration-300 min-h-[105px]">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">Expansão Vital</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Visite a Bioshop e adquira novos biomas ou animais para a sua biosfera virtual.</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full h-8 mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none text-[9px] font-black uppercase tracking-widest px-3 transition-transform active:scale-95 shadow-md">
                    <Link href="/student/rewards">Visitar Bioshop</Link>
                  </Button>
                </div>
              </div>

              {isMissionDone && (
                <div className="mt-4 pt-3 border-t border-slate-250 dark:border-white/5 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-1.5 animate-pulse">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-450" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400">Atividades Concluídas</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Você completou suas tarefas diárias!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD DE RANKING RÁPIDO */}
          <Card className="border border-slate-200/60 dark:border-white/5 rounded-[2rem] bg-white/80 dark:bg-slate-900/40 shadow-2xl backdrop-blur-xl text-slate-800 dark:text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-800 dark:text-white font-black uppercase tracking-tight text-lg">Top 11 Alunos</CardTitle>
              <Button asChild size="sm" className="rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-105 dark:hover:bg-white/5" variant="ghost">
                <Link href="/student/leaderboard" className="gap-1 flex items-center">
                  Ver Ranking de XP
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200/60 dark:border-white/5">
                    <TableHead className="w-12 text-center text-slate-505 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider">Pos</TableHead>
                    <TableHead className="text-slate-505 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider">Nome</TableHead>
                    <TableHead className="text-right text-slate-505 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider">Score XP</TableHead>
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
                    
                    return dynamicLeaderboard.slice(0, 11).map((user: any, index: number) => (
                      <TableRow key={user.id} className={cn(
                        "transition-colors border-slate-200/60 dark:border-white/5",
                        user.ra === currentUser?.ra 
                          ? "bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15" 
                          : "hover:bg-slate-105/50 dark:hover:bg-white/5"
                      )}>
                        <TableCell className="font-bold text-center text-slate-705 dark:text-slate-200">{index + 1}º</TableCell>
                        <TableCell className="font-medium text-slate-705 dark:text-slate-200">{user.name}</TableCell>
                        <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400">
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
          <Card className="border border-slate-200/60 dark:border-white/5 rounded-[2rem] bg-white/80 dark:bg-slate-900/40 shadow-2xl backdrop-blur-xl text-slate-800 dark:text-white flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <BrainCircuit className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <CardTitle className="text-slate-800 dark:text-white font-black uppercase tracking-tight text-lg">Cálculo de Pontos</CardTitle>
              </div>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Entenda como é calculado o seu Score Global.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-650 dark:text-slate-300 flex-1 flex flex-col justify-between">
              {/* Fórmula Visual */}
              <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 text-center shadow-2xl backdrop-blur-md group/formula select-none">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-indigo-500/5 to-rose-500/5 opacity-50 group-hover/formula:opacity-80 transition-opacity" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-505 dark:text-slate-400 mb-2 relative z-10 flex items-center justify-center gap-1.5">
                  <BrainCircuit className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-405 animate-pulse" />
                  Fórmula do Score Global
                </p>
                <div className="text-xs font-black tracking-tight mt-1 flex flex-col sm:flex-row items-center justify-center gap-2 relative z-10">
                  <span className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-xl text-indigo-650 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                    Pontos XP
                  </span>
                  <span className="text-slate-500 font-bold text-sm sm:inline">+</span>
                  <span className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-xl text-emerald-650 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                    (Upgrades × 250)
                  </span>
                  <span className="text-slate-500 font-bold text-sm sm:inline">+</span>
                  <span className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2.5 py-1 rounded-xl text-rose-655 dark:text-rose-455 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                    Vitalidade
                  </span>
                </div>
              </div>

              {/* Detalhes dos Fatores */}
              <div className="space-y-3.5 text-xs flex-1 py-1 text-slate-655 dark:text-slate-300">
                {/* Fator 1: Descarte */}
                <div className="relative overflow-hidden bg-slate-55 dark:bg-slate-950/20 hover:bg-slate-105 dark:hover:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 rounded-2xl p-3 flex gap-3.5 transition-all duration-300 hover:border-emerald-500/20 group/factor1">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-650 dark:text-emerald-400 group-hover/factor1:scale-105 transition-transform shrink-0">
                    <Target className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-[11px] uppercase tracking-wider select-none">Descarte no Totem</p>
                      <span className="bg-emerald-555/10 dark:bg-emerald-500/15 border border-emerald-250 dark:border-emerald-500/30 text-emerald-650 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm select-none">Ativo</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1 text-[11px]">
                      Ganhe pontos por cada resíduo descartado no totem coletor:
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <span className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                        <span className="flex items-center gap-1"><span className="text-[11px] select-none">⚙️</span> Metal</span>
                        <span className="text-emerald-605 dark:text-emerald-400 font-black">+{POINTS_MAPPING['Metal']}</span>
                      </span>
                      <span className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                        <span className="flex items-center gap-1"><span className="text-[11px] select-none">💎</span> Vidro</span>
                        <span className="text-emerald-605 dark:text-emerald-400 font-black">+{POINTS_MAPPING['Vidro']}</span>
                      </span>
                      <span className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                        <span className="flex items-center gap-1"><span className="text-[11px] select-none">🥤</span> Plástico</span>
                        <span className="text-emerald-605 dark:text-emerald-400 font-black">+{POINTS_MAPPING['Plástico']}</span>
                      </span>
                      <span className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                        <span className="flex items-center gap-1"><span className="text-[11px] select-none">📦</span> Papel</span>
                        <span className="text-emerald-605 dark:text-emerald-400 font-black">+{POINTS_MAPPING['Papel']}</span>
                      </span>
                      <span className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                        <span className="flex items-center gap-1"><span className="text-[11px] select-none">🍌</span> Orgânico</span>
                        <span className="text-emerald-605 dark:text-emerald-400 font-black">+{POINTS_MAPPING['Orgânico']}</span>
                      </span>
                      <span className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                        <span className="flex items-center gap-1"><span className="text-[11px] select-none">💻</span> Eletrônico</span>
                        <span className="text-emerald-605 dark:text-emerald-400 font-black">+{POINTS_MAPPING['Eletrônico']}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fator 2: Bioshop */}
                <div className="relative overflow-hidden bg-slate-55 dark:bg-slate-950/20 hover:bg-slate-105 dark:hover:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 rounded-2xl p-3 flex gap-3.5 transition-all duration-300 hover:border-indigo-500/20 group/factor2">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-650 dark:text-indigo-400 group-hover/factor2:scale-105 transition-transform shrink-0">
                    <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-455" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-[11px] uppercase tracking-wider select-none">Itens da Bioshop</p>
                      <span className="bg-indigo-555/10 dark:bg-indigo-500/15 border border-indigo-250 dark:border-indigo-500/30 text-indigo-650 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm select-none">+250 XP / item</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-300 font-medium leading-relaxed mt-1 text-[11px]">
                      Cada bioma ou animal adquirido no seu ecossistema virtual adiciona um multiplicador de score fixo permanente.
                    </p>
                  </div>
                </div>

                {/* Fator 3: Vitalidade */}
                <div className="relative overflow-hidden bg-slate-55 dark:bg-slate-950/20 hover:bg-slate-105 dark:hover:bg-slate-950/40 border border-white/5 rounded-2xl p-3 flex gap-3.5 transition-all duration-300 hover:border-rose-500/20 group/factor3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-650 dark:text-rose-455 group-hover/factor3:scale-105 transition-transform shrink-0">
                    <Leaf className="h-5 w-5 text-rose-650 dark:text-rose-400" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-[11px] uppercase tracking-wider select-none">Saúde da Biosfera</p>
                      <span className="bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm select-none">Bônus Vital</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-300 font-medium leading-relaxed mt-1 text-[11px]">
                      A porcentagem da saúde do ecossistema é convertida em um bônus linear que adiciona até <b className="text-rose-500 dark:text-rose-400 font-bold">+100 pontos</b> diretamente.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex flex-col gap-3">
              <div className="w-full flex flex-col gap-3 bg-slate-100 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-2xl backdrop-blur-md">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 select-none">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400 animate-pulse" />
                  Sua Pontuação Detalhada
                </span>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-1">
                  {/* Pontos Base */}
                  <div className="flex-1 min-w-[70px] bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all group/base">
                    <span className="text-[8px] font-black text-indigo-605 dark:text-indigo-400 uppercase tracking-wider group-hover/base:scale-105 transition-transform select-none">Base XP</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{points}</span>
                  </div>

                  {/* Operador + */}
                  <div className="text-slate-400 dark:text-slate-505 font-bold text-xs px-0.5 select-none">
                    +
                  </div>

                  {/* Upgrades */}
                  <div className="flex-1 min-w-[80px] bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group/upg">
                    <span className="text-[8px] font-black text-emerald-605 dark:text-emerald-400 uppercase tracking-wider group-hover/upg:scale-105 transition-transform select-none">Upgrades</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">+{purchasedItems.length * 250}</span>
                    <span className="text-[7px] text-slate-500 dark:text-slate-405 font-medium select-none">({purchasedItems.length} × 250)</span>
                  </div>

                  {/* Operador + */}
                  <div className="text-slate-400 dark:text-slate-550 font-bold text-xs px-0.5 select-none">
                    +
                  </div>

                  {/* Vitalidade */}
                  <div className="flex-1 min-w-[70px] bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center hover:bg-rose-500/5 hover:border-rose-500/20 transition-all group/vit">
                    <span className="text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider group-hover/vit:scale-105 transition-transform select-none">Vitalidade</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">+{vitality}</span>
                    <span className="text-[7px] text-rose-650/70 dark:text-rose-455/70 font-medium select-none">{vitality}% de bônus</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-1 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-wider select-none">Score Global</span>
                    <span className="text-[8px] text-slate-405 dark:text-slate-500 font-medium select-none">Seu nível de experiência consolidado</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/5 to-yellow-500/10 dark:from-amber-500/10 dark:to-yellow-500/15 border border-amber-300 dark:border-amber-500/20 px-3.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300 group/total">
                    <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-455 animate-pulse group-hover/total:scale-110 transition-transform" />
                    <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-650 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      {globalScore} XP
                    </span>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* CARD DE HISTÓRICO DE DESCARTES */}
        <Card className="border border-slate-200/60 dark:border-white/5 rounded-[2rem] bg-white/80 dark:bg-slate-900/40 shadow-2xl backdrop-blur-xl overflow-hidden mt-2 text-slate-800 dark:text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <span className="text-xl">♻️</span>
                Histórico Recente de Descartes
              </CardTitle>
              <CardDescription className="text-slate-550 dark:text-slate-400 font-medium mt-1 text-xs">
                Acompanhe suas pesagens e os Bio-Coins creditados em cada coleta válida.
              </CardDescription>
            </div>
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 text-emerald-650 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {studentDiscards.length} {studentDiscards.length === 1 ? 'Pesagem' : 'Pesagens'}
            </div>
          </CardHeader>
          <CardContent>
            {studentDiscards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-950/20">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex items-center justify-center mb-4 text-3xl">
                  🍃
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhum descarte registrado ainda</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
                  Seus descartes e pesagens aparecerão aqui em tempo real assim que você usar o Totem Kiosk da escola!
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
                  <Table>
                    <TableHeader className="bg-slate-100 dark:bg-slate-950/40">
                      <TableRow className="border-slate-200/60 dark:border-white/5">
                        <TableHead className="font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider">Data e Hora</TableHead>
                        <TableHead className="font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider">Material Descartado</TableHead>
                        <TableHead className="font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider text-center">Peso Coletado</TableHead>
                        <TableHead className="font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider text-right">Recompensa</TableHead>
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
                          'Plástico': 'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20',
                          'Papel': 'bg-blue-500/10 text-blue-650 dark:text-blue-400 border-blue-500/20',
                          'Vidro': 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20',
                          'Metal': 'bg-amber-500/10 text-amber-650 dark:text-amber-450 border-amber-500/20',
                          'Orgânico': 'bg-stone-500/10 text-stone-650 dark:text-stone-400 border-stone-500/20',
                          'Eletrônico': 'bg-purple-500/10 text-purple-655 dark:text-purple-400 border-purple-500/20',
                          'Não reciclável': 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20',
                        };

                        const materialPillClass = materialColorMap[entry.type] || 'bg-slate-100 dark:bg-slate-900 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-350';

                        return (
                          <TableRow key={entry.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors border-slate-200/60 dark:border-white/5">
                            <TableCell className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                              {formattedDate}
                            </TableCell>
                            <TableCell>
                              <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", materialPillClass)}>
                                {entry.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                              {entry.collected.toFixed(3)} kg
                            </TableCell>
                            <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400 text-xs">
                              +{earnedPoints} Bio-Coins
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
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
                      'Plástico': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                      'Papel': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                      'Vidro': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                      'Metal': 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20',
                      'Orgânico': 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20',
                      'Eletrônico': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                      'Não reciclável': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                    };

                    const materialPillClass = materialColorMap[entry.type] || 'bg-slate-100 dark:bg-slate-900 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-350';

                    return (
                      <div key={entry.id} className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-slate-950/40 shadow-md flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{formattedDate}</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border", materialPillClass)}>
                            {entry.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Peso: <strong className="text-slate-800 dark:text-slate-202">{entry.collected.toFixed(3)} kg</strong></span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">+{earnedPoints} Bio-Coins</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* EXTRATO E LEDGER DE BIO-COINS */}
        <Card className="border border-slate-200/60 dark:border-white/5 rounded-[2rem] bg-white/80 dark:bg-slate-900/40 shadow-2xl backdrop-blur-xl mt-2 text-slate-800 dark:text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                🪙 Extrato Detalhado de Bio-Coins
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-xs">
                Acompanhe o histórico de créditos, resgates e a validade de suas moedas em tempo real.
              </CardDescription>
            </div>
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              Validade: 30 dias
            </div>
          </CardHeader>
          <CardContent>
            {pointTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-950/20">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex items-center justify-center mb-4 text-3xl">
                  🪙
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Seu extrato está vazio</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
                  Seus créditos de moedas e movimentações aparecerão aqui assim que você realizar descartes ou missões!
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
                  <Table>
                    <TableHeader className="bg-slate-100 dark:bg-slate-950/40">
                      <TableRow className="border-slate-200/60 dark:border-white/5">
                        <TableHead className="font-bold text-slate-600 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider">Data</TableHead>
                        <TableHead className="font-bold text-slate-600 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider">Histórico / Origem</TableHead>
                        <TableHead className="font-bold text-slate-600 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider text-center">Validade / Estado</TableHead>
                        <TableHead className="font-bold text-slate-600 border-b border-slate-200/60 dark:border-white/5 text-[9px] uppercase tracking-wider text-right">Lançamento</TableHead>
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
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                                Expirado
                              </span>
                            );
                          } else {
                            statusBadge = (
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/5">
                                Consumido / Resgate
                              </span>
                            );
                          }
                        } else if (tx.expired) {
                          statusBadge = (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-white/5">
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
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 animate-pulse">
                                Expira em {daysLeft}d
                              </span>
                            );
                          } else {
                            statusBadge = (
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold border bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 dark:border-emerald-500/20">
                                Ativo ({daysLeft}d restantes)
                              </span>
                            );
                          }
                        }

                        return (
                          <TableRow key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors border-slate-200/60 dark:border-white/5">
                            <TableCell className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                              {formattedDate}
                            </TableCell>
                            <TableCell className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {tx.description}
                            </TableCell>
                            <TableCell className="text-center">
                              {statusBadge}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-black text-xs",
                              isDebit ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                            )}>
                              {isDebit ? "" : "+"}{tx.amount} Bio-Coins
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
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
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20">
                            Expirado
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/5">
                            Resgate
                          </span>
                        );
                      }
                    } else if (tx.expired) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-white/5">
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
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 animate-pulse">
                            Expira em {daysLeft}d
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 dark:border-emerald-500/20">
                            Ativo ({daysLeft}d)
                          </span>
                        );
                      }
                    }

                    return (
                      <div key={tx.id} className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-slate-950/40 shadow-md flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{formattedDate}</span>
                          {statusBadge}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-white/5">
                          <span className="text-slate-800 dark:text-slate-202 font-bold">{tx.description}</span>
                          <span className={cn(
                            "font-black text-xs",
                            isDebit ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {isDebit ? "" : "+"}{tx.amount} Bio-Coins
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* RODAPÉ INFORMATIVO */}
        <footer className="mt-8 border border-slate-200/60 dark:border-white/5 py-6 bg-white/60 dark:bg-slate-950/40 rounded-t-[2rem] shadow-inner text-slate-800 dark:text-white">
          <div className="container px-4 flex flex-col items-center text-center gap-3">
            <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold flex items-center gap-2">
              <span className="text-xl">♻️</span>
              Dica: Ganhe Bio-Coins descartando materiais recicláveis nos totens da escola.
            </p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 px-4 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-full uppercase tracking-widest font-black shadow-lg flex items-center justify-center">
              Powered by SchoolGain Technology
            </p>
          </div>
        </footer>

        <PhotoCaptureDialog 
          isOpen={isCameraOpen} 
          onClose={() => setIsCameraOpen(false)} 
          onCapture={handlePhotoUpload} 
        />

        {showDepreciationModal && depreciationEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => {
                    const sessionKey = `depreciation_acknowledged_${depreciationEvent.date}`;
                    sessionStorage.setItem(sessionKey, 'true');
                    setShowDepreciationModal(false);
                  }} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-red-100 dark:bg-red-950/50 rounded-full animate-bounce">
                  <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-500" />
                </div>
                
                <h2 className="text-2xl font-black uppercase tracking-tight text-red-750 dark:text-red-500">
                  Alerta de Depreciação!
                </h2>
                
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  Seu ecossistema ficou inativo por <span className="text-red-600 font-bold">{depreciationEvent.inactiveDays} dias</span> e sofreu as consequências da fase <span className="uppercase font-extrabold text-red-600 dark:text-red-500">
                    {depreciationEvent.phase === 'alert' ? 'Alerta' : 
                     depreciationEvent.phase === 'decline' ? 'Declínio' : 
                     depreciationEvent.phase === 'collapse' ? 'Colapso' : 
                     depreciationEvent.phase === 'extinction' ? 'Extinção' : depreciationEvent.phase}
                  </span>.
                </p>
              </div>

              <div className="border-t border-b border-slate-100 dark:border-slate-800 py-4 space-y-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Impacto no Ecossistema</h3>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-semibold text-slate-550">Pontos Perdidos</span>
                    <span className="text-base font-black text-red-600">-{depreciationEvent.pointsLost}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-semibold text-slate-555">Coins Perdidos</span>
                    <span className="text-base font-black text-red-600">-{depreciationEvent.coinsLost}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-semibold text-slate-555">Vitalidade</span>
                    <span className="text-base font-black text-red-600">-{depreciationEvent.vitalityLost}%</span>
                  </div>
                </div>

                {depreciationEvent.itemsRemoved && depreciationEvent.itemsRemoved.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
                    <span className="block text-xs font-bold text-red-750 dark:text-red-400 uppercase tracking-wider mb-2">Itens Removidos:</span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {depreciationEvent.itemsRemoved.map((item: string) => (
                        <span key={item} className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-750 dark:text-red-300 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                          {item.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 text-center pt-2">
                <span className="text-xs text-slate-500">🌱 O ecossistema precisa de você! Retorne às atividades para recuperá-lo.</span>
                <Button 
                  onClick={() => {
                    const sessionKey = `depreciation_acknowledged_${depreciationEvent.date}`;
                    sessionStorage.setItem(sessionKey, 'true');
                    setShowDepreciationModal(false);
                  }} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl"
                >
                  Entendi, vou recuperar!
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
