'use client';

import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface SuccessSectionProps {
  successMessage: string;
  handleExit: () => void;
}

export function SuccessSection({
  successMessage,
  handleExit
}: SuccessSectionProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background items-center justify-center p-4">
      <Card className="w-full max-w-lg border-primary/20 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="h-2 bg-primary"></div>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">Ação Registrada!</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 px-8">
          <p className="text-xl font-bold text-slate-800 leading-relaxed">
            "{successMessage}"
          </p>
          <p className="mt-6 text-sm text-muted-foreground uppercase font-black tracking-widest">Equipe SchoolGain</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleExit} className="w-full h-14 text-lg font-bold" size="lg">
            Finalizar e Voltar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
