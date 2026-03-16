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
import { mockUser, rewards } from '@/lib/data';
import { Gift, ShoppingCart } from 'lucide-react';
import Image from 'next/image';

export default function RewardsPage() {
  const { toast } = useToast();

  const handleRedeem = (rewardName: string, cost: number) => {
    toast({
      title: 'Recompensa Resgatada!',
      description: `Você resgatou "${rewardName}" por ${cost} pontos.`,
    });
  };

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-muted-foreground">Seus Pontos</p>
            <p className="text-2xl font-bold text-primary">{mockUser.points}</p>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rewards.map((reward) => (
          <Card key={reward.id} className="flex flex-col overflow-hidden">
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
                disabled={mockUser.points < reward.cost}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {mockUser.points >= reward.cost
                  ? 'Resgatar'
                  : 'Pontos insuficientes'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
