'use client';

import { useEcosystem } from '@/contexts/EcosystemContext';
import { 
  Leaf, 
  Droplets, 
  Wind, 
  TreeDeciduous, 
  Fish, 
  Bird, 
  Dog,
  Cat as CatIcon,
  Sparkles,
  Waves,
  User,
  Users,
  Minimize
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { EcosystemItem } from '@/types/ecosystem';
import { EcosystemViewer } from '@/components/ecosystem/EcosystemViewer';
import { cn } from '@/lib/utils';

// Componentes Modularizados
import { EcossistemaHUD } from './components/EcossistemaHUD';
import { EcossistemaVitalityPortal } from './components/EcossistemaVitalityPortal';
import { EcossistemaShop } from './components/EcossistemaShop';
import { EcossistemaEffects } from './components/EcossistemaEffects';
import { useToast } from '@/hooks/use-toast';

export default function MeuEcossistemaPage() {
  const { 
    balance = 0, 
    vitality = 0, 
    purchasedItems = [], 
    buyUpgrade,
    refundUpgrade,
    healVitality,
    isNessieAvailable
  } = useEcosystem();

  const { toast } = useToast();

  const [isShopVisible, setIsShopVisible] = useState(false);
  const [lastPurchased, setLastPurchased] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isHealing, setIsHealing] = useState(false);
  const [showVitalityWarning, setShowVitalityWarning] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [forceTime, setForceTime] = useState<'real' | 'day' | 'night'>('real');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullScreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  const toggleFullScreen = () => {
    const doc = document as any;
    const isFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    const element = containerRef.current as any;
    const requestMethod = element ? (
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen
    ) : null;

    if (requestMethod) {
      if (!isFs) {
        try {
          const promise = requestMethod.call(element);
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => {
              console.error(`Error attempting to enable full-screen mode: ${err.message}`);
              setIsFullScreen(true);
            });
          }
        } catch (err: any) {
          console.error(`Error invoking requestFullscreen: ${err.message}`);
          setIsFullScreen(true);
        }
      } else {
        const exitMethod =
          doc.exitFullscreen ||
          doc.webkitExitFullscreen ||
          doc.mozCancelFullScreen ||
          doc.msExitFullscreen;

        if (exitMethod) {
          try {
            exitMethod.call(doc);
          } catch (err: any) {
            console.error(`Error invoking exitFullscreen: ${err.message}`);
            setIsFullScreen(false);
          }
        }
      }
    } else {
      // Fallback para smartphones/navegadores que não suportam Fullscreen API nativo (iOS Safari)
      setIsFullScreen(prev => !prev);
    }
  };

  const handleBuy = (id: EcosystemItem) => {
    const res = buyUpgrade(id);
    if (res.success) {
      setLastPurchased(id);
      setTimeout(() => setLastPurchased(null), 2000);
      toast({
        title: "Item Adquirido! 🎉",
        description: "O item foi adicionado à sua biosfera com sucesso.",
      });
    } else {
      toast({
        title: "Erro na Compra ❌",
        description: res.error || "Não foi possível adquirir o item.",
        variant: "destructive",
      });
    }
  };

  const handleRefund = (id: EcosystemItem) => {
    const res = refundUpgrade(id);
    if (res.success) {
      toast({
        title: "Item Reembolsado! 💸",
        description: "O item foi removido e os bio-coins foram devolvidos à sua conta.",
      });
    } else {
      toast({
        title: "Erro no Reembolso ❌",
        description: res.error || "Não foi possível reembolsar o item.",
        variant: "destructive",
      });
    }
  };

  const handleHealAction = (amount: number) => {
    const res = healVitality(amount);
    if (res.success) {
      setIsHealing(true);
      setTimeout(() => setIsHealing(false), 3000);
      toast({
        title: "Biosfera Restaurada! ❤️",
        description: "A vitalidade do seu ecossistema aumentou.",
      });
    } else {
      toast({
        title: "Erro na Restauração ❌",
        description: res.error || "Não foi possível restaurar a vitalidade.",
        variant: "destructive",
      });
    }
  };

  const shopItems = [
    { id: 'filtro_ar', name: 'Filtro de Ar', icon: <Wind />, price: 200, req: null, minVitality: 70, category: 'Base', desc: 'Tecnologia de purificação que remove CO2 e poluentes do ar.' },
    { id: 'limpar_rio', name: 'Limpeza do Rio', icon: <Droplets />, price: 300, req: null, minVitality: 70, category: 'Base', desc: 'Revitaliza o curso d\'água, permitindo o retorno da vida aquática.' },
    { id: 'reparar_grama', name: 'Restaurar Solo', icon: <Leaf />, price: 150, req: null, minVitality: 70, category: 'Base', desc: 'Recupera a camada fértil do terreno para o plantio de árvores.' },
    { id: 'arvore_1', name: 'Carvalho Norte', icon: <TreeDeciduous className="text-emerald-700" />, price: 200, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Flora', desc: 'Uma árvore robusta que fornece sombra e oxigênio.' },
    { id: 'arvore_2', name: 'Sumit Central', icon: <TreeDeciduous className="text-emerald-600 scale-125" />, price: 200, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Flora', desc: 'Árvore de grande porte, essencial para o ecossistema local.' },
    { id: 'arvore_3', name: 'Salgueiro Sul', icon: <TreeDeciduous className="text-emerald-500 scale-90" />, price: 200, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Flora', desc: 'Folhagens graciosas que embelezam as margens do rio.' },
    { id: 'peixe_1', name: 'Peixe Dourado', icon: <Fish className="text-orange-400" />, price: 100, req: 'Rio Aberto', reqId: 'limpar_rio', category: 'Fauna', desc: 'Espécie pacífica que ajuda a equilibrar o pH da água.' },
    { id: 'peixe_2', name: 'Peixe Turquesa', icon: <Fish className="text-cyan-400" />, price: 100, req: 'Rio Aberto', reqId: 'limpar_rio', category: 'Fauna', desc: 'Raro peixe de águas cristalinas, indicador de pureza.' },
    { id: 'peixe_3', name: 'Peixe Alvo', icon: <Fish className="text-slate-100" />, price: 100, req: 'Rio Aberto', reqId: 'limpar_rio', category: 'Fauna', desc: 'Pequenos cardumes que animam o leito do rio.' },
    {id: 'passaro_1', name: 'Rouxinol', icon: <Bird className="text-sky-300" />, price: 150, req: 'Árvore 1', reqId: 'arvore_1', category: 'Fauna', desc: 'Seu canto aumenta a vitalidade de toda a área.' },
    {id: 'passaro_2', name: 'Beija-flor', icon: <Bird className="text-purple-300" />, price: 150, req: 'Árvore 2', reqId: 'arvore_2', category: 'Fauna', desc: 'Auxilia na polinização das flores ao redor.' },
    {id: 'passaro_3', name: 'Arara Azul', icon: <Bird className="text-blue-500" />, price: 150, req: 'Árvore 3', reqId: 'arvore_3', category: 'Fauna', desc: 'Uma ave majestosa que traz cor ao céu.' },
    {id: 'cachorro', name: 'Cachorro', icon: <Dog className="text-amber-700" />, price: 400, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Fauna', desc: 'O melhor amigo do ecossistema. Muito interativo!' },
    {id: 'gato', name: 'Gato', icon: <CatIcon />, price: 400, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Fauna', desc: 'Misterioso e elegante. Gosta de observar de longe.' },
    {id: 'borboletas', name: 'Borboletas 1', icon: <Sparkles className="text-yellow-400" />, price: 150, req: 'Solo Saudável', reqId: 'reparar_grama', category: 'Fauna', desc: 'Enxames amarelos que indicam um solo rico.' },
    {id: 'borboletas_2', name: 'Borboletas 2', icon: <Sparkles className="text-blue-400" />, price: 200, req: 'Borboletas 1', reqId: 'borboletas', category: 'Fauna', desc: 'Elegantes borboletas azuis que atraem outros polinizadores.' },
    {id: 'borboletas_3', name: 'Borboletas 3', icon: <Sparkles className="text-purple-400" />, price: 250, req: 'Borboletas 2', reqId: 'borboletas_2', category: 'Fauna', desc: 'Espécies raras que só aparecem em florestas densas.' },
    {id: 'borboletas_4', name: 'Borboletas Reais', icon: <Sparkles className="text-orange-500" />, price: 300, req: 'Borboletas 3', reqId: 'borboletas_3', category: 'Fauna', desc: 'Borboletas monarca que migram de muito longe.' },
    {id: 'barco_1', name: 'Barco de Patrulha', icon: <Waves className="text-cyan-400" />, price: 500, req: 'Rio Limpo', reqId: 'limpar_rio', category: 'Lendário', desc: 'Pequena embarcação sustentável para patrulha do rio.' },
    {id: 'barco_2', name: 'Iate Solar', icon: <Waves className="text-indigo-400" />, price: 600, req: 'Barco 1', reqId: 'barco_1', category: 'Lendário', desc: 'Barco avançado com painéis solares para longas viagens.' },
    {id: 'casa', name: 'Casa Sustentável', icon: <Sparkles className="text-amber-400 animate-pulse" />, price: 1500, req: 'Carvalho Norte', reqId: 'arvore_1', minVitality: 100, category: 'Lendário', desc: 'O ápice da sustentabilidade. Uma moradia que gera energia e vida.' },
    {id: 'mae_human', name: 'Mãe', icon: <User className="text-pink-400" />, price: 600, req: 'Casa Sustentável', reqId: 'casa', category: 'Lendário', desc: 'A mãe da família, promovendo a integração e harmonia.' },
    {id: 'criancas', name: 'Crianças', icon: <Users className="text-sky-400" />, price: 400, req: 'Mãe Presente', reqId: 'mae_human', category: 'Lendário', desc: 'As crianças que trazem diversão e alegria ao ambiente.' },
    {id: 'placas_solares', name: 'Placas Solares (Chão)', icon: <Sparkles className="text-blue-400" />, price: 400, req: 'Casa Sustentável', reqId: 'casa', category: 'Lendário', desc: 'Estação de geração solar terrestre para fornecer energia limpa.' },
    {id: 'lixeiras', name: 'Coleta Seletiva', icon: <Leaf className="text-emerald-400" />, price: 200, req: 'Crianças Presentes', reqId: 'criancas', category: 'Base', desc: 'Lixeiras coloridas para triagem e descarte ecologicamente correto.' },
    {id: 'monstro_lago', name: 'Nessie (Lendário)', icon: <Waves className="text-emerald-400 animate-bounce" />, price: 5000, req: 'Casa Sustentável', reqId: 'casa', category: 'Lendário', desc: 'A lenda se torna reality. Protege o lago de qualquer mal.' },
  ];

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex-1 w-full overflow-hidden font-sans select-none bg-slate-950 shadow-2xl animate-in fade-in zoom-in duration-700 transition-all",
        isFullScreen 
          ? "fixed inset-0 z-50 w-screen h-[100dvh] rounded-none" 
          : "h-[500px] xs:h-[580px] md:h-[650px] lg:h-[750px] rounded-2xl"
      )}
    >
      {isFullScreen && (
        <button 
          onClick={toggleFullScreen}
          className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 z-50 p-3 bg-black/80 hover:bg-black/90 text-white border border-white/10 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl pointer-events-auto flex items-center justify-center cursor-pointer"
          title="Sair da Tela Cheia"
        >
          <Minimize className="w-5 h-5 text-emerald-400" />
        </button>
      )}

      <EcosystemViewer 
        vitality={vitality} 
        purchasedItems={purchasedItems as any} 
        forceTime={forceTime}
        onForceTimeChange={setForceTime}
        showControls={false}
        className="absolute inset-0 transition-all transition-duration-[1000ms]"
      />

      <EcossistemaHUD 
        balance={balance} 
        vitality={vitality} 
        handleHealAction={handleHealAction}
        toggleFullScreen={toggleFullScreen}
        isFullScreen={isFullScreen}
        forceTime={forceTime}
        setForceTime={setForceTime}
        onOpenShop={() => setIsShopVisible(true)}
        isShopVisible={isShopVisible}
      />

      {vitality < 70 && showVitalityWarning && (
          <EcossistemaVitalityPortal 
            balance={balance} 
            handleHealAction={handleHealAction} 
            setShowVitalityWarning={setShowVitalityWarning} 
          />
      )}

      <EcossistemaShop 
        isShopVisible={isShopVisible}
        setIsShopVisible={setIsShopVisible}
        shopItems={shopItems}
        purchasedItems={purchasedItems as EcosystemItem[]}
        vitality={vitality}
        balance={balance}
        isNessieAvailable={isNessieAvailable}
        handleBuy={handleBuy}
        handleRefund={handleRefund}
        setHoveredIdx={setHoveredIdx}
      />

      <EcossistemaEffects 
        lastPurchased={lastPurchased} 
        isHealing={isHealing} 
      />
    </div>
  );
}
