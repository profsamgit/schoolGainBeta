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
      <div className={cn('p-2 space-y-2 bg-muted/60 border rounded-lg', className)}>
        {keyRowsNumeric.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((key) => (
              <Button key={key} onClick={() => handleKeyPress(key)} variant="outline" className="w-16 h-16 text-xl font-semibold bg-background">
                {key}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-2">
          <Button onClick={() => handleKeyPress('0')} variant="outline" className="w-16 h-16 text-xl font-semibold bg-background">
            0
          </Button>
          <Button onClick={onBackspace} variant="outline" className="w-16 h-16 text-xl font-semibold bg-background">
            <Delete />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-2 space-y-2 bg-muted/60 border rounded-lg', className)}>
      {keyRowsAlpha.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5">
          {row.map((key) => (
            <Button key={key} onClick={() => handleKeyPress(key)} variant="outline" className="h-11 flex-1 font-semibold bg-background uppercase">
              {key}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-1.5">
         <Button onClick={onBackspace} variant="outline" className="h-11 w-24 bg-background">
            <Delete className="mr-2"/> Backspace
          </Button>
          <Button onClick={() => handleKeyPress(' ')} variant="outline" className="h-11 flex-1 bg-background">
            Space
          </Button>
          <Button onClick={onEnter} variant="default" className="h-11 w-24">
            Enter <CornerDownLeft className="ml-2"/>
          </Button>
      </div>
    </div>
  );
}
