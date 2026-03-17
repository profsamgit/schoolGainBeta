'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { WasteChart } from '@/components/waste-chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { leaderboardData, mockAdmin } from '@/lib/data';
import { LayoutDashboard } from 'lucide-react';
import type { User } from '@/lib/types';
import { useState } from 'react';

export default function AdminDashboardPage() {
    const [users] = useState<Omit<User, 'email' | 'avatar'>[]>([...leaderboardData, mockAdmin]);
    const studentUsers = users.filter((u) => u.role === 'student');
    const topStudent = studentUsers.length > 0 ? [...studentUsers].sort((a, b) => b.points - a.points)[0] : null;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    Dashboard do Gestor
                </h1>
                <p className="text-muted-foreground">
                    Visão geral das métricas e atividades do SchoolGain.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Resíduos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5880 kg</div>
                        <p className="text-xs text-muted-foreground">+5% vs. mês passado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{studentUsers.length}</div>
                        <p className="text-xs text-muted-foreground">+10 desde a última semana</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Principal Contribuidor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{topStudent?.name ?? 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">{topStudent?.points ?? 0} pontos</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <WasteChart />
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                    <CardDescription>Últimos alunos com mais pontos.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.filter(u => u.role === 'student').sort((a,b) => b.points - a.points).slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center gap-4">
                            <Avatar className="h-9 w-9 hidden sm:flex">
                                <AvatarImage src={`https://picsum.photos/seed/${user.id}/100/100`} alt="Avatar" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-sm text-muted-foreground">RA: {user.ra}</p>
                            </div>
                            <div className="ml-auto font-medium">{user.points} pts</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
            </div>
        </div>
    )
}
