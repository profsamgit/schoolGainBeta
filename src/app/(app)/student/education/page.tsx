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
import { ArrowRight, BookOpen, Leaf, Sparkles, Loader2, Award, BookOpenCheck } from 'lucide-react';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useState } from 'react';
import { generateNewAIArticle } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function EducationPage() {
  const { allArticles, currentUser, userStates } = useEcosystem();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const schoolArticles = allArticles;

  // Calculate daily reading limit
  const state = currentUser ? userStates[currentUser.id] : null;
  const today = new Date().toISOString().split('T')[0];
  const readTodayCount = state?.dailyArticleReads?.[today]?.length || 0;
  const maxDailyReads = 3;

  const handleGenerateArticle = async () => {
    if (!currentUser?.schoolId) {
      toast({
        variant: 'destructive',
        title: 'Unidade não identificada',
        description: 'Faça login novamente para validar sua unidade escolar.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const article = await generateNewAIArticle(currentUser.schoolId);
      if (article) {
        toast({
          title: 'Artigo Gerado!',
          description: `Novo artigo "${article.title}" gerado com sucesso por IA!`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Falha na geração',
          description: 'Não foi possível contatar o Gemini no momento. Tente novamente.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao gerar o artigo.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl p-8 text-slate-800 dark:text-white shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              Jornada do Conhecimento
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg font-medium text-sm mt-1 leading-relaxed">
              Explore nossa biblioteca de sustentabilidade gerada por IA. Leia artigos interativos, responda de forma ativa e colha pontos!
            </p>
          </div>
        </div>
        <div className="absolute right-[-40px] top-[-40px] opacity-5 rotate-12 text-emerald-600 dark:text-emerald-400">
            <Leaf className="h-64 w-64" />
        </div>
      </div>

      {/* Painel Meta de Leitura Diária e Geração de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Progresso */}
        <div className="md:col-span-2 relative overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500" /> Meta Diária de Leitura
            </h2>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {readTodayCount} de {maxDailyReads} artigos lidos
            </span>
          </div>

          {/* Slots Visuais do Progresso */}
          <div className="grid grid-cols-3 gap-3 my-4">
            {[0, 1, 2].map((idx) => {
              const active = readTodayCount > idx;
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                    active 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400 shadow-md shadow-emerald-500/5" 
                      : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-white/5 text-slate-400"
                  )}
                >
                  {active ? (
                    <BookOpenCheck className="h-5 w-5 animate-pulse" />
                  ) : (
                    <BookOpen className="h-5 w-5 opacity-40" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
            {readTodayCount >= maxDailyReads 
              ? "Parabéns! Você alcançou a meta diária de hoje. Amanhã tem mais Bio-Coins! 🌿" 
              : `Cada artigo lido rende 20 Bio-Coins. Restam ${maxDailyReads - readTodayCount} leituras bonificadas hoje.`}
          </p>
        </div>

        {/* Card Ações IA */}
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Inteligência Artificial
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Deseja aprender algo novo? Clique abaixo para gerar um artigo exclusivo gerado na hora pela IA do Gemini.
            </p>
          </div>

          <Button
            onClick={handleGenerateArticle}
            disabled={isGenerating}
            className="w-full mt-4 h-12 rounded-2xl font-black uppercase text-[9px] tracking-widest bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg active:scale-95 transition-all duration-300"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Artigo...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4 text-amber-300 animate-pulse" /> Gerar Novo Artigo</>
            )}
          </Button>
        </div>

      </div>

      {/* Grid de Artigos */}
      {schoolArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/20">
          <BookOpen className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-4 animate-bounce" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Sua biblioteca está vazia</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1 max-w-sm">
            Nenhum artigo cadastrado ou gerado para sua unidade. Clique em "Gerar Novo Artigo" para estrear a biblioteca escolar!
          </p>
          <Button
            onClick={handleGenerateArticle}
            disabled={isGenerating}
            className="mt-6 h-11 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
            ) : (
              "Gerar Primeiro Artigo"
            )}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schoolArticles.map((article) => (
            <Card
              key={article.id}
              className="group flex flex-col overflow-hidden border border-slate-200/60 dark:border-white/5 shadow-2xl hover:border-emerald-500/20 dark:hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all duration-500 rounded-[2rem] bg-white/80 dark:bg-slate-900/40 text-slate-800 dark:text-white backdrop-blur-xl"
            >
              <Link href={`/student/education/${article.slug}`} className="block relative h-52 w-full overflow-hidden">
                <Image
                  src={article.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'}
                  alt={article.title}
                  fill
                  unoptimized={!article.image}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  data-ai-hint={article.imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                   <div className="h-1 w-10 bg-emerald-500 dark:bg-emerald-400 rounded-full mb-2 animate-pulse"></div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Pedagógico</span>
                </div>
              </Link>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug uppercase tracking-tight line-clamp-2">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <CardDescription className="text-slate-600 dark:text-slate-400 font-medium text-xs line-clamp-3 leading-relaxed">
                  {article.summary}
                </CardDescription>
              </CardContent>
              <CardFooter className="pt-4 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/40 dark:bg-slate-950/40">
                <Button asChild variant="ghost" className="w-full justify-between font-black uppercase text-[9px] tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:border-emerald-600 dark:hover:border-emerald-500 border border-slate-200 dark:border-white/5 rounded-2xl h-11 px-5 transition-all duration-300 group/btn">
                  <Link href={`/student/education/${article.slug}`}>
                    Explorar Conteúdo <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
