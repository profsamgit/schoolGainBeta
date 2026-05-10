import type { User, Reward, EducationArticle, Participant, School, Turma, Curso, Cargo, SetorEscolar, Terminal } from './types';

/**
 * SchoolGain Data: Produção
 * 
 * Este arquivo agora contém apenas as estruturas iniciais.
 * Todos os dados (Recompensas, Artigos, Usuários, etc.) são lidos
 * dinamicamente do Firebase Firestore.
 */

export const SCHOOLS_MOCK: School[] = [];

// Usuário Administrativo Inicial (Apenas para primeiro acesso se o banco estiver vazio)
export const ADMIN_MOCK: User = {
  id: 'master-admin',
  name: 'Gestor Principal',
  email: 'gestor@schoolgain.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  role: 'super_admin',
  password: '46bedf6fe2d6d6bf157b58c3ddfe0ff5ec53dad2f5689c63cf0f16901049dff5',
  points: 0,
  level: 'Semente',
  ra: 'gestor@schoolgain.com',
  schoolId: 'system-global',
};

export const REWARDS_MOCK: Reward[] = [];
export const ARTICLES_MOCK: EducationArticle[] = [];
export const QUIZ_TOPICS_MOCK: QuizTopic[] = [
  { id: 'topic-1', name: 'Reciclagem', schoolId: 'school-1' },
  { id: 'topic-2', name: 'Consumo Consciente', schoolId: 'school-1' },
  { id: 'topic-3', name: 'Biodiversidade', schoolId: 'school-1' },
  { id: 'topic-4', name: 'Energias Renováveis', schoolId: 'school-1' },
  { id: 'topic-5', name: 'Desmatamento', schoolId: 'school-1' },
];

export const PARTICIPANTS_MOCK: Participant[] = [];
export const TURMAS_MOCK: Turma[] = [];
export const CURSOS_MOCK: Curso[] = [];
export const CARGOS_MOCK: Cargo[] = [];
export const SETORES_MOCK: SetorEscolar[] = [];
export const TERMINALS_MOCK: Terminal[] = [];
