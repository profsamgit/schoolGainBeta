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
  isWaste: z.boolean().describe('A imagem contém um item de resíduo?'),
  wasteType: z
    .enum(['Plástico', 'Papel', 'Vidro', 'Metal', 'Orgânico', 'Eletrônico', 'Não reciclável'])
    .describe('O tipo de resíduo principal identificado na imagem.'),
  material: z.string().describe('O material específico do item (ex: Garrafa PET, Lata de Alumínio, Casca de Banana). Se não for um resíduo, retorne "Não é um resíduo".'),
  recyclable: z.boolean().describe('O item é reciclável?'),
  recyclingInstructions: z.string().describe('Breves instruções de como preparar o item para o descarte (ex: "Lavar e secar antes de descartar"). Se não for reciclável, informe o motivo.'),
  points: z.number().describe('Os pontos concedidos para este tipo de resíduo.'),
  justification: z
    .string()
    .describe('Uma breve justificativa para a classificação e pontuação.'),
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
    'Vidro': 12,
    'Metal': 15,
    'Orgânico': 5,
    'Eletrônico': 20,
    'Não reciclável': 0,
};

const prompt = ai.definePrompt({
  name: 'identifyWastePrompt',
  input: { schema: IdentifyWasteInputSchema },
  output: { schema: IdentifyWasteOutputSchema },
  prompt: `Você é um especialista em classificação de resíduos para um programa de reciclagem. Sua tarefa é identificar o item na imagem fornecida e retornar suas características.

  1.  **Analise a Imagem:** Determine se o item na imagem é um resíduo.
        - Se não for um resíduo, defina 'isWaste' como false e preencha os outros campos com informações neutras (ex: wasteType: 'Não reciclável', material: 'Não é um resíduo', recyclable: false, points: 0).
  2.  **Classifique o Resíduo:** Se for um resíduo, classifique-o em uma das seguintes categorias principais: Plástico, Papel, Vidro, Metal, Orgânico, Eletrônico, ou Não reciclável.
  3.  **Identifique o Material:** Especifique o material exato do item (ex: 'Garrafa PET', 'Lata de Alumínio', 'Jornal', 'Casca de Banana', 'Bateria de Celular').
  4.  **Determine a Reciclabilidade:** Defina 'recyclable' como true ou false.
  5.  **Forneça Instruções:**
        - Se for reciclável, forneça instruções claras e curtas de como o item deve ser preparado para o descarte (ex: "Lavar e secar", "Remover a tampa", "Descartar em lixo eletrônico apropriado").
        - Se não for reciclável, explique brevemente o porquê (ex: "Contaminado com gordura", "Material composto não separável").
  6.  **Atribua Pontos:** Atribua pontos com base na categoria principal, conforme a tabela abaixo.
  7.  **Justifique:** Forneça uma breve justificativa em português para a sua classificação geral.

  **Tabela de Pontos:**
  - Plástico: 10
  - Papel: 8
  - Vidro: 12
  - Metal: 15
  - Orgânico: 5
  - Eletrônico: 20
  - Não reciclável: 0

  Responda estritamente no formato JSON de saída definido.

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
          if (!output.isWaste) {
            return {
              isWaste: false,
              wasteType: 'Não reciclável',
              material: 'Não é um resíduo',
              recyclable: false,
              recyclingInstructions: 'A imagem não parece conter um item de resíduo para descarte.',
              points: 0,
              justification: 'Nenhum resíduo foi detectado na imagem.',
            };
          }
          // Ensure points are consistent with our mapping
          output.points = pointsMapping[output.wasteType] ?? 0;
          return output;
      }
      
      // Fallback in case the model fails to generate a valid output
      return {
          isWaste: false,
          wasteType: 'Não reciclável',
          material: 'Não identificado',
          recyclable: false,
          recyclingInstructions: 'Não foi possível analisar a imagem.',
          points: 0,
          justification: 'A IA não conseguiu processar a imagem fornecida. Tente novamente com outra foto.',
      }
    }
  );
