export type User = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'student' | 'admin' | 'visitor' | 'super_admin';
  password?: string;
  points: number;
  level: 'Semente' | 'Broto' | 'Folha' | 'Árvore' | 'Floresta' | 'Guardião da Biosfera' | 'Guardião da Lenda';
  ra?: string;
  rfid?: string;
  turma?: string;
  curso?: string;
  position?: 'Diretoria' | 'Coordenação' | 'TI' | string;
  vitality?: number;
  itemsCount?: number;
  schoolId?: string;
  mustChangePassword?: boolean;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  cost: number;
  image: string;
  imageHint: string;
  schoolId: string;
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
  schoolId?: string;
};

export type Participant = {
    id: string;
    name: string;
    role: string;
    description: string;
    avatar: string;
    initials: string;
    schoolId?: string;
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
    schoolId?: string;
};

export const SCHOOL_SECTORS = [
  'Biblioteca',
  'Setor Pedagógico',
  'Setor Administrativo',
  'Horta Escolar',
  'Cantina',
  'Laboratório',
  'Secretaria',
  'Pátio de Reciclagem',
  'Eventos Verdes'
] as const;

export type SchoolSector = (typeof SCHOOL_SECTORS)[number];

export type TerminalStatus = 'pending' | 'active' | 'inactive';

export type Terminal = {
  id: string;
  hardwareId: string;
  location: string;
  status: TerminalStatus;
  requestDate: string;
  lastSeen?: string;
  schoolId?: string; // Escola onde o terminal está fisicamente
};

export type School = {
  id: string;
  name: string;
  city: string;
  state: string;
  logo?: string;
  contactEmail: string;
  managerEmail?: string;     // E-mail de login do gestor da unidade
  managerPassword?: string;  // Senha inicial do gestor
  status: 'active' | 'pending';
  joinedDate: string;
};

export type CycleSnapshot = {
    id: string;
    endDate: string;
    totalWasteKg: number;
    totalPoints: number;
    topStudents: { name: string, points: number, ra: string }[];
    wasteByType: Record<string, number>;
    schoolId?: string;
};

export type WasteType = 'Plástico' | 'Papel' | 'Metal' | 'Orgânico' | 'Vidro' | 'Eletrônico' | 'Não reciclável';

export type WasteEntry = {
    id: string;
    date: string;
    collected: number; // em kg
    type: WasteType;
    ra?: string;
    schoolId?: string;
};

export type Turma = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

export type Curso = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};
