'use client';

import { useEcosystem } from '@/contexts/EcosystemContext';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function EducationArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const { allArticles, recordArticleRead, userStates, currentUser } = useEcosystem();
  const { toast } = useToast();
  const article = allArticles.find((a) => a.slug === params.slug);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAlreadyRead = currentUser && userStates[currentUser.id]?.readArticles?.includes(article?.id || '');

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Artigo não encontrado</h2>
        <p className="text-slate-400 font-medium mt-2">O conteúdo que você procura pode ter sido removido ou o link está incorreto.</p>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-800 dark:text-white">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl text-slate-900 dark:text-white leading-tight uppercase">
          {article.title}
        </h1>
        <p className="text-lg text-slate-605 dark:text-slate-400 font-medium leading-relaxed">{article.summary}</p>
      </div>
      <div className="relative h-96 w-full rounded-[2rem] overflow-hidden mb-8 shadow-2xl border border-slate-200/60 dark:border-white/5 bg-slate-100 dark:bg-slate-950">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 896px) 100vw, 896px"
          style={{ objectFit: 'cover' }}
          data-ai-hint={article.imageHint}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
      </div>

      <div className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-6 text-[15px]">
        {article.content.split('\n\n').map((paragraph: string, index: number) => {
          if (paragraph.startsWith('###')) {
            return (
              <h3 key={index} className="text-xl font-black mt-10 mb-4 text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('- ')) {
            const items = paragraph.split('\n').map((item: string, i: number) => (
              <li key={i} className="mb-3 pl-2 text-slate-700 dark:text-slate-300">
                <span className="font-medium">{item.replace('- ', '')}</span>
              </li>
            ));
            return <ul key={index} className="list-disc pl-6 space-y-2 my-6 marker:text-emerald-600 dark:marker:text-emerald-400">{items}</ul>;
          }
          return <p key={index} className="mb-6 leading-relaxed">{paragraph}</p>;
        })}

        {article.videoUrl && (
          <div className="mt-16 p-8 bg-white/80 dark:bg-slate-950/40 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-2xl dark:shadow-inner">
            <h2 className="text-xl font-black mb-8 text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
              <div className="h-1.5 w-8 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
              Vídeo Interativo
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

        <Separator className="my-12 bg-slate-200 dark:bg-white/5" />

        <div className="flex flex-col items-center justify-center space-y-6 pb-20">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Finalizou a leitura?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">Garanta sua recompensa pedagógica de 20 Bio-Coins!</p>
          </div>

          <Button 
            size="lg"
            disabled={hasAlreadyRead || isSubmitting}
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
              "h-14 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              hasAlreadyRead 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default" 
                : "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/10 hover:scale-105 active:scale-95"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : hasAlreadyRead ? (
              <><CheckCircle2 className="mr-2 h-5 w-5" /> Recompensa Coletada</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Coletar Bio-Coins</>
            )}
          </Button>

          {hasAlreadyRead && (
            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest animate-pulse">
              Você já recebeu os créditos por este artigo
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
