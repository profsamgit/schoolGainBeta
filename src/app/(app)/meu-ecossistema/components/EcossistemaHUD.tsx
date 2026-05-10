'use client';

import { 
  ArrowLeft, 
  Coins, 
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EcossistemaHUDProps {
  balance: number;
  vitality: number;
  handleHealAction: (amount: number) => void;
}

export function EcossistemaHUD({
  balance,
  vitality,
  handleHealAction
}: EcossistemaHUDProps) {
  return (
    <div className="absolute top-8 inset-x-0 z-50 flex justify-center px-6 pointer-events-none animate-in slide-in-from-top duration-700">
      <div className="flex items-center gap-2 p-1.5 bg-black/20 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto group transition-all hover:bg-black/30">
          {/* VOLTAR */}
          <Link href="/dashboard">
              <Button size="icon" variant="ghost" className="w-11 h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white transition-all hover:scale-105 active:scale-95 leading-none">
                  <ArrowLeft size={18} />
              </Button>
          </Link>

          <div className="h-8 w-px bg-white/10 mx-1" />

          {/* SALDO */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 shadow-inner">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full shadow-lg shadow-indigo-500/40">
                  <Coins className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">Créditos</span>
                  <span className="text-lg font-black text-white tracking-widest leading-none tabular-nums">
                    {(balance || 0).toLocaleString()}
                  </span>
              </div>
          </div>

          {/* VITALIDADE */}
          <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5 shadow-inner min-w-[240px]">
              <div className="flex flex-col text-right">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">Vitalidade</span>
                  <span className={cn(
                      "text-lg font-black tracking-widest leading-none transition-colors duration-500",
                      (vitality || 0) > 70 ? "text-emerald-400" : (vitality || 0) > 30 ? "text-amber-400" : "text-rose-500"
                  )}>{vitality || 0}%</span>
              </div>
              
              <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                      className={cn(
                          "h-full transition-all transition-duration-[1500ms] rounded-full",
                          vitality > 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]" : 
                          vitality > 30 ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-rose-600 to-red-500"
                      )}
                      style={{ width: `${vitality}%` }}
                  />
              </div>

              {vitality < 100 && balance >= 100 && (
                  <button 
                    onClick={() => handleHealAction(100)}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full border border-emerald-500/20 text-emerald-400 transition-all hover:scale-110 active:scale-90 group"
                    title="Recuperar Vitalidade (+10%)"
                  >
                    <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                  </button>
              )}
          </div>
      </div>
    </div>
  );
}
