import type { User, Reward, EducationArticle, Participant, School, Turma, Curso, Cargo, SetorEscolar, Terminal, QuizTopic } from './types';

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
  name: 'Administrador do Sistema',
  email: 'admin@plataforma.app',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  role: 'super_admin',
  password: '', // A senha deve ser configurada diretamente no Firebase Authentication em Produção
  points: 0,
  level: 'Semente',
  ra: 'SUPER-ADMIN',
  status: 'active',
};

export const REWARDS_MOCK: Reward[] = [];
export const ARTICLES_MOCK: EducationArticle[] = [];
export const QUIZ_TOPICS_MOCK: QuizTopic[] = [];
export const PARTICIPANTS_MOCK: Participant[] = [];
export const TURMAS_MOCK: Turma[] = [];
export const CURSOS_MOCK: Curso[] = [];
export const CARGOS_MOCK: Cargo[] = [];
export const SETORES_MOCK: SetorEscolar[] = [];
export const TERMINALS_MOCK: Terminal[] = [];
