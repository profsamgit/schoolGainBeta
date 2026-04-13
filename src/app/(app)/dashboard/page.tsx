'use client';

import { STUDENT_MOCK, LEADERBOARD_MOCK, ADMIN_MOCK } from '@/lib/data';
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

const levelProgress: { [key: string]: number } = {
  Bronze: 25,
  Prata: 50,
  Ouro: 75,
  Diamante: 100,
};

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
    default:
      return <Medal className="text-orange-400" />;
  }
};

export default function DashboardPage() {
  const { balance, vitality, purchasedItems, isMissionDone, users, currentUser, currentUserRa } = useEcosystem();

  // Cálculo dinâmico de nível baseado em pontos (Exemplo de lógica)
  // Cálculo dinâmico de nível baseado no Score Sustentável
  const getDynamicLevel = (score: number) => {
    if (score >= 17000) return 'Guardião da Biosfera';
    if (score >= 14000) return 'Floresta';
    if (score >= 11000) return 'Árvore';
    if (score >= 8000) return 'Folha';
    if (score >= 5000) return 'Broto';
    return 'Semente';
  };

  const globalScore = EcosystemService.calculateTotalScore(balance, vitality, purchasedItems.length);
  const currentLevel = getDynamicLevel(globalScore);
  
  const nextLevelScore =
    currentLevel === 'Semente' ? 5000 :
    currentLevel === 'Broto' ? 8000 :
    currentLevel === 'Folha' ? 11000 :
    currentLevel === 'Árvore' ? 14000 :
    currentLevel === 'Floresta' ? 17000 : 20000;
  
  const progressToNextLevel = Math.min(100, (globalScore / nextLevelScore) * 100);

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="grid gap-6 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle>Olá, {currentUser?.name || 'Agente'}!</CardTitle>
            <CardDescription>
              Bem-vindo ao seu painel pessoal de sustentabilidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pontos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balance}</div>
                <p className="text-xs text-muted-foreground">+20 na última semana</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nível</CardTitle>
                {getLevelIcon(currentLevel)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentLevel}</div>
                <p className="text-xs text-muted-foreground">
                  Progresso para o próximo nível
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ranking</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  #
                  {(() => {
                    if (!Array.isArray(users) || !currentUser) return 0;
                    const sorted = [...users].map((u: any) => 
                      u.ra === currentUserRa ? { ...u, points: balance } : u
                    ).sort((a: any, b: any) => b.points - a.points);
                    return sorted.findIndex((u: any) => u.ra === currentUserRa) + 1;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {users.length} alunos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vitalidade</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vitality}%</div>
                <p className="text-xs text-muted-foreground">Status da sua Árvore</p>
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Progresso para {
                    currentLevel === 'Semente' ? 'Broto' : 
                    currentLevel === 'Broto' ? 'Folha' : 
                    currentLevel === 'Folha' ? 'Árvore' : 
                    currentLevel === 'Árvore' ? 'Floresta' : 
                    currentLevel === 'Floresta' ? 'Guardião' : 'Mestre'
                }</span>
                <span>
                  {globalScore.toLocaleString()} / {nextLevelScore.toLocaleString()} Score
                </span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </CardFooter>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Nova Missão de Vitalidade */}
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
                <CardTitle>Missão de Vitalidade</CardTitle>
              </div>
              <CardDescription>
                {isMissionDone 
                  ? "Você já completou sua missão diária. Bom trabalho!" 
                  : (vitality < 70 ? "Sua folha está secando! Recupere sua vitalidade agora." : "Complete sua atividade diária para ganhar pontos.")
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMissionDone && (
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    {vitality < 70 
                      ? "O ecossistema precisa de você. Faça um Quiz de Recuperação sobre Reciclagem." 
                      : "Aprenda algo novo no módulo de educação hoje."
                    }
                  </p>
                  <Button asChild className={cn("w-full gap-2", vitality < 70 ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700")}>
                    {vitality < 70 ? (
                      <Link href="/quiz?topic=Reciclagem&autoStart=true">
                        Fazer Quiz de Recuperação
                        <BrainCircuit className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link href="/education">
                        Ir para Educação
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
                  <p className="text-xs text-muted-foreground mt-1">Volte amanhã para novos desafios!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center">
              <CardTitle>Ranking da Turma</CardTitle>
              <Button asChild size="sm" className="ml-auto" variant="ghost">
                <Link href="/leaderboard" className="gap-1">
                  Ver Tudo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">Pos</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead className="text-right">Score Global</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {(() => {
                  if (!Array.isArray(users) || !currentUser) return null;
                  
                  const calculateScore = (u: any) => {
                    const p = u.ra === currentUserRa ? balance : (u.points || 0);
                    const v = u.ra === currentUserRa ? vitality : (u.vitality || 0);
                    const items = u.ra === currentUserRa ? purchasedItems.length : (u.itemsCount || 0);
                    return EcosystemService.calculateTotalScore(p, v, items);
                  };

                  const dynamicLeaderboard = [...users]
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
            <CardFooter className="pt-2">
              <Link href="/rewards" className="w-full">
                <Button variant="outline" className="w-full text-xs h-8">
                  Ver Minhas Recompensas
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Banner de Rodapé Fixo */}
      <footer className="mt-8 border-t py-6 bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
        <div className="container px-4 flex flex-col items-center text-center gap-2">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-xl">♻️</span>
            O descarte físico de materiais é feito exclusivamente via 
            <span className="font-bold text-foreground"> Visão Computacional</span> 
            nos Terminais Kiosk da escola.
          </p>
          <p className="text-[10px] text-muted-foreground px-4 py-1 bg-muted rounded-full uppercase tracking-widest font-bold">
            Eficiência e Sustentabilidade SchoolGain
          </p>
        </div>
      </footer>
    </div>
  );
}
