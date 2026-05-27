'use client';

import { useEcosystem } from '@/contexts/EcosystemContext';
import { notFound, useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { useState, use, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Loader2, ArrowLeft, Hourglass, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function EducationArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { allArticles, recordArticleRead, userStates, currentUser, isInitializing } = useEcosystem();
  const { toast } = useToast();
  
  const article = allArticles.find((a) => {
    try {
      const decodedParam = decodeURIComponent(unwrappedParams.slug).toLowerCase();
      const decodedSlug = decodeURIComponent(a.slug).toLowerCase();
      return a.slug.toLowerCase() === unwrappedParams.slug.toLowerCase() || decodedSlug === decodedParam;
    } catch {
      return a.slug.toLowerCase() === unwrappedParams.slug.toLowerCase();
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTimeForBlock, setInitialTimeForBlock] = useState(1);

  const hasAlreadyRead = currentUser && userStates[currentUser.id]?.readArticles?.includes(article?.id || '');

  // Parse text into clean content blocks
  const blocks = useMemo(() => {
    if (!article) return [];
    return article.content.split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }, [article]);

  // Keep track of maximum paragraph index reached/read by the user
  useEffect(() => {
    if (currentBlockIndex > maxUnlockedIndex) {
      setMaxUnlockedIndex(currentBlockIndex);
    }
  }, [currentBlockIndex, maxUnlockedIndex]);

  // Calculate dynamic reading time for the current block based on word count
  const getReadingTimeForBlock = (text: string) => {
    const cleanText = text.replace(/[#\-]/g, '').trim();
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    // Base time of 3s + 0.3s per word (avg 180wpm with breathing room). Clamp between 3s and 12s.
    return Math.max(3, Math.min(12, Math.ceil(3 + wordCount * 0.3)));
  };

  // Set timer when block changes
  useEffect(() => {
    if (hasAlreadyRead || currentBlockIndex < maxUnlockedIndex) {
      setTimeLeft(0);
      setInitialTimeForBlock(1);
      return;
    }
    if (blocks.length > 0 && blocks[currentBlockIndex]) {
      const time = getReadingTimeForBlock(blocks[currentBlockIndex]);
      setTimeLeft(time);
      setInitialTimeForBlock(time);
    }
  }, [currentBlockIndex, blocks, hasAlreadyRead, maxUnlockedIndex]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (isInitializing || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-400 font-medium">Carregando conteúdo...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Artigo não encontrado</h2>
        <p className="text-slate-400 font-medium mt-2">O conteúdo que você procura pode ter sido removido ou o link está incorreto.</p>
      </div>
    );
  }

  const scrollProgress = blocks.length > 0 ? ((currentBlockIndex + 1) / blocks.length) * 100 : 0;
  const isLastBlock = currentBlockIndex === blocks.length - 1;
  const isTimerDone = timeLeft === 0;

  const handleNext = () => {
    if (currentBlockIndex < blocks.length - 1 && isTimerDone) {
      setCurrentBlockIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex((prev) => prev - 1);
    }
  };

  const renderBlockContent = (text: string) => {
    if (text.startsWith('###')) {
      return (
        <h3 className="text-2xl font-black mb-6 text-emerald-600 dark:text-emerald-400 uppercase tracking-tight animate-in fade-in duration-300">
          {text.replace('### ', '')}
        </h3>
      );
    }
    if (text.startsWith('- ')) {
      const items = text.split('\n').map((item, i) => (
        <li key={i} className="mb-3 pl-2 text-slate-700 dark:text-slate-300 text-[16px] leading-relaxed">
          <span className="font-semibold">{item.replace('- ', '')}</span>
        </li>
      ));
      return (
        <ul className="list-disc pl-6 space-y-2 my-6 marker:text-emerald-600 dark:marker:text-emerald-400 animate-in fade-in duration-300">
          {items}
        </ul>
      );
    }
    return (
      <p className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-semibold animate-in fade-in duration-300">
        {text}
      </p>
    );
  };

  return (
    <article className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-800 dark:text-white relative">
      {/* Barra de Progresso de Leitura Fixa no Topo */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200/20 dark:bg-slate-950/20 z-50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Cabeçalho superior com botão de voltar e estatísticas da leitura */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-550 dark:text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5 shadow-sm">
            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
            Parágrafo {currentBlockIndex + 1} de {blocks.length}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h1 className="text-3xl font-black tracking-tight lg:text-4xl text-slate-900 dark:text-white leading-tight uppercase">
          {article.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{article.summary}</p>
      </div>

      {/* Container de Leitura Interativa */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 dark:border-white/5 bg-white/90 dark:bg-slate-900/40 backdrop-blur-xl p-8 sm:p-12 text-slate-800 dark:text-white shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)] mb-8 transition-all duration-500 min-h-[300px] flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Parágrafo de Conteúdo Ativo */}
        <div className="relative z-10 flex-grow flex flex-col justify-center py-6">
          {blocks.length > 0 && renderBlockContent(blocks[currentBlockIndex])}
        </div>

        {/* Temporizador Interno do Parágrafo */}
        {!isTimerDone && (
          <div className="w-full bg-slate-100 dark:bg-slate-950/40 rounded-full h-1 mt-6 overflow-hidden relative border border-slate-200/30 dark:border-white/5">
            <div 
              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / initialTimeForBlock) * 100}%` }}
            />
          </div>
        )}

        <Separator className="my-8 bg-slate-200/60 dark:bg-white/5" />

        {/* Controles de Navegação de Parágrafos */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Button
            onClick={handlePrev}
            disabled={currentBlockIndex === 0}
            variant="outline"
            className="rounded-2xl h-12 px-6 font-bold uppercase text-[9px] tracking-widest border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-950/50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
          </Button>

          {isLastBlock ? (
            <div className="flex flex-col items-center">
              {/* Botão de Resgatar Recompensa no Último Parágrafo */}
              <Button 
                size="lg"
                disabled={(!isTimerDone && !hasAlreadyRead) || isSubmitting}
                onClick={async () => {
                  if (!article) return;
                  setIsSubmitting(true);
                  try {
                    const success = await recordArticleRead(article.id);
                    if (success) {
                      toast({
                        title: "Leitura Concluída!",
                        description: "Você conquistou 20 Bio-Coins. Continue assim!",
                      });
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className={cn(
                  "h-14 px-8 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl",
                  hasAlreadyRead 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default" 
                    : isTimerDone
                      ? "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-emerald-500/15 hover:scale-105 active:scale-95"
                      : "bg-slate-100 dark:bg-slate-950/45 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : hasAlreadyRead ? (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Recompensa Coletada</>
                ) : !isTimerDone ? (
                  <><Hourglass className="mr-2 h-4 w-4 animate-pulse" /> Leia por {timeLeft}s...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Coletar Recompensa</>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isTimerDone}
              className={cn(
                "rounded-2xl h-12 px-6 font-bold uppercase text-[9px] tracking-widest transition-all duration-300",
                isTimerDone
                  ? "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-md active:scale-95"
                  : "bg-slate-100 dark:bg-slate-950/45 text-slate-400 dark:text-slate-550 border border-slate-200 dark:border-white/5 cursor-not-allowed"
              )}
            >
              {isTimerDone ? (
                <>Próximo <ChevronRight className="h-4 w-4 ml-2" /></>
              ) : (
                <>Leia por {timeLeft}s <Hourglass className="h-3 w-3 ml-2 animate-spin text-slate-450" /></>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Video Interativo do Artigo (opcional, posicionado abaixo se houver) */}
      {article.videoUrl && isLastBlock && (
        <div className="mt-8 p-8 bg-white/80 dark:bg-slate-950/20 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 shadow-2xl animate-in fade-in duration-500">
          <h2 className="text-lg font-black mb-6 text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
            <div className="h-1.5 w-6 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
            Complemento em Vídeo
          </h2>
          <div className="aspect-video shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
            <iframe
              className="w-full h-full"
              src={article.videoUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </article>
  );
}
