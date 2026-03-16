import { educationArticles } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export async function generateStaticParams() {
  return educationArticles.map((article) => ({
    slug: article.slug,
  }));
}

export default function EducationArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = educationArticles.find((a) => a.slug === params.slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          {article.title}
        </h1>
        <p className="text-xl text-muted-foreground">{article.summary}</p>
      </div>
      <div className="relative h-96 w-full rounded-lg overflow-hidden mb-8">
        <Image
          src={article.image}
          alt={article.title}
          fill
          style={{ objectFit: 'cover' }}
          data-ai-hint={article.imageHint}
          priority
        />
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        {article.content.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('###')) {
            return (
              <h3 key={index} className="text-2xl font-semibold mt-6 mb-2">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('- ')) {
            const items = paragraph.split('\n').map((item, i) => (
              <li key={i} className="mb-2">
                {item.replace('- ', '')}
              </li>
            ));
            return <ul key={index} className="list-disc pl-6">{items}</ul>;
          }
          return <p key={index}>{paragraph}</p>;
        })}

        {article.videoUrl && (
          <div className="mt-12">
            <Separator />
            <h2 className="text-3xl font-bold my-6">Vídeo Interativo</h2>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-full rounded-lg"
                src={article.videoUrl}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
