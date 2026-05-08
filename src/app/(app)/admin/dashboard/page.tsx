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
import { LEADERBOARD_MOCK, ADMIN_MOCK } from '@/lib/data';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { LayoutDashboard, Expand, Minimize, RefreshCw, Clock, MapPin, Sun, Cloudy, CloudRain } from 'lucide-react';
import type { User } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const { users, currentUser } = useEcosystem();
    const studentUsers = users.filter((u) => u.role === 'student');
    const topStudent = studentUsers.length > 0 ? [...studentUsers].sort((a, b) => b.points - a.points)[0] : null;

    const [refreshInterval, setRefreshInterval] = useState<string>('0');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [timeZone, setTimeZone] = useState<string>('');
    const [weather, setWeather] = useState<{ temp: string; description: string; icon: React.ElementType; color: string; } | null>(null);

    // Sidebar and fullscreen logic
    const { open: isSidebarOpen, setOpen: setSidebarOpen } = useSidebar();
    const sidebarWasOpen = useRef(isSidebarOpen);

    // Effect for clock and timezone to avoid hydration issues
    useEffect(() => {
        setCurrentTime(new Date());
        setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' '));

        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    // Effect for mock weather
    useEffect(() => {
        // This is a mock. In a real app, you'd use a weather API.
        const weatherOptions = [
            { temp: '28°C', description: 'Ensolarado', icon: Sun, color: 'text-yellow-500' },
            { temp: '22°C', description: 'Parcialmente Nublado', icon: Cloudy, color: 'text-slate-500' },
            { temp: '18°C', description: 'Chuva Leve', icon: CloudRain, color: 'text-blue-500' },
        ];
        
        // This runs only on the client, after hydration
        const randomIndex = Math.floor(Math.random() * weatherOptions.length);
        const randomWeather = weatherOptions[randomIndex];
        
        const timer = setTimeout(() => {
            setWeather(randomWeather);
        }, 1500);

        return () => clearTimeout(timer);
    }, []); // Empty dependency array ensures this runs once on mount.


    // Auto-refresh effect
    useEffect(() => {
        setLastUpdated(new Date()); // Set initial time
        const interval = parseInt(refreshInterval, 10);
        if (interval > 0) {
            const timer = setInterval(() => {
                setLastUpdated(new Date());
                // In a real app, you would re-fetch data here.
            }, interval * 1000);
            return () => clearInterval(timer);
        }
    }, [refreshInterval]);

    // Fullscreen effect
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isCurrentlyFullscreen);
    
            if (!isCurrentlyFullscreen) {
                // Restore sidebar state when exiting fullscreen
                setSidebarOpen(sidebarWasOpen.current);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [setSidebarOpen]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            // Store sidebar state and close it
            sidebarWasOpen.current = isSidebarOpen;
            if (isSidebarOpen) {
                setSidebarOpen(false);
            }
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                // Restore sidebar on error
                setSidebarOpen(sidebarWasOpen.current);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
            <LayoutDashboard className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Acesso Restrito</h2>
            <p className="text-muted-foreground">Área exclusiva para gestores autorizados.</p>
          </div>
          <Button asChild size="lg"><Link href="/dashboard">Voltar para o Painel</Link></Button>
        </div>
      );
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                        Dashboard do Gestor
                    </h1>
                    <p className="text-muted-foreground">
                        Visão geral das métricas e atividades do SchoolGain.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                            <SelectTrigger className="w-[150px] sm:w-[180px]">
                                <SelectValue placeholder="Atualização" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Manual</SelectItem>
                                <SelectItem value="5">5 segundos</SelectItem>
                                <SelectItem value="15">15 segundos</SelectItem>
                                <SelectItem value="30">30 segundos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" size="icon" onClick={toggleFullscreen} className="hidden sm:inline-flex">
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                        <span className="sr-only">{isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}</span>
                    </Button>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground border-t pt-4 -mt-2">
                <div className="flex items-center gap-2">
                    {weather ? (
                        <>
                            <weather.icon className={cn("h-5 w-5", weather.color)} />
                            <span className="font-medium text-foreground">{weather.temp}</span>
                            <span>{weather.description}</span>
                        </>
                    ) : (
                        <>
                            <Cloudy className="h-4 w-4 animate-pulse" />
                            <span>Carregando clima...</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{currentTime ? currentTime.toLocaleString('pt-BR') : 'Carregando...'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Fuso Horário: {timeZone || 'Carregando...'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Dados atualizados em: {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : 'Carregando...'}</span>
                </div>
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
