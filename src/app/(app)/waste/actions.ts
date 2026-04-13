'use server';

import {
  identifyWaste,
  type IdentifyWasteInput,
  type IdentifyWasteOutput,
} from '@/ai/flows/identify-waste';

export async function identifyWasteAction(
  input: IdentifyWasteInput
): Promise<IdentifyWasteOutput> {
  // Validação básica do input
  if (!input.photoDataUri || !input.photoDataUri.startsWith('data:image/')) {
    console.error('Invalid photo data received');
    throw new Error('A imagem fornecida é inválida ou está corrompida.');
  }

  try {
    const result = await identifyWaste(input);
    return result;
  } catch (error: any) {
    console.error('Error identifying waste (AI Flow):', error);
    
    // Erros específicos de cota ou rede podem ser tratados aqui
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error('O serviço de IA está temporariamente sobrecarregado. Tente novamente em alguns segundos.');
    }

    throw new Error('Não foi possível identificar o resíduo no momento. Certifique-se de que a foto está clara e tente novamente.');
  }
}
