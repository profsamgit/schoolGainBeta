import type { User, Reward, EducationArticle, Participant, School } from './types';

// Centralização de Imagens Placeholder (reduzindo dependência de arquivos externos)
const PLACEHOLDER_IMAGES = [
  { id: "reward-book", imageUrl: "https://picsum.photos/seed/reward1/600/400", imageHint: "book nature" },
  { id: "reward-kit", imageUrl: "https://picsum.photos/seed/reward2/600/400", imageHint: "school supplies" },
  { id: "reward-plant", imageUrl: "https://picsum.photos/seed/reward3/600/400", imageHint: "plant pot" },
  { id: "reward-bottle", imageUrl: "https://picsum.photos/seed/reward4/600/400", imageHint: "water bottle" },
  { id: "edu-recycling", imageUrl: "https://picsum.photos/seed/edu1/800/450", imageHint: "recycling bins" },
  { id: "edu-composting", imageUrl: "https://picsum.photos/seed/edu2/800/450", imageHint: "compost garden" },
  { id: "edu-water", imageUrl: "https://picsum.photos/seed/edu3/800/450", imageHint: "clean river" }
];

const getImage = (id: string) => {
  const image = PLACEHOLDER_IMAGES.find((img) => img.id === id);
  return {
    url: image?.imageUrl ?? `https://picsum.photos/seed/${id}/600/400`,
    hint: image?.imageHint ?? 'abstract',
  };
};

export const SCHOOLS_MOCK: School[] = [
  {
    id: 'school-1',
    name: 'CETI Frei José Apicella',
    city: 'Guadalupe',
    state: 'PI',
    status: 'active',
    contactEmail: 'direcao@cetifreijose.com',
    joinedDate: '2024-01-10'
  },
  {
    id: 'school-2',
    name: 'Escola Modelo Sustentável',
    city: 'Teresina',
    state: 'PI',
    status: 'active',
    contactEmail: 'admin@escolamodelo.com',
    joinedDate: '2024-03-15'
  }
];

export const STUDENT_MOCK: User = {
  id: 'user-empty',
  name: 'Aguardando Cadastro',
  role: 'student',
  points: 0,
  level: 'Semente',
  ra: '000000',
  schoolId: 'school-1',
};

export const ADMIN_MOCK: User = {
  id: 'master-admin',
  name: 'Gestor Principal',
  email: 'gestor@schoolgain.com',
  avatar: 'https://picsum.photos/seed/admin/100/100',
  role: 'super_admin',
  password: '46bedf6fe2d6d6bf157b58c3ddfe0ff5ec53dad2f5689c63cf0f16901049dff5', // Hash para rizdy6-wumkyh-rEqxox
  points: 0,
  level: 'Semente',
  ra: 'gestor@schoolgain.com',
  schoolId: 'school-1',
};

export const VISITANTE_MOCK: User = {
  id: 'visitor-1',
  name: 'Visitante',
  avatar: 'https://picsum.photos/seed/visitor/100/100',
  role: 'visitor',
  points: 0,
  level: 'Semente',
  ra: 'VISITANTE',
  schoolId: 'school-1',
};

export const REWARDS_MOCK: Reward[] = [
  {
    id: 'rew-1',
    name: 'Caderno Ecológico SG',
    description: 'Caderno produzido com papel 100% reciclado e capa de fibra de coco.',
    cost: 500,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=book',
    imageHint: 'recycled notebook',
    schoolId: 'school-1'
  },
  {
    id: 'rew-2',
    name: 'Squeeze de Alumínio',
    description: 'Garrafa térmica para reduzir o uso de copos descartáveis na escola.',
    cost: 1200,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=bottle',
    imageHint: 'aluminum bottle',
    schoolId: 'school-1'
  },
  {
    id: 'rew-3',
    name: 'Kit de Canetas Bio',
    description: 'Conjunto de canetas com corpo biodegradável e tinta recarregável.',
    cost: 300,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=pen',
    imageHint: 'eco-friendly pens',
    schoolId: 'school-1'
  },
  {
    id: 'rew-test-new',
    name: 'Muda de Árvore Nativa',
    description: 'Ganhe uma muda de árvore para ajudar no reflorestamento.',
    cost: 800,
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=60',
    imageHint: 'small tree plant',
    schoolId: 'school-1'
  }
];

export const ARTICLES_MOCK: EducationArticle[] = [
  {
    id: 'edu-1',
    slug: 'guia-da-reciclagem',
    title: 'O Guia Completo da Reciclagem',
    summary: 'Aprenda a separar corretamente os diferentes tipos de resíduos e entenda por que isso é tão importante para o planeta.',
    content: `
A reciclagem é um dos pilares da sustentabilidade. Separar o lixo corretamente permite que materiais como plástico, papel, metal e vidro sejam transformados em novos produtos, economizando recursos naturais e energia.

### Como separar:
- **Plástico:** Garrafas PET, embalagens de produtos de limpeza, potes de iogurte. Lave-os para remover resíduos.
- **Papel:** Jornais, revistas, caixas de papelão, folhas de caderno. Não amasse o papel, apenas dobre-o.
- **Metal:** Latas de alumínio e aço. Amasse as latinhas para reduzir o volume.
- **Vidro:** Garrafas, potes de conserva. Tenha cuidado ao manusear para evitar acidentes.
- **Orgânico:** Restos de frutas, legumes e alimentos em geral. Podem ser transformados em adubo através da compostagem.
    `,
    image: getImage('edu-recycling').url,
    imageHint: getImage('edu-recycling').hint,
    schoolId: 'school-1',
  },
  {
    id: 'edu-2',
    slug: 'compostagem-em-casa',
    title: 'Compostagem para Iniciantes',
    summary: 'Transforme seu lixo orgânico em um rico adubo para suas plantas. Veja como é fácil começar sua própria composteira.',
    content: `
A compostagem é um processo natural que transforma matéria orgânica em húmus, um adubo poderoso. Fazer compostagem em casa reduz a quantidade de lixo enviada para aterros e enriquece o solo do seu jardim.

### O que pode ir na composteira:
- Cascas de frutas e legumes
- Borra de café
- Folhas secas e serragem

### O que evitar:
- Carnes e laticínios
- Gorduras e óleos
- Restos de alimentos cozidos e temperados
`,
    image: getImage('edu-composting').url,
    imageHint: getImage('edu-composting').hint,
    schoolId: 'school-1',
  },
  {
    id: 'edu-3',
    slug: 'a-importancia-da-agua',
    title: 'Água: Nosso Tesouro Precioso',
    summary: 'Dicas simples para economizar água e preservar o planeta.',
    content: `### Preserve a Água
A água é vida. Economize hoje para ter amanhã.`,
    image: getImage('edu-water').url,
    imageHint: getImage('edu-water').hint,
    schoolId: 'school-1',
  },
  {
    id: 'edu-test-new',
    slug: 'energia-solar-futuro',
    title: 'Energia Solar: O Futuro é Agora',
    summary: 'Aprenda sobre energia limpa e renovável.',
    content: `### Sol: Energia Pura
O sol é a nossa maior fonte de energia limpa.`,
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=60',
    imageHint: 'solar panels',
    schoolId: 'school-1',
  }
];

export const QUIZ_TOPICS_MOCK: string[] = [
  'Reciclagem',
  'Consumo Consciente',
  'Biodiversidade',
  'Energias Renováveis',
  'Desmatamento',
];

export const PARTICIPANTS_MOCK: Participant[] = [
  {
    id: 'participant-1',
    name: 'Samuel Coelho de Sá',
    role: 'Professor Orientador',
    description: 'Analista de Sistemas - Especialista em Segurança, Redes e Engenharia da Computação. Liderando a inovação sustentável no CETI.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samuel&backgroundColor=b6e3f4',
    schoolId: 'school-1',
    initials: 'SC'
  },
  {
    id: 'participant-2',
    name: 'Lincoln Rodrigues',
    role: 'Líder Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - Especialista em Front-end e UX Design do projeto SchoolGain.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lincoln&backgroundColor=c0aede',
    schoolId: 'school-1',
    initials: 'LR'
  },
  {
    id: 'participant-3',
    name: 'Michelly Maria',
    role: 'Desenvolvedora Full-Stack',
    description: 'Aluna de TDS 2B 2026 - Focada em arquitetura de dados e integração de hardware IoT.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michelly&backgroundColor=ffdfbf',
    schoolId: 'school-1',
    initials: 'MM'
  }
];

