'use server';

import {
  generateQuiz,
  type GenerateQuizInput,
  type GenerateQuizOutput,
} from '@/ai/flows/generate-quiz';

export async function generateQuizAction(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  try {
    const quiz = await generateQuiz(input);
    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Falha ao gerar o quiz. Tente novamente.');
  }
}
