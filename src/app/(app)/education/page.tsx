'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useToast } from '@/hooks/use-toast';

export default function EducationPage() {
  const { completeDailyMission, allArticles } = useEcosystem();
  const { toast } = useToast();

  const handleReadArticle = () => {
    const success = completeDailyMission(10);
    if (success) {
      toast({
        variant: 'success',
        title: 'Missão de Leitura Concluída!',
        description: 'Parabéns! Você ganhou pontos e manteve sua folha viva! 🌿',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          Módulo Educacional
        </h1>
        <p className="text-muted-foreground">
          Aprenda mais sobre sustentabilidade, reciclagem e como cuidar do nosso
          planeta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allArticles.map((article) => (
          <Card
            key={article.id}
            className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <Link href={`/education/${article.slug}`} className="block" onClick={handleReadArticle}>
              <div className="relative h-48 w-full">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={article.imageHint}
                />
              </div>
            </Link>
            <CardHeader>
              <CardTitle>{article.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{article.summary}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full" onClick={handleReadArticle}>
                <Link href={`/education/${article.slug}`}>
                  Ler Artigo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
