'use server';

import { generateArticle } from '@/ai/flows/generate-article';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { EducationArticle } from '@/types/ecosystem';

const TOPICS = [
  "Descarte correto de resíduos e reciclagem",
  "Importância da economia de energia nas escolas",
  "Compostagem orgânica doméstica e escolar",
  "Preservação da água e redução do desperdício",
  "Biodiversidade local e proteção das espécies",
  "Poluição por plásticos e alternativas sustentáveis",
  "Entendendo a pegada de carbono e as mudanças climáticas",
  "Consumo consciente de recursos e produtos",
  "Como cultivar e manter hortas escolares orgânicas",
  "Introdução às energias renováveis e limpas"
];

export async function generateNewAIArticle(schoolId: string): Promise<EducationArticle | null> {
  try {
    // Pick a random topic
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const result = await generateArticle({ topic: randomTopic });

    const id = `ai-art-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    const slug = result.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // High quality environmental images on Unsplash as fallbacks/hints
    const unsplashThemes: Record<string, string> = {
      'recycle': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800',
      'water': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800',
      'energy': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800',
      'forest': 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800',
      'garden': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=800',
      'default': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800'
    };

    let image = unsplashThemes.default;
    const hintLower = result.imageHint.toLowerCase();
    if (hintLower.includes('recycle') || hintLower.includes('waste') || hintLower.includes('trash') || hintLower.includes('bin')) {
      image = unsplashThemes.recycle;
    } else if (hintLower.includes('water') || hintLower.includes('save water') || hintLower.includes('river') || hintLower.includes('rain')) {
      image = unsplashThemes.water;
    } else if (hintLower.includes('solar') || hintLower.includes('energy') || hintLower.includes('panel') || hintLower.includes('electricity') || hintLower.includes('power')) {
      image = unsplashThemes.energy;
    } else if (hintLower.includes('forest') || hintLower.includes('tree') || hintLower.includes('biodiversity') || hintLower.includes('animal') || hintLower.includes('nature')) {
      image = unsplashThemes.forest;
    } else if (hintLower.includes('garden') || hintLower.includes('plant') || hintLower.includes('soil') || hintLower.includes('agriculture') || hintLower.includes('vegetable')) {
      image = unsplashThemes.garden;
    }

    const newArticle: EducationArticle = {
      id,
      title: result.title,
      summary: result.summary,
      content: result.content,
      slug,
      image,
      imageHint: result.imageHint,
      schoolId,
      createdAt: new Date().toISOString()
    };

    // Write directly to Firestore
    await setDoc(doc(db, "articles", id), newArticle);

    return newArticle;
  } catch (error) {
    console.error("[AI ARTICLE GENERATION ERROR]:", error);
    return null;
  }
}
