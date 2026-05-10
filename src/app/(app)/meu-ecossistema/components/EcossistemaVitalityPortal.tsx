'use client';

import { 
  Droplets, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EcossistemaVitalityPortalProps {
  balance: number;
  handleHealAction: (amount: number) => void;
  setShowVitalityWarning: (show: boolean) => void;
}

export function EcossistemaVitalityPortal({
  balance,
  handleHealAction,
  setShowVitalityWarning
}: EcossistemaVitalityPortalProps) {
  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-[4px] animate-in fade-in duration-1000">
      <div className="w-full max-w-lg bg-slate-950/60 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 shadow-[0_80px_150px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <button 
              onClick={() => setShowVitalityWarning(false)}
              className="absolute top-8 right-10 z-20 p-2 text-white/20 hover:text-white transition-all hover:scale-110"
              title="Fechar Aviso"
          >
              <X size={24} />
          </button>
          
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/10 blur-[120px] rounded-full animate-pulse" />
          
          <div className="relative z-10 text-center space-y-10">
              <div className="inline-flex p-6 bg-gradient-to-br from-rose-500 to-orange-600 rounded-[2.5rem] shadow-[0_20px_40px_rgba(244,63,94,0.3)] mb-2 relative transform transition-transform group-hover:scale-110 duration-700">
                  <Droplets className="w-12 h-12 text-white animate-bounce" />
              </div>
              
              <div className="space-y-4">
                  <h2 className="text-5xl font-black text-white tracking-tighter leading-none uppercase">Alerta Bio-Vital</h2>
                  <p className="text-slate-400 text-base font-medium leading-relaxed max-w-[340px] mx-auto opacity-70">
                      O ecossistema está instável. <span className="text-white font-black underline decoration-rose-500/50">Recupere a vitalidade</span> para desbloquear melhorias ambientais.
                  </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-6">
                  <button 
                      onClick={() => handleHealAction(500)}
                      disabled={balance < 500}
                      className={cn(
                          "group h-24 rounded-3xl font-black text-lg uppercase tracking-[0.2em] transition-all duration-700 shadow-2xl relative overflow-hidden",
                          balance >= 500 
                              ? "bg-white text-slate-950 hover:scale-[1.02] shadow-white/10" 
                              : "bg-white/5 text-white/20 border border-white/5 grayscale"
                      )}
                  >
                      {balance >= 500 && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                      <div className="flex flex-col items-center justify-center relative z-10">
                          <div className="flex items-center gap-3">
                              <ShieldCheck className="w-6 h-6" />
                              <span>Restauração (+50%)</span>
                          </div>
                          <span className="text-[11px] opacity-70 font-black mt-2 tracking-[0.3em]">500 CRÉDITOS</span>
                      </div>
                  </button>

                  <button 
                      onClick={() => handleHealAction(100)}
                      disabled={balance < 100}
                      className={cn(
                          "h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 border border-white/10",
                          balance >= 100 
                              ? "bg-white/5 hover:bg-white/10 text-white hover:scale-105" 
                              : "bg-white/5 text-white/20 grayscale"
                      )}
                  >
                    <span className="opacity-60">Injeção Vital (+10%)</span>
                    <span className="ml-3 text-[10px] py-1 px-2 bg-white/10 rounded-lg">100 CRÉDITOS</span>
                  </button>

                  <Link href="/dashboard">
                      <button className="w-full h-12 rounded-xl text-white/30 hover:text-white/60 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
                        Voltar ao Dashboard
                      </button>
                  </Link>
              </div>

              {balance < 100 && (
                  <div className="pt-6 animate-pulse">
                      <p className="text-[11px] text-rose-500 font-black uppercase tracking-[0.3rem]">
                          Recursos escassos • Visite o Kiosk
                      </p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
