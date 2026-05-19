'use client';

import { Delete, CornerDownLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface VirtualKeyboardProps {
  onInput: (value: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  className?: string;
  layout?: 'numeric' | 'alphanumeric';
}

export function VirtualKeyboard({ onInput, onBackspace, onEnter, className, layout = 'alphanumeric' }: VirtualKeyboardProps) {
  const handleKeyPress = (key: string) => {
    onInput(key);
  };
  
  const keyRowsNumeric = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  const keyRowsAlpha = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '@', '.'],
  ];

  if (layout === 'numeric') {
    return (
      <div className={cn('p-4 space-y-3 bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl max-w-sm mx-auto', className)}>
        {keyRowsNumeric.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-3">
            {row.map((key) => (
              <Button 
                key={key} 
                onClick={() => handleKeyPress(key)} 
                variant="outline" 
                className="w-16 h-16 text-xl font-black bg-slate-950/40 border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 text-slate-200 rounded-2xl transition-all duration-200 active:scale-95 shadow-md"
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-3">
          <Button 
            onClick={() => handleKeyPress('0')} 
            variant="outline" 
            className="w-16 h-16 text-xl font-black bg-slate-950/40 border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 text-slate-200 rounded-2xl transition-all duration-200 active:scale-95 shadow-md"
          >
            0
          </Button>
          <Button 
            onClick={onBackspace} 
            variant="outline" 
            className="w-16 h-16 text-xl font-black bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-400 rounded-2xl transition-all duration-200 active:scale-95 shadow-md"
          >
            <Delete className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-4 space-y-2 bg-slate-900/40 border border-white/5 rounded-[2rem] backdrop-blur-xl shadow-2xl w-full max-w-2xl mx-auto', className)}>
      {keyRowsAlpha.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5">
          {row.map((key) => (
            <Button 
              key={key} 
              onClick={() => handleKeyPress(key)} 
              variant="outline" 
              className="h-12 flex-1 text-sm font-black bg-slate-950/40 border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 text-slate-200 rounded-xl transition-all duration-200 active:scale-95 uppercase shadow-md"
            >
              {key}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-1.5 pt-1">
         <Button 
           onClick={onBackspace} 
           variant="outline" 
           className="h-12 w-28 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-250 active:scale-95 shadow-md"
         >
            <Delete className="mr-1.5 h-4 w-4"/> Apagar
          </Button>
          <Button 
            onClick={() => handleKeyPress(' ')} 
            variant="outline" 
            className="h-12 flex-1 bg-slate-950/40 border-white/5 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-250 active:scale-95 shadow-md"
          >
            Espaço
          </Button>
          <Button 
            onClick={onEnter} 
            className="h-12 w-28 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-250 active:scale-95"
          >
            Confirmar <CornerDownLeft className="ml-1.5 h-4 w-4"/>
          </Button>
      </div>
    </div>
  );
}
