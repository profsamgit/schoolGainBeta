'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gift, ShoppingCart, Search, Filter, Coins, Check, ArrowRight } from 'lucide-react';
import { useEcosystem } from '@/contexts/EcosystemContext';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Helper function to resolve dynamic high-quality Unsplash images based on hint or name
const getRewardImage = (image: string, imageHint: string, name: string) => {
  if (image && image.trim() !== '') return image;
  
  const hint = (imageHint || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  
  if (hint.includes('tshirt') || hint.includes('cloth') || lowerName.includes('uniforme')) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('desk') || hint.includes('classroom') || lowerName.includes('lugar') || lowerName.includes('carteira')) {
    return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('key') || hint.includes('idea') || lowerName.includes('prova') || lowerName.includes('dica')) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('hourglass') || hint.includes('clock') || hint.includes('time') || lowerName.includes('entrega') || lowerName.includes('prazo')) {
    return 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('vip') || hint.includes('ticket') || lowerName.includes('cantina') || lowerName.includes('fila')) {
    return 'https://images.unsplash.com/photo-1568649929103-28fffeecca0e?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('potted') || hint.includes('plant') || hint.includes('seedling') || lowerName.includes('horta') || lowerName.includes('vaso')) {
    return 'https://images.unsplash.com/photo-1530968464165-7a1861cbaf9e?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('bag') || hint.includes('tote') || lowerName.includes('sacola') || lowerName.includes('ecobag')) {
    return 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('bottle') || hint.includes('metal') || lowerName.includes('garrafa') || lowerName.includes('copo')) {
    return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('sticker') || lowerName.includes('adesivo')) {
    return 'https://images.unsplash.com/photo-1572945281861-68b295982127?q=80&w=800&auto=format&fit=crop';
  }
  if (hint.includes('dj') || hint.includes('headphone') || hint.includes('music') || lowerName.includes('playlist') || lowerName.includes('som')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerName.includes('cinema') || lowerName.includes('ingresso') || hint.includes('movie')) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerName.includes('recreio') || lowerName.includes('intervalo')) {
    return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerName.includes('arvore') || lowerName.includes('muda') || hint.includes('tree')) {
    return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerName.includes('chaveiro') || hint.includes('keychain')) {
    return 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerName.includes('suporte') || lowerName.includes('popsocket')) {
    return 'https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=800&auto=format&fit=crop';
  }
  if (lowerName.includes('quadra') || lowerName.includes('esporte') || lowerName.includes('ping') || hint.includes('sport')) {
    return 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=800&auto=format&fit=crop';
  }

  return 'https://images.unsplash.com/photo-1549465220-1d8c9d9c6703?q=80&w=800&auto=format&fit=crop';
};

export default function RewardsPage() {
  const { toast } = useToast();
  const { balance, deductPoints, allRewards, recordRewardRedemption } = useEcosystem();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'academic' | 'eco' | 'experience'>('all');
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);
  
  // Redeem Confirmation Dialog State
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Categorize rewards automatically based on content keywords
  const getRewardCategory = (reward: any): 'academic' | 'eco' | 'experience' => {
    const name = reward.name.toLowerCase();
    const desc = reward.description.toLowerCase();
    const hint = (reward.imageHint || '').toLowerCase();

    if (
      name.includes('uniforme') || name.includes('lugar') || name.includes('prova') || 
      name.includes('entrega') || name.includes('atrasada') || desc.includes('aula') || 
      desc.includes('professor') || desc.includes('trabalho')
    ) {
      return 'academic';
    }
    
    if (
      name.includes('horta') || name.includes('ecobag') || name.includes('termica') || 
      name.includes('arvore') || name.includes('muda') || desc.includes('reciclagem') || 
      desc.includes('biodegradavel') || hint.includes('plant') || hint.includes('ecology')
    ) {
      return 'eco';
    }

    return 'experience';
  };

  // Filter rewards
  const filteredRewards = useMemo(() => {
    return allRewards.filter(reward => {
      // 1. Search text filter
      const matchesSearch = 
        reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Category tab filter
      const category = getRewardCategory(reward);
      const matchesCategory = activeCategory === 'all' || category === activeCategory;

      // 3. Affordable filter
      const matchesAffordable = !showAffordableOnly || balance >= reward.cost;

      return matchesSearch && matchesCategory && matchesAffordable;
    });
  }, [allRewards, searchTerm, activeCategory, showAffordableOnly, balance]);

  const handleOpenRedeemConfirm = (reward: any) => {
    setSelectedReward(reward);
    setIsConfirmOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    setIsRedeeming(true);

    // Simulando micro-animação
    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = deductPoints(selectedReward.cost);
    if (success) {
      recordRewardRedemption(selectedReward.id);
      toast({
        title: '🎉 Resgate Efetuado!',
        description: `"${selectedReward.name}" foi resgatado com sucesso!`,
      });
      setIsConfirmOpen(false);
      setSelectedReward(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Saldo Insuficiente',
        description: 'Ops, você não tem Bio-Coins suficientes para essa recompensa.',
      });
    }
    setIsRedeeming(false);
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto relative z-10 text-slate-800 dark:text-white">
      
      {/* Banner Superior Responsivo */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-white/5 bg-gradient-to-br from-white/95 to-slate-50/90 dark:from-slate-900/60 dark:to-slate-950/40 backdrop-blur-xl p-4 sm:p-8 text-slate-800 dark:text-white shadow-lg dark:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Catálogo de Prêmios</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg text-xs sm:text-sm leading-relaxed">
              Sua dedicação ao planeta vale ouro. Colete Bio-Coins descartando resíduos e responda quizzes para trocar por recompensas incríveis.
            </p>
          </div>
          
          {/* Bloco de Saldo Adaptativo */}
          <div className="bg-white/80 dark:bg-slate-950/65 shadow-md dark:shadow-2xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/65 dark:border-white/10 text-left md:text-right min-w-[200px] w-full md:w-auto relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-650 dark:text-emerald-400 mb-1 flex items-center gap-1 md:justify-end">
              <Coins className="h-3 w-3 animate-pulse text-emerald-500" /> Seu Saldo Disponível
            </p>
            <div className="flex items-baseline md:justify-end gap-1.5">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 dark:text-white bg-clip-text bg-gradient-to-r from-slate-900 via-slate-850 to-slate-850 dark:from-white dark:to-slate-200">
                {balance.toLocaleString('pt-BR')}
              </span>
              <span className="text-[9px] font-black text-slate-400 dark:text-emerald-400">Bio-Coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          
          {/* Input de Busca */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Buscar recompensas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/10 rounded-xl focus-visible:ring-emerald-500 text-sm font-medium"
            />
          </div>

          {/* Toggle "Affordable" */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowAffordableOnly(!showAffordableOnly)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all duration-300 shadow-sm",
                showAffordableOnly
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/10"
                  : "bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/60"
              )}
            >
              <Coins className="h-3.5 w-3.5" />
              Apenas acessíveis ({allRewards.filter(r => balance >= r.cost).length})
            </button>
          </div>
        </div>

        {/* Abas de Categorias */}
        <div className="flex flex-wrap gap-2 border-t border-slate-200/50 dark:border-white/5 pt-3">
          {[
            { id: 'all', label: 'Todas', icon: Gift },
            { id: 'academic', label: 'Privilégios Escolares', icon: Check },
            { id: 'eco', label: 'Sustentabilidade', icon: Coins },
            { id: 'experience', label: 'Lazer & Estilo', icon: ShoppingCart }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 border",
                  isActive
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-md"
                    : "bg-white/60 dark:bg-slate-950/20 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-950/40 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vitrine de Prêmios - 2 Colunas Mobile */}
      {filteredRewards.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8">
          {filteredRewards.map((reward) => {
            const hasEnoughCoins = balance >= reward.cost;
            const rewardImageUrl = getRewardImage(reward.image, reward.imageHint, reward.name);

            return (
              <Card 
                key={reward.id} 
                className={cn(
                  "group flex flex-col overflow-hidden border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-500 rounded-2xl sm:rounded-[2rem] bg-white dark:bg-slate-900/30 backdrop-blur-xl relative",
                  !hasEnoughCoins && "opacity-85"
                )}
              >
                {/* Imagem do Card com gradiente superior */}
                <div className="relative h-28 sm:h-52 w-full overflow-hidden bg-slate-950">
                  <Image
                    src={rewardImageUrl}
                    alt={reward.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  
                  {/* Categoria Tag no Card */}
                  <span className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                    {getRewardCategory(reward) === 'academic' ? 'Privilégio' : getRewardCategory(reward) === 'eco' ? 'Ecológico' : 'Lazer'}
                  </span>

                  {/* Custo em Moedas */}
                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-emerald-500 text-white px-2 py-1 rounded-lg shadow-lg border border-emerald-400/20 flex items-center gap-1">
                    <Coins className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span className="text-[9px] sm:text-[11px] font-black">{reward.cost} Bio-Coins</span>
                  </div>
                </div>
                
                {/* Detalhes do Card */}
                <CardHeader className="p-3 sm:p-5 pb-1 sm:pb-1 flex-grow">
                  <CardTitle className="text-xs sm:text-base font-black text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight uppercase tracking-tight line-clamp-1">
                    {reward.name}
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400 font-medium text-[9px] sm:text-[11px] line-clamp-2 leading-relaxed mt-1">
                    {reward.description}
                  </CardDescription>
                </CardHeader>
                
                {/* Rodapé do Card com ação */}
                <CardFooter className="p-2.5 sm:p-5 pt-0">
                  <Button
                    className={cn(
                      "w-full rounded-xl sm:rounded-2xl font-black uppercase text-[8px] sm:text-[10px] tracking-widest h-8 sm:h-11 transition-all duration-300",
                      hasEnoughCoins 
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-emerald-500/25 active:scale-95 border-0" 
                        : "bg-slate-100 dark:bg-slate-950/45 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-white/5 cursor-not-allowed"
                    )}
                    onClick={() => handleOpenRedeemConfirm(reward)}
                    disabled={!hasEnoughCoins}
                  >
                    {hasEnoughCoins ? (
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" /> Resgatar
                      </span>
                    ) : (
                      "Saldo Insuficiente"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/40 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl backdrop-blur-md">
          <Gift className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3 animate-bounce" />
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nenhuma recompensa encontrada</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs text-center font-medium">
            Tente mudar os filtros de busca ou categorias para encontrar o que procura.
          </p>
        </div>
      )}

      {/* Modal Premium de Confirmação de Resgate */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md rounded-3xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 backdrop-blur-xl text-slate-800 dark:text-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-500" /> Confirmar Resgate
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              Por favor, revise os detalhes da transação de resgate.
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="space-y-5 my-4">
              {/* Box da Recompensa Escolhida */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-950">
                  <Image
                    src={getRewardImage(selectedReward.image, selectedReward.imageHint, selectedReward.name)}
                    alt={selectedReward.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-slate-850 dark:text-white tracking-tight truncate">
                    {selectedReward.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedReward.description}
                  </p>
                </div>
              </div>

              {/* Transação / Receipt de Bio-Coins */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Saldo Atual:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{balance} Bio-Coins</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-rose-500">
                  <span>Custo do Item:</span>
                  <span className="font-black">- {selectedReward.cost} Bio-Coins</span>
                </div>
                <div className="border-t border-emerald-500/10 my-2 pt-2 flex justify-between text-xs font-black">
                  <span className="text-slate-700 dark:text-slate-300">Novo Saldo Restante:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{balance - selectedReward.cost} Bio-Coins</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 rounded-xl h-11 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-black uppercase tracking-wider"
              disabled={isRedeeming}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRedeem}
              className="flex-1 rounded-xl h-11 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/15"
              disabled={isRedeeming}
            >
              {isRedeeming ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-1 justify-center">
                  Confirmar <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

