import { config } from 'dotenv';
config();

import { identifyWaste } from './src/ai/flows/identify-waste';

async function test() {
  console.log('Testando comunicação com a IA...');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_API_KEY) {
      console.log('API Key (starts with):', process.env.GEMINI_API_KEY.substring(0, 5) + '...');
  }
  try {
    const result = await identifyWaste({
      photoDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAALElEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABuD8O8AAG6oU1pAAAAAElFTkSuQmCC"
    });
    console.log('Resultado da identificação:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Erro no teste de IA:', JSON.stringify(error, null, 2));
    console.error(error);
  }
}

test();
