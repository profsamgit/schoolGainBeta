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
import { useEcosystem } from '../ecosystem-context';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const { toast } = useToast();
  const { balance, deductPoints, allRewards, currentUser } = useEcosystem();

  const schoolRewards = allRewards.filter(reward => 
    !reward.schoolId || reward.schoolId === currentUser?.schoolId || reward.schoolId === 'school-1'
  );

  const handleRedeem = (rewardName: string, cost: number) => {
    const success = deductPoints(cost);
    if (success) {
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
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-md border border-primary/30">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Catálogo de Prêmios</h1>
            <p className="text-slate-400 font-medium max-w-md">
              Sua dedicação ao planeta vale ouro. Troque suas Bio-Coins por itens exclusivos e experiências únicas.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-right min-w-[200px] shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Seu Saldo Disponível</p>
            <div className="flex items-center justify-end gap-2">
              <span className="text-4xl font-black text-white">{balance.toLocaleString('pt-BR')}</span>
              <span className="text-xs font-bold text-primary">PTS</span>
            </div>
          </div>
        </div>
        <div className="absolute left-[-20px] bottom-[-20px] opacity-5 rotate-45">
            <ShoppingCart className="h-64 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {schoolRewards.map((reward) => (
          <Card key={reward.id} className="group flex flex-col overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl bg-white relative">
            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
              <Image
                src={reward.image || 'https://images.unsplash.com/photo-1549465220-1d8c9d9c6703?q=80&w=800&auto=format&fit=crop'}
                alt={reward.name}
                fill
                unoptimized={!reward.image}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint={reward.imageHint}
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-slate-100">
                 <span className="text-xs font-black text-primary">{reward.cost} pts</span>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-900 leading-tight">{reward.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pt-0">
              <CardDescription className="text-slate-500 font-medium text-sm line-clamp-2 leading-relaxed">
                {reward.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-50 bg-slate-50/50">
              <Button
                className={cn(
                  "w-full rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 transition-all duration-300",
                  balance >= reward.cost 
                    ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
                onClick={() => handleRedeem(reward.name, reward.cost)}
                disabled={balance < reward.cost}
              >
                {balance >= reward.cost ? (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Resgatar Prêmio
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
