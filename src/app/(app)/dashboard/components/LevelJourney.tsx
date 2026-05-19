'use client';

import React from 'react';
import { 
  Sprout, 
  Leaf, 
  TreeDeciduous, 
  Trees, 
  ShieldCheck, 
  Sparkles,
  Target,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserLevel } from '@/lib/types';

interface LevelJourneyProps {
  currentLevel: UserLevel;
  totalScore: number;
}

const LEVELS = [
  { id: 'Semente', name: 'Semente', icon: Target, minScore: 0, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'Broto', name: 'Broto', icon: Sprout, minScore: 2000, color: 'text-lime-500', bg: 'bg-lime-500/10' },
  { id: 'Folha', name: 'Folha', icon: Leaf, minScore: 5000, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'Árvore', name: 'Árvore', icon: TreeDeciduous, minScore: 10000, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'Floresta', name: 'Floresta', icon: Trees, minScore: 15000, color: 'text-green-600', bg: 'bg-green-600/10' },
  { id: 'Guardião da Biosfera', name: 'Guardião', icon: ShieldCheck, minScore: 20000, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 'Guardião da Lenda', name: 'Lenda', icon: Sparkles, minScore: 25000, color: 'text-amber-400', bg: 'bg-amber-400/10' },
];

export function LevelJourney({ currentLevel, totalScore }: LevelJourneyProps) {
  const currentIndex = LEVELS.findIndex(l => l.id === currentLevel);
  const nextLevel = LEVELS[currentIndex + 1];

  return (
    <div className="w-full py-4 px-4 overflow-hidden">
      {/* HEADER DA JORNADA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-3">
        <div className="space-y-0.5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Jornada do Guardião</h3>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
             {currentLevel}
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
        </div>
        
        {nextLevel && (
            <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg group transition-all hover:bg-slate-900/40">
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Próxima Evolução</p>
                    <p className="text-xs font-bold text-slate-200">{nextLevel.name}</p>
                </div>
                <div className={cn("p-1.5 rounded-lg transition-transform group-hover:scale-110", nextLevel.bg, nextLevel.color)}>
                    <nextLevel.icon className="w-4 h-4" />
                </div>
            </div>
        )}
      </div>

      {/* TIMELINE VISUAL */}
      <div className="relative max-w-4xl mx-auto">
        {/* Linha de Base */}
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/5 -translate-y-1/2 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-1000 ease-out"
                style={{ width: `${(currentIndex / (LEVELS.length - 1)) * 100}%` }}
            />
        </div>

        {/* Níveis */}
        <div className="relative flex justify-center gap-4 md:gap-8 items-center w-full overflow-x-auto pb-10 pt-2 no-scrollbar">
          {LEVELS.map((level, index) => {
            const isReached = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = level.icon;

            return (
              <div 
                key={level.id} 
                className="flex flex-col items-center group shrink-0"
                style={{ zIndex: isCurrent ? 20 : 10 }}
              >
                {/* Ícone */}
                <div className={cn(
                  "relative w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                  isReached 
                    ? cn("bg-slate-950 border-current shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-110", level.color) 
                    : "bg-slate-900/20 border-white/5 text-slate-500 scale-90 grayscale opacity-50"
                )}>
                  {isCurrent && (
                    <div className={cn("absolute inset-0 rounded-2xl animate-ping opacity-10", level.bg)} />
                  )}
                  <Icon className={cn("w-6 h-6 md:w-8 md:h-8 transition-transform group-hover:scale-110", isReached ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" : "")} />
                  
                  {/* Badge de Pontos */}
                  <div className={cn(
                    "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all duration-500 border",
                    isReached ? "bg-white text-slate-950 border-white" : "bg-slate-950 text-slate-500 border-white/5"
                  )}>
                    {level.minScore.toLocaleString()} pts
                  </div>
                </div>

                {/* Nome do Nível */}
                <span className={cn(
                  "mt-14 text-[10px] font-black uppercase tracking-widest transition-all text-center",
                  isReached ? "text-white" : "text-slate-500"
                )}>
                  {level.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* LEGENDA MOBILE */}
      <div className="mt-8 md:hidden flex items-center justify-center gap-2 bg-slate-950/40 border border-white/5 py-3 rounded-2xl">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Continue coletando para evoluir
          </p>
      </div>
    </div>
  );
}
