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
      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <BookOpen className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
              Jornada do Conhecimento
            </h1>
            <p className="text-slate-400 max-w-lg font-medium text-sm mt-1 leading-relaxed">
              Transforme informação em ação. Explore nossos guias exclusivos e 
              torne-se um guardião da sustentabilidade.
            </p>
          </div>
        </div>
        <div className="absolute right-[-40px] top-[-40px] opacity-5 rotate-12 text-emerald-400">
            <Leaf className="h-64 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {schoolArticles.map((article) => (
          <Card
            key={article.id}
            className="group flex flex-col overflow-hidden border border-white/5 shadow-2xl hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all duration-500 rounded-[2rem] bg-slate-900/40 text-white backdrop-blur-xl"
          >
            <Link href={`/education/${article.slug}`} className="block relative h-56 w-full overflow-hidden" onClick={handleReadArticle}>
              <Image
                src={article.image}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                data-ai-hint={article.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                 <div className="h-1 w-10 bg-emerald-400 rounded-full mb-2 animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Pedagógico</span>
              </div>
            </Link>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors leading-snug uppercase tracking-tight line-clamp-2">
                {article.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pt-0">
              <CardDescription className="text-slate-400 font-medium text-xs line-clamp-3 leading-relaxed">
                {article.summary}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-4 border-t border-white/5 bg-slate-950/40">
              <Button asChild variant="ghost" className="w-full justify-between font-black uppercase text-[9px] tracking-widest text-emerald-400 hover:text-white hover:bg-emerald-500 hover:border-emerald-500 border border-white/5 rounded-2xl h-11 px-5 transition-all duration-300 group/btn" onClick={handleReadArticle}>
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
