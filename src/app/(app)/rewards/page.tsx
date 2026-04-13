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

export default function RewardsPage() {
  const { toast } = useToast();
  const { balance, deductPoints, allRewards } = useEcosystem();

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Gift className="h-8 w-8 text-primary" />
              Catálogo de Recompensas
            </CardTitle>
            <CardDescription>
              Troque seus pontos por prêmios incríveis!
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Seu Saldo Real</p>
            <p className="text-2xl font-bold text-primary">{balance} pts</p>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allRewards.map((reward) => (
          <Card key={reward.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 w-full">
              <Image
                src={reward.image}
                alt={reward.name}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint={reward.imageHint}
              />
            </div>
            <CardHeader>
              <CardTitle>{reward.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{reward.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <div className="text-lg font-semibold text-primary">
                {reward.cost} pontos
              </div>
              <Button
                className="w-full"
                onClick={() => handleRedeem(reward.name, reward.cost)}
                disabled={balance < reward.cost}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {balance >= reward.cost
                  ? 'Resgatar'
                  : 'Saldo insuficiente'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
