import { BehaviorSubject } from 'rxjs';
import { STUDENT_MOCK, LEADERBOARD_MOCK, REWARDS_MOCK, ARTICLES_MOCK, QUIZ_TOPICS_MOCK, ADMIN_MOCK, VISITANTE_MOCK, SCHOOLS_MOCK } from './data';
import { 
  User, 
  Reward, 
  EducationArticle, 
  Participant,
  AuditLogEntry,
  SCHOOL_SECTORS,
  SchoolSector,
  Terminal,
  TerminalStatus,
  School
} from './types';

/**
 * Lista de participantes da equipe (professores e alunos desenvolvedores).
 * Estes dados são fixos e usados na página "Sobre" ou "Equipe".
 */
const TEAM_MOCK: Participant[] = [
  {
    id: 'participant-1',
    name: 'Samuel Coelho de Sá',
    role: 'Professor',
    description: 'Analista de Sistemas - Especialista em Segurança, Redes e Engenharia da Computação',
    avatar: 'https://picsum.photos/seed/prof-samuel/200/200',
    initials: 'SC',
    schoolId: 'school-1',
  },
  {
    id: 'participant-2',
    name: 'Lincoln Rodrigues',
    role: 'Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/lincoln/200/200',
    initials: 'LR',
    schoolId: 'school-1',
  },
  {
    id: 'participant-3',
    name: 'Michelly Maria',
    role: 'Desenvolvedora',
    description: 'Aluna de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/michelly/200/200',
    initials: 'MM',
    schoolId: 'school-1',
  },
  {
    id: 'participant-4',
    name: 'Pedro Henrique',
    role: 'Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/pedro-h/200/200',
    initials: 'PH',
    schoolId: 'school-1',
  },
  {
    id: 'participant-5',
    name: 'Samuel Lucas',
    role: 'Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/samuel-l/200/200',
    initials: 'SL',
    schoolId: 'school-1',
  },
  {
    id: 'participant-6',
    name: 'Samuel Viana',
    role: 'Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/samuel-v/200/200',
    initials: 'SV',
    schoolId: 'school-1',
  },
  {
    id: 'participant-7',
    name: 'Yann Kaio',
    role: 'Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/yann/200/200',
    initials: 'YK',
    schoolId: 'school-1',
  }
];

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
  'casa' | 'barco_1' | 'barco_2';

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
 * Configurações globais do sistema, gerenciadas pelo gestor.
 */
export interface SystemSettings {
  loginMethod: 'manual' | 'qr' | 'rfid' | 'all';
  loginCameraSource: 'browser' | 'esp32';      // Fonte para login QR
  scanningCameraSource: 'browser' | 'esp32';   // Fonte para identificar lixo
  terminalId: string;
}

/**
 * Estrutura completa dos dados gerenciados pelo serviço.
 */
export interface EcosystemData {
  users: User[]; // Lista de todos os usuários (alunos e admins)
  rewards: Reward[];                       // Prêmios disponíveis para troca
  articles: EducationArticle[];            // Artigos educativos
  quizTopics: string[];                    // Tópicos de quiz
  currentUserRa: string | null;            // RA do usuário atualmente logado
  participants: Participant[];             // Equipe do projeto
  turmas: string[];                        // Lista de séries/turmas
  cursos: string[];                        // Lista de cursos técnicos
  userStates: Record<string, EcosystemUserState>; // Estado de cada aluno indexado pelo RA
  systemSettings: SystemSettings;          // Configurações de hardware e login
  terminals: Terminal[];                   // Lista de terminais físicos cadastrados
  schools: School[];                       // Lista de escolas parceiras
}

const STORAGE_KEY = 'schoolgain_ecosystem';

/**
 * EcosystemService: O Cérebro do Sistema
 * 
 * Este serviço gerencia toda a lógica de negócio, persistência e reatividade.
 * Ele utiliza o padrão "Service" com RxJS para garantir que a interface reflita
 * as mudanças de dados instantaneamente.
 */
export class EcosystemService {
  private STORAGE_PREFIX = 'schoolgain_v21_clean';
  
  /**
   * Converte uma string de texto puro em um hash SHA-256 para armazenamento seguro.
   */
  public static async hashPassword(password: string): Promise<string> {
    if (typeof window === 'undefined') return password;
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Verifica se o usuário atual tem permissões de administrador.
   * Nota: Em um sistema real, esta verificação deve ocorrer no Backend.
   */
  private checkAdminAuth(): boolean {
    const user = this.data.users.find(u => u.ra === this.currentUserRa);
    return !!(user && (user.role === 'admin' || user.role === 'super_admin'));
  }
  
  // Dados iniciais e estrutura de armazenamento
  private data: EcosystemData = {
    users: [ADMIN_MOCK, VISITANTE_MOCK],
    rewards: [...REWARDS_MOCK],
    articles: [...ARTICLES_MOCK],
    quizTopics: [...QUIZ_TOPICS_MOCK],
    currentUserRa: null,
    participants: [...TEAM_MOCK],
    turmas: ['1ª Série', '2ª Série', '3ª Série'],
    cursos: ['Técnico em Desenvolvimento de Sistemas', 'Técnico em Agropecuária', 'Gestão Escolar'],
    userStates: {},
    systemSettings: {
      loginMethod: 'all',
      loginCameraSource: 'browser',
      scanningCameraSource: 'browser',
      terminalId: 'TERM-01'
    },
    terminals: [
      { id: 'term-1', hardwareId: 'SG-TOTEM-01', location: 'CETI Frei José - Entrada Principal', status: 'active', schoolId: 'school-1', requestDate: '2024-05-01' },
      { id: 'term-2', hardwareId: 'SG-TOTEM-02', location: 'CETI Frei José - Refeitório', status: 'active', schoolId: 'school-1', requestDate: '2024-05-02' }
    ],
    schools: [...SCHOOLS_MOCK],
    resetVersion: 'v21_clean'
  } as any;

  /**
   * BehaviorSubjects (RxJS):
   * São como "canais" de informação que sempre guardam o valor mais recente.
   * Os componentes do React se "inscrevem" nesses canais para receber atualizações.
   */
  private balanceSubject = new BehaviorSubject<number>(0);
  private vitalitySubject = new BehaviorSubject<number>(100);
  private currentUserRaSubject = new BehaviorSubject<string | null>(null);
  private usersSubject = new BehaviorSubject<User[]>([]);
  private rewardsSubject = new BehaviorSubject<Reward[]>([]);
  private articlesSubject = new BehaviorSubject<EducationArticle[]>([]);
  private quizTopicsSubject = new BehaviorSubject<string[]>([]);
  private participantsSubject = new BehaviorSubject<Participant[]>([]);
  private purchasedItemsSubject = new BehaviorSubject<EcosystemItem[]>([]);
  private terminalsSubject = new BehaviorSubject<Terminal[]>([]);
  private schoolsSubject = new BehaviorSubject<School[]>([]);
  private lastMissionDateSubject = new BehaviorSubject<string | null>(null);
  private turmasSubject = new BehaviorSubject<string[]>([]);
  private cursosSubject = new BehaviorSubject<string[]>([]);
  private auditLogsSubject = new BehaviorSubject<AuditLogEntry[]>([]);
  private levelSubject = new BehaviorSubject<string>('Iniciante');
  
  // Novos canais para hardware e gestão
  private systemSettingsSubject = new BehaviorSubject<SystemSettings>({
    loginMethod: 'all',
    loginCameraSource: 'browser',
    scanningCameraSource: 'browser',
    terminalId: 'TERM-01'
  });
  private pendingLoginSubject = new BehaviorSubject<{ ra: string, terminalId: string } | null>(null);

  constructor() {
    // Inicializa os canais com os dados iniciais (mockados)
    this.usersSubject.next(this.data.users);
    this.rewardsSubject.next(this.data.rewards);
    this.articlesSubject.next(this.data.articles);
    this.quizTopicsSubject.next(this.data.quizTopics);
    this.participantsSubject.next(this.data.participants);
    this.turmasSubject.next(this.data.turmas);
    this.cursosSubject.next(this.data.cursos);
    this.systemSettingsSubject.next(this.data.systemSettings || {
      loginMethod: 'all',
      loginCameraSource: 'browser',
      scanningCameraSource: 'browser',
      terminalId: 'TERM-01'
    });
    this.terminalsSubject.next(this.data.terminals || []);
    this.schoolsSubject.next(this.data.schools || []);
  }

  /**
   * Inicializa o serviço carregando os dados salvos no navegador (localStorage).
   */
  initialize() {
    if (typeof window === 'undefined') return;
    this.loadFromStorage();
    
    // Notifica todos os inscritos sobre os dados carregados
    this.currentUserRaSubject.next(this.data.currentUserRa);
    this.usersSubject.next(this.data.users);
    this.rewardsSubject.next(this.data.rewards);
    this.articlesSubject.next(this.data.articles);
    this.quizTopicsSubject.next(this.data.quizTopics);
    this.participantsSubject.next(this.data.participants);
    this.turmasSubject.next(this.data.turmas);
    this.cursosSubject.next(this.data.cursos);
    this.terminalsSubject.next(this.data.terminals || []);
    this.schoolsSubject.next(this.data.schools || []);

    // Se houver um usuário logado, sincroniza os pontos e ecossistema dele
    if (this.data.currentUserRa) {
      this.syncStateWithUser(this.data.currentUserRa);
    }
  }

  /**
   * Sincroniza o estado global com os dados específicos do usuário logado.
   * @param ra Registro Acadêmico do aluno.
   */
  private syncStateWithUser(ra: string) {
    const userState = this.data.userStates[ra];
    const userRecord = this.data.users.find(u => u.ra === ra);

    if (userState) {
      // Carrega o estado existente do aluno
      if (userRecord && userRecord.points < userState.balance) {
        userRecord.points = userState.balance;
      }
      this.balanceSubject.next(userState.balance);
      this.vitalitySubject.next(userState.vitality);
      this.purchasedItemsSubject.next(userState.purchasedItems);
      this.lastMissionDateSubject.next(userState.lastMissionDate);
      
      // Atualiza o nível do aluno baseado no seu progresso
      this.levelSubject.next(this.calculateLevel(this.balance, this.purchasedItems));
    } else if (userRecord) {
      // Cria um estado inicial para novos alunos (5000 Bio-Coins bônus)
      const newState: EcosystemUserState = {
        balance: 5000, 
        vitality: 0,
        purchasedItems: [],
        lastMissionDate: null,
        curso: userRecord.curso
      };
      this.data.userStates[ra] = newState;
      this.balanceSubject.next(newState.balance);
      this.vitalitySubject.next(newState.vitality);
      this.purchasedItemsSubject.next(newState.purchasedItems);
      this.lastMissionDateSubject.next(newState.lastMissionDate);
    }
  }

  /**
   * Atualiza os pontos de um usuário.
   * @param ra RA do aluno.
   * @param currentBalanceChange Mudança no saldo atual (pode ser negativo se ele gastar).
   * @param lifetimePointsGain Ganho de pontos vitalícios (usado no ranking).
   */
  private syncUserPoints(ra: string, currentBalanceChange: number, lifetimePointsGain: number) {
    const state = this.data.userStates[ra] || this.getDefaultState();
    state.balance += currentBalanceChange;
    this.data.userStates[ra] = state;

    // Se for o usuário logado, atualiza a tela instantaneamente
    if (ra === this.currentUserRa) {
      this.balanceSubject.next(state.balance);
    }

    // Atualiza a lista global de usuários para refletir no ranking
    const studentIdx = this.data.users.findIndex(u => u.ra === ra);
    if (studentIdx !== -1) {
      const student = this.data.users[studentIdx];
      student.points = (student.points || 0) + lifetimePointsGain;
      
      const score = EcosystemService.calculateTotalScore(student.points, state.vitality, state.purchasedItems.length);
      student.level = this.calculateLevel(score, state.purchasedItems);
      if (ra === this.currentUserRa) this.levelSubject.next(student.level);
      
      this.data.users[studentIdx] = { ...student };
      this.usersSubject.next([...this.data.users]);
    }

    this.saveToStorage(); // Salva as mudanças permanentemente
  }

  // Getters para acessar os dados atuais
  get users() { return this.usersSubject.value; }
  get allRewards() { return this.data.rewards; }
  get allArticles() { return this.data.articles; }
  get allQuizTopics() { return this.data.quizTopics; }
  get allParticipants() { return this.data.participants; }
  get allTurmas() { return this.data.turmas; }
  get allCursos() { return this.data.cursos; }
  get auditLogs() { return this.auditLogsSubject.value; }
  get terminals() { return this.terminalsSubject.value; }
  get schools() { return this.schoolsSubject.value; }

  // Observables para os componentes React se inscreverem
  get users$() { return this.usersSubject.asObservable(); }
  get balance$() { return this.balanceSubject.asObservable(); }
  get vitality$() { return this.vitalitySubject.asObservable(); }
  get currentUserRa$() { return this.currentUserRaSubject.asObservable(); }
  get rewards$() { return this.rewardsSubject.asObservable(); }
  get articles$() { return this.articlesSubject.asObservable(); }
  get quizTopics$() { return this.quizTopicsSubject.asObservable(); }
  get participants$() { return this.participantsSubject.asObservable(); }
  get turmas$() { return this.turmasSubject.asObservable(); }
  get cursos$() { return this.cursosSubject.asObservable(); }
  get purchasedItems$() { return this.purchasedItemsSubject.asObservable(); }
  get auditLogs$() { return this.auditLogsSubject.asObservable(); }
  get level$() { return this.levelSubject.asObservable(); }
  get systemSettings$() { return this.systemSettingsSubject.asObservable(); }
  get pendingLogin$() { return this.pendingLoginSubject.asObservable(); }
  get terminals$() { return this.terminalsSubject.asObservable(); }
  get schools$() { return this.schoolsSubject.asObservable(); }

  get balance() { return this.balanceSubject.value; }
  get vitality() { return this.vitalitySubject.value; }
  get purchasedItems() { return this.purchasedItemsSubject.value; }
  get currentUserRa() { return this.currentUserRaSubject.value; }
  get systemSettings() { return this.systemSettingsSubject.value; }

  /**
   * Atualiza as configurações de hardware do sistema.
   */
  updateSystemSettings(settings: SystemSettings) {
    this.data.systemSettings = settings;
    this.systemSettingsSubject.next(settings);
    this.saveToStorage();
  }

  /**
   * Dispara um evento de login vindo de hardware externo (ESP32).
   */
  triggerHardwareLogin(ra: string, terminalId: string) {
    this.pendingLoginSubject.next({ ra, terminalId });
    // Limpa o evento após um curto período para não disparar login duplo
    setTimeout(() => this.pendingLoginSubject.next(null), 2000);
  }

  /**
   * Solicita autorização para um novo terminal.
   */
  requestTerminalAuthorization(hardwareId: string, location: string, schoolId: string) {
    if (!this.data.terminals) this.data.terminals = [];
    const existing = this.data.terminals.find(t => t.hardwareId === hardwareId);
    if (existing) return false;

    const newTerminal: Terminal = {
      id: `term-${Date.now()}`,
      hardwareId,
      location,
      status: 'pending',
      schoolId,
      requestDate: new Date().toISOString()
    };

    this.data.terminals.push(newTerminal);
    this.terminalsSubject.next([...this.data.terminals]);
    this.saveToStorage();
    return true;
  }

  /**
   * Atualiza o status de um terminal.
   */
  updateTerminalStatus(id: string, status: TerminalStatus, schoolId?: string) {
    if (!this.checkAdminAuth()) return;
    const terminal = this.data.terminals.find(t => t.id === id);
    if (terminal) {
      terminal.status = status;
      if (schoolId) terminal.schoolId = schoolId;
      this.terminalsSubject.next([...this.data.terminals]);
      this.saveToStorage();
    }
  }

  /**
   * Remove um terminal.
   */
  deleteTerminal(id: string) {
    if (!this.checkAdminAuth()) return;
    this.data.terminals = this.data.terminals.filter(t => t.id !== id);
    this.terminalsSubject.next([...this.data.terminals]);
    this.saveToStorage();
  }

  /**
   * Solicita o registro de uma nova escola.
   */
  requestSchoolRegistration(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>) {
    const newSchool: School = {
      ...schoolData,
      id: `school-${Date.now()}`,
      status: 'pending',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    this.data.schools.push(newSchool);
    this.schoolsSubject.next([...this.data.schools]);
    this.saveToStorage();
    return true;
  }

  /**
   * Atualiza o status de uma escola (Aprovação).
   */
  async updateSchoolStatus(id: string, status: 'active' | 'pending') {
    if (!this.checkAdminAuth()) return;
    const school = this.data.schools.find(s => s.id === id);
    if (school) {
      school.status = status;
      
      // Se estiver ativando, garante que o usuário gestor exista
      if (status === 'active' && school.managerEmail) {
        const userExists = this.data.users.find(u => u.email?.toLowerCase() === school.managerEmail?.toLowerCase());
        if (!userExists) {
          const newUser: User = {
            id: `user-admin-${Date.now()}`,
            name: `Gestor ${school.name}`,
            email: school.managerEmail,
            password: school.managerPassword ? await EcosystemService.hashPassword(school.managerPassword) : '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // Default admin123 hash
            role: 'admin',
            schoolId: school.id,
            ra: `G-${Date.now().toString().slice(-4)}`,
            points: 0,
            level: 'Iniciante'
          };
          this.data.users.push(newUser);
          this.usersSubject.next([...this.data.users]);
        }
      }

      this.schoolsSubject.next([...this.data.schools]);
      this.saveToStorage();
    }
  }

  /**
   * Remove uma escola.
   */
  deleteSchool(id: string) {
    if (!this.checkAdminAuth()) return;
    this.data.schools = this.data.schools.filter(s => s.id !== id);
    this.schoolsSubject.next([...this.data.schools]);
    this.saveToStorage();
  }

  /**
   * Retorna o estado de um usuário específico.
   */
  getUserState(ra: string): EcosystemUserState {
    return this.data.userStates[ra] || this.getDefaultState();
  }

  private getDefaultState(): EcosystemUserState {
    return { balance: 5000, vitality: 0, purchasedItems: [], lastMissionDate: null, curso: '', nessiePurchaseDate: undefined };
  }

  /**
   * Verifica se o item especial "Nessie" ainda está disponível para compra este mês.
   * (Limitado a 3 pessoas por mês).
   */
  isNessieAvailable() {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${today.getMonth() + 1}`;
    
    const nessieOwnersInMonth = Object.values(this.data.userStates).filter(state => {
      if (!state.purchasedItems.includes('monstro_lago') || !state.nessiePurchaseDate) return false;
      return state.nessiePurchaseDate.startsWith(currentMonth);
    });
    
    return nessieOwnersInMonth.length < 3;
  }

  /**
   * Retorna os alunos que conseguiram o item lendário no mês atual.
   */
  getMonthlyLegends() {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${today.getMonth() + 1}`;
    
    return Object.entries(this.data.userStates)
      .filter(([_, state]) => {
        return state.purchasedItems.includes('monstro_lago') && 
               state.nessiePurchaseDate && 
               state.nessiePurchaseDate.startsWith(currentMonth);
      })
      .map(([ra, state]) => {
        const user = this.data.users.find(u => u.ra === ra);
        return {
          ra,
          name: user?.name || 'Agente Desconhecido',
          purchaseDate: state.nessiePurchaseDate
        };
      })
      .sort((a, b) => new Date(a.purchaseDate!).getTime() - new Date(b.purchaseDate!).getTime())
      .slice(0, 3);
  }

  /**
   * Verifica se a missão diária já foi realizada hoje.
   */
  get isMissionDone() {
    const lastDate = this.lastMissionDateSubject.value;
    if (!lastDate) return false;
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return lastDate === today;
  }

  /**
   * Carrega os dados do localStorage.
   */
  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.data = { ...this.data, ...parsed };
      } catch (e) {
        console.error('Erro ao carregar dados do ecossistema', e);
      }
    }

    // Carrega logs de auditoria
    const logsStr = localStorage.getItem(`${this.STORAGE_PREFIX}_audit_logs`);
    if (logsStr) {
      this.auditLogsSubject.next(JSON.parse(logsStr));
    }

    // Lógica de reset (para atualizações de versão do sistema)
    let hasChanges = false;
    const RESET_VERSION = 'v21_clean'; // Nova versão
    if ((this.data as any).resetVersion !== RESET_VERSION) {
      this.data.userStates = {};
      this.data.users = [ADMIN_MOCK, VISITANTE_MOCK]; 
      this.data.terminals = [
        { id: 'term-1', hardwareId: 'SG-TOTEM-01', location: 'CETI Frei José - Entrada Principal', status: 'active', schoolId: 'school-1', requestDate: '2024-05-01' },
        { id: 'term-2', hardwareId: 'SG-TOTEM-02', location: 'CETI Frei José - Refeitório', status: 'active', schoolId: 'school-1', requestDate: '2024-05-02' }
      ];
      this.data.systemSettings = {
        loginMethod: 'all',
        loginCameraSource: 'browser',
        scanningCameraSource: 'browser',
        terminalId: 'TERM-01'
      };
      (this.data as any).resetVersion = RESET_VERSION;
      hasChanges = true;
    }

    // Garante que o ADMIN_MOCK sempre exista e seja super_admin
    const adminIndex = this.data.users.findIndex(u => u.ra === ADMIN_MOCK.ra);
    if (adminIndex === -1) {
      this.data.users.push(ADMIN_MOCK);
      hasChanges = true;
    } else {
      const admin = this.data.users[adminIndex];
      if (admin.role !== 'super_admin') {
        admin.role = 'super_admin';
        hasChanges = true;
      }
    }

    // Garante que o VISITANTE_MOCK sempre exista e seja visitor
    const visitorExists = this.data.users.find(u => u.ra === VISITANTE_MOCK.ra);
    if (!visitorExists) {
      this.data.users.push(VISITANTE_MOCK);
      hasChanges = true;
    } else if (visitorExists.role !== 'visitor') {
      visitorExists.role = 'visitor';
      hasChanges = true;
    }

    // Garante que todos os usuários conhecidos tenham um estado inicial
    this.data.users.forEach(user => {
      if (user.ra && !this.data.userStates[user.ra]) {
        this.data.userStates[user.ra] = this.getDefaultState();
        hasChanges = true;
      }
    });

    if (hasChanges) this.saveToStorage();
  }

  /**
   * Salva o estado atual no localStorage.
   */
  private saveToStorage() {
    if (typeof window === 'undefined') return;
    this.data.currentUserRa = this.currentUserRaSubject.value;
    if (this.data.currentUserRa) {
      this.data.userStates[this.data.currentUserRa] = {
        balance: this.balanceSubject.value,
        vitality: this.vitalitySubject.value,
        purchasedItems: this.purchasedItemsSubject.value,
        lastMissionDate: this.lastMissionDateSubject.value,
        nessiePurchaseDate: this.data.userStates[this.data.currentUserRa]?.nessiePurchaseDate,
        curso: (this.data.users.find(u => u.ra === this.data.currentUserRa) as any)?.curso
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    localStorage.setItem(`${this.STORAGE_PREFIX}_audit_logs`, JSON.stringify(this.auditLogsSubject.value));
  }

  /**
   * Identifica o aluno com maior pontuação total no sistema.
   */
  getGlobalLeader() {
    if (!this.data.users || this.data.users.length === 0) return null;
    
    const students = this.data.users.filter(u => u.role !== 'admin');
    if (students.length === 0) return null;

    const ranked = students
      .map(u => {
        const ra = u.ra || '';
        const state = this.data.userStates[ra] || this.getDefaultState();
        const score = EcosystemService.calculateTotalScore(u.points || 0, state.vitality, state.purchasedItems.length);
        return { ...u, totalScore: score };
      })
      .sort((a,b) => b.totalScore - a.totalScore);
      
    return ranked[0];
  }

  /**
   * Marca a missão diária como completa e concede pontos.
   */
  completeDailyMission(points: number) {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    if (this.lastMissionDateSubject.value === today) return false;
    this.lastMissionDateSubject.next(today);
    
    if (this.currentUserRa) {
      this.syncUserPoints(this.currentUserRa, points, points);
    }
    return true;
  }

  /**
   * Deduz pontos do saldo do aluno (ex: compras).
   */
  deductPoints(points: number) {
    if (this.balance < points || !this.currentUserRa) return false;
    this.syncUserPoints(this.currentUserRa, -points, 0);
    return true;
  }

  /**
   * Transforma pontos Bio-Coins em vitalidade para o ecossistema.
   */
  healVitality(points: number) {
    if (this.balance < points || !this.currentUserRa) return false;
    const vitalityGain = Math.floor(points / 10);
    const newVitality = Math.min(100, this.vitality + vitalityGain);
    if (newVitality === this.vitality) return false;
    
    this.vitalitySubject.next(newVitality);
    this.syncUserPoints(this.currentUserRa, -points, 0);
    return true;
  }

  /**
   * Registra frequência. Faltas reduzem a vitalidade do ecossistema drasticamente.
   */
  registerAttendance(status: 'presente' | 'falta') {
    if (status === 'falta') {
      this.vitalitySubject.next(Math.max(0, this.vitality - 20));
      this.saveToStorage();
    }
  }

  /**
   * Lógica de compra de melhorias para o ecossistema.
   * Verifica saldo, vitalidade mínima e requisitos de outros itens.
   */
  buyUpgrade(item: EcosystemItem) {
    // Catálogo de preços e requisitos
    const catalog: Record<EcosystemItem, { price: number; minVitality?: number; required?: string }> = {
      'limpar_rio': { price: 300, minVitality: 70 },
      'filtro_ar': { price: 200, minVitality: 70 },
      'reparar_grama': { price: 150, minVitality: 70 },
      'arvore_1': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'arvore_2': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'arvore_3': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'passaro_1': { price: 150, required: 'arvore_1' },
      'passaro_2': { price: 150, required: 'arvore_2' },
      'peixe_1': { price: 100, required: 'limpar_rio' },
      'peixe_2': { price: 100, required: 'limpar_rio' },
      'peixe_3': { price: 100, required: 'limpar_rio' },
      'cachorro': { price: 400, required: 'reparar_grama' },
      'coelho': { price: 250, required: 'reparar_grama' },
      'borboletas': { price: 150, required: 'reparar_grama' },
      'borboletas_2': { price: 200, required: 'borboletas' },
      'borboletas_3': { price: 250, required: 'borboletas_2' },
      'casa': { price: 1500, minVitality: 100, required: 'arvore_1' },
      'barco_1': { price: 500, required: 'limpar_rio' },
      'barco_2': { price: 600, required: 'barco_1' },
    };

    const upgrade = catalog[item];
    if (this.purchasedItems.includes(item)) return false; // Já possui o item
    if (upgrade.minVitality && this.vitality < upgrade.minVitality) return false; // Vitalidade insuficiente

    // Lógica para itens lendários (só podem ser comprados se todos os normais já foram)
    const legendaryItems: EcosystemItem[] = ['casa', 'barco_1', 'barco_2'];
    const isLegendary = legendaryItems.includes(item);

    if (isLegendary) {
      const regularItems = Object.keys(catalog).filter(id => !legendaryItems.includes(id as EcosystemItem));
      if (regularItems.some(id => !this.purchasedItems.includes(id as EcosystemItem))) return false;
    } else if (upgrade.required && !this.purchasedItems.includes(upgrade.required as EcosystemItem)) {
      return false; // Não possui o item requisito (ex: precisa de árvore para ter pássaro)
    }

    if (this.balance < upgrade.price || !this.currentUserRa) return false; // Saldo insuficiente

    // Atualiza a lista de itens comprados
    const newItems = [...this.purchasedItems, item];
    this.purchasedItemsSubject.next(newItems);

    let balanceAdjust = -upgrade.price;
    let pointsAdjust = 0;

    // Se comprar a 'casa' (item máximo), ganha um bônus especial de pontos
    if (item === 'casa') {
      pointsAdjust = 5000;
      balanceAdjust += 5000;
      
      const state = this.data.userStates[this.currentUserRa] || this.getDefaultState();
      const today = new Date();
      state.nessiePurchaseDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      this.data.userStates[this.currentUserRa] = state;
    }

    // Sincroniza e salva
    this.syncUserPoints(this.currentUserRa, balanceAdjust, pointsAdjust);
    return true;
  }

  /**
   * Concede pontos a um aluno específico (Usado por Administradores).
   * Registra a ação no log de auditoria.
   */
  grantPoints(ra: string, points: number, sector: string, action: string, adminName: string): boolean {
    // Verificação básica de autorização (em um sistema real, isso seria feito no servidor)
    const currentAdmin = this.data.users.find(u => u.ra === this.currentUserRa);
    if (!currentAdmin || (currentAdmin.role !== 'admin' && currentAdmin.role !== 'super_admin')) {
      console.error('[SECURITY] Tentativa de conceder pontos por usuário não autorizado');
      return false;
    }

    const student = this.data.users.find(u => u.ra === ra);
    if (!student) return false;

    this.syncUserPoints(ra, points, points);

    // Cria a entrada de auditoria
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      ra,
      studentName: student.name,
      points,
      sector,
      action,
      timestamp: new Date().toISOString(),
      adminName,
      schoolId: student.schoolId
    };
    this.auditLogsSubject.next([log, ...this.auditLogsSubject.value]);
    this.saveToStorage();
    return true;
  }

  /**
   * Adiciona pontos genéricos a um usuário.
   */
  addPoints(points: number, studentRa?: string) {
    const targetRa = studentRa || this.currentUserRa;
    if (targetRa) {
      this.syncUserPoints(targetRa, points, points);
    }
  }

  /**
   * Bônus por avistar um evento especial no sistema.
   */
  grantSightingBonus(ra: string) {
    this.syncUserPoints(ra, 50, 50);
    return true;
  }

  /**
   * Autentica um usuário pelo RA ou RFID.
   */
  async login(id: string, password?: string) {
    const cleanId = id.trim();
    const cleanPassword = password?.trim();

    const user = this.data.users.find(u => 
      u.ra === cleanId || 
      u.rfid === cleanId || 
      u.email?.toLowerCase() === cleanId.toLowerCase()
    );

    if (user) {
      // Exige senha apenas para perfis de gestão quando fornecida manualmente
      if (user.role === 'admin' || user.role === 'super_admin') {
        // Se a senha NÃO foi fornecida (ex: login via QR Code ou RFID), permitimos a entrada direta
        if (!cleanPassword) {
            const ra = user.ra!;
            this.currentUserRaSubject.next(ra);
            this.syncStateWithUser(ra);
            this.saveToStorage();
            return true;
        }
        
        const hashedInput = await EcosystemService.hashPassword(cleanPassword);
        if (user.password !== hashedInput) {
            console.error(`[AUTH] Senha incorreta para o gestor: ${cleanId}`);
            return false;
        }
      }
      
      const ra = user.ra!;
      this.currentUserRaSubject.next(ra);
      this.syncStateWithUser(ra);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Finaliza a sessão do usuário.
   */
  logout() {
    this.currentUserRaSubject.next(null);
    this.balanceSubject.next(0);
    this.vitalitySubject.next(100);
    this.purchasedItemsSubject.next([]);
    this.lastMissionDateSubject.next(null);
    this.saveToStorage();
  }

  // Funções de atualização em massa (usadas no painel admin)
  updateUsers(newUsers: any[]) {
    if (!this.checkAdminAuth()) return;
    this.data.users = newUsers;
    this.usersSubject.next(newUsers);
    this.saveToStorage();
  }

  updateRewards(newRewards: Reward[]) {
    if (!this.checkAdminAuth()) return;
    this.data.rewards = newRewards;
    this.rewardsSubject.next(newRewards);
    this.saveToStorage();
  }

  updateArticles(newArticles: EducationArticle[]) {
    if (!this.checkAdminAuth()) return;
    this.data.articles = newArticles;
    this.articlesSubject.next(newArticles);
    this.saveToStorage();
  }

  updateQuizTopics(newTopics: string[]) {
    if (!this.checkAdminAuth()) return;
    this.data.quizTopics = newTopics;
    this.quizTopicsSubject.next(newTopics);
    this.saveToStorage();
  }

  updateParticipants(newParticipants: Participant[]) {
    if (!this.checkAdminAuth()) return;
    this.data.participants = newParticipants;
    this.participantsSubject.next(newParticipants);
    this.saveToStorage();
  }

  updateTurmas(newTurmas: string[]) {
    if (!this.checkAdminAuth()) return;
    this.data.turmas = newTurmas;
    this.turmasSubject.next(newTurmas);
    this.saveToStorage();
  }

  updateCursos(newCursos: string[]) {
    if (!this.checkAdminAuth()) return;
    this.data.cursos = newCursos;
    this.cursosSubject.next(newCursos);
    this.saveToStorage();
  }

  /**
   * Altera a senha de um usuário (principalmente gestores).
   */
  async changePassword(ra: string, newPassword: string) {
    const userIndex = this.data.users.findIndex(u => u.ra === ra);
    if (userIndex !== -1) {
      const hashedPassword = await EcosystemService.hashPassword(newPassword);
      this.data.users[userIndex].password = hashedPassword;
      this.usersSubject.next([...this.data.users]);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Altera a própria senha, exigindo a senha atual.
   */
  async updateMyPassword(currentPassword: string, newPassword: string) {
    const ra = this.currentUserRaSubject.value;
    if (!ra) return false;
    
    const user = this.data.users.find(u => u.ra === ra);
    if (!user) return false;

    const hashedCurrent = await EcosystemService.hashPassword(currentPassword);
    const isStoredHashed = user.password && user.password.length === 64;
    
    const isMatch = isStoredHashed 
      ? user.password === hashedCurrent 
      : user.password === currentPassword;

    if (isMatch) {
      user.password = await EcosystemService.hashPassword(newPassword);
      this.usersSubject.next([...this.data.users]);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Cálculo estático da pontuação total.
   * Considera Bio-Coins, Vitalidade e Itens.
   */
  static calculateTotalScore(points: number, vitality: number, itemsCount: number): number {
    return Math.floor(points + (vitality * 100) + (itemsCount * 500));
  }

  /**
   * Calcula o nível visual do aluno (título honorário).
   */
  private calculateLevel(score: number, purchasedItems?: EcosystemItem[]): any {
    const items = purchasedItems || this.purchasedItems;
    if (items.includes('casa')) return 'Guardião da Lenda';
    if (score >= 17000) return 'Guardião da Biosfera';
    if (score >= 14000) return 'Floresta';
    if (score >= 11000) return 'Árvore';
    if (score >= 8000) return 'Folha';
    if (score >= 5000) return 'Broto';
    return 'Semente';
  }
}
