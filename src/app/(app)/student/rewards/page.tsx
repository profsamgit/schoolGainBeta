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

  const schoolRewards = allRewards.filter(reward => 
    !reward.schoolId || reward.schoolId === currentUser?.schoolId || reward.schoolId === 'school-1'
  );

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Gift className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Catálogo de Prêmios</h1>
            <p className="text-slate-400 font-medium max-w-md text-sm">
              Sua dedicação ao planeta vale ouro. Troque suas Bio-Coins por itens exclusivos e experiências únicas.
            </p>
          </div>
          <div className="bg-slate-950/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 text-right min-w-[200px] shadow-inner">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Seu Saldo Disponível</p>
            <div className="flex items-center justify-end gap-2">
              <span className="text-3xl font-black text-white">{balance.toLocaleString('pt-BR')}</span>
              <span className="text-[9px] font-black text-emerald-400">BIO-COINS</span>
            </div>
          </div>
        </div>
        <div className="absolute left-[-20px] bottom-[-20px] opacity-5 rotate-45 text-emerald-400">
            <ShoppingCart className="h-64 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {schoolRewards.map((reward) => (
          <Card key={reward.id} className="group flex flex-col overflow-hidden border border-white/5 shadow-2xl hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all duration-500 rounded-[2rem] bg-slate-900/40 text-white backdrop-blur-xl relative">
            <div className="relative h-56 w-full overflow-hidden bg-slate-950">
              <Image
                src={reward.image || 'https://images.unsplash.com/photo-1549465220-1d8c9d9c6703?q=80&w=800&auto=format&fit=crop'}
                alt={reward.name}
                fill
                unoptimized={!reward.image}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                data-ai-hint={reward.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                 <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">🪙 {reward.cost} Bio-Coins</span>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black text-white group-hover:text-emerald-400 transition-colors leading-tight uppercase tracking-tight line-clamp-1">{reward.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pt-0">
              <CardDescription className="text-slate-400 font-medium text-xs line-clamp-2 leading-relaxed">
                {reward.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-4 border-t border-white/5 bg-slate-950/40">
              <Button
                className={cn(
                  "w-full rounded-2xl font-black uppercase text-[9px] tracking-widest h-11 transition-all duration-300",
                  balance >= reward.cost 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10" 
                    : "bg-slate-950/40 text-slate-500 border border-white/5 cursor-not-allowed"
                )}
                onClick={() => handleRedeem(reward.id, reward.name, reward.cost)}
                disabled={balance < reward.cost}
              >
                {balance >= reward.cost ? (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Resgatar Prêmio
                  </div>
                ) : (
                  "Bio-Coins Insuficientes"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
