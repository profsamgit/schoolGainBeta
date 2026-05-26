'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EcossistemaEffectsProps {
  lastPurchased: string | null;
  isHealing: boolean;
}

export function EcossistemaEffects({
  lastPurchased,
  isHealing
}: EcossistemaEffectsProps) {
  if (!lastPurchased && !isHealing) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      <Sparkles className={cn(
          "w-64 h-64 animate-ping opacity-60",
          isHealing ? "text-emerald-400" : "text-yellow-400 shadow-[0_0_50px_rgba(251,191,36,0.5)]"
      )} />
    </div>
  );
}
