'use server';
/**
 * @fileOverview A Genkit flow for generating dynamic educational articles on environmental topics.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleInputSchema = z.object({
  topic: z.string().describe('The environmental topic for the article. (e.g. "Reciclagem", "Biodiversidade", etc.)'),
});
export type GenerateArticleInput = z.infer<typeof GenerateArticleInputSchema>;

const GenerateArticleOutputSchema = z.object({
  title: z.string().describe('O título chamativo do artigo em português.'),
  summary: z.string().describe('Um resumo explicativo de duas linhas em português.'),
  content: z.string().describe('O texto completo do artigo em português, estruturado em parágrafos separados por duas quebras de linha (\\n\\n) e subtítulos usando "### " no início da linha.'),
  imageHint: z.string().describe('Uma sugestão curta em inglês de palavras-chave para busca de imagens relacionadas (ex: "recycle plastic bin").'),
});
export type GenerateArticleOutput = z.infer<typeof GenerateArticleOutputSchema>;

export async function generateArticle(input: GenerateArticleInput): Promise<GenerateArticleOutput> {
  return generateArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateArticlePrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: {schema: GenerateArticleInputSchema},
  output: {schema: GenerateArticleOutputSchema},
  config: {
    responseMimeType: 'application/json',
  },
  prompt: `Você é um educador especializado em sustentabilidade e meio ambiente para estudantes de escolas.
Crie um artigo educativo dinâmico, envolvente e instrutivo sobre o tema de sustentabilidade: "{{topic}}".

Escreva tudo em português do Brasil. O conteúdo deve ser rico, estruturado em parágrafos e usar títulos e tópicos relevantes para prender a atenção do aluno. 
Separe os parágrafos com duas quebras de linha (\\n\\n) e marque subtítulos com "### ". Exemplo de conteúdo:
### Por que reciclar?
A reciclagem é...

### Dicas Práticas
- Separe o lixo limpo do sujo.
- Utilize compostagem.

Tudo deve ser formatado em um JSON de acordo com o esquema de saída fornecido.`,
});

const generateArticleFlow = ai.defineFlow(
  {
    name: 'generateArticleFlow',
    inputSchema: GenerateArticleInputSchema,
    outputSchema: GenerateArticleOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
