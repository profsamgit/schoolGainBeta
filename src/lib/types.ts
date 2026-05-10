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
  // Configurações específicas do Totem
  loginMethod?: 'manual' | 'qr' | 'rfid' | 'all';
  loginCameraSource?: 'browser' | 'esp32' | 'url';
  scanningCameraSource?: 'browser' | 'esp32' | 'url';
  loginCameraDeviceId?: string;
  scanningCameraDeviceId?: string;
  loginCameraUrl?: string;
  scanningCameraUrl?: string;
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
  schoolId?: string;
};

export type Curso = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  schoolId?: string;
};

export type Cargo = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  schoolId?: string;
};

export type SetorEscolar = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  schoolId?: string;
};

export type QuizTopic = {
  id: string;
  name: string;
  schoolId?: string;
};

/**
 * Tipos de itens que podem ser adquiridos no ecossistema.
 * Cada string corresponde a um elemento visual ou funcional no mundo virtual.
 */
export type EcosystemItem = 
  'filtro_ar' | 'limpar_rio' | 'reparar_grama' | 
  'arvore_1' | 'arvore_2' | 'arvore_3' | 
  'passaro_1' | 'passaro_2' | 
  'peixe_1' | 'peixe_2' | 'peixe_3' | 
  'cachorro' | 'coelho' | 'borboletas' | 'borboletas_2' | 'borboletas_3' |
  'casa' | 'barco_1' | 'barco_2' | 'monstro_lago';

/**
 * Interface que define o estado individual de cada usuário.
 * Armazena saldo atual, vitalidade do seu ecossistema e itens comprados.
 */
export interface EcosystemUserState {
  balance: number;           // Bio-Coins atuais do aluno
  vitality: number;          // Percentual de saúde do ambiente (0-100)
  purchasedItems: EcosystemItem[]; // Lista de IDs de itens comprados
  lastMissionDate: string | null;  // Data da última missão diária completada
  nessiePurchaseDate?: string;     // Data de compra do item especial (Nessie/Casa)
  curso?: string;            // Curso do aluno
}

/**
 * Estado de segurança para controle de brute-force.
 */
export interface SecurityState {
  failedAttempts: number;
  lockoutUntil: string | null;
}

/**
 * Configurações globais do sistema, gerenciadas pelo gestor.
 */
export interface SystemSettings {
  studentLoginMethod: 'manual' | 'qr' | 'rfid' | 'all';
  adminLoginMethod: 'manual' | 'qr' | 'rfid' | 'all';
  terminalId: string;
  studentCaptureSource?: 'browser' | 'esp32' | 'url';
  adminCaptureSource?: 'browser' | 'esp32' | 'url';
  studentCaptureDevice?: string;
  adminCaptureDevice?: string;
  studentCaptureUrl?: string;
  adminCaptureUrl?: string;
}

/**
 * Estrutura completa dos dados gerenciados pelo serviço.
 */
export interface EcosystemData {
  users: User[]; // Lista de todos os usuários (alunos e admins)
  rewards: Reward[];                       // Prêmios disponíveis para troca
  articles: EducationArticle[];            // Artigos educativos
  quizTopics: QuizTopic[];                    // Tópicos de quiz
  currentUserRa: string | null;            // RA do usuário atualmente logado
  participants: Participant[];             // Equipe do projeto
  turmas: Turma[];                         // Lista de séries/turmas
  cursos: Curso[];                         // Lista de cursos técnicos
  cargos: Cargo[];                         // Lista de cargos administrativos
  setores: SetorEscolar[];                 // Lista de setores escolares
  userStates: Record<string, EcosystemUserState>; // Estado de cada aluno indexado pelo RA
  systemSettings: SystemSettings;          // Configurações de hardware e login
  terminals: Terminal[];                   // Lista de terminais físicos cadastrados
  schools: School[];                       // Lista de escolas parceiras
  wasteEntries: WasteEntry[];              // Histórico de resíduos coletados
  auditLogs: AuditLogEntry[];              // Histórico de auditoria unificado
  resetHistory: CycleSnapshot[];           // Snapshots de ciclos passados
  resetVersion: string;                    // Versão atual para controle de migração
  securityState?: Record<string, SecurityState>; // Rastreamento de falhas de login
}
