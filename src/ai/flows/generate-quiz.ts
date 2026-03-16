'use server';
/**
 * @fileOverview A Genkit flow for generating dynamic quizzes on environmental topics.
 *
 * - generateQuiz - A function that generates a quiz based on an environmental topic and difficulty.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The environmental topic for the quiz.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium').describe('The difficulty level of the quiz.'),
  numberOfQuestions: z.number().int().min(1).max(10).default(5).describe('The number of questions in the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  quizTitle: z.string().describe('The title of the generated quiz.'),
  questions: z.array(
    z.object({
      questionText: z.string().describe('The text of the quiz question.'),
      options: z.array(z.string()).min(2).max(5).describe('An array of possible answer options for the question.'),
      correctAnswer: z.string().describe('The correct answer option from the provided options.'),
      explanation: z.string().optional().describe('An optional explanation for the correct answer.')
    })
  ).min(1).describe('An array of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert educator specializing in environmental science, tasked with creating engaging quizzes for students.\nGenerate a multiple-choice quiz on the topic of "{{topic}}".\n\nThe quiz should have {{numberOfQuestions}} questions and be of "{{difficulty}}" difficulty.\nEach question must have at least two and no more than five answer options.\nThe correct answer must be one of the provided options.\nAlso, include a brief explanation for the correct answer if possible.\n\nThe output must be a JSON object conforming to the following schema:\n\n{{#output.schema}}\n`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
