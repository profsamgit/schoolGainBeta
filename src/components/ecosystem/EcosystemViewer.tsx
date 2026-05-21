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
  Waves,
  Leaf
} from 'lucide-react';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { EcosystemItem } from '@/types/ecosystem';
 
// --- COMPONENTES VISUAIS (SUB-ELEMENTOS) ---

/**
 * Fireflies: Pequenos pontos de luz que flutuam à noite.
 */
const Fireflies = () => (
  <div className="absolute inset-0 z-40 pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <div 
        key={i}
        className="absolute w-1.5 h-1.5 bg-emerald-300 rounded-full blur-[1px] animate-pulse"
        style={{
          top: `${Math.random() * 60 + 20}%`,
          left: `${Math.random() * 100}%`,
          animationDuration: `${2 + Math.random() * 3}s`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: 0.6
        }}
      >
        <div className="absolute inset-0 bg-emerald-400 blur-[4px] animate-ping" style={{ animationDuration: '3s' }} />
      </div>
    ))}
  </div>
);

/**
 * SunBeams: Raios de sol suaves que cruzam a tela.
 */
const SunBeams = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
    {[...Array(5)].map((_, i) => (
      <div 
        key={i}
        className="absolute h-[200%] w-32 bg-gradient-to-b from-yellow-100/40 to-transparent rotate-[25deg]"
        style={{
          top: '-50%',
          left: `${i * 25}%`,
          filter: 'blur(40px)',
          animation: `sunbeam-move ${10 + i * 2}s infinite alternate ease-in-out`
        }}
      />
    ))}
  </div>
);

/**
 * WindLeaves: Folhas que cruzam o cenário ocasionalmente.
 */
const WindLeaves = () => (
  <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
    {[...Array(8)].map((_, i) => (
      <div 
        key={i}
        className="absolute text-emerald-600/40"
        style={{
          top: `${Math.random() * 100}%`,
          left: '-10%',
          animation: `wind-leaf ${5 + Math.random() * 5}s linear infinite`,
          animationDelay: `${Math.random() * 10}s`
        }}
      >
        <Leaf size={12 + Math.random() * 8} />
      </div>
    ))}
  </div>
);

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
const PainterlyDog = ({ className }: { className?: string }) => {
  const [isWagging, setIsWagging] = useState(false);
  
  return (
    <div 
      className={cn("relative group cursor-pointer pointer-events-auto select-none", className)}
      onClick={() => {
        setIsWagging(true);
        const audio = new Audio('/sounds/bark.mp3');
        audio.play().catch(() => {});
      }}
      onAnimationEnd={() => setIsWagging(false)}
    >
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-black/10 blur-lg rounded-full" />
      <svg viewBox="0 0 60 50" width="60" className={cn("drop-shadow-xl transition-all duration-500 group-hover:scale-110 overflow-visible", isWagging && "animate-bounce")}>
        {/* Rabo Animado */}
        <path d="M12 28 Q2 18 8 12" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
                values="0 12 28; 35 12 28; 0 12 28; -35 12 28; 0 12 28"
                dur="0.5s" repeatCount="indefinite" />
        </path>
        <path d="M18 38 L15 48" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
        <path d="M30 38 L27 48" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
        <path d="M12 28 Q30 18 45 28 L45 38 Q30 48 12 38 Z" fill="#92400e" />
        <path d="M40 38 L43 48" stroke="#92400e" strokeWidth="7" strokeLinecap="round" />
        <rect x="40" y="20" width="12" height="4" fill="#ef4444" rx="2" />
        <circle cx="50" cy="18" r="11" fill="#92400e" />
        <path d="M42 12 Q35 8 38 22" fill="#78350f" />
        <path d="M58 12 Q65 8 62 22" fill="#78350f" />
        <circle cx="53" cy="15" r="1.5" fill="black" />
        <circle cx="53" cy="15" r="0.5" fill="white" className="animate-pulse" />
        <circle cx="58" cy="20" r="3.5" fill="#451a03" />
      </svg>
      {isWagging && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[12px] font-black text-amber-950 shadow-2xl border border-amber-200/50 animate-in zoom-in fade-in duration-300 whitespace-nowrap z-50">
          🦴 AU! AU!
        </div>
      )}
    </div>
  );
};

/**
 * PainterlyCat: Desenha um gato elegante que balança o rabo.
 */
const PainterlyCat = ({ className }: { className?: string }) => {
  const [isPurring, setIsPurring] = useState(false);
  
  return (
    <div 
      className={cn("relative group cursor-pointer pointer-events-auto select-none", className)}
      onClick={() => {
        setIsPurring(true);
        // Som de ronrom ou miado se disponível
        const audio = new Audio('/sounds/meow.mp3');
        audio.play().catch(() => {});
      }}
      onAnimationEnd={() => setIsPurring(false)}
    >
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/10 blur-lg rounded-full" />
      <svg viewBox="0 0 50 45" width="45" className={cn("drop-shadow-xl transition-all duration-500 group-hover:scale-110 overflow-visible", isPurring && "animate-bounce")}>
        {/* Rabo Longo e Curvado */}
        <path d="M10 32 Q0 25 5 15 Q10 5 20 10" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
                values="0 10 32; 20 10 32; 0 10 32; -20 10 32; 0 10 32"
                dur="1.2s" repeatCount="indefinite" />
        </path>
        {/* Patas */}
        <path d="M15 35 L15 42" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <path d="M25 35 L25 42" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <path d="M35 35 L35 42" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
        {/* Corpo */}
        <path d="M12 25 Q25 15 40 25 L40 35 Q25 42 12 35 Z" fill="#64748b" />
        {/* Cabeça */}
        <circle cx="42" cy="20" r="9" fill="#64748b" />
        {/* Orelhas Pontudas */}
        <path d="M35 15 L33 5 L40 12 Z" fill="#475569" />
        <path d="M49 15 L51 5 L44 12 Z" fill="#475569" />
        {/* Bigodes */}
        <path d="M48 22 L55 20 M48 23 L55 23 M48 24 L55 26" stroke="white" strokeWidth="0.5" opacity="0.6" />
        {/* Rosto */}
        <circle cx="45" cy="18" r="1.2" fill="#fde047" />
        <circle cx="39" cy="18" r="1.2" fill="#fde047" />
        {/* Narizinho */}
        <path d="M42 21 L41 22 L43 22 Z" fill="#fda4af" />
      </svg>
      {isPurring && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-2xl text-[10px] font-black text-slate-800 shadow-2xl border border-slate-200 animate-in zoom-in fade-in duration-300 whitespace-nowrap z-50">
          🐾 MIAU!
        </div>
      )}
    </div>
  );
};

/**
 * PainterlyHouse: Desenha a casa sustentável moderna com jardins e luzes.
 */
const PainterlyHouse = ({ className, isNight = false }: { className?: string, isNight?: boolean }) => (
  <div className={cn("relative group transition-all duration-700", className)}>
    {/* Sombra base */}
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-8 bg-black/10 blur-2xl rounded-full" />
    
    <svg viewBox="0 0 160 140" width="180" className="drop-shadow-2xl overflow-visible transition-transform duration-700 group-hover:scale-110">
      {/* Base/Fundação */}
      <rect x="10" y="110" width="140" height="10" fill="#475569" rx="2" />
      
      {/* Corpo Principal (Madeira e Vidro) */}
      <path d="M20 110 L140 110 L140 50 L20 50 Z" fill="#92400e" stroke="#78350f" strokeWidth="1" />
      
      {/* Janelão de Vidro Central */}
      <rect x="40" y="60" width="80" height="50" fill={isNight ? "#fef08a" : "#94a3b8"} opacity={isNight ? "0.8" : "0.4"} className="transition-colors duration-[3000ms]" />
      <path d="M40 60 L120 110 M120 60 L40 110" stroke="white" strokeWidth="0.5" opacity="0.3" />
      
      {/* Luz Interna (Glow noturno) */}
      {isNight && (
          <rect x="45" y="65" width="70" height="40" fill="#facc15" filter="blur(8px)" opacity="0.4" />
      )}

      {/* Porta */}
      <rect x="25" y="75" width="15" height="35" fill="#451a03" />
      <circle cx="37" cy="92" r="1" fill="#fde047" />

      {/* Telhado Ecológico (Com plantas) */}
      <path d="M10 55 L80 15 L150 55 Z" fill="#166534" stroke="#14532d" strokeWidth="2" />
      <path d="M15 50 Q80 10 145 50" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <circle cx="40" cy="35" r="4" fill="#15803d" />
      <circle cx="120" cy="35" r="3" fill="#15803d" />
      <circle cx="80" cy="25" r="5" fill="#14532d" />

      {/* Varanda/Terraço */}
      <rect x="120" y="80" width="30" height="30" fill="#78350f" opacity="0.8" />
      <path d="M120 80 L150 80" stroke="#451a03" strokeWidth="2" />

      {/* Painéis Solares (Top-notch) */}
      <g transform="rotate(-30, 100, 30)">
        <rect x="80" y="20" width="40" height="20" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" rx="2" />
        <path d="M80 25 L120 25 M80 30 L120 30 M80 35 L120 35" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
        <path d="M90 20 L90 40 M100 20 L100 40 M110 20 L110 40" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
      </g>
    </svg>
  </div>
);

/**
 * PainterlyBoat: Desenha embarcações que flutuam no rio.
 */
const PainterlyBoat = ({ className, delay, type = 'patrol' }: { className?: string, delay?: string, type?: 'patrol' | 'solar' }) => (
  <div className={cn("relative animate-float-boat z-30 pointer-events-auto group", className)} style={{ animationDelay: delay }}>
    <svg viewBox="0 0 120 100" width="100" className="drop-shadow-2xl overflow-visible transition-transform duration-700 group-hover:scale-110">
      {/* Reflexo na água */}
      <ellipse cx="60" cy="85" rx="40" ry="10" fill="black" opacity="0.1" filter="blur(8px)" />
      
      {type === 'patrol' ? (
          <>
            {/* Barco de Patrulha (Madeira) */}
            <path d="M15 65 Q60 95 105 65 L95 45 L25 45 Z" fill="#5d4037" stroke="#3e2723" strokeWidth="1" />
            <path d="M25 45 L95 45 L90 50 L30 50 Z" fill="#3e2723" opacity="0.3" />
            {/* Mastros */}
            <rect x="58" y="15" width="4" height="40" fill="#3e2723" rx="1" />
            {/* Vela */}
            <path d="M62 15 Q85 30 62 45 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5">
                <animate attributeName="d" values="M62 15 Q85 30 62 45 Z; M62 15 Q95 30 62 45 Z; M62 15 Q85 30 62 45 Z" dur="3s" repeatCount="indefinite" />
            </path>
          </>
      ) : (
          <>
            {/* Iate Solar (Moderno) */}
            <path d="M10 65 Q60 90 110 65 L100 40 L20 40 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            {/* Cabine */}
            <path d="M35 40 L85 40 L75 25 L45 25 Z" fill="#334155" />
            {/* Painéis Solares */}
            <rect x="48" y="28" width="24" height="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.5" rx="1" />
            <path d="M48 28 L72 36" stroke="#38bdf8" strokeWidth="0.2" opacity="0.5" />
            <path d="M54 28 L54 36 M60 28 L60 36 M66 28 L66 36" stroke="#38bdf8" strokeWidth="0.2" opacity="0.5" />
            {/* Antena */}
            <line x1="75" y1="25" x2="80" y2="10" stroke="#94a3b8" strokeWidth="1" />
          </>
      )}
    </svg>
  </div>
);

/**
 * PainterlyNessie: Desenha o monstro lendário do lago com detalhes premium.
 */
const PainterlyNessie = ({ className, isNight = false }: { className?: string, isNight?: boolean }) => {
  const [isDiving, setIsDiving] = useState(false);

  useEffect(() => {
    if (isDiving) {
      const timer = setTimeout(() => setIsDiving(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isDiving]);

  return (
    <div 
      className={cn("relative z-20 group cursor-pointer pointer-events-auto select-none", className)}
      onClick={() => setIsDiving(true)}
    >
      {/* Ondulações na água quando está visível */}
      {!isDiving && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-emerald-400/20 blur-xl rounded-full animate-pulse" />
      )}

      <svg viewBox="0 0 160 120" width="130" className={cn("drop-shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all duration-[2000ms] ease-in-out overflow-visible", isDiving ? "translate-y-40 opacity-0 scale-75" : "animate-float-boat")}>
        {/* Pescoço e Cabeça */}
        <path 
          d="M20 100 Q 40 110 60 100 Q 80 90 70 60 Q 60 30 90 20 Q 120 10 135 40 Q 140 60 125 75 L 115 80" 
          fill="none" 
          stroke={isNight ? "#059669" : "#10b981"} 
          strokeWidth="16" 
          strokeLinecap="round" 
          className="transition-colors duration-[3000ms]"
        />
        
        {/* Escamas/Detalhes no pescoço */}
        <path d="M75 55 Q70 45 75 35 M85 45 Q80 35 85 25" fill="none" stroke="white" strokeWidth="2" opacity="0.2" />
        
        {/* Coroa Mística (Apenas se for Lendário) */}
        <path d="M125 15 L130 5 L135 15 L140 5 L145 15" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

        {/* Olhos Grandes e Místicos */}
        <circle cx="132" cy="35" r="4" fill="white" />
        <circle cx="133" cy="35" r="2" fill={isNight ? "#10b981" : "#064e3b"} />
        <circle cx="134" cy="34" r="0.8" fill="white" className="animate-pulse" />

        {/* Corcovas (Humps) */}
        <path d="M30 105 Q 45 85 60 105" fill={isNight ? "#065f46" : "#059669"} />
        <path d="M70 105 Q 85 85 100 105" fill={isNight ? "#065f46" : "#059669"} />
        
        {/* Nadadeira Lateral */}
        <path d="M45 105 L30 115 L45 118 Z" fill="#047857" opacity="0.6">
            <animateTransform attributeName="transform" type="rotate" values="0 45 105; 15 45 105; 0 45 105" dur="2s" repeatCount="indefinite" />
        </path>

        {/* Brilho Noturno */}
        {isNight && (
            <g opacity="0.5" filter="url(#bloom)">
                <circle cx="133" cy="35" r="6" fill="#10b981" opacity="0.3" />
                <path d="M90 20 Q120 10 135 40" fill="none" stroke="#34d399" strokeWidth="2" opacity="0.4" />
            </g>
        )}
      </svg>

      {/* Efeito de Mergulho (Splash) */}
      {isDiving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Waves className="w-20 h-20 text-emerald-400/60 animate-ping" />
              <div className="mt-4 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-500/30">
                  <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest animate-pulse">Mergulhando...</span>
              </div>
          </div>
      )}
    </div>
  );
};

/**
 * PainterlyFish: Desenha peixes que nadam no rio e mudam de lugar.
 */
const PainterlyFish = ({ color, className, initialDelay = 0 }: { color: string, className?: string, initialDelay?: number }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [flip, setFlip] = useState(1);

  useEffect(() => {
    const swim = () => {
      // Começa desaparecendo
      setOpacity(0);
      
      setTimeout(() => {
        // Muda de posição aleatoriamente dentro de um raio
        setPos({
          x: Math.random() * 150 - 75,
          y: Math.random() * 40 - 20
        });
        setFlip(Math.random() > 0.5 ? 1 : -1);
        setOpacity(1);
      }, 2000); // Fica 2s "mergulhado"
    };

    // Delay inicial
    const timeout = setTimeout(() => {
        setOpacity(1);
        const interval = setInterval(swim, 8000 + Math.random() * 4000);
        return () => clearInterval(interval);
    }, initialDelay * 1000);

    return () => clearTimeout(timeout);
  }, [initialDelay]);

  return (
    <div 
      className={cn("absolute transition-all duration-[2000ms] ease-in-out pointer-events-none", className)} 
      style={{ 
          transform: `translate(${pos.x}px, ${pos.y}px) scaleX(${flip})`,
          opacity: opacity
      }}
    >
      <svg viewBox="0 0 40 20" width="40" height="20" className="drop-shadow-sm overflow-visible">
        {/* Corpo com movimento ondulante */}
        <path d="M5 10 Q15 0 35 10 Q15 20 5 10" fill={color}>
            <animate attributeName="d" 
                values="M5 10 Q15 0 35 10 Q15 20 5 10; 
                        M5 10 Q15 5 35 10 Q15 15 5 10; 
                        M5 10 Q15 0 35 10 Q15 20 5 10" 
                dur="0.6s" repeatCount="indefinite" />
        </path>
        {/* Cauda com movimento de chicote */}
        <path d="M5 10 L0 5 L0 15 Z" fill={color} className="origin-[5px_10px]">
            <animateTransform attributeName="transform" type="rotate"
                values="0 5 10; 15 5 10; 0 5 10; -15 5 10; 0 5 10"
                dur="0.3s" repeatCount="indefinite" />
        </path>
        <circle cx="28" cy="8" r="1" fill="black" />
      </svg>
    </div>
  );
};

/**
 * PainterlyBird: Desenha pássaros que voam e batem asas.
 */
const PainterlyBird = ({ color, className, initialDelay = 0 }: { color: string, className?: string, initialDelay?: number }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [flip, setFlip] = useState(1);

  useEffect(() => {
    const fly = () => {
      // Muda de posição sem desaparecer
      setPos({
        x: Math.random() * 600 - 300,
        y: Math.random() * 120 - 60
      });
      setFlip(Math.random() > 0.5 ? 1 : -1);
    };

    // Inicia voo e mantém o loop
    setOpacity(0.9);
    const interval = setInterval(fly, 5000 + Math.random() * 3000); // Muda de rota mais rápido

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={cn("absolute transition-all duration-[3000ms] ease-in-out pointer-events-none", className)} 
      style={{ 
          transform: `translate(${pos.x}px, ${pos.y}px) scaleX(${flip})`,
          opacity: opacity
      }}
    >
      <svg viewBox="0 0 50 40" width="45" height="35" className="drop-shadow-lg overflow-visible">
        {/* Cauda */}
        <path d="M5 25 L0 30 L5 35 Z" fill={color} opacity="0.8" />
        {/* Asa de Trás */}
        <path d="M25 20 L15 5 L30 15 Z" fill={color} filter="brightness(0.8)">
            <animateTransform attributeName="transform" type="rotate"
                values="0 25 20; -40 25 20; 0 25 20"
                dur="0.4s" repeatCount="indefinite" />
        </path>
        {/* Corpo */}
        <path d="M10 25 Q25 40 40 25 Q45 15 35 15 L15 15 Q5 15 10 25" fill={color} />
        {/* Cabeça */}
        <circle cx="40" cy="20" r="7" fill={color} />
        <circle cx="43" cy="18" r="1.5" fill="black" />
        {/* Bico */}
        <path d="M47 20 L55 22 L47 24 Z" fill="#f59e0b" />
        {/* Asa da Frente */}
        <path d="M25 20 L10 0 L35 15 Z" fill={color} filter="brightness(1.1)">
            <animateTransform attributeName="transform" type="rotate"
                values="0 25 20; -60 25 20; 0 25 20"
                dur="0.4s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
};

/**
 * PainterlyButterflies: Enxames de borboletas que voam e mudam de lugar.
 */
const PainterlyButterflies = ({ color, className, initialDelay = 0 }: { color: string, className?: string, initialDelay?: number }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const flutter = () => {
      setOpacity(0);
      
      setTimeout(() => {
        // Borboletas se movem mais na vertical e horizontal
        setPos({
          x: Math.random() * 200 - 100,
          y: Math.random() * 60 - 30
        });
        setOpacity(0.8);
      }, 1500);
    };

    const timeout = setTimeout(() => {
        setOpacity(0.8);
        const interval = setInterval(flutter, 6000 + Math.random() * 4000);
        return () => clearInterval(interval);
    }, initialDelay * 1000);

    return () => clearTimeout(timeout);
  }, [initialDelay]);

  return (
    <div 
      className={cn("absolute transition-all duration-[1500ms] ease-in-out pointer-events-none", className)}
      style={{ 
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          opacity: opacity
      }}
    >
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="absolute animate-bounce" 
          style={{ 
            left: `${i * 12}px`, 
            top: `${i * -8}px`, 
            animationDelay: `${i * 0.3}s`,
            animationDuration: '1.5s'
          }}
        >
          <svg viewBox="0 0 20 20" width="14" height="14" className="drop-shadow-sm">
            <path d="M10 10 Q5 5 2 10 Q5 15 10 10 Q15 5 18 10 Q15 15 10 10" fill={color} className="animate-pulse" />
          </svg>
        </div>
      ))}
    </div>
  );
};

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

  /**
   * Filtro de Degradação Visual:
   * Conforme a vitalidade cai, o mundo perde cor e contraste.
   */
  const vitalityFilter = useMemo(() => {
    if (vitality >= 80) return "none";
    if (vitality >= 50) return "saturate(0.7) contrast(0.9)";
    if (vitality >= 30) return "saturate(0.4) contrast(0.8) sepia(0.2)";
    return "grayscale(1) contrast(0.7) brightness(0.8)";
  }, [vitality]);

  if (!isClient) return <div className={cn("relative w-full h-full bg-slate-950", className)} />;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-slate-950 rounded-3xl", className)}>
      <SVGFilters />
      
      {/* Camada de ruído visual para dar textura premium */}
      <div 
        className="absolute inset-0 z-[80] pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')` }}
      />

      {/* Interface de controle do horário (apenas se interativo) */}
      {interactive && (
        <div className="absolute top-4 left-4 z-[100] flex gap-2">
            <button 
                onClick={() => setForceTime(forceTime === 'night' ? 'day' : 'night')}
                className="p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/60 transition-all"
            >
                {isEcosystemNight ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>
            
            {/* Indicador de Vitalidade Visual */}
            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", vitality > 70 ? "bg-emerald-500" : vitality > 30 ? "bg-yellow-500" : "bg-red-500")} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{vitality}% Vitalidade</span>
            </div>
        </div>
      )}

      <div className="absolute inset-0 transition-all duration-[2000ms]" style={{ filter: vitalityFilter }}>
        {/* CÉU */}
        <div className={cn("absolute inset-0 bg-gradient-to-b transition-colors transition-duration-[3000ms]", getSkyGradient)} />
        
        {/* EFEITOS ATMOSFÉRICOS */}
        {!isEcosystemNight && airClean && <SunBeams />}
        {isEcosystemNight && <Fireflies />}
        {isHealthy && <WindLeaves />}

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
                {/* Árvores (Mudam de cor se a vitalidade for baixa) */}
                {purchasedItems.includes('arvore_3') && <PainterlyTree size={110} color={vitality < 30 ? (isEcosystemNight ? "#2d1a13" : "#451a03") : (isEcosystemNight ? "#022c22" : "#064e3b")} className="absolute bottom-[42%] left-[38%] z-30" delay="0.5s" />}
                {purchasedItems.includes('arvore_2') && <PainterlyTree size={160} color={vitality < 30 ? (isEcosystemNight ? "#2d1a13" : "#451a03") : (isEcosystemNight ? "#064e3b" : "#15803d")} className="absolute bottom-[30%] left-[12%] z-20" delay="1.2s" />}
                {purchasedItems.includes('arvore_1') && <PainterlyTree size={190} color={vitality < 30 ? (isEcosystemNight ? "#2d1a13" : "#451a03") : (isEcosystemNight ? "#064e3b" : "#14532d")} className="absolute bottom-[12%] left-[4%] z-20" delay="0s" />}

                {/* Casa */}
                {purchasedItems.includes('casa') && <PainterlyHouse isNight={isEcosystemNight} className="absolute bottom-[35%] left-[25%] z-20 scale-125" />}

                {/* Animais Terrestres (Só aparecem se Vitalidade >= 70) */}
                {vitality >= 70 && purchasedItems.includes('cachorro') && <PainterlyDog className="absolute bottom-[12%] left-[22%] z-30" />}
                {vitality >= 70 && purchasedItems.includes('gato') && <PainterlyCat className="absolute bottom-[22%] left-[32%] z-30" />}
                
                {/* Borboletas (Só aparecem se Vitalidade >= 50) */}
                {vitality >= 50 && purchasedItems.includes('borboletas') && <PainterlyButterflies color="#fbbf24" className="absolute bottom-[25%] left-[15%] z-40" initialDelay={0} />}
                {vitality >= 50 && purchasedItems.includes('borboletas_2') && <PainterlyButterflies color="#60a5fa" className="absolute bottom-[35%] left-[8%] z-40" initialDelay={2} />}
                {vitality >= 50 && purchasedItems.includes('borboletas_3') && <PainterlyButterflies color="#a855f7" className="absolute bottom-[20%] left-[28%] z-40" initialDelay={4} />}
                {vitality >= 50 && purchasedItems.includes('borboletas_4') && <PainterlyButterflies color="#f97316" className="absolute bottom-[15%] left-[5%] z-40" initialDelay={6} />}

                {/* Pássaros (Só aparecem se Vitalidade >= 50) */}
                {vitality >= 50 && purchasedItems.includes('passaro_1') && <PainterlyBird color="#7dd3fc" className="absolute bottom-[65%] left-[25%] z-10" initialDelay={0} />}
                {vitality >= 50 && purchasedItems.includes('passaro_2') && <PainterlyBird color="#d8b4fe" className="absolute bottom-[75%] left-[45%] z-10" initialDelay={10} />}
                {vitality >= 50 && purchasedItems.includes('passaro_3') && <PainterlyBird color="#3b82f6" className="absolute bottom-[55%] left-[60%] z-10" initialDelay={5} />}

                {/* Vida Aquática (Só aparecem se Vitalidade >= 50) */}
                {vitality >= 50 && purchasedItems.includes('peixe_1') && <PainterlyFish color="#fbbf24" className="absolute bottom-[18%] left-[65%] z-30" initialDelay={0} />}
                {vitality >= 50 && purchasedItems.includes('peixe_2') && <PainterlyFish color="#22d3ee" className="absolute bottom-[10%] left-[75%] z-30" initialDelay={4} />}
                {vitality >= 50 && purchasedItems.includes('peixe_3') && <PainterlyFish color="#f8fafc" className="absolute bottom-[25%] left-[70%] z-30" initialDelay={8} />}

                {/* Barcos */}
                {purchasedItems.includes('barco_1') && <PainterlyBoat type="patrol" className="absolute bottom-[28%] left-[55%] z-30 scale-110" />}
                {purchasedItems.includes('barco_2') && <PainterlyBoat type="solar" className="absolute bottom-[20%] left-[82%] z-30 scale-125" delay="1s" />}
                
                {/* Nessie (Lendário - Só aparece se Vitalidade >= 80) */}
                {vitality >= 80 && purchasedItems.includes('monstro_lago') && <PainterlyNessie isNight={isEcosystemNight} className="absolute bottom-[45%] left-[85%] z-20" />}
            </div>
        </div>
      </div>
    </div>
  );
}
