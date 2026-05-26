'use client';

import { 
  ArrowLeft, 
  Coins, 
  Sparkles,
  ShieldCheck,
  Infinity,
  Maximize,
  Minimize,
  Sun as SunIcon,
  Moon as MoonIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEcosystem } from '@/contexts/EcosystemContext';

interface EcossistemaHUDProps {
  balance: number;
  vitality: number;
  handleHealAction: (amount: number) => void;
  toggleFullScreen: () => void;
  isFullScreen: boolean;
  forceTime: 'real' | 'day' | 'night';
  setForceTime: (time: 'real' | 'day' | 'night') => void;
}

export function EcossistemaHUD({
  balance,
  vitality,
  handleHealAction,
  toggleFullScreen,
  isFullScreen,
  forceTime,
  setForceTime
}: EcossistemaHUDProps) {
  const { level, purchasedItems, userStates, currentUserId } = useEcosystem();

  // Verifica proteção lendária
  const hasLegendaryShield = (() => {
    if (!purchasedItems.includes('monstro_lago') || !currentUserId) return false;
    const state = userStates[currentUserId];
    if (!state || !state.nessiePurchaseDate) return false;
    
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const [pYear, pMonth] = state.nessiePurchaseDate.split('-').map(Number);
    return currentMonth === `${pYear}-${pMonth}`;
  })();

  return (
    <div className="absolute top-4 md:top-8 inset-x-0 z-50 flex justify-center px-2 md:px-6 pointer-events-none animate-in slide-in-from-top duration-1000 ease-in-out">
      <div className={cn(
          "flex items-center gap-1 xs:gap-1.5 md:gap-4 p-1 md:p-2 bg-black/30 backdrop-blur-[40px] rounded-[2rem] md:rounded-[2.5rem] border shadow-[0_25px_60px_rgba(0,0,0,0.5)] pointer-events-auto group transition-all hover:bg-black/40 ring-1 ring-white/5",
          hasLegendaryShield ? "border-amber-400/30 shadow-amber-500/10" : "border-white/10"
      )}>
          {/* VOLTAR */}
          <Link href="/student/dashboard">
              <button className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center group/back" title="Voltar ao Painel">
                  <ArrowLeft size={14} className="md:w-5 md:h-5 group-hover/back:-translate-x-1 transition-transform" />
              </button>
          </Link>

          <button 
            onClick={toggleFullScreen}
            className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center group/fs" 
            title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia Imersiva"}
          >
              {isFullScreen ? <Minimize size={14} className="md:w-5 md:h-5" /> : <Maximize size={14} className="md:w-5 md:h-5" />}
          </button>

          <button 
            onClick={() => setForceTime(forceTime === 'night' ? 'day' : 'night')}
            className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center group/time" 
            title={forceTime === 'night' ? "Modo Dia" : "Modo Noite"}
          >
              {forceTime === 'night' ? <SunIcon size={14} className="md:w-5 md:h-5 text-amber-400 animate-pulse" /> : <MoonIcon size={14} className="md:w-5 md:h-5 text-indigo-300" />}
          </button>

          <div className="h-5 md:h-10 w-px bg-white/10 mx-0.5 md:mx-1" />

          {/* BADGE DE NÍVEL */}
          <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full border border-indigo-500/20 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest leading-none mb-1">Nível Atual</span>
                  <span className="text-xs font-black text-white tracking-widest leading-none uppercase italic">{level}</span>
              </div>
          </div>

          {/* SALDO */}
          <div className="flex items-center gap-1 xs:gap-1.5 md:gap-4 px-2 py-1 xs:px-3 xs:py-1.5 md:px-6 md:py-2.5 bg-white/5 rounded-full border border-white/5 shadow-inner flex-shrink-0">
              <div className="p-1 md:p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg md:rounded-xl shadow-lg shadow-orange-500/20">
                  <Coins className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <div className="flex flex-col">
                  <span className="text-[6px] md:text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Coins</span>
                  <span className="text-sm md:text-xl font-black text-white tracking-[0.05em] md:tracking-[0.1em] leading-none tabular-nums">
                    {(balance || 0).toLocaleString()}
                  </span>
              </div>
          </div>

          {/* VITALIDADE */}
          <div className="flex items-center gap-1.5 md:gap-5 px-2 py-1.5 md:px-6 md:py-2.5 bg-white/5 rounded-full border border-white/5 shadow-inner min-w-[90px] xs:min-w-[140px] md:min-w-[200px] lg:min-w-[280px] relative overflow-hidden flex-shrink">
              {hasLegendaryShield && (
                  <div className="absolute inset-0 bg-amber-400/5 animate-pulse pointer-events-none" />
              )}
              
              <div className="flex flex-col text-right">
                  <span className="text-[7px] md:text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-0.5 md:mb-1">
                      {hasLegendaryShield ? 'Prot.' : 'Vitalidade'}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasLegendaryShield && <Infinity size={10} className="text-amber-400 animate-pulse md:w-3.5 md:h-3.5" />}
                    <span className={cn(
                        "text-xs md:text-xl font-black tracking-widest leading-none transition-colors duration-500",
                        hasLegendaryShield ? "text-amber-400" : ((vitality || 0) > 70 ? "text-emerald-400" : (vitality || 0) > 30 ? "text-amber-400" : "text-rose-500")
                    )}>{vitality || 0}%</span>
                  </div>
              </div>
              
              <div className="hidden xs:block flex-1 h-2 md:h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                      className={cn(
                          "h-full transition-all transition-duration-[2000ms] rounded-full",
                          hasLegendaryShield ? "bg-gradient-to-r from-amber-400 to-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.5)]" : (
                            vitality > 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]" : 
                            vitality > 30 ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-rose-600 to-red-500"
                          )
                      )}
                      style={{ width: `${vitality}%` }}
                  />
              </div>

              {vitality < 100 && balance >= 100 && !hasLegendaryShield && (
                  <button 
                    onClick={() => handleHealAction(100)}
                    className="p-1.5 md:p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg md:rounded-xl border border-emerald-500/20 text-emerald-400 transition-all hover:scale-110 active:scale-90 group/heal relative overflow-hidden flex-shrink-0"
                    title="Recuperar Vitalidade (+10%)"
                  >
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/heal:opacity-100 transition-opacity" />
                    <Sparkles className="w-3.5 h-3.5 md:w-5 md:h-5 group-hover/heal:rotate-12 transition-transform" />
                  </button>
              )}

              {hasLegendaryShield && (
                  <div className="p-1.5 md:p-2.5 bg-amber-400/10 rounded-lg md:rounded-xl border border-amber-400/20 text-amber-400 flex-shrink-0" title="Proteção da Lenda Ativa">
                      <ShieldCheck size={14} className="animate-bounce md:w-5 md:h-5" />
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
