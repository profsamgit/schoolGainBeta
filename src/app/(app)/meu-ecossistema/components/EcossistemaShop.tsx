'use client';

import { 
  Leaf, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EcosystemItem } from '@/lib/types';

interface EcossistemaShopProps {
  isShopVisible: boolean;
  setIsShopVisible: (visible: boolean) => void;
  shopItems: any[];
  purchasedItems: EcosystemItem[];
  vitality: number;
  balance: number;
  isNessieAvailable: () => boolean;
  handleBuy: (id: EcosystemItem) => void;
  setHoveredIdx: (idx: number | null) => void;
}

export function EcossistemaShop({
  isShopVisible,
  setIsShopVisible,
  shopItems,
  purchasedItems,
  vitality,
  balance,
  isNessieAvailable,
  handleBuy,
  setHoveredIdx
}: EcossistemaShopProps) {
  return (
    <>
      {/* GATILHO DA LOJA */}
      <div className={cn(
          "absolute bottom-10 right-10 z-[70] transition-all duration-1000",
          isShopVisible ? "opacity-0 scale-50 pointer-events-none translate-y-20" : "opacity-100 scale-100"
      )}>
          <button 
            onClick={() => setIsShopVisible(true)}
            className="w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-[0_30px_60px_rgba(0,0,0,0.5)] bg-slate-900 border border-white/20 hover:scale-110 hover:border-indigo-500/50 group relative overflow-hidden"
          >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Leaf className="w-9 h-9 text-indigo-400 group-hover:text-white transition-colors animate-pulse" />
              <span className="text-[9px] font-black text-white/40 group-hover:text-white uppercase tracking-widest mt-1">BIO SHOP</span>
          </button>
      </div>

      {/* NOVO DOCK DE COMPRAS */}
      <div className={cn(
          "absolute bottom-0 inset-x-0 z-[150] p-10 flex justify-center transition-all duration-1000 transform",
          isShopVisible ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0 pointer-events-none"
      )}>
          <div className="relative w-full max-w-5xl">
              <div className="absolute -inset-10 bg-indigo-500/20 blur-[100px] rounded-full opacity-50" />
              
              <div className="bg-black/40 backdrop-blur-[45px] rounded-[4rem] p-4 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col gap-6">
                  <div className="flex justify-between items-center px-8 pt-6 pb-2 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tighter uppercase">Bio-Ecossistema</h3>
                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest leading-none">Biodiversidade & Sustentabilidade</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsShopVisible(false)}
                        className="w-12 h-12 bg-white/5 hover:bg-rose-500/20 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-rose-400 transition-all group/close"
                    >
                        <X size={24} className="group-hover/close:rotate-90 transition-transform" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-10 pb-12 px-8 overflow-y-auto max-h-[60vh] scrollbar-hide pt-4">
                    {[
                        { id: 'Base', label: 'Habitat Base', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                        { id: 'Flora', label: 'Flora & Vegetação', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { id: 'Fauna', label: 'Fauna Silvestre', color: 'text-sky-400', bg: 'bg-sky-500/10' },
                        { id: 'Lendário', label: 'Itens Lendários', color: 'text-amber-400', bg: 'bg-amber-500/10' }
                    ].map((cat) => {
                        const catItems = shopItems.filter(item => item.category === cat.id);
                        if (catItems.length === 0) return null;

                        return (
                            <div key={cat.id} className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]", cat.bg, cat.color)}>
                                        {cat.label}
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-start gap-5 overflow-visible">
                                    {catItems.map((item) => {
                                        const idx = shopItems.indexOf(item);
                                        const isPurchased = purchasedItems.includes(item.id as EcosystemItem);
                                        const isRequirementLocked = item.reqId ? (!purchasedItems.includes(item.reqId as EcosystemItem) && !isPurchased) : false;
                                        const isVitalityLocked = item.minVitality ? (vitality < item.minVitality && !isPurchased) : false;
                                        const regularItemsCount = shopItems.filter(i => i.category !== 'Lendário').length;
                                        const purchasedRegularCount = shopItems.filter(i => i.category !== 'Lendário' && purchasedItems.includes(i.id as EcosystemItem)).length;
                                        const isLegendaryLocked = item.category === 'Lendário' && purchasedRegularCount < regularItemsCount && !isPurchased;
                                        const isNessieSoldOut = item.id === 'monstro_lago' && !isNessieAvailable() && !isPurchased;
                                        const isLocked = isRequirementLocked || isVitalityLocked || isLegendaryLocked || isNessieSoldOut;
                                        const canAfford = balance >= item.price;

                                        const categoryStyles = {
                                            Base: "border-indigo-500/20 group-hover:border-indigo-500/50 shadow-indigo-500/5",
                                            Flora: "border-emerald-500/20 group-hover:border-emerald-500/50 shadow-emerald-500/5",
                                            Fauna: "border-sky-500/20 group-hover:border-sky-500/50 shadow-sky-500/5",
                                            Lendário: "border-amber-500/20 group-hover:border-amber-500/50 shadow-amber-500/5",
                                        }[item.category as string] || "border-white/10";
                                        
                                        return (
                                            <div 
                                                key={item.id}
                                                className="relative flex flex-col items-center gap-4 w-28 group/item"
                                                onMouseEnter={() => setHoveredIdx(idx)}
                                                onMouseLeave={() => setHoveredIdx(null)}
                                            >
                                                <button 
                                                    onClick={() => !isLocked && !isPurchased && handleBuy(item.id as EcosystemItem)}
                                                    className={cn(
                                                        "group/icon relative w-20 h-20 rounded-[1.8rem] flex items-center justify-center transition-all duration-700 border-2 overflow-hidden",
                                                        isPurchased ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : 
                                                        isLocked ? "bg-black/40 text-white/10 border-white/5 grayscale" : 
                                                        cn("bg-white/5 text-white/80 hover:text-white hover:-translate-y-2 bg-gradient-to-br from-white/5 to-transparent shadow-xl", categoryStyles)
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute inset-0 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-700",
                                                        item.category === 'Base' ? "bg-indigo-500/5" :
                                                        item.category === 'Flora' ? "bg-emerald-500/5" :
                                                        item.category === 'Fauna' ? "bg-sky-500/5" : "bg-amber-500/10"
                                                    )} />

                                                    <div className="relative z-10 scale-150 transform-gpu transition-transform duration-700 group-hover/icon:scale-[1.8]">{item.icon}</div>
                                                    
                                                    {isPurchased && (
                                                        <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-0.5 shadow-lg z-20">
                                                            <CheckCircle2 size={8} className="text-white" />
                                                        </div>
                                                    )}
                                                </button>

                                                <button 
                                                    disabled={isLocked || isPurchased || !canAfford}
                                                    onClick={() => handleBuy(item.id as EcosystemItem)}
                                                    className={cn(
                                                        "w-full h-8 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border relative overflow-hidden",
                                                        isPurchased 
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-default" 
                                                            : isLocked 
                                                                ? "bg-white/5 text-white/10 border-white/5 cursor-not-allowed"
                                                                : canAfford
                                                                    ? "bg-white text-slate-950 hover:bg-slate-200 hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
                                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20 cursor-not-allowed"
                                                    )}
                                                >
                                                    <div className="relative z-10 flex items-center justify-center gap-1.5">
                                                        {isPurchased ? (
                                                            <>
                                                                <ShieldCheck size={10} />
                                                                <span>Ativo</span>
                                                            </>
                                                        ) : isLocked ? (
                                                            <>
                                                                <Lock size={10} />
                                                                <span>{isNessieSoldOut ? 'Esgotado' : 'Bloqueado'}</span>
                                                            </>
                                                        ) : (
                                                            <span>{canAfford ? 'Comprar' : 'Sem Saldo'}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}
