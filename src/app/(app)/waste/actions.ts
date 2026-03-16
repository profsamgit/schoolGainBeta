'use server';

import {
  identifyWaste,
  type IdentifyWasteInput,
  type IdentifyWasteOutput,
} from '@/ai/flows/identify-waste';

export async function identifyWasteAction(
  input: IdentifyWasteInput
): Promise<IdentifyWasteOutput> {
  try {
    const result = await identifyWaste(input);
    return result;
  } catch (error) {
    console.error('Error identifying waste:', error);
    throw new Error('Falha ao identificar o resíduo. Tente novamente.');
  }
}
