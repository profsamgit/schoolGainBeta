'use client';

import { useEcosystem } from '@/app/(app)/ecosystem-context';
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
        <h2 className="text-2xl font-bold">Artigo não encontrado</h2>
        <p className="text-muted-foreground">O conteúdo que você procura pode ter sido removido ou o link está incorreto.</p>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900 leading-tight">
          {article.title}
        </h1>
        <p className="text-xl text-slate-500 font-medium">{article.summary}</p>
      </div>
      <div className="relative h-96 w-full rounded-3xl overflow-hidden mb-8 shadow-2xl border-4 border-white">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 896px) 100vw, 896px"
          style={{ objectFit: 'cover' }}
          data-ai-hint={article.imageHint}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none text-slate-700 leading-relaxed">
        {article.content.split('\n\n').map((paragraph: string, index: number) => {
          if (paragraph.startsWith('###')) {
            return (
              <h3 key={index} className="text-2xl font-black mt-10 mb-4 text-primary uppercase tracking-tight">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('- ')) {
            const items = paragraph.split('\n').map((item: string, i: number) => (
              <li key={i} className="mb-3 pl-2">
                <span className="font-medium">{item.replace('- ', '')}</span>
              </li>
            ));
            return <ul key={index} className="list-disc pl-6 space-y-2 my-6 marker:text-primary">{items}</ul>;
          }
          return <p key={index} className="mb-6">{paragraph}</p>;
        })}

        {article.videoUrl && (
          <div className="mt-16 p-8 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner">
            <h2 className="text-3xl font-black mb-8 text-slate-900 flex items-center gap-3">
              <div className="h-2 w-12 bg-primary rounded-full"></div>
              Vídeo Interativo
            </h2>
            <div className="aspect-video shadow-2xl rounded-2xl overflow-hidden border-8 border-white">
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

        <Separator className="my-12" />

        <div className="flex flex-col items-center justify-center space-y-6 pb-20">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Finalizou a leitura?</h3>
            <p className="text-slate-500 font-medium">Garanta sua recompensa pedagógica de 20 Bio-Coins!</p>
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
              "h-16 px-10 rounded-2xl text-lg font-black uppercase tracking-widest transition-all duration-500",
              hasAlreadyRead 
                ? "bg-emerald-500 hover:bg-emerald-500 text-white cursor-default" 
                : "bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : hasAlreadyRead ? (
              <><CheckCircle2 className="mr-3 h-6 w-6" /> Recompensa Coletada</>
            ) : (
              <><Sparkles className="mr-3 h-6 w-6" /> Coletar Bio-Coins</>
            )}
          </Button>

          {hasAlreadyRead && (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse">
              Você já recebeu os créditos por este artigo
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
