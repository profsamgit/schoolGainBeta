export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'admin';
  points: number;
  level: 'Semente' | 'Broto' | 'Folha' | 'Árvore' | 'Floresta' | 'Guardião da Biosfera';
  ra?: string;
  turma?: string;
  curso?: string;
  vitality?: number;
  itemsCount?: number;
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

export type Participant = {
    id: string;
    name: string;
    role: string;
    description: string;
    avatar: string;
    initials: string;
};

export type AuditLogEntry = {
    id: string;
    ra: string;
    studentName: string;
    points: number;
    sector: string;
    action: string;
    timestamp: string;
    adminName: string;
};

export const SCHOOL_SECTORS = [
  'Biblioteca',
  'Horta Escolar',
  'Cantina',
  'Laboratório',
  'Secretaria',
  'Pátio de Reciclagem',
  'Eventos Verdes'
] as const;

export type SchoolSector = (typeof SCHOOL_SECTORS)[number];
