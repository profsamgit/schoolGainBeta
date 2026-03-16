import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { leaderboardData, mockUser } from '@/lib/data';
import { Medal, Trophy } from 'lucide-react';

const getMedal = (index: number) => {
  if (index === 0)
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (index === 1)
    return <Trophy className="h-5 w-5 text-slate-400" />;
  if (index === 2)
    return <Trophy className="h-5 w-5 text-orange-400" />;
  return <span className="text-muted-foreground">{index + 1}</span>;
};

const getLevelBadge = (level: string) => {
  let color = '';
  switch (level) {
    case 'Bronze':
      color = 'text-orange-600 bg-orange-100';
      break;
    case 'Prata':
      color = 'text-slate-600 bg-slate-200';
      break;
    case 'Ouro':
      color = 'text-yellow-600 bg-yellow-100';
      break;
    case 'Diamante':
      color = 'text-cyan-600 bg-cyan-100';
      break;
  }
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}
    >
      {level}
    </span>
  );
};

export default function LeaderboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Ranking de Agentes da Sustentabilidade
        </CardTitle>
        <CardDescription>
          Veja quem está liderando a corrida pela sustentabilidade na escola!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Posição</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="text-right">Pontos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboardData.map((user, index) => (
              <TableRow
                key={user.id}
                className={
                  user.id === mockUser.id ? 'bg-primary/10' : ''
                }
              >
                <TableCell>
                  <div className="flex items-center justify-center font-bold text-lg w-[30px]">
                    {getMedal(index)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{getLevelBadge(user.level)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {user.points}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
