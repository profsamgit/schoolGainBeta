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
import { ArrowRight, BookOpen, Leaf } from 'lucide-react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useToast } from '@/hooks/use-toast';

export default function EducationPage() {
  const { completeDailyMission, allArticles, currentUser } = useEcosystem();
  const { toast } = useToast();

  const schoolArticles = allArticles.filter(article => 
    !article.schoolId || article.schoolId === currentUser?.schoolId || article.schoolId === 'school-1'
  );

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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="relative overflow-hidden rounded-3xl bg-emerald-900 p-8 text-white shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <BookOpen className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-2">
              Jornada do Conhecimento
            </h1>
            <p className="text-emerald-100/80 max-w-lg font-medium">
              Transforme informação em ação. Explore nossos guias exclusivos e 
              torne-se um guardião da sustentabilidade.
            </p>
          </div>
        </div>
        <div className="absolute right-[-40px] top-[-40px] opacity-10 rotate-12">
            <Leaf className="h-64 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {schoolArticles.map((article) => (
          <Card
            key={article.id}
            className="group flex flex-col overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl bg-white"
          >
            <Link href={`/education/${article.slug}`} className="block relative h-56 w-full overflow-hidden" onClick={handleReadArticle}>
              <Image
                src={article.image}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint={article.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4">
                 <div className="h-1 w-12 bg-emerald-400 rounded-full mb-2"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Pedagógico</span>
              </div>
            </Link>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                {article.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pt-0">
              <CardDescription className="text-slate-500 font-medium line-clamp-3 leading-relaxed">
                {article.summary}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-50 bg-slate-50/50">
              <Button asChild variant="ghost" className="w-full justify-between font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all group/btn" onClick={handleReadArticle}>
                <Link href={`/education/${article.slug}`}>
                  Explorar Conteúdo <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
