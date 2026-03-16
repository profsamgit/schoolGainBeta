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

export const IdentifyWasteOutputSchema = z.object({
  wasteType: z
    .enum(['Plástico', 'Papel', 'Metal', 'Orgânico', 'Não identificado'])
    .describe('The type of waste identified in the image.'),
  points: z.number().describe('The points awarded for this type of waste.'),
  justification: z
    .string()
    .describe('A brief justification for the classification.'),
});
export type IdentifyWasteOutput = z.infer<typeof IdentifyWasteOutputSchema>;

export const IdentifyWasteInputSchema = z.object({
    photoDataUri: z
      .string()
      .describe(
        "A photo of a waste item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
  prompt: `You are an expert in waste classification for a recycling program. Your task is to identify the type of waste from the provided image.

  The possible waste types are: Plástico, Papel, Metal, Orgânico.

  Based on the image, classify the waste material. If you cannot determine the material with high confidence, or if the image does not contain a waste item, classify it as "Não identificado".

  Provide a brief justification for your classification.

  Assign points based on the classification:
  - Plástico: 10 points
  - Papel: 8 points
  - Metal: 15 points
  - Orgânico: 5 points
  - Não identificado: 0 points

  Image: {{media url=photoDataUri}}`,
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
