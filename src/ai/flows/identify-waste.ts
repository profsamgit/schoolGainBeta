'use server';
/**
 * @fileOverview A Genkit flow for identifying waste material from an image.
 *
 * - identifyWaste - A function that handles the waste identification process.
 * - IdentifyWasteInput - The input type for the identifyWaste function.
 * - IdentifyWasteOutput - The return type for the identifyWaste function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyWasteOutputSchema = z.object({
  wasteType: z
    .enum(['Plástico', 'Papel', 'Metal', 'Orgânico', 'Não identificado'])
    .describe('O tipo de resíduo identificado na imagem.'),
  points: z.number().describe('Os pontos concedidos para este tipo de resíduo.'),
  justification: z
    .string()
    .describe('Uma breve justificativa para a classificação.'),
});
export type IdentifyWasteOutput = z.infer<typeof IdentifyWasteOutputSchema>;

const IdentifyWasteInputSchema = z.object({
    photoDataUri: z
      .string()
      .describe(
        "Uma foto de um item de resíduo, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
      ),
  });
export type IdentifyWasteInput = z.infer<typeof IdentifyWasteInputSchema>;

export async function identifyWaste(input: IdentifyWasteInput): Promise<IdentifyWasteOutput> {
  return identifyWasteFlow(input);
}

const pointsMapping: Record<string, number> = {
    'Plástico': 10,
    'Papel': 8,
    'Metal': 15,
    'Orgânico': 5,
    'Não identificado': 0,
};

const prompt = ai.definePrompt({
  name: 'identifyWastePrompt',
  input: { schema: IdentifyWasteInputSchema },
  output: { schema: IdentifyWasteOutputSchema },
  prompt: `Você é um especialista em classificação de resíduos para um programa de reciclagem. Sua tarefa é identificar o tipo de resíduo a partir da imagem fornecida.

  Os tipos de resíduos possíveis são: Plástico, Papel, Metal, Orgânico.

  Com base na imagem, classifique o material residual. Se você não conseguir determinar o material com alta confiança, ou se a imagem não contiver um item de resíduo, classifique-o como "Não identificado".

  Forneça uma breve justificativa para sua classificação em português.

  Atribua pontos com base na classificação:
  - Plástico: 10 pontos
  - Papel: 8 pontos
  - Metal: 15 pontos
  - Orgânico: 5 pontos
  - Não identificado: 0 pontos

  Imagem: {{media url=photoDataUri}}`,
});

const identifyWasteFlow = ai.defineFlow(
    {
      name: 'identifyWasteFlow',
      inputSchema: IdentifyWasteInputSchema,
      outputSchema: IdentifyWasteOutputSchema,
    },
    async (input) => {
      const {output} = await prompt(input);

      if (output) {
          // Ensure points are consistent with our mapping
          output.points = pointsMapping[output.wasteType] ?? 0;
          return output;
      }
      
      // Fallback in case the model fails to generate a valid output
      return {
          wasteType: 'Não identificado',
          points: 0,
          justification: 'Não foi possível identificar o material na imagem.',
      }
    }
  );
