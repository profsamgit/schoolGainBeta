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
import { EcosystemItem } from '@/types/ecosystem';

interface EcossistemaShopProps {
  isShopVisible: boolean;
  setIsShopVisible: (visible: boolean) => void;
  shopItems: any[];
  purchasedItems: EcosystemItem[];
  vitality: number;
  balance: number;
  isNessieAvailable: () => boolean;
  handleBuy: (id: EcosystemItem) => void;
  handleRefund: (id: EcosystemItem) => void;
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
  handleRefund,
  setHoveredIdx
}: EcossistemaShopProps) {
  return (
    <>

      {/* NOVO DOCK DE COMPRAS - REDESIGN PREMIUM */}
      <div className={cn(
          "fixed bottom-0 inset-x-0 z-[150] p-0 md:p-6 lg:p-10 flex justify-center transition-all duration-1000 transform",
          isShopVisible ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0 pointer-events-none"
      )}>
          <div className="relative w-full max-w-6xl">
              <div className="absolute -inset-20 bg-indigo-500/10 blur-[120px] rounded-full opacity-30 animate-pulse" />
              
              <div className="bg-slate-950/95 md:bg-black/60 backdrop-blur-[20px] md:backdrop-blur-[60px] rounded-t-[2.5rem] md:rounded-[3rem] rounded-b-none md:rounded-[3rem] p-1 md:p-2 border-t md:border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col gap-2 overflow-hidden max-h-[90vh] md:max-h-[85vh]">
                  {/* HEADER DA LOJA */}
                  <div className="flex justify-between items-center px-4 md:px-10 pt-6 md:pt-8 pb-2 md:pb-4 relative z-10">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-white/5 flex-shrink-0">
                            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <h3 className="text-white font-black text-lg md:text-2xl tracking-tighter uppercase italic">Bio-Shop</h3>
                                <span className="px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[8px] font-black text-indigo-400 uppercase tracking-widest">v2.0</span>
                            </div>
                            <p className="text-white/40 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mt-0.5">Bio-Catalisador</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex flex-col items-end mr-2 md:mr-4">
                            <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">Saldo</span>
                            <span className="text-sm md:text-xl font-black text-emerald-400 tracking-widest tabular-nums">₵ {balance.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={() => setIsShopVisible(false)}
                            className="w-10 h-10 md:w-14 md:h-14 bg-white/5 hover:bg-rose-500/20 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-rose-400 transition-all group/close flex-shrink-0"
                        >
                            <X size={20} className="md:w-7 md:h-7 group-hover/close:rotate-90 transition-transform" />
                        </button>
                    </div>
                  </div>

                  {/* CONTEÚDO SCROLLABLE */}
                  <div className="flex flex-col gap-6 md:gap-12 pb-24 md:pb-14 px-4 md:px-10 overflow-y-auto max-h-[60vh] md:max-h-[50vh] scrollbar-hide pt-4 md:pt-6">
                    {[
                        { id: 'Base', label: 'Habitat Base', desc: 'Fundação necessária para qualquer forma de vida.', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                        { id: 'Flora', label: 'Flora & Vegetação', desc: 'Pulmões verdes do seu mundo virtual.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { id: 'Fauna', label: 'Fauna Silvestre', desc: 'Traga movimento e alma para o ecossistema.', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
                        { id: 'Lendário', label: 'Mítico & Lendário', desc: 'Conquistas supremas de sustentabilidade.', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
                    ].map((cat) => {
                        const catItems = shopItems.filter(item => item.category === cat.id);
                        if (catItems.length === 0) return null;

                        return (
                            <div key={cat.id} className="space-y-4 md:space-y-8">
                                <div className="flex items-center md:items-end gap-3 md:gap-6 px-1 md:px-2">
                                    <div className="flex flex-col flex-shrink-0">
                                        <div className={cn("px-3 py-1 md:px-4 md:py-1.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.25em] w-fit mb-1 md:mb-2", cat.bg, cat.color, "border", cat.border)}>
                                            {cat.label}
                                        </div>
                                        <p className="text-white/20 text-[8px] md:text-[10px] font-bold uppercase tracking-wider md:tracking-widest">{cat.desc}</p>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                </div>
                                
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                    {catItems.map((item) => {
                                        const idx = shopItems.indexOf(item);
                                        const isPurchased = purchasedItems.includes(item.id as EcosystemItem);
                                        const isRequirementLocked = item.reqId ? (!purchasedItems.includes(item.reqId as EcosystemItem) && !isPurchased) : false;
                                        const isVitalityLocked = item.minVitality ? (vitality < item.minVitality && !isPurchased) : false;
                                        const isLegendaryLocked = item.id === 'monstro_lago' && 
                                            shopItems.filter(i => i.id !== 'monstro_lago').some(i => !purchasedItems.includes(i.id as EcosystemItem)) && 
                                            !isPurchased;
                                        const isNessieSoldOut = item.id === 'monstro_lago' && !isNessieAvailable() && !isPurchased;
                                        const isLocked = isRequirementLocked || isVitalityLocked || isLegendaryLocked || isNessieSoldOut;
                                        const canAfford = balance >= item.price;

                                        return (
                                            <div 
                                                key={item.id}
                                                className={cn(
                                                    "group/card relative flex flex-col p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all duration-700",
                                                    isPurchased 
                                                        ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_20px_40px_rgba(16,185,129,0.05)]" 
                                                        : isLocked 
                                                            ? "bg-black/20 border-white/5 opacity-60" 
                                                            : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
                                                )}
                                                onMouseEnter={() => setHoveredIdx(idx)}
                                                onMouseLeave={() => setHoveredIdx(null)}
                                            >
                                                {/* ICON CONTAINER */}
                                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                                    <div className={cn(
                                                        "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-700 flex-shrink-0",
                                                        isPurchased ? "bg-emerald-500/20 text-emerald-400" : 
                                                        isLocked ? "bg-white/5 text-white/10" : "bg-white/10 text-white group-hover/card:scale-110"
                                                    )}>
                                                        <div className="scale-[1.1] md:scale-[1.3]">{item.icon}</div>
                                                    </div>
                                                    
                                                    {!isPurchased && !isLocked && (
                                                        <div className="px-2 py-0.5 md:px-3 md:py-1 bg-white/10 rounded-lg border border-white/10 text-emerald-400 font-black text-[10px] md:text-xs tabular-nums flex-shrink-0">
                                                            ₵{item.price}
                                                        </div>
                                                    )}

                                                    {item.id === 'monstro_lago' && !isPurchased && (
                                                        <div className={cn(
                                                            "px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-tighter flex-shrink-0",
                                                            isNessieSoldOut ? "bg-rose-500/20 text-rose-400" : "bg-amber-400/20 text-amber-400 animate-pulse"
                                                        )}>
                                                            {isNessieSoldOut ? 'Sem Vagas' : 'Limitado'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* INFO */}
                                                <div className="space-y-1 mb-4 md:mb-6 flex-1 flex flex-col justify-between">
                                                    <h4 className={cn(
                                                        "font-black text-[10px] md:text-xs uppercase tracking-wider line-clamp-1",
                                                        isPurchased ? "text-emerald-400" : "text-white"
                                                    )}>{item.name}</h4>
                                                    <p className="text-white/30 text-[8px] md:text-[9px] font-medium leading-tight md:leading-relaxed min-h-[30px] line-clamp-2 md:line-clamp-none">
                                                        {item.desc || "Item decorativo para seu mundo virtual."}
                                                    </p>
                                                </div>

                                                {/* REQUISITOS (SE BLOQUEADO) */}
                                                {isLocked && !isPurchased && (
                                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-[3px] rounded-[1.3rem] md:rounded-[1.8rem] p-3 md:p-6 text-center animate-in fade-in duration-500">
                                                        {isNessieSoldOut ? (
                                                            <div className="space-y-1 md:space-y-2">
                                                                <X className="w-6 h-6 md:w-10 md:h-10 text-rose-500 mx-auto mb-1" />
                                                                <h5 className="text-white font-black text-[10px] md:text-xs uppercase tracking-widest">Esgotado</h5>
                                                                <p className="text-white/40 text-[7px] md:text-[8px] font-bold uppercase leading-tight">
                                                                    Limite mensal de 3 agentes atingido.<br/>Tente novamente no próximo ciclo!
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <Lock className="w-5 h-5 md:w-8 md:h-8 text-white/20 mb-2" />
                                                                <p className="text-white/60 text-[8px] md:text-[9px] font-black uppercase tracking-wider leading-tight">
                                                                    {isLegendaryLocked ? "Requer Ecossistema Completo" : isRequirementLocked ? `Requer ${item.req}` : `Requer Vitalidade ${item.minVitality}%`}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* BOTÃO DE AÇÃO */}
                                                <button 
                                                    disabled={isLocked || (!isPurchased && !canAfford)}
                                                    onClick={() => isPurchased ? handleRefund(item.id as EcosystemItem) : handleBuy(item.id as EcosystemItem)}
                                                    className={cn(
                                                        "w-full py-2 md:py-2.5 rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all duration-500 border relative overflow-hidden group/btn",
                                                        isPurchased 
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 cursor-pointer" 
                                                            : isLocked 
                                                                ? "hidden"
                                                                : canAfford
                                                                    ? "bg-white text-slate-950 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20 cursor-not-allowed"
                                                    )}
                                                >
                                                    <span className="relative z-10 flex items-center justify-center gap-1 md:gap-2">
                                                        {isPurchased ? (
                                                            <>
                                                                <ShieldCheck size={12} className="md:w-3.5 md:h-3.5 group-hover/btn:hidden" />
                                                                <span className="group-hover/btn:hidden">Adquirido</span>
                                                                <span className="hidden group-hover/btn:inline">Reembolsar</span>
                                                            </>
                                                        ) : (
                                                            <span>{canAfford ? 'Comprar' : 'Saldo'}</span>
                                                        )}
                                                    </span>
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
