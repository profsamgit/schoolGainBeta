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
  ShieldCheck,
  X,
  Cloud,
  Moon as MoonIcon,
  Sun as SunIcon,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { EcosystemItem } from '@/lib/types';
import Link from 'next/link';
import { EcosystemViewer } from '@/components/ecosystem/EcosystemViewer';

export default function MeuEcossistemaPage() {
  const { 
    balance = 0, 
    vitality = 0, 
    purchasedItems = [], 
    buyUpgrade,
    healVitality,
    isNessieAvailable
  } = useEcosystem();

  const [isShopVisible, setIsShopVisible] = useState(false);
  const [lastPurchased, setLastPurchased] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isHealing, setIsHealing] = useState(false);
  const [showVitalityWarning, setShowVitalityWarning] = useState(true);

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
    { id: 'borboletas', name: 'Borboletas 1', icon: <Sparkles className="text-yellow-400" />, price: 150, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Fauna' },
    { id: 'borboletas_2', name: 'Borboletas 2', icon: <Sparkles className="text-blue-400" />, price: 200, req: 'Borboletas 1', reqId: 'borboletas', category: 'Fauna' },
    { id: 'borboletas_3', name: 'Borboletas 3', icon: <Sparkles className="text-purple-400" />, price: 250, req: 'Borboletas 2', reqId: 'borboletas_2', category: 'Fauna' },
    { id: 'barco_1', name: 'Barco 1', icon: <Waves className="text-cyan-400" />, price: 500, req: 'Rio Limpo', reqId: 'limpar_rio', category: 'Lendário' },
    { id: 'barco_2', name: 'Barco 2', icon: <Waves className="text-indigo-400" />, price: 600, req: 'Barco 1', reqId: 'barco_1', category: 'Lendário' },
    { id: 'casa', name: 'Casa Sustentável', icon: <Sparkles className="text-amber-400 animate-pulse" />, price: 1500, req: 'Requisita Ecossistema Full', minVitality: 100, category: 'Lendário' },
    { id: 'monstro_lago', name: 'Nessie (Lendário)', icon: <Waves className="text-emerald-400 animate-bounce" />, price: 5000, req: 'Casa Sustentável', reqId: 'casa', category: 'Lendário' },
  ];

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden font-sans select-none">
      {/* CENA VISUAL (COMPONENTE REUTILIZÁVEL) */}
      <EcosystemViewer 
        vitality={vitality} 
        purchasedItems={purchasedItems as any} 
        className="absolute inset-0 transition-all transition-duration-[1000ms]"
      />

      {/* --- NOVO HUD PREMIUM (UNIFICADO) --- */}
      <div className="absolute top-8 inset-x-0 z-50 flex justify-center px-6 pointer-events-none">
          <div className="flex items-center gap-2 p-1.5 bg-black/20 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto group transition-all hover:bg-black/30">
              {/* VOLTAR */}
              <Link href="/dashboard">
                  <Button size="icon" variant="ghost" className="w-11 h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white transition-all hover:scale-105 active:scale-95 leading-none">
                      <ArrowLeft size={18} />
                  </Button>
              </Link>

              <div className="h-8 w-px bg-white/10 mx-1" />

              {/* SALDO */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 shadow-inner">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full shadow-lg shadow-indigo-500/40">
                      <Coins className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">Créditos</span>
                      <span className="text-lg font-black text-white tracking-widest leading-none tabular-nums">
                        {(balance || 0).toLocaleString()}
                      </span>
                  </div>
              </div>

              {/* VITALIDADE */}
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5 shadow-inner min-w-[240px]">
                  <div className="flex flex-col text-right">
                      <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">Vitalidade</span>
                      <span className={cn(
                          "text-lg font-black tracking-widest leading-none transition-colors duration-500",
                          (vitality || 0) > 70 ? "text-emerald-400" : (vitality || 0) > 30 ? "text-amber-400" : "text-rose-500"
                      )}>{vitality || 0}%</span>
                  </div>
                  
                  <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                      <div 
                          className={cn(
                              "h-full transition-all transition-duration-[1500ms] rounded-full",
                              vitality > 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]" : 
                              vitality > 30 ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-rose-600 to-red-500"
                          )}
                          style={{ width: `${vitality}%` }}
                      />
                  </div>

                  {vitality < 100 && balance >= 100 && (
                      <button 
                        onClick={() => handleHealAction(100)}
                        className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full border border-emerald-500/20 text-emerald-400 transition-all hover:scale-110 active:scale-90 group"
                        title="Recuperar Vitalidade (+10%)"
                      >
                        <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                      </button>
                  )}
              </div>
          </div>
      </div>

      {/* --- PORTAL DE RESTAURAÇÃO (MAIS ELEGANTE) --- */}
      {vitality < 70 && showVitalityWarning && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-[4px] animate-in fade-in duration-1000">
              <div className="w-full max-w-lg bg-slate-950/60 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 shadow-[0_80px_150px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                  <button 
                      onClick={() => setShowVitalityWarning(false)}
                      className="absolute top-8 right-10 z-20 p-2 text-white/20 hover:text-white transition-all hover:scale-110"
                      title="Fechar Aviso"
                  >
                      <X size={24} />
                  </button>
                  
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/10 blur-[120px] rounded-full animate-pulse" />
                  
                  <div className="relative z-10 text-center space-y-10">
                      <div className="inline-flex p-6 bg-gradient-to-br from-rose-500 to-orange-600 rounded-[2.5rem] shadow-[0_20px_40px_rgba(244,63,94,0.3)] mb-2 relative transform transition-transform group-hover:scale-110 duration-700">
                          <Droplets className="w-12 h-12 text-white animate-bounce" />
                      </div>
                      
                      <div className="space-y-4">
                          <h2 className="text-5xl font-black text-white tracking-tighter leading-none uppercase">Alerta Bio-Vital</h2>
                          <p className="text-slate-400 text-base font-medium leading-relaxed max-w-[340px] mx-auto opacity-70">
                              O ecossistema está instável. <span className="text-white font-black underline decoration-rose-500/50">Recupere a vitalidade</span> para desbloquear melhorias ambientais.
                          </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 pt-6">
                          <button 
                              onClick={() => handleHealAction(500)}
                              disabled={balance < 500}
                              className={cn(
                                  "group h-24 rounded-3xl font-black text-lg uppercase tracking-[0.2em] transition-all duration-700 shadow-2xl relative overflow-hidden",
                                  balance >= 500 
                                      ? "bg-white text-slate-950 hover:scale-[1.02] shadow-white/10" 
                                      : "bg-white/5 text-white/20 border border-white/5 grayscale"
                              )}
                          >
                              {balance >= 500 && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                              <div className="flex flex-col items-center justify-center relative z-10">
                                  <div className="flex items-center gap-3">
                                      <ShieldCheck className="w-6 h-6" />
                                      <span>Restauração (+50%)</span>
                                  </div>
                                  <span className="text-[11px] opacity-70 font-black mt-2 tracking-[0.3em]">500 CRÉDITOS</span>
                              </div>
                          </button>

                          <button 
                              onClick={() => handleHealAction(100)}
                              disabled={balance < 100}
                              className={cn(
                                  "h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 border border-white/10",
                                  balance >= 100 
                                      ? "bg-white/5 hover:bg-white/10 text-white hover:scale-105" 
                                      : "bg-white/5 text-white/20 grayscale"
                              )}
                          >
                            <span className="opacity-60">Injeção Vital (+10%)</span>
                            <span className="ml-3 text-[10px] py-1 px-2 bg-white/10 rounded-lg">100 CRÉDITOS</span>
                          </button>

                          <Link href="/dashboard">
                              <button className="w-full h-12 rounded-xl text-white/30 hover:text-white/60 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
                                Voltar ao Dashboard
                              </button>
                          </Link>
                      </div>

                      {balance < 100 && (
                          <div className="pt-6 animate-pulse">
                              <p className="text-[11px] text-rose-500 font-black uppercase tracking-[0.3rem]">
                                  Recursos escassos • Visite o Kiosk
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- GATILHO DA LOJA (MODERNO) --- */}
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

      {/* --- NOVO DOCK DE COMPRAS (DOCK STYLE) --- */}
      <div className={cn(
          "absolute bottom-0 inset-x-0 z-[150] p-10 flex justify-center transition-all duration-1000 transform",
          isShopVisible ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0 pointer-events-none"
      )}>
          <div className="relative w-full max-w-5xl">
              {/* EFEITO DE GLOW ATRÁS DO DOCK */}
              <div className="absolute -inset-10 bg-indigo-500/20 blur-[100px] rounded-full opacity-50" />
              
              <div className="bg-black/40 backdrop-blur-[45px] rounded-[4rem] p-4 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col gap-6">
                  {/* HEADER MINIMALISTA */}
                  {/* HEADER MINIMALISTA */}
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

                                        // Estilos baseados na categoria
                                        const categoryStyles = {
                                            Base: "border-indigo-500/20 group-hover:border-indigo-500/50 shadow-indigo-500/5",
                                            Flora: "border-emerald-500/20 group-hover:border-emerald-500/50 shadow-emerald-500/5",
                                            Fauna: "border-sky-500/20 group-hover:border-sky-500/50 shadow-sky-500/5",
                                            Lendário: "border-amber-500/20 group-hover:border-amber-500/50 shadow-amber-500/5 animate-pulse-subtle",
                                        }[item.category as string] || "border-white/10";
                                        
                                        return (
                                            <div 
                                                key={item.id}
                                                className="relative flex flex-col items-center gap-4 w-28 group/item"
                                                onMouseEnter={() => setHoveredIdx(idx)}
                                                onMouseLeave={() => setHoveredIdx(null)}
                                            >
                                                
                                                {/* ICON CONTAINER */}
                                                <button 
                                                    onClick={() => !isLocked && !isPurchased && handleBuy(item.id as EcosystemItem)}
                                                    className={cn(
                                                        "group/icon relative w-20 h-20 rounded-[1.8rem] flex items-center justify-center transition-all duration-700 border-2 overflow-hidden",
                                                        isPurchased ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : 
                                                        isLocked ? "bg-black/40 text-white/10 border-white/5 grayscale" : 
                                                        cn("bg-white/5 text-white/80 hover:text-white hover:-translate-y-2 bg-gradient-to-br from-white/5 to-transparent shadow-xl", categoryStyles),
                                                        canAfford && !isPurchased && !isLocked && "shadow-white/5"
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

                                                {/* ACTION BUTTON BELOW */}
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

      {/* EFEITOS DE COMPRA/CURA (EXPANDIDO) */}
      {(lastPurchased || isHealing) && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm animate-in fade-in duration-500" />
            <Sparkles className={cn(
                "w-64 h-64 animate-ping opacity-60",
                isHealing ? "text-emerald-400" : "text-yellow-400 shadow-[0_0_50px_rgba(251,191,36,0.5)]"
            )} />
          </div>
      )}
    </div>
  );
}
