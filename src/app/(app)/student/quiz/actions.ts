'use server';

import {
  generateQuiz,
  type GenerateQuizInput,
  type GenerateQuizOutput,
} from '@/ai/flows/generate-quiz';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export async function generateQuizAction(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const normalizedTopic = input.topic.trim().toLowerCase();

    // 1. Tenta recuperar um quiz exato já gerado do banco de dados (Cache)
    const qCache = query(
      quizzesRef,
      where('difficulty', '==', input.difficulty),
      where('numberOfQuestions', '==', input.numberOfQuestions)
    );
    const cacheSnapshot = await getDocs(qCache);
    let cachedQuiz: GenerateQuizOutput | null = null;

    cacheSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.topic && data.topic.trim().toLowerCase() === normalizedTopic) {
        cachedQuiz = {
          quizTitle: data.quizTitle,
          questions: data.questions,
        };
      }
    });

    if (cachedQuiz) {
      console.log(`[QUIZ-CACHE] Quiz encontrado em cache para o tópico: ${input.topic}`);
      return cachedQuiz;
    }

    // 2. Não há quiz idêntico. Vamos buscar todas as perguntas já geradas para esse tópico para evitar repetição
    const qAllTopics = query(quizzesRef);
    const allSnapshot = await getDocs(qAllTopics);
    const existingQuestions: string[] = [];

    allSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.topic && data.topic.trim().toLowerCase() === normalizedTopic && Array.isArray(data.questions)) {
        data.questions.forEach((q: any) => {
          if (q && q.questionText) {
            existingQuestions.push(q.questionText);
          }
        });
      }
    });

    // 3. Invoca o fluxo de IA passando a lista de perguntas existentes como exclusão
    console.log(`[QUIZ-GENERATOR] Gerando novo quiz para o tópico "${input.topic}". Excluindo ${existingQuestions.length} perguntas já criadas.`);
    const quiz = await generateQuiz({
      ...input,
      existingQuestions: existingQuestions.length > 0 ? existingQuestions : undefined,
    });

    // 4. Salva o quiz gerado no banco de dados
    await addDoc(quizzesRef, {
      topic: input.topic,
      difficulty: input.difficulty,
      numberOfQuestions: input.numberOfQuestions,
      quizTitle: quiz.quizTitle,
      questions: quiz.questions,
      createdAt: new Date().toISOString(),
    });

    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Falha ao gerar o quiz. Tente novamente.');
  }
}
