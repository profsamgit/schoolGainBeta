/**
 * ============================================================================
 * TYPES & MODELS: ESPECIFICAÇÃO TÉCNICA (BLUEPRINT)
 * ============================================================================
 * Este arquivo estabelece as definições de estruturas de dados do sistema.
 * 
 * Através destas definições, assegura-se que as entidades (Usuários, Unidades, 
 * Recompensas) sigam um padrão rigoroso, prevenindo inconsistências e erros 
 * de processamento durante a execução da aplicação.
 */

export const USER_LEVELS = [
  'Semente', 
  'Broto', 
  'Folha', 
  'Árvore', 
  'Floresta', 
  'Guardião da Biosfera', 
  'Guardião da Lenda'
] as const;

export type UserLevel = (typeof USER_LEVELS)[number];

export type User = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'student' | 'admin' | 'staff' | 'visitor' | 'super_admin';
  password?: string;
  ra?: string;
  rfid?: string;
  turma?: string;  // Referência ao ID ou Nome da Turma
  curso?: string;  // Referência ao ID ou Nome do Curso
  position?: string; // Cargo administrativo (referência ao Nome do Cargo)
  schoolId?: string;
  mustChangePassword?: boolean;
  status: 'active' | 'inactive';
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
  schoolId: string;
};

export type Participant = {
    id: string;
    name: string;
    role: string;
    description: string;
    avatar: string;
    initials: string;
    schoolId?: string;
    isBetaTester?: boolean; // Identifica alunos beta-testers (exibidos na seção de agradecimento da página Sobre)
};

export type AuditActionType = 
  | 'LOGIN_SUCCESS' | 'LOGIN_FAIL' 
  | 'CRUD_CREATE' | 'CRUD_UPDATE' | 'CRUD_DELETE' 
  | 'SYSTEM_RESET' | 'POINTS_AWARDED' | 'ITEM_PURCHASED'
  | 'SECURITY_LOCKOUT' | 'CONFIG_CHANGE'
  | 'ARTICLE_READ' | 'QUIZ_COMPLETED' | 'REWARD_REDEEMED';

export type AuditLogEntry = {
    id: string;
    action: AuditActionType | string;
    category: 'AUTH' | 'DATA' | 'ECOSYSTEM' | 'SYSTEM';
    timestamp: string;
    actorId: string;   // ID Único (UUID) de quem realizou a ação
    actorName: string;
    unitId?: string;   // ID da escola ou 'MASTER'
    details: string;   // Descrição humanizada da ação
    metadata?: any;    // Dados técnicos (Ex: snapshot do objeto antes/depois)
    targetEntity?: string; // Tabela afetada (users, schools, etc)
    targetId?: string;     // ID do registro afetado
    // Rastreabilidade Nominal
    studentName?: string;
    points?: number;
    adminName?: string;
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
  settings?: {
    preferredCamera?: string;
    scanningCameraDevice?: string;
    loginMethod?: 'manual' | 'qr' | 'rfid' | 'all';
    loginCameraSource?: 'browser' | 'esp32' | 'esp32_https' | 'url';
    scanningCameraSource?: 'browser' | 'esp32' | 'esp32_https' | 'url';
    cameraUrl?: string;
    loginCameraUrl?: string;
    scanningCameraUrl?: string;
    scannerFramerate?: 'fluid' | 'balanced' | 'high_res';
    loginCameraFramerate?: 'fluid' | 'balanced' | 'high_res';
    loginCameraFlash?: boolean;
    scanningCameraFlash?: boolean;
    schoolgainServer?: string;
    hardwareToken?: string;
  };
};

export type School = {
  id: string;
  name: string;
  city: string;
  state: string;
  logo?: string;
  contactEmail: string;
  managerEmail?: string;     // E-mail de login do gestor da unidade
  initialManagerPassword?: string;  // Senha inicial (temporária para aprovação)
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  joinedDate: string;
};

export type CycleSnapshot = {
    id: string;
    endDate: string;
    totalWasteKg: number;
    totalPoints: number;
    topStudents: Array<{ name: string; points: number; studentId: string }>;
    wasteByType: Record<string, number>;
    schoolId?: string;
};

export interface EcosystemLegend {
    id: string; // Formato: studentId-month-year
    studentId: string;
    studentName: string;
    schoolId: string;
    month: number;
    year: number;
    purchaseDate: string;
    benefitActive: boolean;
}

export type WasteType = 'Plástico' | 'Papel' | 'Metal' | 'Orgânico' | 'Vidro' | 'Eletrônico' | 'Não reciclável';

export type WasteEntry = {
    id: string;
    date: string;
    collected: number; // em kg
    type: WasteType;
    studentId?: string; // ID imutável para rastreamento (Chave Principal)
    schoolId?: string;
    points?: number;
};

export type Turma = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  schoolId: string;
};

export type Curso = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  schoolId: string;
};

export type Cargo = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  schoolId: string;
};

export type SetorEscolar = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  schoolId: string;
};

export type QuizTopic = {
  id: string;
  name: string;
  schoolId: string;
};

export type RegistrationRequest = {
  id: string;
  name: string;
  ra: string;
  rfid?: string;
  turma: string;
  curso: string;
  schoolId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

/**
 * Tipos de itens que podem ser adquiridos no ecossistema.
 * Cada string corresponde a um elemento visual ou funcional no mundo virtual.
 */
export type EcosystemItem = 
  'filtro_ar' | 'limpar_rio' | 'reparar_grama' | 
  'arvore_1' | 'arvore_2' | 'arvore_3' | 
  'passaro_1' | 'passaro_2' | 'passaro_3' |
  'peixe_1' | 'peixe_2' | 'peixe_3' | 
  'cachorro' | 'gato' | 'borboletas' | 'borboletas_2' | 'borboletas_3' | 'borboletas_4' |
  'casa' | 'barco_1' | 'barco_2' | 'monstro_lago';

/**
 * Interface que define o estado individual de cada usuário.
 * Armazena saldo atual, vitalidade do seu ecossistema e itens comprados.
 */
export interface EcosystemUserState {
  id?: string;               // ID único do aluno (vinculado ao users/id)
  schoolId?: string;         // Unidade escolar do aluno (para filtros de admin)
  balance: number;           // Bio-Coins atuais do aluno
  points: number;            // Pontos totais (lifetime) do aluno
  vitality: number;          // Percentual de saúde do ambiente (0-100)
  vitalityActivated: boolean; // Se o ecossistema foi ativado via Quiz
  purchasedItems: EcosystemItem[]; // Lista de itens comprados
  itemsCount: number;        // Quantidade de itens
  lastMissionDate: string | null;  // Data da última missão diária completada
  lastQuizDates?: Record<'easy' | 'medium' | 'hard', string | null>; // Data de conclusão de cada dificuldade
  nessiePurchaseDate?: string | null;     // Data de compra do item especial (Nessie/Casa)
  curso?: string | null;            // Curso do aluno
  level: UserLevel;             // Título do aluno
  readArticles: string[];      // IDs dos artigos lidos
  pointTransactions?: PointTransaction[]; // Histórico de transações de pontos
}

export type PointTransaction = {
  id: string;
  date: string;       // ISO String
  amount: number;     // Valor positivo (ganho) ou negativo (gasto/expiração)
  description: string; // Ex: "Descarte de Plástico", "Leitura de Artigo", "Compra de Upgrade", "Expiração de Pontos"
  expired?: boolean;   // Flag para evitar dupla contabilidade de expirações
};

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
  studentCaptureSource?: 'browser' | 'esp32' | 'esp32_https' | 'url';
  adminCaptureSource?: 'browser' | 'esp32' | 'esp32_https' | 'url';
  studentCaptureDevice?: string;
  adminCaptureDevice?: string;
  studentCaptureUrl?: string;
  adminCaptureUrl?: string;
}

/**
 * Estrutura completa dos dados gerenciados pelo serviço.
 */
export interface EcosystemData {
  users: User[]; // Lista mestre (legado/compatibilidade)
  students: User[];
  admins: User[];
  staff: User[];
  superAdmins: User[];
  visitors: User[];
  rewards: Reward[];                       // Prêmios disponíveis para troca
  articles: EducationArticle[];            // Artigos educativos
  quizTopics: QuizTopic[];                    // Tópicos de quiz
  currentUserRa: string | null;            // RA do usuário atualmente logado
  currentUserId: string | null;            // ID único do usuário logado (Firestore)
  participants: Participant[];             // Equipe do projeto
  turmas: Turma[];                         // Lista de séries/turmas
  cursos: Curso[];                         // Lista de cursos técnicos
  cargos: Cargo[];                         // Lista de cargos administrativos
  setores: SetorEscolar[];                 // Lista de setores escolares
  userStates: Record<string, EcosystemUserState>; // Estado de cada aluno indexado pelo ID (Firestore)
  systemSettings: SystemSettings;          // Configurações de hardware e login
  terminals: Terminal[];                   // Lista de terminais físicos cadastrados
  schools: School[];                       // Lista de escolas parceiras
  wasteEntries: WasteEntry[];              // Histórico de resíduos coletados
  auditLogs: AuditLogEntry[];              // Histórico de auditoria unificado
  registrationRequests: RegistrationRequest[]; // Solicitações de cadastro pendentes
  resetHistory: CycleSnapshot[];           // Snapshots de ciclos passados
  resetVersion: string;                    // Versão atual para controle de migração
  securityState?: Record<string, SecurityState>; // Rastreamento de falhas de login
}

export interface BehaviorTelemetryEntry extends Omit<AuditLogEntry, 'actorId' | 'actorName'> {
  actorId?: string;
  actorName?: string;
}

