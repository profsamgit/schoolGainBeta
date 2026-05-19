'use client';

import React, { useState, useMemo } from 'react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { EcosystemService } from '@/lib/ecosystem.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Trophy, 
  Crown, 
  Star, 
  Flame, 
  Eye, 
  MapPin,
  Leaf,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EcosystemViewer } from '@/components/ecosystem/EcosystemViewer';

const getLevelBadge = (level: string) => {
  switch (level) {
    case 'Semente':
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]">Semente</Badge>;
    case 'Broto':
      return <Badge className="bg-lime-500/10 text-lime-400 border-lime-500/20 shadow-[0_0_10px_rgba(132,204,22,0.05)]">Broto</Badge>;
    case 'Folha':
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]">Folha</Badge>;
    case 'Árvore':
      return <Badge className="bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.05)]">Árvore</Badge>;
    case 'Floresta':
      return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.05)]">Floresta</Badge>;
    case 'Guardião da Biosfera':
      return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.05)] animate-pulse">Guardião</Badge>;
    case 'Guardião da Lenda':
      return <Badge className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-slate-900 border-yellow-300 font-black shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce">LENDA</Badge>;
    default:
      return <Badge variant="outline" className="border-white/10 text-slate-300">{level}</Badge>;
  }
};

const formatDisplayName = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export default function LeaderboardPage() {
  const { users, currentUserRa, balance, vitality, purchasedItems, getUserState, initUserSpecificSync, getMonthlyLegends, isPreviewMode, currentUser, userStates, legends } = useEcosystem();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rankingRole, setRankingRole] = useState<'student' | 'staff'>(currentUser?.role === 'staff' ? 'staff' : 'student');
  
  const monthlyLegends = useMemo(() => getMonthlyLegends(), [getMonthlyLegends, legends, purchasedItems, userStates, users]);

  const calculateScore = (u: any) => {
    const state = userStates[u.id] || {};
    const p = state.points || 0;
    const isCurrent = u.id === currentUser?.id;
    const v = isCurrent ? vitality : (state.vitality || 0);
    const items = isCurrent ? purchasedItems.length : (state.purchasedItems?.length || 0);

    return EcosystemService.calculateTotalScore(p, v, items);
  };

  const dynamicLeaderboard = useMemo(() => {
    if (!users) return [];
    return users
      .filter(u => u.role === rankingRole)
      .map(u => {
        const isCurrent = u.id === currentUser?.id;
        const state = userStates[u.id] || {};
        return {
          ...u,
          displayPoints: state.points || 0,
          displayVitality: isCurrent ? vitality : (state.vitality || 0),
          displayItems: isCurrent ? purchasedItems.length : (state.purchasedItems?.length || 0),
          level: state.level || 'Semente',
          totalScore: calculateScore(u)
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [users, currentUserRa, balance, vitality, purchasedItems, userStates, rankingRole]);

  const topThree = dynamicLeaderboard.slice(0, 3);
  const restUsers = dynamicLeaderboard.slice(3);

  const PodiumCard = ({ user, position, delay }: { user: any, position: number, delay: string }) => {
    const isFirst = position === 1;
    const isSecond = position === 2;
    
    return (
      <div 
        className={cn(
          "relative flex flex-col items-center animate-in slide-in-from-bottom-12 duration-1000 fill-mode-both",
          isFirst ? "z-30 -mt-12 order-2" : isSecond ? "z-20 mt-4 order-1" : "z-10 mt-10 order-3"
        )}
        style={{ animationDelay: delay }}
      >
        <div className={cn(
          "relative group p-1 rounded-[2.5rem] transition-all duration-500 hover:scale-105",
          isFirst ? "bg-gradient-to-br from-emerald-400 via-yellow-400 to-emerald-500 shadow-[0_20px_60px_rgba(16,185,129,0.4)]" : 
          isSecond ? "bg-gradient-to-br from-slate-300 via-blue-200 to-slate-400 shadow-[0_15px_40px_rgba(148,163,184,0.25)]" :
          "bg-gradient-to-br from-orange-400 via-amber-200 to-orange-500 shadow-[0_15px_30px_rgba(251,191,36,0.25)]"
        )}>
          <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[2.2rem] p-6 md:p-8 text-center w-48 md:w-64 space-y-5 relative overflow-hidden">
            <div className={cn(
                "absolute -top-16 -right-16 w-32 h-32 blur-[80px] rounded-full",
                isFirst ? "bg-emerald-500/40" : isSecond ? "bg-blue-500/30" : "bg-orange-500/30"
            )} />
            
            <div className="relative z-10 flex flex-col items-center">
                {isFirst && <Crown className="text-yellow-400 mb-2 animate-bounce h-10 w-10 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />}
                
                <div className="relative mb-4">
                    <div className={cn(
                        "w-20 h-20 md:w-24 md:h-24 rounded-full border-2 p-1 bg-white/5 overflow-hidden shadow-2xl",
                        isFirst ? "border-emerald-400/50" : "border-white/10"
                    )}>
                        <div className={cn(
                            "w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-black relative group-hover:scale-110 transition-transform duration-500",
                            isFirst ? "bg-emerald-600" : isSecond ? "bg-slate-600" : "bg-orange-600"
                        )}>
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user.name.charAt(0)
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-xl border-2 border-slate-950",
                        isFirst ? "bg-yellow-400 text-slate-900" : isSecond ? "bg-slate-300 text-slate-800" : "bg-orange-400 text-white"
                    )}>
                        {position}º
                    </div>
                    {isFirst && (
                        <div className="absolute -top-4 -left-4 bg-yellow-400 p-2 rounded-full shadow-lg animate-pulse">
                            <Leaf className="h-6 w-6 text-slate-900" fill="currentColor" />
                        </div>
                    )}
                </div>

                <div className="space-y-1.5 w-full">
                    <h3 className="text-[14px] md:text-lg font-black text-white px-2 uppercase tracking-tight text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                        {formatDisplayName(user.name)}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5">
                        <Flame className={cn("h-4 w-4", isFirst ? "text-emerald-400" : "text-white/40")} />
                        <span className={cn(
                          "text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]",
                          user.level === 'Guardião da Lenda' ? "text-yellow-400 animate-pulse" : "text-white/50"
                        )}>{user.level}</span>
                    </div>
                </div>

                <div className="pt-5 border-t border-white/10 w-full mt-5">
                    <p className="text-2xl md:text-3xl font-black text-white leading-none tabular-nums tracking-tighter">
                        {user.totalScore.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-black uppercase text-emerald-400/80 tracking-[0.25em] mt-2">Score XP</p>
                </div>

                <div className="pt-5">
                   <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full bg-white/10 hover:bg-white/20 text-[10px] uppercase font-black tracking-widest text-white h-10 px-6 transition-all duration-300 hover:scale-110 active:scale-95"
                        onClick={() => {
                          setSelectedUser(user);
                          initUserSpecificSync(user.id);
                        }}
                      >
                        <Eye size={14} className="mr-2" /> Explorar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[90vw] h-[85vh] p-0 overflow-hidden border-none bg-slate-900 shadow-2xl">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Explorando Ecossistema de {selectedUser?.name}</DialogTitle>
                          <DialogDescription>Progresso ambiental em tempo real.</DialogDescription>
                        </DialogHeader>
                        {selectedUser && (() => {
                          const state = userStates[selectedUser.id] || getUserState(selectedUser.id);
                          return (
                            <div className="relative w-full h-full">
                              <EcosystemViewer 
                                vitality={state.vitality} 
                                purchasedItems={state.purchasedItems} 
                                className="w-full h-full"
                              />
                              <div className="absolute top-8 left-8 z-50">
                                <div className="px-8 py-4 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-2xl">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/40">
                                      {selectedUser.name.charAt(0)}
                                    </div>
                                    <div>
                                      <h3 className="text-base font-black text-white uppercase tracking-tight">{selectedUser.name}</h3>
                                      <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-emerald-400" />
                                        <span className="text-[11px] text-white/70 font-bold uppercase tracking-wider">{selectedUser.level}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute bottom-8 right-8 z-50">
                                   <div className="px-6 py-3 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-emerald-500/40 animate-pulse">
                                      Modo Visitante
                                   </div>
                                </div>
                            </div>
                          );
                        })()}
                      </DialogContent>
                    </Dialog>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!users) return null;
  
  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20">
      {/* SEÇÃO DO PÓDIO (ESTILO CAMPEONATO) */}
      <div className="relative pt-20 pb-16 flex flex-col items-center">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10">
             <Trophy className="h-64 w-64 text-emerald-500/5 rotate-12" />
         </div>
         
         <div className="text-center space-y-4 mb-20 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase flex items-center justify-center gap-6">
               <Star className="text-emerald-400 animate-pulse h-10 w-10" fill="currentColor" />
               Pódio da Elite
               <Star className="text-emerald-400 animate-pulse h-10 w-10" fill="currentColor" />
            </h2>
            <p className="text-slate-400 font-black text-base uppercase tracking-[0.3em]">Os Guardiões da Biosfera em Destaque</p>
         </div>
 
         <div className="flex flex-wrap justify-center items-end gap-6 md:gap-12 px-6 w-full">
            {topThree[1] && <PodiumCard user={topThree[1]} position={2} delay="0.1s" />}
            {topThree[0] && <PodiumCard user={topThree[0]} position={1} delay="0s" />}
            {topThree[2] && <PodiumCard user={topThree[2]} position={3} delay="0.2s" />}
         </div>
      </div>
 
      {/* HALL DAS LENDAS DO MÊS */}
      <div className="px-6">
        <div className="max-w-5xl mx-auto bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-white/5">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full" />
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-4 text-center md:text-left">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Exclusividade Mensal</span>
                 </div>
                 <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Hall das Lendas</h3>
                 <p className="text-slate-400 font-bold text-sm max-w-md uppercase tracking-wide leading-relaxed">
                    Apenas 3 agentes por mês conseguem domar a Nessie. Estes são os pioneiros deste ciclo.
                 </p>
              </div>
 
              <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
                 {[0, 1, 2].map((i) => {
                    const legend = monthlyLegends[i];
                    return (
                      <div key={i} className="flex flex-col items-center gap-4">
                         <div className={cn(
                            "w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500 overflow-hidden",
                            legend ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse" : "bg-white/5 border-dashed border-white/10"
                          )}>
                            {legend ? (
                               legend.avatar ? (
                                  <img src={legend.avatar} alt={legend.name} className="w-full h-full object-cover" />
                               ) : (
                                  <span className="text-3xl font-black text-white">{legend.name.charAt(0)}</span>
                               )
                            ) : (
                               <Trophy className="h-8 w-8 text-white/10" />
                            )}
                         </div>
                         <div className="text-center">
                            <p className={cn(
                               "text-[10px] font-black uppercase tracking-widest",
                               legend ? "text-emerald-400" : "text-slate-600"
                            )}>
                               {legend ? legend.name.split(' ')[0] : 'Vaga Aberta'}
                            </p>
                            {legend && <p className="text-[8px] text-white/40 font-bold uppercase mt-1">{new Date(legend.purchaseDate).toLocaleDateString()}</p>}
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>
 
      {/* TABELA DO RESTANTE DO RANKING */}
      <Card className="border border-white/5 shadow-2xl bg-slate-900/40 rounded-[2rem] overflow-hidden text-white backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight text-white">
                <Flame className="h-6 w-6 text-orange-400 animate-pulse" />
                Corrida Sustentável
              </CardTitle>
              <CardDescription className="font-black text-slate-400 uppercase tracking-widest text-[9px]">
                 Monitoramento global de agentes
              </CardDescription>
            </div>
            
            <Tabs value={rankingRole} onValueChange={(val: any) => setRankingRole(val)} className="w-full md:w-auto">
              <TabsList className="bg-slate-950/60 p-1 h-12 rounded-full border border-white/5">
                <TabsTrigger value="student" className="rounded-full px-8 font-black uppercase text-[9px] tracking-widest text-slate-400 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-300">
                   Alunos
                </TabsTrigger>
                <TabsTrigger value="staff" className="rounded-full px-8 font-black uppercase text-[9px] tracking-widest text-slate-400 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-300">
                   Equipe
                </TabsTrigger>
              </TabsList>
            </Tabs>
 
            <div className="flex items-center gap-2 bg-slate-950/40 border border-white/5 rounded-full px-4 py-2 text-slate-300">
                <Trophy className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-wider tabular-nums">Total: {dynamicLeaderboard.length} Agentes</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/40">
              <TableRow className="border-b border-white/5">
                <TableHead className="w-24 text-center h-14 font-black uppercase text-[9px] tracking-widest text-slate-400">Pos</TableHead>
                <TableHead className="h-14 font-black uppercase text-[9px] tracking-widest text-slate-400">Agente</TableHead>
                <TableHead className="hidden md:table-cell h-14 font-black uppercase text-[9px] tracking-widest text-slate-400">Nível</TableHead>
                <TableHead className="text-center h-14 font-black uppercase text-[9px] tracking-widest text-slate-400">Vitalidade</TableHead>
                <TableHead className="text-right h-14 font-black uppercase text-[9px] tracking-widest text-slate-400">Score Global</TableHead>
                <TableHead className="w-24 text-center h-14 font-black uppercase text-[9px] tracking-widest text-slate-400">Visita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restUsers.map((user, index) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    "group transition-all duration-300 border-b border-white/5 hover:bg-white/5",
                    user.ra === currentUser?.ra && "bg-emerald-500/10 hover:bg-emerald-500/15 border-l-[6px] border-l-emerald-500 text-white",
                    user.level === 'Guardião da Lenda' && "bg-amber-500/10 hover:bg-amber-500/15 border-l-[6px] border-l-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] text-white"
                  )}
                >
                  <TableCell className="font-black text-center text-slate-450 text-xl py-6 tabular-nums group-hover:text-emerald-400 transition-colors border-b border-white/5">
                    {index + 4}º
                  </TableCell>
                  <TableCell className="border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-[1rem] bg-slate-950 flex items-center justify-center font-black text-slate-400 shadow-sm border border-white/5 group-hover:border-emerald-500/30 transition-colors overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <span className={cn(
                                "block text-sm uppercase tracking-tight",
                                user.ra === currentUser?.ra ? "font-black text-emerald-400" : "font-bold text-slate-200"
                            )}>
                                {formatDisplayName(user.name)}
                                {user.ra === currentUser?.ra && <span className="ml-2 text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Você</span>}

                                {index + 4 === 1 && <Leaf className="ml-2 h-4 w-4 text-yellow-400 inline" fill="currentColor" />}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest md:hidden">{user.level}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell border-b border-white/5">
                    {getLevelBadge(user.level)}
                  </TableCell>
                  <TableCell className="border-b border-white/5">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-black text-xs tabular-nums",
                            user.displayVitality >= 70 ? 'text-emerald-400' : 'text-amber-400'
                          )}>
                            {user.displayVitality}%
                          </span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000",
                            user.displayVitality >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'
                          )}
                          style={{ width: `${user.displayVitality}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right border-b border-white/5">
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="font-black text-2xl text-white tabular-nums tracking-tighter">
                            {user.totalScore.toLocaleString()}
                        </span>
                        <span className="text-[7px] font-black text-slate-450 uppercase tracking-widest">Pontos XP</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center border-b border-white/5">
                    <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 hover:text-emerald-400 border border-white/5 transition-all duration-300"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye size={18} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[90vw] h-[85vh] p-0 overflow-hidden border-none bg-slate-900 shadow-2xl">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Explorando Ecossistema de {selectedUser?.name}</DialogTitle>
                            <DialogDescription>Visualização em tempo real do progresso de restauração ambiental deste agente.</DialogDescription>
                          </DialogHeader>
                          {selectedUser && (() => {
                            const state = userStates[selectedUser.id] || getUserState(selectedUser.id);
                            return (
                              <div className="relative w-full h-full">
                                <EcosystemViewer 
                                  vitality={state.vitality} 
                                  purchasedItems={state.purchasedItems} 
                                  className="w-full h-full"
                                  interactive={true}
                                />
                                <div className="absolute top-8 left-8 z-50">
                                  <div className="px-8 py-4 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-2xl">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xl">
                                        {selectedUser.name.charAt(0)}
                                      </div>
                                      <div>
                                        <h3 className="text-base font-black text-white uppercase tracking-tight">{selectedUser.name}</h3>
                                        <div className="flex items-center gap-2">
                                          <MapPin size={14} className="text-emerald-400" />
                                          <span className="text-[11px] text-white/70 font-bold uppercase tracking-[0.1em]">{selectedUser.level}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute bottom-8 right-8 z-50">
                                   <div className="px-6 py-3 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-emerald-500/40 animate-bounce">
                                      Modo Visitante
                                   </div>
                                </div>
                              </div>
                            );
                          })()}
                        </DialogContent>
                      </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {restUsers.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <Trophy className="h-16 w-16 text-slate-100 mx-auto" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Mais agentes em breve!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
