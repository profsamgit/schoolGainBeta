'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Gift, ShoppingCart } from 'lucide-react';
import { useEcosystem } from '@/contexts/EcosystemContext';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const { toast } = useToast();
  const { balance, deductPoints, allRewards, currentUser, recordRewardRedemption } = useEcosystem();

  const schoolRewards = allRewards;

  const handleRedeem = (rewardId: string, rewardName: string, cost: number) => {
    const success = deductPoints(cost);
    if (success) {
      recordRewardRedemption(rewardId);
      toast({
        title: 'Recompensa Resgatada!',
        description: `Você resgatou "${rewardName}" por ${cost} pontos.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro no Resgate',
        description: 'Saldo insuficiente para esta recompensa.',
      });
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto relative z-10 text-slate-800 dark:text-white">
      {/* Banner Superior Responsivo */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white/85 dark:bg-slate-900/40 backdrop-blur-xl p-4 sm:p-8 text-slate-800 dark:text-white shadow-lg dark:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Catálogo de Prêmios</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md text-xs sm:text-sm leading-relaxed">
              Sua dedicação ao planeta vale ouro. Troque suas Bio-Coins por itens exclusivos e experiências únicas.
            </p>
          </div>
          
          {/* Bloco de Saldo Adaptativo */}
          <div className="bg-slate-100/60 dark:bg-slate-950/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-white/5 text-left md:text-right min-w-[160px] sm:min-w-[200px] shadow-inner w-full md:w-auto">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Seu Saldo Disponível</p>
            <div className="flex items-center md:justify-end gap-2">
              <span className="text-xl sm:text-3xl font-black text-slate-800 dark:text-white">{balance.toLocaleString('pt-BR')}</span>
              <span className="text-[8px] sm:text-[9px] font-black text-emerald-650 dark:text-emerald-400">BIO-COINS</span>
            </div>
          </div>
        </div>
        <div className="absolute left-[-20px] bottom-[-20px] opacity-5 rotate-45 text-emerald-400 pointer-events-none">
            <ShoppingCart className="h-48 w-48 sm:h-64 sm:w-64" />
        </div>
      </div>

      {/* Vitrine de Prêmios - 2 Colunas Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
        {schoolRewards.map((reward) => (
          <Card key={reward.id} className="group flex flex-col overflow-hidden border border-slate-200 dark:border-white/5 shadow-md dark:shadow-2xl hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all duration-500 rounded-2xl sm:rounded-[2rem] bg-white/80 dark:bg-slate-900/40 text-slate-800 dark:text-white backdrop-blur-xl relative">
            
            {/* Imagem do Card - Altura h-28 Mobile e h-56 Desktop */}
            <div className="relative h-28 sm:h-56 w-full overflow-hidden bg-slate-950">
              <Image
                src={reward.image || 'https://images.unsplash.com/photo-1549465220-1d8c9d9c6703?q=80&w=800&auto=format&fit=crop'}
                alt={reward.name}
                fill
                unoptimized={!reward.image}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                data-ai-hint={reward.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              {/* Pill de Custo Compacto Adaptativo */}
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg border border-slate-200/50 dark:border-white/10">
                 <span className="text-[8px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">🪙 {reward.cost} Coins</span>
              </div>
            </div>
            
            {/* Card Content - Padding reduzido no celular */}
            <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-base font-black text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight uppercase tracking-tight line-clamp-1">
                {reward.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 flex-grow">
              <CardDescription className="text-slate-500 dark:text-slate-400 font-medium text-[10px] sm:text-xs line-clamp-2 leading-relaxed">
                {reward.description}
              </CardDescription>
            </CardContent>
            
            {/* Card Footer - Compacto */}
            <CardFooter className="p-2 sm:p-6 pt-2 sm:pt-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40">
              <Button
                className={cn(
                  "w-full rounded-xl sm:rounded-2xl font-black uppercase text-[8px] sm:text-[9px] tracking-widest h-8 sm:h-11 transition-all duration-300",
                  balance >= reward.cost 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10 active:scale-95" 
                    : "bg-slate-100 dark:bg-slate-950/45 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5 cursor-not-allowed"
                )}
                onClick={() => handleRedeem(reward.id, reward.name, reward.cost)}
                disabled={balance < reward.cost}
              >
                {balance >= reward.cost ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" /> Resgatar
                  </div>
                ) : (
                  "Saldo Insuficiente"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
