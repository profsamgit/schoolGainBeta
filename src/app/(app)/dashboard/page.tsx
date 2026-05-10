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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { EcosystemService } from '@/lib/ecosystem.service';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useState } from 'react';
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

export default function DashboardPage() {
  /**
   * CONSUMO DO CONTEXTO:
   * Aqui pegamos as informações que o EcosystemProvider está "espalhando" para o sistema.
   * balance: saldo atual
   * vitality: saúde do ecossistema
   * currentUser: dados do aluno logado
   */
  const { balance, vitality, purchasedItems, isMissionDone, users, currentUser, currentUserRa, level, uploadUserAvatar } = useEcosystem();
  const router = useRouter();
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
  const globalScore = EcosystemService.calculateTotalScore(balance, vitality, purchasedItems.length);
  const currentLevel = level;
  
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
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="grid gap-6 flex-grow">
        
        {/* CARD DE BOAS-VINDAS E RESUMO */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="relative group/avatar">
                <Avatar className="h-16 w-16 rounded-2xl border-4 border-white shadow-xl bg-slate-900 text-white flex items-center justify-center text-xl font-black uppercase transition-transform group-hover/avatar:scale-105">
                   <AvatarImage src={currentUser?.avatar} className="object-cover" />
                   <AvatarFallback className="bg-slate-900 text-white">{currentUser?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
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
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-white shadow-lg z-20 opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl">Olá, {currentUser?.name?.split(' ')[0] || 'Agente'}!</CardTitle>
                <CardDescription className="font-medium text-slate-500">
                  Seu progresso na jornada sustentável hoje.
                </CardDescription>
              </div>
            </div>
            <StudentCard />
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Bloco de Saldo */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bio-Coins</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balance}</div>
                <p className="text-xs text-muted-foreground">Saldo disponível para upgrades</p>
              </CardContent>
            </Card>

            {/* Bloco de Nível */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
                {getLevelIcon(currentLevel)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentLevel}</div>
                <p className="text-xs text-muted-foreground">Sua patente ecológica</p>
              </CardContent>
            </Card>

            {/* Bloco de Ranking */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sua Posição</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  #
                  {(() => {
                    if (!Array.isArray(users) || !currentUser) return 0;
                    const students = users.filter((u: any) => u.role === 'student');
                    const sorted = [...students].sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
                    return sorted.findIndex((u: any) => u.ra?.toUpperCase() === currentUserRa?.toUpperCase()) + 1;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">de {users.filter(u => u.role === 'student').length} alunos</p>
              </CardContent>
            </Card>

            {/* Bloco de Vitalidade */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vitalidade</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vitality}%</div>
                <p className="text-xs text-muted-foreground">Saúde do seu ecossistema</p>
              </CardContent>
            </Card>

          </CardContent>
          
          {/* BARRA DE PROGRESSO DE NÍVEL */}
          <CardFooter>
            <div className="w-full">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Rumo ao próximo nível</span>
                <span>
                  {globalScore.toLocaleString()} / {nextLevelScore.toLocaleString()} Total Score
                </span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </CardFooter>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* CARD DE MISSÃO DIÁRIA */}
          {/* Ele muda de cor (fica laranja) se a vitalidade do aluno estiver baixa! */}
          <Card className={cn(
            "relative overflow-hidden transition-all duration-500",
            isMissionDone ? "opacity-60 bg-slate-50 dark:bg-slate-900/40" : (vitality < 70 ? "border-amber-500 bg-amber-500/5" : "border-primary/50")
          )}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {isMissionDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  vitality < 70 ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : <Target className="h-5 w-5 text-primary" />
                )}
                <CardTitle>Missão Diária</CardTitle>
              </div>
              <CardDescription>
                {isMissionDone 
                  ? "Parabéns! Missão cumprida por hoje." 
                  : (vitality < 70 ? "Alerta! Seu ecossistema está fraco. Recupere vitalidade." : "Complete um desafio para ganhar Bio-Coins.")
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMissionDone && (
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    {vitality < 70 
                      ? "O rio está poluído! Faça um Quiz sobre Reciclagem para limpar o ambiente." 
                      : "Aprenda sobre energia limpa para fortalecer sua base."
                    }
                  </p>
                  <Button asChild className={cn("w-full gap-2", vitality < 70 ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700")}>
                    {vitality < 70 ? (
                      <Link href="/quiz?topic=Reciclagem&autoStart=true">
                        Fazer Quiz de Emergência
                        <BrainCircuit className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link href="/education">
                        Estudar e Ganhar Pontos
                        <BookOpen className="h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                </div>
              )}
              {isMissionDone && (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-emerald-600">Missão Concluída</p>
                  <p className="text-xs text-muted-foreground mt-1">Sua recompensa foi creditada.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD DE RANKING RÁPIDO */}
          <Card>
            <CardHeader className="flex flex-row items-center">
              <CardTitle>Top 3 Alunos</CardTitle>
              <Button asChild size="sm" className="ml-auto" variant="ghost">
                <Link href="/leaderboard" className="gap-1">
                  Ver Ranking Completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">Pos</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Score Total</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {(() => {
                  if (!Array.isArray(users) || !currentUser) return null;
                  
                  // Lógica para ordenar a tabela em tempo real no dashboard
                  const calculateScore = (u: any) => {
                    const p = u.points || 0;
                    const v = u.ra === currentUserRa ? vitality : (u.vitality || 0);
                    const items = u.ra === currentUserRa ? purchasedItems.length : (u.itemsCount || 0);
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
                    <TableRow key={user.id} className={user.ra === currentUserRa ? "bg-primary/5" : ""}>
                      <TableCell className='font-bold text-center'>{index + 1}º</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {user.totalScore.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RODAPÉ INFORMATIVO */}
      <footer className="mt-8 border-t py-6 bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
        <div className="container px-4 flex flex-col items-center text-center gap-2">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-xl">♻️</span>
            Dica: Ganhe Bio-Coins descartando materiais recicláveis nos totens da escola.
          </p>
          <p className="text-[10px] text-muted-foreground px-4 py-1 bg-muted rounded-full uppercase tracking-widest font-bold">
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
