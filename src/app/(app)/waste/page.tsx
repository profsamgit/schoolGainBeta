'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Paperclip, Recycle, Trash2, Atom } from 'lucide-react';
import { useState } from 'react';

const wasteTypes = [
  { id: 'plastic', label: 'Plástico', icon: Recycle, points: 10 },
  { id: 'paper', label: 'Papel', icon: Paperclip, points: 8 },
  { id: 'metal', label: 'Metal', icon: Atom, points: 15 },
  { id: 'organic', label: 'Orgânico', icon: Leaf, points: 5 },
];

export default function WastePage() {
  const [selectedWaste, setSelectedWaste] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaste) {
      toast({
        title: 'Seleção necessária',
        description: 'Por favor, selecione um tipo de resíduo.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const waste = wasteTypes.find((w) => w.id === selectedWaste);

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Registro bem-sucedido!',
        description: `Você ganhou ${waste?.points} pontos por reciclar ${waste?.label}.`,
      });
      setSelectedWaste(null);
    }, 1000);
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Registro de Descarte de Resíduo
          </CardTitle>
          <CardDescription>
            Selecione o tipo de resíduo que você descartou corretamente para
            ganhar pontos.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <RadioGroup
              value={selectedWaste ?? undefined}
              onValueChange={setSelectedWaste}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {wasteTypes.map((waste) => (
                <Label
                  key={waste.id}
                  htmlFor={waste.id}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    selectedWaste === waste.id
                      ? 'border-primary bg-primary/10'
                      : 'border-muted'
                  } hover:border-primary/50`}
                >
                  <waste.icon className="h-12 w-12 mb-2 text-primary" />
                  <span className="font-bold text-lg">{waste.label}</span>
                  <span className="text-sm text-muted-foreground">
                    +{waste.points} pontos
                  </span>
                  <RadioGroupItem
                    value={waste.id}
                    id={waste.id}
                    className="sr-only"
                  />
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !selectedWaste}
            >
              {isLoading ? 'Registrando...' : 'Registrar e Ganhar Pontos'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
