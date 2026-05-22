'use client';

import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, PartyPopper, Leaf } from 'lucide-react';

interface SuccessSectionProps {
  successMessage: string;
  handleExit: () => void;
}

export function SuccessSection({
  successMessage,
  handleExit
}: SuccessSectionProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-100 dark:bg-[#070913] items-center justify-center p-4 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* 🚀 Estilos de Animação e Partículas */}
      <style>{`
        @keyframes success-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 25px rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
          10%, 90% { opacity: 0.8; }
          100% { transform: translateY(-120px) rotate(360deg); opacity: 0; }
        }
        .cyber-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
      `}</style>

      {/* Orbes e Grids de Fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] animate-pulse" />
        <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
        
        {/* Floating Celebration Particles */}
        <div className="absolute bottom-0 left-[20%] w-3 h-3 bg-emerald-400 rounded-full blur-[1px] animate-[float-particle_4s_infinite]" style={{ animationDelay: '0.2s' }} />
        <div className="absolute bottom-0 left-[40%] w-2 h-2 bg-yellow-400 rounded-full blur-[1px] animate-[float-particle_5s_infinite]" style={{ animationDelay: '1.2s' }} />
        <div className="absolute bottom-0 left-[60%] w-3.5 h-3.5 bg-teal-400 rounded-full blur-[1px] animate-[float-particle_3.5s_infinite]" style={{ animationDelay: '0.6s' }} />
        <div className="absolute bottom-0 left-[80%] w-2.5 h-2.5 bg-emerald-300 rounded-full blur-[1px] animate-[float-particle_4.5s_infinite]" style={{ animationDelay: '2s' }} />
      </div>

      <main className="relative z-10 w-full max-w-md flex flex-col items-center">
        <Card className="w-full backdrop-blur-3xl bg-white/90 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-slate-200/60 dark:ring-white/5 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          
          <CardHeader className="text-center pb-2 pt-8">
            <div className="flex items-center gap-2 mb-3 select-none justify-center">
              <Leaf className="h-4 w-4 text-emerald-400 fill-emerald-500/20 animate-pulse shrink-0" />
              <span className="text-xs font-black tracking-[0.3em] uppercase bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-transparent bg-clip-text">
                SchoolGain Kiosk
              </span>
            </div>
            {/* Glowing Success Badge */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/5 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-[success-pulse_3s_infinite]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.35)] border border-emerald-400/30">
                <Check className="h-9 w-9 text-white font-black stroke-[3.5]" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Ação Registrada!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center py-6 px-8 space-y-4">
            {/* Success Quote Panel */}
            <div className="bg-slate-100/80 dark:bg-slate-950/60 p-6 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-inner relative overflow-hidden">
              <div className="absolute -top-3 -right-3 text-emerald-500/10 pointer-events-none">
                <PartyPopper className="w-20 h-20 rotate-12" />
              </div>
              
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed relative z-10">
                "{successMessage}"
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest pt-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Sua Atitude Sustentável Transforma o Ecossistema</span>
            </div>
          </CardContent>
          
          <CardFooter className="pb-8 pt-2 px-8">
            <Button 
              onClick={handleExit} 
              className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-95 border border-emerald-400/20"
              size="lg"
            >
              Finalizar e Voltar
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
