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
 * StarField: Campo de estrelas cintilantes para a noite.
 */
const StarField = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    {[...Array(40)].map((_, i) => (
      <div
        key={i}
        className="absolute bg-white rounded-full"
        style={{
          top: `${Math.random() * 45}%`,
          left: `${Math.random() * 100}%`,
          width: `${1.2 + Math.random() * 2}px`,
          height: `${1.2 + Math.random() * 2}px`,
          animation: `star-twinkle ${2 + Math.random() * 4}s infinite ease-in-out`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: 0.3 + Math.random() * 0.7,
          boxShadow: '0 0 6px rgba(255,255,255,0.9)'
        }}
      />
    ))}
  </div>
);

/**
 * CloudField: Nuvens flutuantes que cruzam a tela de dia.
 */
const CloudField = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
    {[...Array(3)].map((_, i) => (
      <svg
        key={i}
        viewBox="0 0 100 60"
        className="absolute fill-white/80"
        style={{
          top: `${4 + i * 8}%`,
          width: `${10 + i * 5}%`,
          minWidth: `${60 + i * 30}px`,
          maxWidth: `${120 + i * 60}px`,
          height: 'auto',
          animation: `cloud-drift ${35 + i * 15}s linear infinite`,
          animationDelay: `${-i * 12}s`,
        }}
      >
        <path d="M 20 40 a 15 15 0 0 1 20 -10 a 22 22 0 0 1 40 0 a 15 15 0 0 1 20 10 a 15 15 0 0 1 -80 0 z" />
      </svg>
    ))}
  </div>
);

/**
 * SunOrMoon: Astro dinâmico renderizado de forma vetorizada com glow.
 */
const SunOrMoon = ({ isNight }: { isNight: boolean }) => {
  if (isNight) {
    return (
      <div
        className="absolute top-[8%] left-[70%] z-0 transition-all duration-[3000ms]"
        style={{ filter: 'drop-shadow(0 0 25px rgba(186, 230, 253, 0.45))' }}
      >
        <svg viewBox="0 0 100 100" width="80" height="80" className="overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#moon-glow)" className="animate-pulse" style={{ animationDuration: '4s' }} />
          <circle cx="50" cy="50" r="35" fill="url(#moon-surface)" />
          <circle cx="35" cy="40" r="5" fill="#94a3b8" opacity="0.3" />
          <circle cx="45" cy="65" r="8" fill="#94a3b8" opacity="0.25" />
          <circle cx="65" cy="45" r="4" fill="#94a3b8" opacity="0.3" />
          <circle cx="55" cy="30" r="3" fill="#94a3b8" opacity="0.2" />
        </svg>
      </div>
    );
  } else {
    return (
      <div
        className="absolute top-[8%] left-[6%] sm:left-[12%] z-0 transition-all duration-[3000ms] overflow-visible"
        style={{ filter: 'drop-shadow(0 0 35px rgba(251, 191, 36, 0.55))' }}
      >
        <svg viewBox="0 0 100 100" width="80" height="80" className="overflow-visible">
          <circle cx="50" cy="50" r="48" fill="url(#sun-flare)" className="animate-pulse" style={{ animationDuration: '3s' }} />
          <circle cx="50" cy="50" r="35" fill="url(#sun-gradient)" />
        </svg>
      </div>
    );
  }
};

/**
 * WaterShimmers: Linhas de reflexo cintilantes na superfície da água.
 */
const WaterShimmers = ({ isNight }: { isNight: boolean }) => (
  <div className="absolute bottom-[2%] right-[5%] w-[45%] h-[20%] z-20 pointer-events-none overflow-hidden">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className={cn(
          "absolute h-[1.5px] rounded-full",
          isNight ? "bg-blue-300/40" : "bg-white/60"
        )}
        style={{
          top: `${15 + i * 15}%`,
          left: `${10 + Math.random() * 40}%`,
          width: `${30 + Math.random() * 60}px`,
          animation: `water-shimmer ${2.5 + Math.random() * 2}s infinite ease-in-out`,
          animationDelay: `${Math.random() * 3}s`
        }}
      />
    ))}
  </div>
);

/**
 * GrassAndFlowers: Detalhes estéticos de vegetação no solo.
 */
const GrassAndFlowers = ({ isNight, isHealthy }: { isNight: boolean, isHealthy: boolean }) => {
  if (!isHealthy) return null;
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {[
        { left: '8%', bottom: '25%', color: '#f43f5e' },
        { left: '15%', bottom: '15%', color: '#fda4af' },
        { left: '5%', bottom: '45%', color: '#fbbf24' },
        { left: '22%', bottom: '8%', color: '#38bdf8' }
      ].map((item, i) => (
        <div key={i} className="absolute" style={{ left: item.left, bottom: item.bottom }}>
          <svg viewBox="0 0 20 20" width="16" height="16" className="overflow-visible opacity-75">
            <path d="M5 20 Q3 10 0 8 M10 20 Q10 8 8 5 M15 20 Q17 12 20 10" fill="none" stroke={isNight ? "#064e3b" : "#22c55e"} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="4" r="2" fill={item.color} />
            <circle cx="8" cy="4" r="0.7" fill="#ffffff" />
          </svg>
        </div>
      ))}
    </div>
  );
};

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
const MountainRange = ({ className, isNight }: { className?: string, isNight: boolean }) => (
  <div className={cn("w-full h-full relative", className)}>
    <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="w-full h-full relative z-10 overflow-visible">
      {/* Camada 1: Montanhas de Fundo (Nevadas) */}
      <path
        d="M0 380 L180 180 L320 280 L520 100 L680 250 L850 150 L1000 380 Z"
        fill={isNight ? "url(#mountain-back-night)" : "url(#mountain-back-day)"}
        opacity="0.9"
      />

      {/* Camada 2: Montanhas do Meio */}
      <path
        d="M50 380 L280 200 L450 320 L650 140 L820 280 L1000 380 L0 380 Z"
        fill={isNight ? "url(#mountain-mid-night)" : "url(#mountain-mid-day)"}
        opacity="0.9"
      />

      {/* Camada 3: Montanhas da Frente */}
      <path
        d="M0 380 L120 260 L240 340 L380 220 L560 350 L750 200 L880 290 L1000 380 Z"
        fill={isNight ? "url(#mountain-front-night)" : "url(#mountain-front-day)"}
      />
    </svg>
  </div>
);

/**
 * SVGFilters: Contém filtros especiais e gradientes de cores da paisagem.
 */
const SVGFilters = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      {/* Sun & Moon gradients */}
      <linearGradient id="sun-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <radialGradient id="sun-flare" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#facc15" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.6" />
        <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="moon-surface" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="50%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>

      {/* Mountain gradients (Day) */}
      <linearGradient id="mountain-back-day" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="25%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="mountain-mid-day" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#5d4037" />
        <stop offset="100%" stopColor="#3e2723" />
      </linearGradient>
      <linearGradient id="mountain-front-day" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4e342e" />
        <stop offset="100%" stopColor="#2d1a13" />
      </linearGradient>

      {/* Mountain gradients (Night) */}
      <linearGradient id="mountain-back-night" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="35%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="mountain-mid-night" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#18181b" />
        <stop offset="100%" stopColor="#09090b" />
      </linearGradient>
      <linearGradient id="mountain-front-night" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#111827" />
        <stop offset="100%" stopColor="#030712" />
      </linearGradient>

      {/* Sand gradients */}
      <linearGradient id="sand-clean-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
      <linearGradient id="sand-clean-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="sand-dirty-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5d4037" />
        <stop offset="100%" stopColor="#271a13" />
      </linearGradient>
      <linearGradient id="sand-dirty-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1c0a00" />
        <stop offset="100%" stopColor="#090500" />
      </linearGradient>

      {/* Ground gradients (Clean / Green) */}
      <linearGradient id="ground-back-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient id="ground-front-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
      <linearGradient id="ground-back-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#064e3b" />
        <stop offset="100%" stopColor="#022c22" />
      </linearGradient>
      <linearGradient id="ground-front-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#065f46" />
        <stop offset="100%" stopColor="#022c22" />
      </linearGradient>

      {/* Ground gradients (Dirty / Brown) */}
      <linearGradient id="ground-back-dirty-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5d4037" />
        <stop offset="100%" stopColor="#3e2723" />
      </linearGradient>
      <linearGradient id="ground-front-dirty-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="ground-back-dirty-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#271a13" />
        <stop offset="100%" stopColor="#100a06" />
      </linearGradient>
      <linearGradient id="ground-front-dirty-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2d1a13" />
        <stop offset="100%" stopColor="#100a06" />
      </linearGradient>

      {/* River gradients (Clean) */}
      <linearGradient id="river-clean-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="river-clean-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="50%" stopColor="#1d4ed8" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>

      {/* River gradients (Dirty) */}
      <linearGradient id="river-dirty-day" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="50%" stopColor="#5d4037" />
        <stop offset="100%" stopColor="#271a13" />
      </linearGradient>
      <linearGradient id="river-dirty-night" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1c0a00" />
        <stop offset="50%" stopColor="#271a13" />
        <stop offset="100%" stopColor="#090500" />
      </linearGradient>

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
        <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
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
const PainterlyTree = ({
  color,
  className,
  delay,
  style,
  reflection = false,
  type = 'carvalho'
}: {
  color: string,
  className?: string,
  delay?: string,
  style?: any,
  reflection?: boolean,
  type?: 'carvalho' | 'sumit' | 'salgueiro'
}) => {
  if (type === 'sumit') {
    // Sumit Central (Cone/Pinheiro/Cipreste)
    return (
      <svg
        viewBox="0 0 120 180"
        className={cn(reflection ? "opacity-20 blur-[2px]" : "animate-tree-sway origin-bottom h-auto", className)}
        style={{ ...style, animationDelay: delay, filter: reflection ? 'none' : 'url(#soft-shadow)' }}
      >
        <path d="M55 180 L65 180 L63 100 L57 100 Z" fill="#2b1a13" />
        <path d="M60 20 L25 80 L95 80 Z" fill={color} filter="brightness(1.15)" />
        <path d="M60 50 L15 115 L105 115 Z" fill={color} />
        <path d="M60 80 L5 145 L115 145 Z" fill={color} filter="brightness(0.85)" opacity="0.9" />
      </svg>
    );
  }

  if (type === 'salgueiro') {
    // Salgueiro Sul (Chorão/Folhas pendentes)
    return (
      <svg
        viewBox="0 0 120 180"
        className={cn(reflection ? "opacity-20 blur-[2px]" : "animate-tree-sway origin-bottom h-auto", className)}
        style={{ ...style, animationDelay: delay, filter: reflection ? 'none' : 'url(#soft-shadow)' }}
      >
        <path d="M50 180 L70 180 C65 140 85 110 75 90 C70 80 50 85 45 75 Z" fill="#2b1a13" />
        <g transform="translate(60, 80)">
          <ellipse cx="0" cy="-10" rx="45" ry="35" fill={color} opacity="0.95" />
          <path d="M-40 -10 C-45 20 -35 50 -30 65 C-25 50 -20 20 -25 -10 Z" fill={color} filter="brightness(0.9)" />
          <path d="M-20 -15 C-25 15 -15 45 -10 60 C-5 45 0 15 -5 -15 Z" fill={color} filter="brightness(1.05)" />
          <path d="M40 -10 C45 20 35 50 30 65 C25 50 20 20 25 -10 Z" fill={color} filter="brightness(0.8)" />
          <path d="M20 -15 C25 15 15 45 10 60 C5 45 0 15 5 -15 Z" fill={color} filter="brightness(0.95)" />
          <circle cx="0" cy="-25" r="30" fill={color} filter="brightness(1.1)" />
        </g>
      </svg>
    );
  }

  // Carvalho Norte (Robusto/Arredondado clássico)
  return (
    <svg
      viewBox="0 0 120 180"
      className={cn(reflection ? "opacity-20 blur-[2px]" : "animate-tree-sway origin-bottom h-auto", className)}
      style={{ ...style, animationDelay: delay, filter: reflection ? 'none' : 'url(#soft-shadow)' }}
    >
      <path d="M50 180 L70 180 L65 105 L55 105 Z" fill="#2b1a13" />
      <g transform="translate(60, 75)">
        <circle r="45" fill={color} />
        <circle cx="-20" cy="-15" r="32" fill={color} filter="brightness(1.1)" opacity="0.9" />
        <circle cx="20" cy="-10" r="32" fill={color} filter="brightness(0.9)" opacity="0.85" />
        <circle cx="-10" cy="15" r="30" fill={color} filter="brightness(1.05)" opacity="0.9" />
        <circle cx="15" cy="15" r="28" fill={color} filter="brightness(0.95)" opacity="0.8" />
      </g>
    </svg>
  );
};

/**
 * PainterlyDog: Desenha um cachorro que balança o rabo.
 */
const PainterlyDog = ({ className, isNight = false }: { className?: string, isNight?: boolean }) => {
  const [isWagging, setIsWagging] = useState(false);

  return (
    <div
      className={cn("relative group cursor-pointer pointer-events-auto select-none", className)}
      onClick={() => {
        setIsWagging(true);
        const audio = new Audio('/sounds/bark.mp3');
        audio.play().catch(() => { });
      }}
      onAnimationEnd={() => setIsWagging(false)}
    >
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/10 blur-lg rounded-full" />
      <svg viewBox="0 0 60 50" className={cn("w-full h-auto drop-shadow-xl transition-all duration-500 group-hover:scale-110 overflow-visible", isWagging && "animate-bounce")}>
        {/* Rabo Animado */}
        <path d="M12 28 Q2 18 8 12" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round">
          {!isNight && (
            <animateTransform attributeName="transform" type="rotate"
              values="0 12 28; 35 12 28; 0 12 28; -35 12 28; 0 12 28"
              dur="0.5s" repeatCount="indefinite" />
          )}
        </path>
        
        {isNight ? (
          <>
            {/* Patas encolhidas */}
            <rect x="14" y="38" width="10" height="4" fill="#78350f" rx="2" />
            <rect x="26" y="38" width="10" height="4" fill="#78350f" rx="2" />
            <rect x="38" y="38" width="10" height="4" fill="#92400e" rx="2" />
          </>
        ) : (
          <>
            {/* Pernas em pé */}
            <path d="M18 38 L15 48" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
            <path d="M30 38 L27 48" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
            <path d="M40 38 L43 48" stroke="#92400e" strokeWidth="7" strokeLinecap="round" />
          </>
        )}
        <path d="M12 28 Q30 18 45 28 L45 38 Q30 48 12 38 Z" fill="#92400e" />
        <rect x="40" y="20" width="12" height="4" fill="#ef4444" rx="2" />
        <circle cx="50" cy="18" r="11" fill="#92400e" />
        <path d="M42 12 Q35 8 38 22" fill="#78350f" />
        <path d="M58 12 Q65 8 62 22" fill="#78350f" />
        <circle cx="53" cy="15" r="1.5" fill="black" />
        <circle cx="53" cy="15" r="0.5" fill="white" className="animate-pulse" />
        <circle cx="58" cy="20" r="3.5" fill="#451a03" />
      </svg>
      {isWagging && !isNight && (
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
const PainterlyCat = ({ className, isNight = false }: { className?: string, isNight?: boolean }) => {
  const [isPurring, setIsPurring] = useState(false);

  return (
    <div
      className={cn("relative group cursor-pointer pointer-events-auto select-none", className)}
      onClick={() => {
        if (isNight) return;
        setIsPurring(true);
        const audio = new Audio('/sounds/meow.mp3');
        audio.play().catch(() => { });
      }}
      onAnimationEnd={() => setIsPurring(false)}
    >
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-3 bg-black/10 blur-lg rounded-full" />
      <svg viewBox="0 0 50 45" className={cn("w-full h-auto drop-shadow-xl transition-all duration-500 group-hover:scale-110 overflow-visible", isPurring && "animate-bounce")}>
        {/* Rabo Longo */}
        <path d="M10 32 Q0 25 5 15 Q10 5 20 10" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round">
          {!isNight && (
            <animateTransform attributeName="transform" type="rotate"
              values="0 10 32; 20 10 32; 0 10 32; -20 10 32; 0 10 32"
              dur="1.2s" repeatCount="indefinite" />
          )}
        </path>
        
        {isNight ? (
          <>
            {/* Patas encolhidas */}
            <rect x="13" y="35" width="8" height="3" fill="#475569" rx="1.5" />
            <rect x="23" y="35" width="8" height="3" fill="#475569" rx="1.5" />
            <rect x="33" y="35" width="8" height="3" fill="#64748b" rx="1.5" />
          </>
        ) : (
          <>
            {/* Pernas em pé */}
            <path d="M15 35 L15 42" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <path d="M25 35 L25 42" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <path d="M35 35 L35 42" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          </>
        )}
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
 * PainterlyChildren: Desenha crianças brincando e acenando no cenário saudável.
 */
const PainterlyChildren = ({ className }: { className?: string }) => {
  const [waving, setWaving] = useState(false);

  return (
    <div
      className={cn("relative group cursor-pointer pointer-events-auto select-none", className)}
      onClick={() => setWaving(prev => !prev)}
    >
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[90%] h-2 bg-black/10 blur-md rounded-full" />
      <svg viewBox="0 0 80 60" className="w-full h-auto drop-shadow-lg overflow-visible transition-transform duration-500 group-hover:scale-110">
        {/* Criança 1: Sentada e acenando */}
        <g transform="translate(15, 10)">
          {/* Pernas */}
          <path d="M10 40 L18 45 M15 40 L24 43" stroke="#1e3a8a" strokeWidth="4" strokeLinecap="round" />
          {/* Corpo */}
          <rect x="5" y="20" width="12" height="20" fill="#f43f5e" rx="4" />
          {/* Cabeça */}
          <circle cx="11" cy="12" r="7" fill="#fbcfe8" />
          {/* Cabelo */}
          <path d="M5 12 Q11 2 17 12 Q11 7 5 12" fill="#7c2d12" />
          {/* Braço acenando */}
          <path d="M17 22 Q25 15 28 8" fill="none" stroke="#fbcfe8" strokeWidth="3" strokeLinecap="round">
            {waving && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 17 22; -25 17 22; 25 17 22; 0 17 22"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </g>

        {/* Criança 2: Correndo alegremente */}
        <g transform="translate(45, 5)">
          {/* Pernas (Correndo) */}
          <path d="M10 38 L6 48 M12 38 L18 48" stroke="#065f46" strokeWidth="4.5" strokeLinecap="round">
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-10 11 38; 15 11 38; -10 11 38"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </path>
          {/* Corpo */}
          <rect x="5" y="18" width="13" height="20" fill="#fbbf24" rx="4" />
          {/* Cabeça */}
          <circle cx="11" cy="11" r="7" fill="#fed7aa" />
          {/* Cabelo */}
          <circle cx="11" cy="7" r="8" fill="#1e293b" />
          {/* Braços */}
          <path d="M4 22 L-2 28 M18 22 L24 26" stroke="#fed7aa" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      </svg>

      {waving && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-2xl text-[10px] font-black text-rose-950 shadow-2xl border border-rose-200 animate-in zoom-in fade-in duration-300 whitespace-nowrap z-50">
          👋 Olá!
        </div>
      )}
    </div>
  );
};

/**
 * PainterlyMother: Desenha a mãe da família.
 */
const PainterlyMother = ({
  className,
  onClick,
  areChildrenSummoned
}: {
  className?: string,
  onClick?: () => void,
  areChildrenSummoned: boolean
}) => {
  const [talking, setTalking] = useState(false);

  return (
    <div
      className={cn("relative group cursor-pointer pointer-events-auto select-none", className)}
      onClick={() => {
        setTalking(true);
        if (onClick) onClick();
        setTimeout(() => setTalking(false), 3000);
      }}
    >
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-2.5 bg-black/10 blur-md rounded-full" />
      <svg viewBox="0 0 60 70" className="w-full h-auto drop-shadow-lg overflow-visible transition-transform duration-500 group-hover:scale-110">
        {/* Pernas */}
        <path d="M22 45 L22 65 M30 45 L30 65" stroke="#475569" strokeWidth="4" strokeLinecap="round" />

        {/* Vestido */}
        <path d="M15 25 L37 25 L42 50 L10 50 Z" fill="#ec4899" />

        {/* Cabeça */}
        <circle cx="26" cy="14" r="9" fill="#fbcfe8" />

        {/* Cabelo (Coque/Bun moderno e elegante) */}
        {/* Cabelo base cobrindo a cabeça */}
        <path d="M17 12 C17 4, 35 4, 35 12 C35 18, 17 18, 17 12 Z" fill="#3e2723" />
        {/* Coque no topo */}
        <circle cx="26" cy="2" r="5.5" fill="#3e2723" />

        {/* Braço acenando */}
        <path d="M37 28 Q44 32 46 24" fill="none" stroke="#fbcfe8" strokeWidth="3" strokeLinecap="round">
          {talking && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 37 28; -15 37 28; 15 37 28; 0 37 28"
              dur="0.8s"
              repeatCount="indefinite"
              className="origin-[37px_28px]"
            />
          )}
        </path>
      </svg>

      {talking && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-black text-pink-950 shadow-2xl border border-pink-200 animate-in zoom-in fade-in duration-300 whitespace-nowrap z-50">
          {areChildrenSummoned ? "💬 Venham cá, crianças!" : "💬 Vão brincar, crianças!"}
        </div>
      )}
    </div>
  );
};

/**
 * PainterlyHouse: Desenha a casa sustentável moderna com jardins e luzes.
 */
const PainterlyHouse = ({ 
  className, 
  isNight = false, 
  hasSolarPanels = false,
  hasMother = false,
  hasChildren = false
}: { 
  className?: string, 
  isNight?: boolean, 
  hasSolarPanels?: boolean,
  hasMother?: boolean,
  hasChildren?: boolean
}) => (
  <div className={cn("relative group transition-all duration-700", className)}>
    {/* Sombra base */}
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/25 blur-2xl rounded-full" />

    <svg viewBox="0 0 160 140" className="w-full h-auto drop-shadow-2xl overflow-visible transition-transform duration-700 group-hover:scale-110">
      <defs>
        {/* Parede de Madeira Premium */}
        <linearGradient id="houseWood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#854d0e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        {/* Telhado de Grama / Ecológico */}
        <linearGradient id="ecoRoof" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="60%" stopColor="#166534" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        {/* Telhado Clássico de Cerâmica */}
        <linearGradient id="classicRoof" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="50%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        {/* Fundação de Pedra */}
        <linearGradient id="foundationStone" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        {/* Vidro da Janela */}
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="glassNightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        {/* Painel Solar */}
        <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Base/Fundação */}
      <rect x="10" y="110" width="140" height="10" fill="url(#foundationStone)" rx="2" stroke="#1e293b" strokeWidth="0.5" />

      {/* Corpo Principal (Madeira Premium) */}
      <path d="M20 110 L140 110 L140 50 L20 50 Z" fill="url(#houseWood)" stroke="#451a03" strokeWidth="1" />

      {/* Janelão de Vidro Central com Moldura Moderna */}
      <rect x="40" y="60" width="80" height="50" fill="#2d1710" rx="1" />
      <rect x="42" y="62" width="76" height="46" fill={(isNight && hasSolarPanels) ? "url(#glassNightGrad)" : "url(#glassGrad)"} opacity={(isNight && hasSolarPanels) ? "0.85" : "0.5"} className="transition-all duration-[3000ms]" />

      {/* Luz Interna (Glow noturno) */}
      {isNight && hasSolarPanels && (
        <rect x="45" y="65" width="70" height="40" fill="#facc15" filter="blur(8px)" opacity="0.3" />
      )}

      {/* Sombra da Mãe no lado esquerdo da janela */}
      {isNight && hasSolarPanels && hasMother && (
        <g opacity="0.8">
          <path d="M 52 108 L 52 82 C 52 79 55 77 58 77 C 61 77 64 79 64 82 L 64 108 Z" fill="#0f172a" />
          <circle cx="58" cy="73" r="3.5" fill="#0f172a" />
        </g>
      )}

      {/* Sombra das Crianças no lado direito da janela */}
      {isNight && hasSolarPanels && hasChildren && (
        <g opacity="0.8">
          {/* Criança 1 */}
          <path d="M 82 108 L 82 88 C 82 86 84 85 86 85 C 88 85 90 86 90 88 L 90 108 Z" fill="#0f172a" />
          <circle cx="86" cy="81" r="2.8" fill="#0f172a" />
          {/* Criança 2 */}
          <path d="M 96 108 L 96 93 C 96 91 97 90 99 90 C 101 90 102 91 102 93 L 102 108 Z" fill="#0f172a" />
          <circle cx="99" cy="87" r="2.2" fill="#0f172a" />
        </g>
      )}

      {/* Divisórias Modernas das Janelas */}
      <line x1="80" y1="62" x2="80" y2="108" stroke="#1e293b" strokeWidth="1.5" opacity="0.7" />
      <line x1="42" y1="85" x2="118" y2="85" stroke="#1e293b" strokeWidth="1.5" opacity="0.7" />

      {/* Reflexos nas Janelas */}
      <path d="M45 65 L65 105" stroke="white" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
      <path d="M55 65 L70 95" stroke="white" strokeWidth="0.5" opacity="0.2" strokeLinecap="round" />

      {/* Porta de Design Moderno */}
      <rect x="24" y="72" width="14" height="38" fill="#3e2723" stroke="#1a0c02" strokeWidth="1" rx="0.5" />
      <circle cx="35" cy="91" r="1.2" fill="#e2e8f0" />
      <line x1="27" y1="74" x2="27" y2="108" stroke="#1a0c02" strokeWidth="0.5" opacity="0.3" />
      <line x1="31" y1="74" x2="31" y2="108" stroke="#1a0c02" strokeWidth="0.5" opacity="0.3" />

      {/* Telhado de Telhas Clássico */}
      <path d="M10 54 L80 12 L150 54 Z" fill="url(#classicRoof)" stroke="#7c2d12" strokeWidth="1.5" />
      {/* Detalhes de linhas de telhas */}
      <path d="M20 48 L80 12 M35 48 L80 12 M50 48 L80 12 M65 48 L80 12 M80 48 L80 12 M95 48 L80 12 M110 48 L80 12 M125 48 L80 12 M140 48 L80 12" stroke="#5c200b" strokeWidth="0.75" opacity="0.4" strokeLinecap="round" />

      {/* Varanda/Terraço */}
      <rect x="120" y="82" width="30" height="28" fill="#5c3f30" stroke="#3e2723" strokeWidth="0.5" />
      <line x1="120" y1="82" x2="150" y2="82" stroke="#e2e8f0" strokeWidth="1.5" />
      <line x1="125" y1="82" x2="125" y2="110" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="132" y1="82" x2="132" y2="110" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="139" y1="82" x2="139" y2="110" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="146" y1="82" x2="146" y2="110" stroke="#e2e8f0" strokeWidth="1" />

      {/* Vaso de flor na varanda */}
      <rect x="123" y="76" width="6" height="6" fill="#b45309" rx="0.5" />
      <path d="M126 76 Q122 70 125 68 Q129 70 127 76" fill="#22c55e" />
    </svg>
  </div>
);

/**
 * PainterlyBoat: Desenha embarcações que flutuam no rio.
 */
const PainterlyBoat = ({ className, delay, type = 'patrol' }: { className?: string, delay?: string, type?: 'patrol' | 'solar' }) => (
  <div className={cn("relative animate-float-boat z-30 pointer-events-auto group", className)} style={{ animationDelay: delay }}>
    <svg viewBox="0 0 120 100" className="w-full h-auto drop-shadow-2xl overflow-visible transition-transform duration-700 group-hover:scale-110">
      {/* Reflexo na água */}
      <ellipse cx="60" cy="85" rx="40" ry="10" fill="black" opacity="0.1" filter="blur(8px)" />

      {type === 'patrol' ? (
        <>
          <defs>
            <linearGradient id="boatWood" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8d5b4c" />
              <stop offset="40%" stopColor="#5c3a2f" />
              <stop offset="100%" stopColor="#3d221a" />
            </linearGradient>
            <linearGradient id="boatSail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fffaf0" />
              <stop offset="100%" stopColor="#d2c9b4" />
            </linearGradient>
          </defs>
          {/* Casco Principal de Madeira */}
          <path d="M15 65 Q60 95 105 65 L95 45 L25 45 Z" fill="url(#boatWood)" stroke="#3d221a" strokeWidth="1.5" />

          {/* Borda superior de acabamento */}
          <path d="M23 45 L97 45 L94 48 L26 48 Z" fill="#b07d62" />

          {/* Interior do barco / Sombra */}
          <path d="M26 48 L94 48 Q60 62 26 48" fill="#2d1710" opacity="0.6" />

          {/* Banco/Assento interno de madeira */}
          <rect x="52" y="52" width="16" height="4" fill="#8d5b4c" rx="1" />

          {/* Mastro */}
          <rect x="58" y="15" width="4" height="40" fill="#3e2723" rx="1" />

          {/* Cordas de suporte */}
          <line x1="28" y1="46" x2="58" y2="18" stroke="#d2c9b4" strokeWidth="0.5" opacity="0.6" />
          <line x1="92" y1="46" x2="62" y2="18" stroke="#d2c9b4" strokeWidth="0.5" opacity="0.6" />

          {/* Vela Wind-Blown Animada */}
          <g>
            <path d="M62 15 Q85 30 62 45 Z" fill="url(#boatSail)" stroke="#b0a896" strokeWidth="0.5">
              <animate attributeName="d" values="M62 15 Q85 30 62 45 Z; M62 15 Q92 30 62 45 Z; M62 15 Q85 30 62 45 Z" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M62 22 Q75 30 62 38" fill="none" stroke="#a79e8a" strokeWidth="0.5" strokeDasharray="2,2" />
          </g>

          {/* Bandeirinha no topo do mastro */}
          <path d="M62 15 L78 19 L62 23 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="0.5">
            <animate attributeName="d" values="M62 15 L78 19 L62 23 Z; M62 15 L84 20 L62 23 Z; M62 15 L78 19 L62 23 Z" dur="1.5s" repeatCount="indefinite" />
          </path>

          {/* Bóia salva-vidas */}
          <g transform="translate(78, 62)">
            <circle cx="0" cy="0" r="7.5" fill="#f8fafc" stroke="#dc2626" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="4.5" fill="none" stroke="#fff" strokeWidth="1" />
            <rect x="-1" y="-8" width="2" height="16" fill="#dc2626" transform="rotate(45)" />
            <rect x="-1" y="-8" width="2" height="16" fill="#dc2626" transform="rotate(-45)" />
            <circle cx="0" cy="0" r="3.5" fill="#5d4037" />
          </g>

          {/* Lanterna traseira */}
          <g transform="translate(18, 54)">
            <line x1="0" y1="0" x2="4" y2="4" stroke="#94a3b8" strokeWidth="1" />
            <rect x="2" y="4" width="4" height="6" fill="#fbbf24" stroke="#3e2723" strokeWidth="1" rx="0.5" className="animate-pulse" />
            <circle cx="4" cy="7" r="1.5" fill="#fff" className="animate-ping" style={{ animationDuration: '2s' }} />
          </g>
        </>
      ) : (
        <>
          <defs>
            <linearGradient id="yachtHull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="yachtGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="solarPanel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Casco Aerodinâmico e Moderno */}
          <path d="M10 65 Q60 90 110 65 L102 38 L22 38 Z" fill="url(#yachtHull)" stroke="#cbd5e1" strokeWidth="1" />

          {/* Linha de Friso Neon Ecológico */}
          <path d="M13 61 Q60 81 107 61" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.8" />

          {/* Cabine Futurista com Vidro e Colunas */}
          <path d="M35 38 L85 38 L77 20 L45 20 Z" fill="#1e293b" />
          <path d="M42 36 L78 36 L72 23 L48 23 Z" fill="url(#yachtGlass)" stroke="#38bdf8" strokeWidth="0.5" opacity="0.85" />
          <line x1="60" y1="23" x2="60" y2="36" stroke="#0f172a" strokeWidth="0.75" />

          {/* Painéis Solares no Teto */}
          <g transform="translate(48, 14)">
            <rect x="0" y="0" width="24" height="5" fill="url(#solarPanel)" stroke="#38bdf8" strokeWidth="0.5" rx="0.5" />
            <line x1="6" y1="0" x2="6" y2="5" stroke="#38bdf8" strokeWidth="0.2" opacity="0.6" />
            <line x1="12" y1="0" x2="12" y2="5" stroke="#38bdf8" strokeWidth="0.2" opacity="0.6" />
            <line x1="18" y1="0" x2="18" y2="5" stroke="#38bdf8" strokeWidth="0.2" opacity="0.6" />
          </g>

          {/* Radar Circular Rotativo */}
          <g transform="translate(55, 15)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#94a3b8" strokeWidth="1.2" />
            <ellipse cx="0" cy="-2" rx="4" ry="1.5" fill="#f8fafc" stroke="#64748b" strokeWidth="0.5">
              <animateTransform attributeName="transform" type="rotate" values="0 0 -2; 360 0 -2" dur="4s" repeatCount="indefinite" />
            </ellipse>
          </g>

          {/* Antena de Comunicação com Led */}
          <g transform="translate(80, 20)">
            <line x1="0" y1="0" x2="6" y2="-12" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="6" cy="-12" r="1.2" fill="#ef4444" className="animate-pulse" />
          </g>

          {/* Defensas de proteção nas laterais */}
          <rect x="35" y="44" width="3" height="10" fill="#f8fafc" rx="1.5" stroke="#cbd5e1" strokeWidth="0.5" />
          <rect x="60" y="46" width="3" height="10" fill="#f8fafc" rx="1.5" stroke="#cbd5e1" strokeWidth="0.5" />
          <rect x="85" y="44" width="3" height="10" fill="#f8fafc" rx="1.5" stroke="#cbd5e1" strokeWidth="0.5" />
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
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [flip, setFlip] = useState(1);

  // Função para afundar e surgir em outro lugar
  const triggerDive = () => {
    if (isDiving) return;
    setIsDiving(true);

    // No meio do mergulho (quando submersa totalmente)
    setTimeout(() => {
      // Sorteia nova posição no rio/lago (para a esquerda, rio adentro)
      setPos({
        x: Math.random() * -240,
        y: Math.random() * 50 - 25
      });
      // Sorteia direção de visualização
      setFlip(Math.random() > 0.5 ? 1 : -1);
    }, 3000);

    // Resurge após 8 segundos
    setTimeout(() => {
      setIsDiving(false);
    }, 8000);
  };

  // Efeito de mergulho automático a cada 25-45 segundos
  useEffect(() => {
    const autoDive = () => {
      triggerDive();
    };
    const timerId = setInterval(autoDive, 25000 + Math.random() * 20000);
    return () => clearInterval(timerId);
  }, [isDiving]);

  return (
    <div
      className={cn("relative z-20 group cursor-pointer pointer-events-auto select-none transition-all duration-[2000ms] ease-in-out", className)}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`
      }}
      onClick={triggerDive}
    >
      {/* Ondulações na água quando está visível */}
      {!isDiving && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-8 bg-emerald-400/25 blur-xl rounded-full animate-pulse" />
      )}

      <svg
        viewBox="0 0 160 120"
        className={cn(
          "w-full h-auto drop-shadow-[0_20px_50px_rgba(16,185,129,0.45)] transition-all duration-[2000ms] ease-in-out overflow-visible",
          isDiving ? "translate-y-40 opacity-0 scale-75" : "animate-float-boat"
        )}
        style={{
          transform: `scaleX(${flip})`
        }}
      >
        <defs>
          <linearGradient id="nessieSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="30%" stopColor="#10b981" />
            <stop offset="70%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="nessieSkinNight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="40%" stopColor="#065f46" />
            <stop offset="80%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
          <linearGradient id="nessieCrown" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <filter id="nessieGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.06   0 0 0 0 0.9   0 0 0 0 0.5  0 0 0 1 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Partículas Mágicas Flutuando ao Redor */}
        {!isDiving && (
          <g opacity={isNight ? "0.8" : "0.5"}>
            <circle cx="10" cy="50" r="1.5" fill="#60a5fa" className="animate-ping" style={{ animationDelay: '0.2s' }} />
            <circle cx="150" cy="70" r="2" fill="#34d399" className="animate-bounce" style={{ animationDelay: '0.5s' }} />
            <circle cx="80" cy="30" r="1.5" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
            <circle cx="40" cy="40" r="1" fill="#a7f3d0" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
          </g>
        )}

        {/* Cauda com nadadeira final */}
        <path
          d="M10 90 Q 0 80 5 70 Q 10 60 20 85 Z"
          fill={isNight ? "url(#nessieSkinNight)" : "url(#nessieSkin)"}
        />

        {/* Pescoço e Cabeça */}
        <path
          d="M20 100 Q 40 110 60 100 Q 80 90 70 60 Q 60 30 90 20 Q 120 10 135 40 Q 140 60 125 75 L 115 80"
          fill="none"
          stroke={isNight ? "url(#nessieSkinNight)" : "url(#nessieSkin)"}
          strokeWidth="18"
          strokeLinecap="round"
          className="transition-colors duration-[3000ms]"
        />

        {/* Escamas de brilho 3D no pescoço */}
        <path d="M75 55 Q71 45 75 35 M85 45 Q81 35 85 25" fill="none" stroke="#6ee7b7" strokeWidth="2.5" opacity="0.3" strokeLinecap="round" />

        {/* Coroa Mística Dourada com Gemas */}
        <g>
          <path d="M122 18 L126 6 L132 12 L138 3 L144 12 L150 6 L154 18 Z" fill="url(#nessieCrown)" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="138" cy="10" r="2.5" fill="#ef4444" className="animate-pulse" />
          <circle cx="126" cy="18" r="1.5" fill="#3b82f6" />
          <circle cx="150" cy="18" r="1.5" fill="#3b82f6" />
        </g>

        {/* Olhos Grandes e Místicos que Piscam e Brilham */}
        <circle cx="132" cy="35" r="4.5" fill="white" />
        <circle cx="133" cy="35" r="2.5" fill={isNight ? "#059669" : "#064e3b"} />
        <circle cx="134" cy="34" r="1" fill="white" className="animate-pulse" />

        {/* Corcovas (Humps) com gradiente e volume 3D */}
        <path d="M25 105 Q 48 70 70 105" fill={isNight ? "url(#nessieSkinNight)" : "url(#nessieSkin)"} />
        <path d="M65 105 Q 88 65 110 105" fill={isNight ? "url(#nessieSkinNight)" : "url(#nessieSkin)"} />

        {/* Nadadeira Lateral Animada */}
        <path d="M45 105 L28 116 L43 119 Z" fill={isNight ? "#022c22" : "#047857"} opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" values="0 45 105; 20 45 105; 0 45 105" dur="1.8s" repeatCount="indefinite" />
        </path>

        {/* Brilho Místico Noturno Aura */}
        {isNight && (
          <g opacity="0.65" filter="url(#nessieGlow)">
            <circle cx="133" cy="35" r="7" fill="#10b981" opacity="0.25" />
            <path d="M90 20 Q120 10 135 40" fill="none" stroke="#6ee7b7" strokeWidth="3" opacity="0.5" />
            <path d="M65 105 Q 88 65 110 105" fill="none" stroke="#6ee7b7" strokeWidth="2" opacity="0.3" />
          </g>
        )}
      </svg>

      {/* Efeito de Mergulho (Splash) */}
      {isDiving && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
          <Waves className="w-20 h-20 text-emerald-400/60 animate-ping" />
          <div className="mt-4 px-3 py-1.5 bg-emerald-950/80 backdrop-blur-md rounded-full border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest animate-pulse">Mergulhando...</span>
          </div>
        </div>
      )}

      {/* Balão de Fala do Monstro do Lago */}
      {isDiving && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-black text-emerald-400 border border-emerald-500/30 shadow-2xl animate-in zoom-in fade-in duration-300 whitespace-nowrap z-50">
          ✨ NESSIE: "Glub! Glub! 🌊"
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

  const safeColorId = color.replace('#', '');

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
      className={cn("absolute transition-all duration-[2000ms] ease-in-out pointer-events-none select-none", className)}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) scaleX(${flip})`,
        opacity: opacity
      }}
    >
      <svg viewBox="0 0 50 25" className="w-full h-auto drop-shadow-md overflow-visible">
        <defs>
          <linearGradient id={`fishBody-${safeColorId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="70%" stopColor={color} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`fishFins-${safeColorId}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Barbatana Dorsal (Costas) */}
        <path d="M18 6 C 22 -2, 28 -2, 26 6 Z" fill={`url(#fishFins-${safeColorId})`} opacity="0.9">
          <animateTransform attributeName="transform" type="skewX"
            values="0; 15; 0; -15; 0"
            dur="0.8s" repeatCount="indefinite" />
        </path>

        {/* Cauda em leque detalhada */}
        <path d="M6 12 C 0 4, -2 6, 1 12 C -2 18, 0 20, 6 12 Z" fill={`url(#fishFins-${safeColorId})`} className="origin-[6px_12px]">
          <animateTransform attributeName="transform" type="rotate"
            values="0 6 12; 20 6 12; 0 6 12; -20 6 12; 0 6 12"
            dur="0.4s" repeatCount="indefinite" />
        </path>

        {/* Corpo principal */}
        <path d="M6 12 Q 18 2 38 12 Q 18 22 6 12" fill={`url(#fishBody-${safeColorId})`} />

        {/* Detalhe da Guelra */}
        <path d="M30 9 C 28 11, 28 13, 30 15" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />

        {/* Olho com brilho */}
        <circle cx="33" cy="11" r="2" fill="black" />
        <circle cx="34" cy="10" r="0.6" fill="white" />

        {/* Barbatana Peitoral */}
        <path d="M22 14 C 20 18, 25 22, 24 14" fill={`url(#fishFins-${safeColorId})`} opacity="0.95">
          <animateTransform attributeName="transform" type="rotate"
            values="0 22 14; 25 22 14; 0 22 14; -15 22 14; 0 22 14"
            dur="0.5s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
};

/**
 * PainterlyBird: Desenha pássaros que voam e batem asas.
 */
const PainterlyBird = ({ color, className, initialDelay = 0, isNight = false }: { color: string, className?: string, initialDelay?: number, isNight?: boolean }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [flip, setFlip] = useState(1);

  const safeColorId = color.replace('#', '');

  useEffect(() => {
    if (isNight) {
      setPos({ x: 0, y: 0 });
      setFlip(1); // Fica virado para o lado da árvore
      setOpacity(0.95);
      return;
    }

    const fly = () => {
      setPos({
        x: Math.random() * 200 - 100,
        y: Math.random() * 60 - 30
      });
      setFlip(Math.random() > 0.5 ? 1 : -1);
    };

    setOpacity(0.9);
    const interval = setInterval(fly, 5000 + Math.random() * 3000); // Muda de rota mais rápido

    return () => clearInterval(interval);
  }, [isNight]);

  return (
    <div
      className={cn("absolute transition-all duration-[3000ms] ease-in-out pointer-events-none select-none", className)}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) scaleX(${flip})`,
        opacity: opacity
      }}
    >
      <svg viewBox="0 0 60 40" className="w-full h-auto drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id={`birdBody-${safeColorId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="60%" stopColor={color} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={`birdWing-${safeColorId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        
        {/* Cauda elegante com penas sobrepostas */}
        <path d="M10 24 C -2 20 -4 30 2 33 C 4 29 8 27 10 24 Z" fill={`url(#birdBody-${safeColorId})`} opacity="0.85" />
        <path d="M10 25 C -4 26 -3 35 4 36 C 6 32 9 28 10 25 Z" fill={`url(#birdBody-${safeColorId})`} opacity="0.75" />

        {/* Asa de Trás com animação suave */}
        <path d="M25 20 C 15 2 12 6 22 13 C 27 16 28 18 25 20 Z" fill={`url(#birdWing-${safeColorId})`} filter="brightness(0.75)">
          {!isNight && (
            <animateTransform attributeName="transform" type="rotate"
              values="0 25 20; -45 25 20; 10 25 20; 0 25 20"
              dur="0.45s" repeatCount="indefinite" />
          )}
        </path>

        {/* Corpo principal gordinho e harmônico */}
        <path d="M12 24 C 5 18 18 10 32 14 C 40 16 46 22 42 28 C 36 34 20 32 12 24 Z" fill={`url(#birdBody-${safeColorId})`} />

        {/* Peito/Papo contrastante (detalhe fofo/premium) */}
        <path d="M26 15 C 34 16 41 21 38 27 C 34 32 24 30 20 25 C 22 20 24 16 26 15 Z" fill="white" opacity="0.3" />

        {/* Cabeça */}
        <circle cx="38" cy="18" r="8" fill={`url(#birdBody-${safeColorId})`} />
        
        {/* Olho com brilho de vida */}
        <circle cx="41" cy="16" r="2.2" fill="black" />
        <circle cx="42" cy="15" r="0.7" fill="white" />
        
        {/* Bico cônico dourado */}
        <path d="M45 18 Q 53 19 45 23 Q 44 21 45 18 Z" fill="#f59e0b" />

        {/* Asa da Frente */}
        <path d="M25 20 C 15 -2 8 2 20 12 C 26 16 27 18 25 20 Z" fill={`url(#birdWing-${safeColorId})`} filter="brightness(1.1)">
          {!isNight && (
            <animateTransform attributeName="transform" type="rotate"
              values="0 25 20; -60 25 20; 15 25 20; 0 25 20"
              dur="0.45s" repeatCount="indefinite" />
          )}
        </path>
      </svg>
    </div>
  );
};

/**
 * PainterlyButterflies: Enxames de borboletas que voam e mudam de lugar.
 */
const PainterlyButterflies = ({ color, className, initialDelay = 0, isNight = false }: { color: string, className?: string, initialDelay?: number, isNight?: boolean }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const flutterToRandom = () => {
    setPos({
      x: Math.random() * 120 - 60,
      y: Math.random() * 50 - 25
    });
  };

  useEffect(() => {
    if (isNight) {
      setPos({ x: 0, y: 0 });
      setOpacity(0.95);
      return;
    }

    const flutter = () => {
      setOpacity(0);

      setTimeout(() => {
        flutterToRandom();
        setOpacity(0.8);
      }, 1500);
    };

    const timeout = setTimeout(() => {
      setOpacity(0.8);
      const interval = setInterval(flutter, 6000 + Math.random() * 4000);
      return () => clearInterval(interval);
    }, initialDelay * 1000);

    return () => clearTimeout(timeout);
  }, [initialDelay, isNight]);

  return (
    <div
      className={cn("absolute transition-all duration-[1500ms] ease-in-out pointer-events-auto cursor-pointer select-none", className)}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        opacity: opacity
      }}
      onClick={(e) => {
        if (isNight) return; // Não voa ao clicar de noite
        e.stopPropagation();
        setOpacity(0.3);
        setTimeout(() => {
          flutterToRandom();
          setOpacity(0.8);
        }, 150);
      }}
    >
      {[...Array(1)].map((_, i) => (
        <div
          key={i}
          className={cn("absolute", !isNight && "animate-bounce")}
          style={{
            left: `${i * 25}%`,
            top: `${i * -18}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: '1.8s',
            width: '45%'
          }}
        >
          {/* Borboleta individual com asas que batem em 3D */}
          <svg
            viewBox="0 0 30 30"
            className="w-full h-auto overflow-visible drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
          >
            {/* Corpo e antenas */}
            <line x1="15" y1="8" x2="15" y2="22" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M15 8 Q12 5 11 3 M15 8 Q18 5 19 3" fill="none" stroke="#0f172a" strokeWidth="0.8" strokeLinecap="round" />

            {/* Grupo de asas que batem horizontalmente */}
            <g
              style={{
                transformOrigin: '15px 15px',
                animation: isNight ? 'none' : 'btf-flap 0.25s infinite ease-in-out',
                transform: isNight ? 'scaleX(0.2)' : 'none',
                animationDelay: `${i * 0.1}s`
              }}
            >
              {/* Asas Esquerdas (Superior e Inferior) */}
              <path d="M15 15 Q6 6 2 11 Q1 17 15 17 Q7 23 9 24 Q13 25 15 17" fill={color} opacity="0.95" />
              {/* Asas Direitas (Superior e Inferior) */}
              <path d="M15 15 Q24 6 28 11 Q29 17 15 17 Q23 23 21 24 Q17 25 15 17" fill={color} opacity="0.95" />

              {/* Detalhes internos brilhantes da asa */}
              <path d="M15 15 Q9 9 6 12 Q8 15 15 15 M15 15 Q21 9 24 12 Q22 15 15 15" fill="#ffffff" opacity="0.4" />
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
};

/**
 * PainterlySolarFarm: Desenha um conjunto de painéis solares terrestres.
 */
const PainterlySolarFarm = ({ className }: { className?: string }) => (
  <div className={cn("relative group transition-all duration-700 pointer-events-auto select-none", className)}>
    <div className="absolute -bottom-1 left-[10%] w-[15%] h-2.5 bg-black/15 blur-md rounded-full" />
    <div className="absolute -bottom-1 left-[35%] w-[60%] h-3 bg-black/10 blur-md rounded-full" />
    <svg viewBox="0 0 170 50" className="w-full h-auto drop-shadow-lg overflow-visible transition-transform duration-500 group-hover:scale-105">
      <defs>
        <linearGradient id="solarPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Fio de Conexão das Placas para a Bateria */}
      <path d="M70 30 Q45 44 29 35" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M95 28 Q75 42 70 30" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <path d="M120 26 Q95 40 95 28" fill="none" stroke="#1e293b" strokeWidth="1.0" strokeLinecap="round" opacity="0.7" />

      {/* Suportes metálicos */}
      <line x1="70" y1="25" x2="70" y2="42" stroke="#64748b" strokeWidth="2.5" />
      <line x1="95" y1="23" x2="95" y2="40" stroke="#64748b" strokeWidth="2.5" />
      <line x1="120" y1="21" x2="120" y2="38" stroke="#64748b" strokeWidth="2.5" />

      {/* Placa Solar 1 */}
      <g transform="rotate(-15, 70, 25)">
        <rect x="55" y="12" width="30" height="16" fill="url(#solarPanelGrad)" stroke="#38bdf8" strokeWidth="1" rx="1" />
        <line x1="55" y1="20" x2="85" y2="20" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <line x1="65" y1="12" x2="65" y2="28" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <line x1="75" y1="12" x2="75" y2="28" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <path d="M57 14 L70 26" stroke="#fff" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
      </g>

      {/* Placa Solar 2 */}
      <g transform="rotate(-15, 95, 23)">
        <rect x="80" y="10" width="30" height="16" fill="url(#solarPanelGrad)" stroke="#38bdf8" strokeWidth="1" rx="1" />
        <line x1="80" y1="18" x2="110" y2="18" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <line x1="90" y1="10" x2="90" y2="26" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <line x1="100" y1="10" x2="100" y2="26" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <path d="M82 12 L95 24" stroke="#fff" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
      </g>

      {/* Placa Solar 3 */}
      <g transform="rotate(-15, 120, 21)">
        <rect x="105" y="8" width="30" height="16" fill="url(#solarPanelGrad)" stroke="#38bdf8" strokeWidth="1" rx="1" />
        <line x1="105" y1="16" x2="135" y2="16" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <line x1="115" y1="8" x2="115" y2="24" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <line x1="125" y1="8" x2="125" y2="24" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
        <path d="M107 10 L120 22" stroke="#fff" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
      </g>

      {/* Inversor / Bateria de Armazenamento */}
      <g transform="translate(15, 28)">
        <rect x="0" y="0" width="14" height="14" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" rx="1" />
        <rect x="2" y="2" width="10" height="4" fill="#1e293b" rx="0.5" />
        <circle cx="5" cy="4" r="0.75" fill="#22c55e" className="animate-pulse" />
        <circle cx="8" cy="4" r="0.75" fill="#3b82f6" />
        <rect x="3" y="9" width="8" height="2" fill="#475569" rx="0.5" />
      </g>
    </svg>
  </div>
);

/**
 * PainterlyRecyclingBins: Desenha um ponto de coleta seletiva com 4 lixeiras coloridas.
 */
const PainterlyRecyclingBins = ({ className }: { className?: string }) => (
  <div className={cn("relative group transition-all duration-700 pointer-events-auto select-none", className)}>
    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[95%] h-2.5 bg-black/15 blur-md rounded-full" />
    <svg viewBox="0 0 100 50" className="w-full h-auto drop-shadow-lg overflow-visible transition-transform duration-500 group-hover:scale-105">
      {/* Placa Coleta Seletiva */}
      <rect x="25" y="4" width="50" height="8" fill="#1e293b" rx="2" stroke="#475569" strokeWidth="0.5" />
      <path d="M47 8 L50 5 L53 8 Z" fill="#22c55e" />
      <text x="50" y="10" fontSize="3.5" fontWeight="900" fill="#22c55e" textAnchor="middle" letterSpacing="0.2">RECICLAR</text>
      <line x1="50" y1="12" x2="50" y2="18" stroke="#475569" strokeWidth="1" />

      {/* Lixeira Azul (Papel) */}
      <g transform="translate(10, 18)">
        <rect x="0" y="0" width="16" height="24" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" rx="2" />
        <rect x="-1" y="-1" width="18" height="4" fill="#1d4ed8" rx="1" />
        <rect x="5" y="7" width="6" height="8" fill="#fff" opacity="0.3" rx="0.5" />
        <line x1="7" y1="10" x2="9" y2="10" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
      </g>

      {/* Lixeira Vermelha (Plástico) */}
      <g transform="translate(30, 18)">
        <rect x="0" y="0" width="16" height="24" fill="#dc2626" stroke="#b91c1c" strokeWidth="1" rx="2" />
        <rect x="-1" y="-1" width="18" height="4" fill="#b91c1c" rx="1" />
        <ellipse cx="8" cy="11" rx="2" ry="4" fill="#fff" opacity="0.3" />
        <rect x="7" y="5" width="2" height="3" fill="#fff" opacity="0.3" />
      </g>

      {/* Lixeira Verde (Vidro) */}
      <g transform="translate(50, 18)">
        <rect x="0" y="0" width="16" height="24" fill="#16a34a" stroke="#15803d" strokeWidth="1" rx="2" />
        <rect x="-1" y="-1" width="18" height="4" fill="#15803d" rx="1" />
        <path d="M6 14 L6 9 Q6 6 8 6 Q10 6 10 9 L10 14 Z" fill="#fff" opacity="0.3" />
      </g>

      {/* Lixeira Amarela (Metal) */}
      <g transform="translate(70, 18)">
        <rect x="0" y="0" width="16" height="24" fill="#eab308" stroke="#ca8a04" strokeWidth="1" rx="2" />
        <rect x="-1" y="-1" width="18" height="4" fill="#ca8a04" rx="1" />
        <rect x="5" y="8" width="6" height="9" fill="#fff" opacity="0.3" rx="1" />
      </g>
    </svg>
  </div>
);

// ---------------------------------------------

/**
 * Componente Principal EcosystemViewer
 */
export function EcosystemViewer({
  vitality,
  purchasedItems = [],
  className,
  interactive = true,
  isLegendary: isLegendaryProp,
  forceTime: externalForceTime,
  onForceTimeChange,
  showControls = true
}: {
  vitality: number;
  purchasedItems?: EcosystemItem[];
  className?: string;
  interactive?: boolean;
  isLegendary?: boolean;
  forceTime?: 'real' | 'day' | 'night';
  onForceTimeChange?: (time: 'real' | 'day' | 'night') => void;
  showControls?: boolean;
}) {
  const { level } = useEcosystem();
  const isLegendary = isLegendaryProp ?? (level === 'Guardião da Lenda');
  const [realTime, setRealTime] = useState({ h: 12, m: 0 });
  const [internalForceTime, setInternalForceTime] = useState<'real' | 'day' | 'night'>('real');
  const forceTime = externalForceTime !== undefined ? externalForceTime : internalForceTime;
  const setForceTime = onForceTimeChange !== undefined ? onForceTimeChange : setInternalForceTime;
  const [isClient, setIsClient] = useState(false);
  const [areChildrenSummoned, setAreChildrenSummoned] = useState(false);

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
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes cloud-drift {
          0% { transform: translateX(-200px); }
          100% { transform: translateX(100vw); }
        }
        @keyframes water-shimmer {
          0%, 100% { opacity: 0.3; transform: scaleX(0.9); }
          50% { opacity: 0.9; transform: scaleX(1.1); }
        }
        @keyframes shore-wave {
          0% { stroke-dashoffset: 0; opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { stroke-dashoffset: -50; opacity: 0.4; }
        }
        @keyframes btf-flap {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.15); }
        }
        @keyframes btf-flap-slow {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.2); }
        }
      `}</style>
      <SVGFilters />

      {/* Camada de ruído visual para dar textura premium */}
      <div
        className="absolute inset-0 z-[80] pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')` }}
      />

      {/* Interface de controle do horário (apenas se interativo e showControls) */}
      {interactive && showControls && (
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

        {/* Só mostra a Aurora se o aluno for Lendário */}
        {isLegendary && <AuroraBoreal />}

        {/* EFEITOS ATMOSFÉRICOS */}
        {!isEcosystemNight && airClean && <SunBeams />}
        {isEcosystemNight && <Fireflies />}
        {isHealthy && <WindLeaves />}
        {isEcosystemNight && <StarField />}
        {!isEcosystemNight && <CloudField />}

        {/* SOL OU LUA VETORIAL */}
        <SunOrMoon isNight={isEcosystemNight} />

        {/* MONTANHAS */}
        <div className="absolute inset-x-0 bottom-[30%] h-[40%] z-10 opacity-90 blur-[1px]">
          <MountainRange isNight={isEcosystemNight} />
        </div>

        {/* RIO E TERRA (DESENHO DINÂMICO MULTICAMADAS) */}
        <div className="absolute bottom-0 inset-x-0 w-full h-[45%] z-20">
          <svg viewBox="0 0 1000 450" preserveAspectRatio="none" className="w-full h-full">
            {/* Rio com gradientes de profundidade */}
            <path
              d="M440 0 L1000 0 L1000 450 L0 450 Q530 250 440 0 Z"
              fill={riverClean ? (isEcosystemNight ? "url(#river-clean-night)" : "url(#river-clean-day)") : (isEcosystemNight ? "url(#river-dirty-night)" : "url(#river-dirty-day)")}
              className="transition-all duration-[3000ms]"
              style={{ filter: riverClean ? 'url(#water-ripple)' : 'none' }}
            />

            {/* Terra - Camada de Fundo (Back Hill) */}
            <path
              d="M0 0 L490 0 Q580 230 0 450 Z"
              fill={groundClean ? (isEcosystemNight ? "url(#ground-back-night)" : "url(#ground-back-day)") : (isEcosystemNight ? "url(#ground-back-dirty-night)" : "url(#ground-back-dirty-day)")}
              className="transition-all duration-[3000ms] opacity-90"
            />

            {/* Terra - Faixa de Areia / Praia (Beach Layer) */}
            <path
              d="M0 0 L495 0 Q585 245 0 450 Z"
              fill={groundClean ? (isEcosystemNight ? "url(#sand-clean-night)" : "url(#sand-clean-day)") : (isEcosystemNight ? "url(#sand-dirty-night)" : "url(#sand-dirty-day)")}
              className="transition-all duration-[3000ms]"
            />

            {/* Terra - Camada da Frente (Front Hill) */}
            <path
              d="M0 0 L440 0 Q530 250 0 450 Z"
              fill={groundClean ? (isEcosystemNight ? "url(#ground-front-night)" : "url(#ground-front-day)") : (isEcosystemNight ? "url(#ground-front-dirty-night)" : "url(#ground-front-dirty-day)")}
              className="transition-all duration-[3000ms]"
            />

            {/* Espuma de Onda Animada (Shore Wave - posicionada na borda da água) */}
            {riverClean && (
              <path
                d="M497 0 Q587 245 0 452"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="10, 15"
                style={{ animation: 'shore-wave 6s linear infinite' }}
              />
            )}
          </svg>

          {/* Shimmers e Vegetação */}
          <WaterShimmers isNight={isEcosystemNight} />
          <GrassAndFlowers isNight={isEcosystemNight} isHealthy={groundClean} />
        </div>

        {/* ELEMENTOS COMPRADOS (SÓ APARECEM SE ESTIVEREM NA LISTA) */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div className="relative w-full h-full">
            {/* Árvores (Mudam de col se a vitalidade for baixa) */}
            {purchasedItems.includes('arvore_3') && <PainterlyTree type="salgueiro" color={vitality < 30 ? (isEcosystemNight ? "#2d1a13" : "#451a03") : (isEcosystemNight ? "#0d9488" : "#10b981")} className="absolute bottom-[42%] left-[0%] z-30 w-[11%] min-w-[50px] max-w-[110px]" delay="0.5s" />}
            {purchasedItems.includes('arvore_2') && <PainterlyTree type="sumit" color={vitality < 30 ? (isEcosystemNight ? "#2d1a13" : "#451a03") : (isEcosystemNight ? "#065f46" : "#16a34a")} className="absolute bottom-[30%] left-[12%] z-20 w-[16%] min-w-[70px] max-w-[160px]" delay="1.2s" />}
            {purchasedItems.includes('arvore_1') && <PainterlyTree type="carvalho" color={vitality < 30 ? (isEcosystemNight ? "#2d1a13" : "#451a03") : (isEcosystemNight ? "#064e3b" : "#15803d")} className="absolute bottom-[12%] left-[4%] z-20 w-[19%] min-w-[85px] max-w-[190px]" delay="0s" />}

            {/* Casa */}
            {purchasedItems.includes('casa') && (
              <PainterlyHouse 
                isNight={isEcosystemNight} 
                hasSolarPanels={purchasedItems.includes('placas_solares')} 
                hasMother={purchasedItems.includes('mae_human')}
                hasChildren={purchasedItems.includes('criancas')}
                className="absolute bottom-[35%] left-[25%] z-20 w-[18%] min-w-[100px] max-w-[225px]" 
              />
            )}

            {/* Estação de Placas Solares (Só aparece se comprar o Filtro de Ar) */}
            {purchasedItems.includes('placas_solares') && <PainterlySolarFarm className="absolute bottom-[36%] left-[36%] z-20 w-[20%] min-w-[110px] max-w-[250px]" />}

            {/* Ponto de Coleta Seletiva (Só aparece se Restaurar o Solo) */}
            {purchasedItems.includes('lixeiras') && <PainterlyRecyclingBins className="absolute bottom-[30%] left-[30%] z-30 w-[8%] min-w-[45px] max-w-[100px]" />}

            {/* Animais Terrestres (Só aparecem se Vitalidade >= 70) */}
            {vitality >= 70 && purchasedItems.includes('cachorro') && (
              <PainterlyDog 
                key={`cachorro_${isEcosystemNight ? 'night' : 'day'}`}
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-30 w-[6%] min-w-[30px] max-w-[60px]",
                  isEcosystemNight ? "bottom-[35%] left-[23%]" : "bottom-[12%] left-[22%]"
                )} 
              />
            )}
            {vitality >= 70 && purchasedItems.includes('gato') && (
              <PainterlyCat 
                key={`gato_${isEcosystemNight ? 'night' : 'day'}`}
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-30 w-[4.5%] min-w-[22px] max-w-[45px]",
                  isEcosystemNight ? "bottom-[36%] left-[42%]" : "bottom-[22%] left-[32%]"
                )} 
              />
            )}

            {/* Mãe (Só aparece se for comprada e for dia) */}
            {vitality >= 70 && purchasedItems.includes('mae_human') && !isEcosystemNight && (
              <PainterlyMother
                areChildrenSummoned={areChildrenSummoned}
                onClick={() => setAreChildrenSummoned(prev => !prev)}
                className="absolute bottom-[32%] left-[23%] z-30 w-[6%] min-w-[32px] max-w-[65px]"
              />
            )}

            {/* Crianças brincando (Aparecem quando compradas, ecossistema saudável e for dia) */}
            {vitality >= 75 && purchasedItems.includes('criancas') && !isEcosystemNight && (
              <PainterlyChildren
                className={cn(
                  "absolute z-30 w-[8%] min-w-[40px] max-w-[80px] transition-all duration-[2000ms] ease-in-out",
                  areChildrenSummoned
                    ? "bottom-[28%] left-[20%]"
                    : "bottom-[13%] left-[16%]"
                )}
              />
            )}

            {/* Borboletas (Só aparecem se Vitalidade >= 50) */}
            {vitality >= 50 && purchasedItems.includes('borboletas') && (
              <PainterlyButterflies 
                key={`borboletas_1_${isEcosystemNight ? 'night' : 'day'}`}
                color="#fbbf24" 
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-40 w-[6%] min-w-[30px]",
                  isEcosystemNight ? "bottom-[22%] left-[12%]" : "bottom-[25%] left-[15%]"
                )} 
                initialDelay={0} 
              />
            )}
            {vitality >= 50 && purchasedItems.includes('borboletas_2') && (
              <PainterlyButterflies 
                key={`borboletas_2_${isEcosystemNight ? 'night' : 'day'}`}
                color="#60a5fa" 
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-40 w-[6%] min-w-[30px]",
                  isEcosystemNight ? "bottom-[45%] left-[16%]" : "bottom-[35%] left-[8%]"
                )} 
                initialDelay={2} 
              />
            )}
            {vitality >= 50 && purchasedItems.includes('borboletas_3') && (
              <PainterlyButterflies 
                key={`borboletas_3_${isEcosystemNight ? 'night' : 'day'}`}
                color="#a855f7" 
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-40 w-[6%] min-w-[30px]",
                  isEcosystemNight ? "bottom-[52%] left-[2%]" : "bottom-[20%] left-[28%]"
                )} 
                initialDelay={4} 
              />
            )}
            {vitality >= 50 && purchasedItems.includes('borboletas_4') && (
              <PainterlyButterflies 
                key={`borboletas_4_${isEcosystemNight ? 'night' : 'day'}`}
                color="#f97316" 
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-40 w-[6%] min-w-[30px]",
                  isEcosystemNight ? "bottom-[18%] left-[7%]" : "bottom-[15%] left-[5%]"
                )} 
                initialDelay={6} 
              />
            )}

            {/* Pássaros (Só aparecem se Vitalidade >= 50) */}
            {vitality >= 50 && purchasedItems.includes('passaro_1') && (
              <PainterlyBird 
                key={`passaro_1_${isEcosystemNight ? 'night' : 'day'}`}
                color="#7dd3fc" 
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-10 w-[4.5%] min-w-[22px] max-w-[45px]",
                  isEcosystemNight ? "bottom-[24%] left-[9%] z-30" : "bottom-[65%] left-[25%]"
                )} 
                initialDelay={0} 
              />
            )}
            {vitality >= 50 && purchasedItems.includes('passaro_2') && (
              <PainterlyBird 
                key={`passaro_2_${isEcosystemNight ? 'night' : 'day'}`}
                color="#d8b4fe" 
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-10 w-[4.5%] min-w-[22px] max-w-[45px]",
                  isEcosystemNight ? "bottom-[42%] left-[18%] z-30" : "bottom-[75%] left-[45%]"
                )} 
                initialDelay={10} 
              />
            )}
            {vitality >= 50 && purchasedItems.includes('passaro_3') && (
              <PainterlyBird 
                key={`passaro_3_${isEcosystemNight ? 'night' : 'day'}`}
                color="#3b82f6" 
                isNight={isEcosystemNight}
                className={cn(
                  "absolute z-10 w-[4.5%] min-w-[22px] max-w-[45px]",
                  isEcosystemNight ? "bottom-[54%] left-[5%] z-30" : "bottom-[55%] left-[60%]"
                )} 
                initialDelay={5} 
              />
            )}

            {/* Vida Aquática (Só aparecem se Vitalidade >= 50) */}
            {vitality >= 50 && purchasedItems.includes('peixe_1') && <PainterlyFish color="#fbbf24" className="absolute bottom-[24%] left-[65%] z-30 w-[4%] min-w-[20px] max-w-[40px]" initialDelay={0} />}
            {vitality >= 50 && purchasedItems.includes('peixe_2') && <PainterlyFish color="#22d3ee" className="absolute bottom-[17%] left-[75%] z-30 w-[4%] min-w-[20px] max-w-[40px]" initialDelay={4} />}
            {vitality >= 50 && purchasedItems.includes('peixe_3') && <PainterlyFish color="#f8fafc" className="absolute bottom-[29%] left-[70%] z-30 w-[4%] min-w-[20px] max-w-[40px]" initialDelay={8} />}

            {/* Nessie (Lendário - Só aparece se Vitalidade >= 80) */}
            {vitality >= 80 && purchasedItems.includes('monstro_lago') && <PainterlyNessie isNight={isEcosystemNight} className="absolute bottom-[38%] left-[85%] z-10 w-[13%] min-w-[65px] max-w-[130px]" />}

            {/* Barcos */}
            {purchasedItems.includes('barco_1') && <PainterlyBoat type="patrol" className="absolute bottom-[28%] left-[55%] z-30 w-[10%] min-w-[50px] max-w-[110px]" />}
            {purchasedItems.includes('barco_2') && <PainterlyBoat type="solar" className="absolute bottom-[20%] left-[82%] z-30 w-[12%] min-w-[60px] max-w-[150px]" delay="1s" />}
          </div>
        </div>
      </div>
    </div>
  );
}
