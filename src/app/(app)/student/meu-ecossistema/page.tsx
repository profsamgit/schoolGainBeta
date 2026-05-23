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
  Waves 
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
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
    {id: 'casa', name: 'Casa Sustentável', icon: <Sparkles className="text-amber-400 animate-pulse" />, price: 1500, req: 'Ecossistema Completo', minVitality: 100, category: 'Lendário', desc: 'O ápice da sustentabilidade. Uma moradia que gera energia e vida.' },
    {id: 'monstro_lago', name: 'Nessie (Lendário)', icon: <Waves className="text-emerald-400 animate-bounce" />, price: 5000, req: 'Casa Sustentável', reqId: 'casa', category: 'Lendário', desc: 'A lenda se torna realidade. Protege o lago de qualquer mal.' },
  ];

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex-1 w-full overflow-hidden font-sans select-none bg-slate-950 shadow-2xl animate-in fade-in zoom-in duration-700",
        isFullScreen ? "h-screen rounded-0" : "min-h-[650px] lg:min-h-[750px] rounded-2xl"
      )}
    >
      <EcosystemViewer 
        vitality={vitality} 
        purchasedItems={purchasedItems as any} 
        className="absolute inset-0 transition-all transition-duration-[1000ms]"
      />

      <EcossistemaHUD 
        balance={balance} 
        vitality={vitality} 
        handleHealAction={handleHealAction}
        toggleFullScreen={toggleFullScreen}
        isFullScreen={isFullScreen}
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
        setHoveredIdx={setHoveredIdx}
      />

      <EcossistemaEffects 
        lastPurchased={lastPurchased} 
        isHealing={isHealing} 
      />
    </div>
  );
}
