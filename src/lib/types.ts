export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'admin' | 'teacher';
  points: number;
  level: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';
  ra?: string;
  turma?: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  cost: number;
  image: string;
  imageHint: string;
};

export type EducationArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  imageHint: string;
  videoUrl?: string;
};
