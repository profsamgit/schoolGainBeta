'use client';

/**
 * EcosystemViewer: O Coração Visual do SchoolGain
 * 
 * Este componente é responsável por renderizar o mundo virtual que os alunos constroem.
 * Ele usa SVG (Scalable Vector Graphics) para criar desenhos leves que podem ser
 * animados e alterados via código.
 */

import { 
  Sparkles,
  Cloud,
  Moon as MoonIcon,
  Sun as SunIcon,
  Waves
} from 'lucide-react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { EcosystemItem } from '@/lib/types';
 
// --- COMPONENTES VISUAIS (SUB-ELEMENTOS) ---

/**
 * AuroraBoreal: Um efeito visual especial que aparece apenas para alunos
 * que atingiram o nível máximo (Guardião da Lenda).
 */
const AuroraBoreal = () => (
  <div className="absolute inset-0 z-0 pointer-events-none opacity-50 overflow-hidden mix-blend-screen">
      <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <defs>
              <linearGradient id="aurora-green" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                  <stop offset="30%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="aurora-purple" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
                  <stop offset="30%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
              <filter id="aurora-blur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
              </filter>
          </defs>
          <g filter="url(#aurora-blur)">
              <path d="M-200 150 Q 200 50 500 150 T 1200 150 L 1200 0 L -200 0 Z" fill="url(#aurora-green)">
                  <animate attributeName="d" 
                      values="M-200 150 Q 200 50 500 150 T 1200 150 L 1200 0 L -200 0 Z;
                              M-200 180 Q 250 250 600 180 T 1200 180 L 1200 0 L -200 0 Z;
                              M-200 150 Q 200 50 500 150 T 1200 150 L 1200 0 L -200 0 Z" 
                      dur="15s" repeatCount="indefinite" />
              </path>
              <path d="M-200 200 Q 300 100 600 200 T 1200 200 L 1200 0 L -200 0 Z" fill="url(#aurora-purple)" opacity="0.6">
                  <animate attributeName="d" 
                      values="M-200 200 Q 300 100 600 200 T 1200 200 L 1200 0 L -200 0 Z;
                              M-200 250 Q 350 350 700 250 T 1200 250 L 1200 0 L -200 0 Z;
                              M-200 200 Q 300 100 600 200 T 1200 200 L 1200 0 L -200 0 Z" 
                      dur="18s" repeatCount="indefinite" />
              </path>
          </g>
      </svg>
  </div>
);

/**
 * MountainRange: Desenha as montanhas ao fundo.
 */
const MountainRange = ({ className, isLegendary }: { className?: string, isLegendary?: boolean }) => (
  <div className={cn("w-full h-full relative", className)}>
    {/* Só mostra a Aurora se o aluno for Lendário */}
    {isLegendary && <AuroraBoreal />}

    <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="w-full h-full relative z-10">
      <path d="M0 300 L150 100 L250 180 L400 50 L550 160 L750 80 L1000 300 Z" fill="#5d4037" />
      <path d="M50 300 L250 120 L400 200 L550 80 L750 180 L1000 300 Z" fill="#3e2723" />
    </svg>
  </div>
);

/**
 * SVGFilters: Contém filtros especiais como "água em movimento" ou "sombra suave".
 * Estes filtros são referenciados no código via ID (ex: url(#water-ripple)).
 */
const SVGFilters = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter id="organic-edge">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="water-ripple">
        <feTurbulence type="turbulence" baseFrequency="0.02 0.05" numOctaves="2" result="turbulence">
            <animate attributeName="baseFrequency" values="0.02 0.05; 0.03 0.06; 0.02 0.05" dur="10s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="15" />
      </filter>
      <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
        <feOffset dx="4" dy="8" result="offsetblur" />
        <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
        <filter id="bloom">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.5 -0.2" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
);

/**
 * PainterlyTree: Desenha uma árvore que balança levemente com o vento.
 */
const PainterlyTree = ({ size, color, className, delay, style, reflection = false }: { size: number, color: string, className?: string, delay?: string, style?: any, reflection?: boolean }) => (
  <svg 
    viewBox="0 0 120 180" 
    width={size} 
    height={size * 1.5} 
    className={cn(reflection ? "opacity-20 blur-[2px]" : "animate-tree-sway origin-bottom", className)}
    style={{ ...style, animationDelay: delay, filter: reflection ? 'none' : 'url(#soft-shadow)' }}
  >
    <path d="M50 180 L70 180 L65 110 L55 110 Z" fill="#2b1a13" />
    <g transform="translate(60, 80)">
        <circle r="50" fill={color} />
        <circle cx="-15" cy="-20" r="35" fill={color} filter="brightness(1.1)" opacity="0.9" />
        <circle cx="20" cy="10" r="30" fill={color} filter="brightness(0.9)" opacity="0.8" />
    </g>
  </svg>
);

/**
 * PainterlyDog: Desenha um cachorro que balança o rabo.
 */
const PainterlyDog = ({ className }: { className?: string }) => (
  <div className={cn("relative group", className)}>
    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/10 blur-md rounded-full" />
    <svg viewBox="0 0 80 60" width="70" className="drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
      <path d="M15 45 Q25 55 45 45 L55 50 Q65 45 60 30 Q55 15 40 15 L25 15 Q15 15 10 30 Q5 45 15 45" fill="#a16207" />
      <path d="M55 35 Q65 40 75 35" fill="none" stroke="#a16207" strokeWidth="6" strokeLinecap="round" className="animate-tail-wag origin-left" />
      <path d="M40 15 Q45 0 55 15 L50 25 Q45 28 40 25 Z" fill="#854d0e" />
      <circle cx="48" cy="18" r="1.5" fill="black" />
      <path d="M42 8 Q35 5 38 18" fill="none" stroke="#713f12" strokeWidth="4" strokeLinecap="round" />
    </svg>
  </div>
);

/**
 * PainterlyHouse: Desenha a casa sustentável com painel solar.
 */
const PainterlyHouse = ({ className }: { className?: string }) => (
  <div className={cn("relative group translate-y-2", className)}>
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/10 blur-xl rounded-full" />
    <svg viewBox="0 0 120 100" width="140" className="drop-shadow-xl transition-transform duration-700 group-hover:scale-105">
      <path d="M10 90 L110 90 L110 40 L10 40 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <path d="M0 45 L60 5 L120 45 Z" fill="#15803d" stroke="#166534" strokeWidth="2" />
      <path d="M50 90 L70 90 L70 65 L50 65 Z" fill="#78350f" />
      <circle cx="65" cy="78" r="1.5" fill="#fbbf24" />
      <path d="M25 55 L40 55 L40 70 L25 70 Z" fill="#cbd5e1" opacity="0.6" />
      <path d="M80 55 L95 55 L95 70 L80 70 Z" fill="#cbd5e1" opacity="0.6" />
      <rect x="70" y="20" width="30" height="15" fill="#1e293b" transform="rotate(-33 70 20)" rx="1" />
    </svg>
  </div>
);

/**
 * PainterlyBoat: Desenha o barco que flutua no rio.
 */
const PainterlyBoat = ({ className, delay }: { className?: string, delay?: string }) => (
  <div className={cn("relative animate-float-boat z-30", className)} style={{ animationDelay: delay }}>
    <svg viewBox="0 0 100 80" width="80" height="60" className="drop-shadow-lg overflow-visible">
      <path d="M10 40 Q50 70 90 40 L80 25 L20 25 Z" fill="#451a03" stroke="#2b1a13" strokeWidth="1" />
      <rect x="48" y="5" width="4" height="25" fill="#2b1a13" rx="1" />
      <path d="M52 5 L85 20 L52 25 Z" fill="#f8fafc" opacity="0.95" />
    </svg>
  </div>
);

/**
 * PainterlyNessie: Desenha o monstro lendário do lago.
 */
const PainterlyNessie = ({ className }: { className?: string }) => (
  <div className={cn("relative z-20 group", className)}>
    <svg viewBox="0 0 120 100" width="100" className="drop-shadow-2xl animate-float-boat">
      <path 
        d="M20 80 Q 40 90 60 80 Q 80 70 70 50 Q 60 30 80 20 Q 100 10 110 30 Q 115 50 100 60 L 90 65" 
        fill="none" 
        stroke="#10b981" 
        strokeWidth="12" 
        strokeLinecap="round" 
        className="opacity-90"
      />
      <circle cx="108" cy="28" r="1.5" fill="black" />
      {/* Nadadeiras que aparecem na água */}
      <path d="M30 85 Q 40 75 50 85" fill="#059669" />
      <path d="M60 85 Q 70 75 80 85" fill="#059669" />
    </svg>
  </div>
);

// ---------------------------------------------

/**
 * Componente Principal EcosystemViewer
 */
export function EcosystemViewer({ 
  vitality, 
  purchasedItems, 
  className,
  interactive = true 
}: { vitality: number, purchasedItems: EcosystemItem[], className?: string, interactive?: boolean }) {
  const { level } = useEcosystem();
  const isLegendary = level === 'Guardião da Lenda';
  const [realTime, setRealTime] = useState({ h: 12, m: 0 });
  const [forceTime, setForceTime] = useState<'real' | 'day' | 'night'>('real');
  const [isClient, setIsClient] = useState(false);

  // Efeito para lidar com o ciclo de dia e noite real
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setRealTime({ h: now.getHours(), m: now.getMinutes() });
    const timer = setInterval(() => {
      const d = new Date();
      setRealTime({ h: d.getHours(), m: d.getMinutes() });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Define se o mundo deve estar escuro (noite) ou claro (dia).
   */
  const isEcosystemNight = useMemo(() => {
    if (forceTime === 'day') return false;
    if (forceTime === 'night') return true;
    const minutes = realTime.h * 60 + realTime.m;
    return minutes < 6 * 60 || minutes > 18 * 60; // Noite entre 18h e 06h
  }, [realTime, forceTime]);

  /**
   * ESTADO DO ECOSSISTEMA:
   * Aqui verificamos se o ambiente está saudável (vitalidade > 70%)
   * e quais melhorias o aluno comprou.
   */
  const isHealthy = vitality >= 70;
  const riverClean = purchasedItems.includes('limpar_rio') && isHealthy;
  const airClean = purchasedItems.includes('filtro_ar') && isHealthy;
  const groundClean = purchasedItems.includes('reparar_grama') && isHealthy;

  // Cores dinâmicas baseadas no estado
  const riverColor = riverClean ? (isEcosystemNight ? "#1d4ed8" : "#3b82f6") : (isEcosystemNight ? "#2b1a13" : "#5d4037");
  const groundColor = groundClean ? (isEcosystemNight ? "#064e3b" : "#15803d") : (isEcosystemNight ? "#2d1a13" : "#3e2723");

  // Gradiente do céu muda conforme o horário e a limpeza do ar
  const getSkyGradient = useMemo(() => {
    if (!airClean) return 'from-slate-700 via-slate-800 to-slate-900'; // Ar poluído
    if (isEcosystemNight) return 'from-slate-950 via-indigo-950 to-black'; // Noite limpa
    return 'from-sky-400 via-blue-500 to-blue-700'; // Dia limpo
  }, [isEcosystemNight, airClean]);

  if (!isClient) return <div className={cn("relative w-full h-full bg-slate-950", className)} />;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-slate-950 rounded-3xl", className)}>
      <SVGFilters />
      
      {/* Camada de ruído visual para dar textura premium */}
      <div className="absolute inset-0 z-[80] pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Interface de controle do horário (apenas se interativo) */}
      {interactive && (
        <div className="absolute top-4 left-4 z-[100] flex gap-2">
            <button 
                onClick={() => setForceTime(forceTime === 'night' ? 'day' : 'night')}
                className="p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/60 transition-all"
            >
                {isEcosystemNight ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>
        </div>
      )}

      <div className="absolute inset-0">
        {/* CÉU */}
        <div className={cn("absolute inset-0 bg-gradient-to-b transition-colors transition-duration-[3000ms]", getSkyGradient)} />
        
        {/* SOL OU LUA */}
        <div className={cn(
          "absolute top-[10%] transition-all transition-duration-[3000ms] w-32 h-32 rounded-full blur-[2px]",
          isEcosystemNight ? "left-[70%] bg-slate-200 shadow-[0_0_80px_rgba(255,255,255,0.3)]" : "left-[15%] bg-yellow-100 shadow-[0_0_100px_rgba(251,191,36,0.4)]"
        )} />

        {/* MONTANHAS */}
        <div className="absolute inset-x-0 bottom-[30%] h-[40%] z-10 opacity-90 blur-[1px]">
            <MountainRange isLegendary={isLegendary} />
        </div>
        
        {/* RIO E TERRA (DESENHO DINÂMICO) */}
        <svg viewBox="0 0 1000 450" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-[45%] z-20">
            {/* Rio */}
            <path 
                d="M450 0 L1000 0 L1000 450 L0 450 Q550 250 450 0 Z" 
                fill={riverColor} 
                className="transition-colors transition-duration-[3000ms]"
                style={{ filter: riverClean ? 'url(#water-ripple)' : 'none' }}
            />
            {/* Terra */}
            <path 
                d="M0 0 L450 0 Q550 250 0 450 Z" 
                fill={groundColor}
                className="transition-colors transition-duration-[3000ms]"
            />
        </svg>

        {/* ELEMENTOS COMPRADOS (SÓ APARECEM SE ESTIVEREM NA LISTA) */}
        <div className="absolute inset-0 z-50 pointer-events-none">
            <div className="relative w-full h-full">
                {/* Árvores */}
                {purchasedItems.includes('arvore_3') && <PainterlyTree size={100} color={isEcosystemNight ? "#022c22" : "#064e3b"} className="absolute bottom-[48%] left-[5%]" delay="0.5s" />}
                {purchasedItems.includes('arvore_2') && <PainterlyTree size={160} color={isEcosystemNight ? "#064e3b" : "#15803d"} className="absolute bottom-[30%] left-[10%]" delay="1.2s" />}
                {purchasedItems.includes('arvore_1') && <PainterlyTree size={180} color={isEcosystemNight ? "#064e3b" : "#14532d"} className="absolute bottom-[15%] left-[2%]" delay="0s" />}

                {/* Casa */}
                {purchasedItems.includes('casa') && <PainterlyHouse className="absolute bottom-[38%] left-[20%] z-20" />}

                {/* Animais */}
                {purchasedItems.includes('cachorro') && <PainterlyDog className="absolute bottom-[12%] left-[22%] z-30" />}
                
                {/* Barcos */}
                {purchasedItems.includes('barco_1') && <PainterlyBoat className="absolute bottom-[26%] left-[60%] z-30" />}
                
                {/* Nessie (Lendário) */}
                {purchasedItems.includes('monstro_lago') && <PainterlyNessie className="absolute bottom-[24%] left-[75%] z-20" />}
            </div>
        </div>
      </div>

      {/* ESTILOS DE ANIMAÇÃO */}
      <style jsx global>{`
        @keyframes tree-sway { 0%, 100% { transform: skewX(-1deg); } 50% { transform: skewX(1deg); } }
        @keyframes tail-wag { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(20deg); } }
        @keyframes float-boat { 0%, 100% { transform: translateY(0) rotate(-0.5deg); } 50% { transform: translateY(-4px) rotate(0.5deg); } }
        
        .animate-tree-sway { animation: tree-sway 5s ease-in-out infinite; }
        .animate-tail-wag { animation: tail-wag 0.3s linear infinite; }
        .animate-float-boat { animation: float-boat 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
