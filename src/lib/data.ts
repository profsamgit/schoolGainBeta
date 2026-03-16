import type { User, Reward, EducationArticle } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  return {
    url: image?.imageUrl ?? `https://picsum.photos/seed/${id}/600/400`,
    hint: image?.imageHint ?? 'abstract',
  };
};

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Verde',
  email: 'alex.verde@schoolgain.com',
  avatar: getImage('user-avatar-1').url,
  role: 'student',
  points: 1250,
  level: 'Prata',
  ra: '123456',
  turma: '8º A',
};

export const mockAdmin: User = {
  id: 'admin-1',
  name: 'Gestor Escolar',
  email: 'admin@schoolgain.com',
  avatar: 'https://picsum.photos/seed/admin/100/100',
  role: 'admin',
  points: 0,
  level: 'Bronze',
  ra: 'admin01',
  turma: 'Administração',
};

export const leaderboardData: Omit<User, 'email' | 'avatar'>[] = [
  { id: 'user-2', name: 'Sofia Recicla', points: 3400, level: 'Ouro', ra: '234567', turma: '9º B', role: 'student' },
  { id: 'user-3', name: 'Pedro Planta', points: 2850, level: 'Ouro', ra: '345678', turma: '9º A', role: 'student' },
  { id: 'user-1', name: 'Alex Verde', points: 1250, level: 'Prata', ra: '123456', turma: '8º A', role: 'student' },
  { id: 'user-4', name: 'Lia Sustentável', points: 980, level: 'Bronze', ra: '456789', turma: '7º C', role: 'student' },
  { id: 'user-5', name: 'Carlos Coleta', points: 720, level: 'Bronze', ra: '567890', turma: '8º B', role: 'student' },
  { id: 'user-6', name: 'Mariana Horta', points: 510, level: 'Bronze', ra: '678901', turma: '7º A', role: 'student' },
  { id: 'user-7', name: 'Beto Água', points: 300, level: 'Bronze', ra: '789012', turma: '6º B', role: 'student' },
];

export const rewards: Reward[] = [
  {
    id: 'reward-1',
    name: 'Livro sobre Natureza',
    description: 'Um livro fascinante sobre a vida selvagem.',
    cost: 500,
    image: getImage('reward-book').url,
    imageHint: getImage('reward-book').hint,
  },
  {
    id: 'reward-2',
    name: 'Kit de Material Escolar Ecológico',
    description: 'Cadernos, lápis e borrachas feitos de material reciclado.',
    cost: 800,
    image: getImage('reward-kit').url,
    imageHint: getImage('reward-kit').hint,
  },
  {
    id: 'reward-3',
    name: 'Muda de Planta',
    description: 'Uma pequena planta para você cuidar em casa.',
    cost: 1200,
    image: getImage('reward-plant').url,
    imageHint: getImage('reward-plant').hint,
  },
  {
    id: 'reward-4',
    name: 'Garrafa de Água Reutilizável',
    description: 'Leve sua água para todo lugar e evite copos plásticos.',
    cost: 1500,
    image: getImage('reward-bottle').url,
    imageHint: getImage('reward-bottle').hint,
  },
];

export const educationArticles: EducationArticle[] = [
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
  },
  {
    id: 'edu-3',
    slug: 'a-importancia-da-agua',
    title: 'Água: Nosso Tesouro Precioso',
    summary: 'Descubra por que a conservação da água é vital para a vida na Terra e aprenda dicas simples para economizar no dia a dia.',
    content: `
A água é essencial para todos os seres vivos. Embora o planeta seja coberto por água, menos de 1% está disponível para consumo humano. Por isso, cada gota conta!

### Dicas para economizar:
- Feche a torneira ao escovar os dentes.
- Tome banhos mais curtos.
- Reutilize a água da máquina de lavar para limpar o quintal.
- Verifique se há vazamentos em sua casa.
    `,
    image: getImage('edu-water').url,
    imageHint: getImage('edu-water').hint,
    videoUrl: 'https://www.youtube.com/embed/v343-uG-p2Q',
  },
];

export const wasteData = [
  { type: 'Plástico', collected: 450, date: '2024-01' },
  { type: 'Papel', collected: 620, date: '2024-01' },
  { type: 'Metal', collected: 120, date: '2024-01' },
  { type: 'Orgânico', collected: 800, date: '2024-01' },
  { type: 'Plástico', collected: 480, date: '2024-02' },
  { type: 'Papel', collected: 650, date: '2024-02' },
  { type: 'Metal', collected: 150, date: '2024-02' },
  { type: 'Orgânico', collected: 830, date: '2024-02' },
  { type: 'Plástico', collected: 510, date: '2024-03' },
  { type: 'Papel', collected: 680, date: '2024-03' },
  { type: 'Metal', collected: 180, date: '2024-03' },
  { type: 'Orgânico', collected: 880, date: '2024-03' },
];
