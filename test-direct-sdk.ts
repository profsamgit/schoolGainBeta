import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function testDirect() {
  console.log('--- Teste Direto com @google/generative-ai ---');
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERRO: GEMINI_API_KEY não encontrada no ambiente.');
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    console.log('Enviando prompt simples...');
    const result = await model.generateContent('Identifique este item: Uma garrafa de plástico.');
    const response = await result.response;
    console.log('Resposta da IA (Texto):', response.text());
    console.log('Teste OK!');
  } catch (error) {
    console.error('Falha no Teste Direto:', error);
  }
}

testDirect();
