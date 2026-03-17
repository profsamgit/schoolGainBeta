import { mockUser, leaderboardData } from '@/lib/data';
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

const levelProgress: { [key: string]: number } = {
  Bronze: 25,
  Prata: 50,
  Ouro: 75,
  Diamante: 100,
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'Prata':
      return <Medal className="text-slate-400" />;
    case 'Ouro':
      return <Medal className="text-amber-400" />;
    case 'Diamante':
      return <Medal className="text-cyan-300" />;
    default:
      return <Medal className="text-orange-400" />;
  }
};

export default function DashboardPage() {
  const nextLevelPoints =
    mockUser.level === 'Prata'
      ? 2000
      : mockUser.level === 'Ouro'
      ? 5000
      : 1000;
  const progressToNextLevel = (mockUser.points / nextLevelPoints) * 100;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Olá, {mockUser.name}!</CardTitle>
          <CardDescription>
            Bem-vindo ao seu painel, Agente da Sustentabilidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUser.points}</div>
              <p className="text-xs text-muted-foreground">+20 na última semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nível</CardTitle>
              {getLevelIcon(mockUser.level)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUser.level}</div>
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
                {leaderboardData.findIndex((u) => u.id === mockUser.id) + 1}
              </div>
              <p className="text-xs text-muted-foreground">
                de {leaderboardData.length} alunos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34</div>
              <p className="text-xs text-muted-foreground">descartes este mês</p>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter>
          <div className="w-full">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progresso para o nível Ouro</span>
              <span>
                {mockUser.points} / {nextLevelPoints} Pontos
              </span>
            </div>
            <Progress value={progressToNextLevel} className="h-2" />
          </div>
        </CardFooter>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <CardTitle>Ações Rápidas</CardTitle>
            <Button asChild size="sm" className="ml-auto gap-1" variant="outline">
              <Link href="/quiz">
                Iniciar Quiz
                <BrainCircuit className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href="/waste" className='block'>
              <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">
                    Registrar Resíduo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Marque os resíduos que você descartou e ganhe pontos.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/rewards" className='block'>
              <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Ver Recompensas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Veja o que você pode ganhar com seus pontos de sustentabilidade.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking da Turma</CardTitle>
            <CardDescription>
              Veja os agentes mais engajados da sua turma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.slice(0, 3).map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-bold'>{index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-right">{user.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm" className="w-full">
              <Link href="/leaderboard">Ver Ranking Completo</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
