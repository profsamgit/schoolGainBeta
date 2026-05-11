import {googleAI} from '@genkit-ai/google-genai';
import {genkit} from 'genkit';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: 'googleai/gemini-2.5-flash-lite',
});
