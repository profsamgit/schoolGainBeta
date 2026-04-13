'use client';

import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  Droplets, 
  Wind, 
  TreeDeciduous, 
  Fish, 
  Bird, 
  Dog,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { EcosystemItem } from '@/lib/ecosystem.service';
import Link from 'next/link';
import { EcosystemViewer } from '@/components/ecosystem/EcosystemViewer';

export default function MeuEcossistemaPage() {
  const { 
    balance, 
    vitality, 
    purchasedItems, 
    buyUpgrade,
    healVitality 
  } = useEcosystem();

  const [isShopVisible, setIsShopVisible] = useState(false);
  const [lastPurchased, setLastPurchased] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isHealing, setIsHealing] = useState(false);

  const handleBuy = (id: EcosystemItem) => {
    const success = buyUpgrade(id);
    if (success) {
      setLastPurchased(id);
      setTimeout(() => setLastPurchased(null), 2000);
    }
  };

  const handleHealAction = (amount: number) => {
    const success = healVitality(amount);
    if (success) {
      setIsHealing(true);
      setTimeout(() => setIsHealing(false), 3000);
    }
  };

  const shopItems = [
    // FUNDAÇÃO
    { id: 'filtro_ar', name: 'Filtro de Ar', icon: <Wind />, price: 200, req: null, minVitality: 70, category: 'Base' },
    { id: 'limpar_rio', name: 'Limpeza do Rio', icon: <Droplets />, price: 300, req: null, minVitality: 70, category: 'Base' },
    { id: 'reparar_grama', name: 'Restaurar Solo', icon: <Leaf />, price: 150, req: null, minVitality: 70, category: 'Base' },
    
    // FLORA (ÁRVORES INDIVIDUAIS)
    { id: 'arvore_1', name: 'Carvalho Norte', icon: <TreeDeciduous className="text-emerald-700" />, price: 200, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Flora' },
    { id: 'arvore_2', name: 'Sumit Central', icon: <TreeDeciduous className="text-emerald-600 scale-125" />, price: 200, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Flora' },
    { id: 'arvore_3', name: 'Salgueiro Sul', icon: <TreeDeciduous className="text-emerald-500 scale-90" />, price: 200, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Flora' },
    
    // FAUNA (ANIMAIS INDIVIDUAIS)
    { id: 'peixe_1', name: 'Peixe Dourado', icon: <Fish className="text-orange-400" />, price: 100, req: 'Rio Aberto', reqId: 'limpar_rio', category: 'Fauna' },
    { id: 'peixe_2', name: 'Peixe Turquesa', icon: <Fish className="text-cyan-400" />, price: 100, req: 'Rio Aberto', reqId: 'limpar_rio', category: 'Fauna' },
    { id: 'peixe_3', name: 'Peixe Alvo', icon: <Fish className="text-slate-100" />, price: 100, req: 'Rio Aberto', reqId: 'limpar_rio', category: 'Fauna' },
    { id: 'passaro_1', name: 'Rouxinol', icon: <Bird className="text-sky-300" />, price: 150, req: 'Árvore 1', reqId: 'arvore_1', category: 'Fauna' },
    { id: 'passaro_2', name: 'Beija-flor', icon: <Bird className="text-purple-300" />, price: 150, req: 'Árvore 2', reqId: 'arvore_2', category: 'Fauna' },
    { id: 'cachorro', name: 'Cachorro', icon: <Dog className="text-amber-700" />, price: 400, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Fauna' },
    { id: 'coelho', name: 'Coelho', icon: <Sparkles className="text-slate-300" />, price: 250, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Fauna' }, 
    { id: 'borboletas', name: 'Borboletas', icon: <Sparkles className="text-yellow-400" />, price: 150, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Fauna' },
    { id: 'monstro_lago', name: 'Lenda do Lago', icon: <Sparkles className="text-teal-400 animate-pulse" />, price: 2000, req: 'Ecossistema 100% Restaurado', minVitality: 100, category: 'Lendário' },
  ];

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden font-sans">
      {/* CENA VISUAL (COMPONENTE REUTILIZÁVEL) */}
      <EcosystemViewer 
        vitality={vitality} 
        purchasedItems={purchasedItems as any} 
        className="absolute inset-0"
      />

      {/* INTERFACE DE CABEÇALHO */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
          <Link href="/dashboard">
              <Button size="icon" variant="ghost" className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white shrink-0">
                  <ArrowLeft size={20} />
              </Button>
          </Link>
          <div className="px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center gap-3 shadow-2xl">
              <div className="p-1.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50">
                  <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-white tracking-widest leading-none">
                {balance} <span className="text-[10px] opacity-50 font-medium">PTS</span>
              </span>
          </div>
      </div>

      {/* BARRA DE VITALIDADE */}
      <div className="absolute top-6 right-6 z-50">
          <div className="px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4">
              <div className="text-right">
                  <p className="text-2xl font-black text-white leading-none">{vitality}%</p>
              </div>
              <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden border border-white/10 backdrop-blur-md">
                  <div 
                      className={cn(
                          "h-full transition-all duration-1000 rounded-full",
                          vitality > 70 ? "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]" : 
                          vitality > 30 ? "bg-amber-400" : "bg-red-500"
                      )}
                      style={{ width: `${vitality}%` }}
                  />
              </div>
              {vitality < 100 && balance >= 100 && (
                  <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleHealAction(100)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400 group-hover:animate-spin" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Recuperar Vitalidade (+10%)</span>
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* PORTAL DE RESTAURAÇÃO (BLOQUEIO POR VITALIDADE) */}
      {vitality < 70 && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-1000">
              <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 blur-[100px] rounded-full" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-[100px] rounded-full" />
                  
                  <div className="relative z-10 text-center space-y-8">
                      <div className="inline-flex p-5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl shadow-2xl shadow-rose-500/30 animate-pulse mb-2">
                          <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      
                      <div className="space-y-3">
                          <h2 className="text-4xl font-black text-white tracking-tight leading-loose">Ecossistema em Perigo</h2>
                          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                              Sua vitalidade está crítica. <span className="text-emerald-400 font-bold">Restaure a vida</span> para desbloquear o Reflorestamento e a limpeza do Rio.
                          </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 pt-4">
                          <Button 
                              onClick={() => handleHealAction(100)}
                              disabled={balance < 100}
                              className={cn(
                                  "h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 border border-white/5",
                                  balance >= 100 
                                      ? "bg-white/5 hover:bg-white/15 text-white hover:scale-105" 
                                      : "bg-white/5 opacity-30 grayscale"
                              )}
                          >
                              <div className="flex flex-col items-center">
                                  <span>Curar Pouco (+10%)</span>
                                  <span className="text-[9px] opacity-50 font-bold mt-1">100 PTS</span>
                              </div>
                          </Button>
                          
                          <Button 
                              onClick={() => handleHealAction(500)}
                              disabled={balance < 500}
                              className={cn(
                                  "h-20 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-700 shadow-2xl",
                                  balance >= 500 
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white hover:scale-[1.03] shadow-emerald-500/30" 
                                      : "bg-white/10 opacity-30 grayscale"
                              )}
                          >
                              <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-2">
                                      <Leaf className="w-4 h-4" />
                                      <span>Restauração Máxima (+50%)</span>
                                  </div>
                                  <span className="text-[10px] opacity-70 font-bold mt-1">500 PTS</span>
                              </div>
                          </Button>
                      </div>

                      {balance < 100 && (
                          <div className="pt-4 animate-bounce">
                              <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest italic">
                                  Saldo insuficiente! Vá ao Kiosk coletar resíduos.
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- GATILHO DA LOJA (LUMINOUS ORB) --- */}
      <div className="absolute bottom-10 right-10 z-50">
          <button 
            onClick={() => setIsShopVisible(true)}
            className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl group",
                "bg-indigo-500/20 backdrop-blur-3xl border border-white/20 hover:scale-110 hover:bg-indigo-500/40",
                isShopVisible ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"
            )}
          >
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse" />
              <Leaf className="w-8 h-8 text-white animate-bounce" />
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-full border border-white/20 shadow-lg uppercase tracking-tighter">Loja Bio</div>
          </button>
      </div>

      {/* --- MENU DE COMPRA (BIO-SHOP DOCK) --- */}
      <div className={cn(
          "absolute bottom-0 inset-x-0 z-50 p-6 flex justify-center transition-all duration-1000 transform",
          isShopVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}>
          <div className="relative w-full max-w-6xl">
              <div className="bg-slate-950/40 backdrop-blur-[50px] rounded-[3.5rem] p-6 border border-white/10 shadow-[0_-30px_100px_rgba(0,0,0,0.8)]">
                  {/* HEADER DA LOJA */}
                  <div className="flex justify-between items-center mb-6 px-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
                              <Leaf className="w-4 h-4 text-white" />
                          </div>
                          <div>
                              <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Restaurar Ecossistema</h3>
                              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Invista seus pontos em vida e beleza</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setIsShopVisible(false)}
                        className="p-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 rounded-2xl text-white/50 hover:text-rose-400 transition-all group"
                      >
                         <span className="text-[10px] font-black uppercase tracking-widest mr-2 group-hover:inline hidden">Fechar Vista</span>
                         <CheckCircle2 size={18} />
                      </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {shopItems.map((item, idx) => {
                        const isPurchased = purchasedItems.includes(item.id as EcosystemItem);
                        const isRequirementLocked = item.reqId ? (!purchasedItems.includes(item.reqId as EcosystemItem) && !isPurchased) : false;
                        const isVitalityLocked = item.minVitality ? (vitality < item.minVitality && !isPurchased) : false;
                        const isLocked = isRequirementLocked || isVitalityLocked;
                        const canAfford = balance >= item.price;
                        
                        return (
                            <div 
                                key={item.id}
                                className="relative"
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            >
                                {hoveredIdx === idx && (
                                    <div className="absolute -top-[12rem] left-1/2 -translate-x-1/2 w-56 animate-in slide-in-from-bottom-2 duration-300 pb-12 pointer-events-auto z-[100]">
                                        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl text-white relative">
                                            <div className="absolute top-full left-0 right-0 h-12" />
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-black uppercase text-white/50">{item.name}</span>
                                                {isPurchased ? <ShieldCheck className="text-emerald-400" size={16} /> : isLocked ? <Lock className="text-rose-500" size={16} /> : <Coins className="text-indigo-400" size={16} />}
                                            </div>
                                            {isPurchased ? <p className="text-[10px] text-emerald-400 font-bold uppercase leading-relaxed">Já ativo no seu ecossistema!</p> : isLocked ? <p className="text-[10px] text-rose-300 font-bold uppercase leading-relaxed">{isVitalityLocked ? `Vitalidade Baixa (Requer 70%)` : `Bloqueado: Requer ${item.req}`}</p> : <div className="space-y-4"><div className="flex items-end gap-1"><span className="text-2xl font-black">{item.price}</span><span className="text-[10px] text-white/40 font-bold mb-1">PTS</span></div><Button disabled={!canAfford} onClick={() => handleBuy(item.id as EcosystemItem)} className={cn("w-full rounded-xl font-bold text-[10px] uppercase h-9 tracking-tighter", canAfford ? "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30" : "bg-white/10")}>{canAfford ? 'Comprar Agora' : 'Saldo Insuficiente'}</Button></div>}
                                        </div>
                                    </div>
                                )}
                                <button className={cn("group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500", isPurchased && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", isLocked && "bg-black/40 text-slate-600 grayscale border border-white/5", !isPurchased && !isLocked && "bg-white/10 text-white border border-white/10 hover:scale-110 hover:bg-white/20 active:scale-95", canAfford && !isPurchased && !isLocked && "shadow-[0_0_20px_rgba(99,102,241,0.3)] border-indigo-500/40")}>{item.icon}{isPurchased && <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5"><CheckCircle2 size={10} className="text-white" /></div>}{isLocked && <Lock size={12} className="absolute -bottom-1 -right-1 text-slate-500" />}</button>
                            </div>
                        );
                    })}
                  </div>
              </div>
          </div>
      </div>

      {/* EFEITOS DE COMPRA/CURA */}
      {(lastPurchased || isHealing) && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <Sparkles className={cn(
                "w-48 h-48 animate-ping opacity-50",
                isHealing ? "text-emerald-400" : "text-yellow-300"
            )} />
          </div>
        )}
    </div>
  );
}
