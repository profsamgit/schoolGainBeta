import { BehaviorSubject } from 'rxjs';
import { POINTS_MAPPING } from './constants';
import { REWARDS_MOCK, ARTICLES_MOCK, QUIZ_TOPICS_MOCK, ADMIN_MOCK, SCHOOLS_MOCK, PARTICIPANTS_MOCK, TURMAS_MOCK, CURSOS_MOCK, CARGOS_MOCK, SETORES_MOCK, TERMINALS_MOCK } from './data';
import {
  User,
  Reward,
  EducationArticle,
  Participant,
  AuditLogEntry,
  AuditActionType,
  SCHOOL_SECTORS,
  SchoolSector,
  Terminal,
  TerminalStatus,
  School,
  WasteEntry,
  WasteType,
  CycleSnapshot,
  Turma,
  Curso,
  Cargo,
  SetorEscolar,
  EcosystemItem,
  EcosystemUserState,
  SecurityState,
  SystemSettings,
  EcosystemData,
  QuizTopic,
  UserLevel,
  USER_LEVELS,
  RegistrationRequest,
  EcosystemLegend
} from './types';


import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDoc,
  getDocs
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const STORAGE_BASE = 'schoolgain_v22';
const STORAGE_KEY = 'schoolgain_ecosystem_data';
const AUDIT_LOGS_KEY = `${STORAGE_BASE}_audit_logs`;

/**
 * ============================================================================
 * ECOSYSTEM SERVICE: O CÉREBRO DO SCHOOLGAIN
 * ============================================================================
 * Este arquivo atua como o Gerente Central da infraestrutura digital.
 * Todas as operações do sistema (crédito de pontuação, resgate de benefícios 
 * e autenticação em terminais) são processadas através desta classe.
 * 
 * Ele utiliza o padrão "Service" com RxJS para garantir que a interface reflita
 * as mudanças de dados instantaneamente (como se fossem os reflexos do corpo).
 */
export class EcosystemService {

  /**
   * Converte uma string de texto puro em um hash SHA-256 para armazenamento seguro.
   */
  public static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async verifyUniversalPassword(password: string, currentUser: User | null, allUsers: User[]): Promise<boolean> {
    if (!password || !currentUser) return false;
    const providedHash = await this.hashPassword(password);

    // 1. Verifica se é a senha do usuário atual
    if (currentUser.password === providedHash) return true;

    // 2. Verifica se é a senha de QUALQUER Super Admin (Chave Mestra)
    const masterPassMatches = allUsers.some(u => u.role === 'super_admin' && u.password === providedHash);

    return masterPassMatches;
  }

  /**
   * Verifica se o usuário atual tem permissões de administrador.
   * Nota: Em um sistema real, esta verificação deve ocorrer no Backend.
   */
  private checkAdminAuth(): boolean {
    if (!this.currentUserRa) return false;
    const user = this.data.users.find(u => u.ra?.toUpperCase() === this.currentUserRa?.toUpperCase());
    return !!(user && (user.role === 'admin' || user.role === 'super_admin'));
  }

  // Dados iniciais e estrutura de armazenamento
  private data: EcosystemData = {
    users: [ADMIN_MOCK],
    rewards: [],
    articles: [],
    quizTopics: [],
    currentUserRa: null,
    currentUserId: null,
    participants: [],
    turmas: [],
    cursos: [],
    cargos: [],
    setores: [],
    userStates: {},
    systemSettings: {
      studentLoginMethod: 'all',
      adminLoginMethod: 'all',
      studentCaptureSource: 'browser',
      adminCaptureSource: 'browser',
      studentCaptureDevice: '',
      adminCaptureDevice: '',
      studentCaptureUrl: '',
      adminCaptureUrl: ''
    },
    terminals: [],
    schools: [],
    securityState: {},
    wasteEntries: [],
    auditLogs: [],
    registrationRequests: [],
    resetHistory: [],
    resetVersion: 'v22_stable'
  };

  private _hardwareId: string | null = null;

  /**
   * BehaviorSubjects (RxJS):
   * São como "canais" de informação que sempre guardam o valor mais recente.
   * Os componentes do React se "inscrevem" nesses canais para receber atualizações.
   */
  private balanceSubject = new BehaviorSubject<number>(0);
  private vitalitySubject = new BehaviorSubject<number>(100);
  private currentUserRaSubject = new BehaviorSubject<string | null>(null);
  private isSyncing = false;
  private usersSubject = new BehaviorSubject<User[]>([ADMIN_MOCK]);
  private rewardsSubject = new BehaviorSubject<Reward[]>([]);
  private articlesSubject = new BehaviorSubject<EducationArticle[]>([]);
  private quizTopicsSubject = new BehaviorSubject<QuizTopic[]>([]);
  private participantsSubject = new BehaviorSubject<Participant[]>([]);
  private purchasedItemsSubject = new BehaviorSubject<EcosystemItem[]>([]);
  private terminalsSubject = new BehaviorSubject<Terminal[]>([]);
  private schoolsSubject = new BehaviorSubject<School[]>([]);
  private lastMissionDateSubject = new BehaviorSubject<string | null>(null);
  private turmasSubject = new BehaviorSubject<Turma[]>([]);
  private cursosSubject = new BehaviorSubject<Curso[]>([]);
  private cargosSubject = new BehaviorSubject<Cargo[]>([]);
  private setoresSubject = new BehaviorSubject<SetorEscolar[]>([]);
  private auditLogsSubject = new BehaviorSubject<AuditLogEntry[]>([]);
  private levelSubject = new BehaviorSubject<UserLevel>('Semente');
  private registrationRequestsSubject = new BehaviorSubject<RegistrationRequest[]>([]);
  private userStatesSubject = new BehaviorSubject<Record<string, EcosystemUserState>>({}); // Estado de cada aluno indexado pelo ID (Firestore)

  // Novos canais para hardware e gestão
  private systemSettingsSubject = new BehaviorSubject<SystemSettings>({
    studentLoginMethod: 'all',
    adminLoginMethod: 'all',
    studentCaptureSource: 'browser',
    adminCaptureSource: 'browser',
    studentCaptureDevice: '',
    adminCaptureDevice: '',
    studentCaptureUrl: '',
    adminCaptureUrl: ''
  });
  private pendingLoginSubject = new BehaviorSubject<{ ra: string, terminalId: string } | null>(null);
  private wasteEntriesSubject = new BehaviorSubject<WasteEntry[]>([]);
  private resetHistorySubject = new BehaviorSubject<CycleSnapshot[]>([]);
  private kioskUserRaSubject = new BehaviorSubject<string | null>(null);
  private legendsSubject = new BehaviorSubject<EcosystemLegend[]>([]);

  constructor() {
    // Inicializa os canais com os dados iniciais (mockados)
    this.usersSubject.next(this.data.users);
    this.rewardsSubject.next(this.data.rewards);
    this.articlesSubject.next(this.data.articles);
    this.quizTopicsSubject.next(this.data.quizTopics);
    this.participantsSubject.next(this.data.participants);
    this.turmasSubject.next(this.data.turmas);
    this.cursosSubject.next(this.data.cursos);
    this.cargosSubject.next(this.data.cargos || []);
    this.setoresSubject.next(this.data.setores || []);
    this.systemSettingsSubject.next(this.data.systemSettings || {
      studentLoginMethod: 'all',
      adminLoginMethod: 'all',
      studentCaptureSource: 'browser',
      adminCaptureSource: 'browser',
      studentCaptureDevice: '',
      adminCaptureDevice: '',
      studentCaptureUrl: '',
      adminCaptureUrl: ''
    });
    this.terminalsSubject.next(this.data.terminals || []);
    this.systemSettingsSubject.next(this.data.systemSettings);
    this.wasteEntriesSubject.next(this.data.wasteEntries || []);
    this.registrationRequestsSubject.next(this.data.registrationRequests || []);
    this.resetHistorySubject.next(this.data.resetHistory || []);
  }

  /**
   * Conecta aos canais do Firestore para atualizações em tempo real.
   */
  private initFirebaseSync() {
    if (typeof window === 'undefined') return;

    // 1. Sincronização de Usuários
    onSnapshot(collection(db, "users"), (snapshot) => {
      const usersMap = new Map<string, User>();
      snapshot.forEach(doc => {
        const u = doc.data() as User;
        // Usa o ID como chave única para evitar duplicatas na lista
        if (u.id) usersMap.set(u.id, u);
      });

      const users = Array.from(usersMap.values());
      if (users.length > 0) {
        this.data.users = users;
        this.usersSubject.next(users);
        // Garante que o usuário logado localmente ainda exista no banco
        if (this.data.currentUserId) {
          const currentInDb = users.find(u => u.id === this.data.currentUserId);
          if (!currentInDb && snapshot.metadata.fromCache === false) {
            this.logout();
            return;
          }
          if (currentInDb) {
            // Se o RA mudou no banco para o usuário logado, atualizamos a referência local para o sync continuar feliz
            if (currentInDb.ra !== this.data.currentUserRa) {
              this.data.currentUserRa = currentInDb.ra || null;
              this.data.currentUserId = currentInDb.id;
              this.currentUserRaSubject.next(this.data.currentUserRa);
              this.saveToStorage();
            }
          }
        }
      }
    });

    // 2. Sincronização de Recompensas (Com limpeza de campo RA legado)
    onSnapshot(collection(db, "rewards"), (snapshot) => {
      const rewards: Reward[] = [];
      snapshot.forEach(doc => {
        const { ra, ...cleanReward } = doc.data() as any;
        rewards.push(cleanReward as Reward);
      });
      if (rewards.length > 0) {
        this.data.rewards = rewards;
        this.rewardsSubject.next(rewards);
      }
    });

    // 3. Sincronização de Artigos
    onSnapshot(collection(db, "articles"), (snapshot) => {
      const articles: EducationArticle[] = [];
      snapshot.forEach(doc => articles.push(doc.data() as EducationArticle));
      if (articles.length > 0) {
        this.data.articles = articles;
        this.articlesSubject.next(articles);
      }
    });

    // 4. Sincronização de Participantes (Créditos)
    onSnapshot(collection(db, "participants"), (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach(doc => participants.push(doc.data() as Participant));
      if (participants.length > 0) {
        this.data.participants = participants;
        this.participantsSubject.next(participants);
      }
    });

    // 5. Configurações por Unidade (SystemSettings)
    // Cada escola tem seu próprio documento de configuração baseado no schoolId
    const currentRa = this.currentUserRaSubject.value;
    const currentUser = this.data.users.find(u => u.ra === currentRa);
    const settingsId = currentUser?.schoolId;

    if (settingsId) {
      onSnapshot(doc(db, "settings", settingsId), (docSnap) => {
        if (docSnap.exists()) {
          const settings = docSnap.data() as SystemSettings;
          this.data.systemSettings = settings;
          this.systemSettingsSubject.next(settings);
        } else {
          // Se não houver config específica, cria uma cópia inicial baseada no padrão
          setDoc(doc(db, "settings", settingsId), this.data.systemSettings);
        }
      });
    } else {
      // Para Super Admins ou deslogados, usa o padrão do sistema sem criar lixo no Firestore
      this.systemSettingsSubject.next(this.data.systemSettings);
    }

    // Sincronização de Tópicos de Quiz
    onSnapshot(collection(db, "quizTopics"), (snapshot) => {
      const topics: QuizTopic[] = [];
      snapshot.forEach(doc => topics.push(doc.data() as QuizTopic));
      if (topics.length > 0) {
        this.data.quizTopics = topics;
        this.quizTopicsSubject.next(topics);
      }
    });

    // 6. Sincronização de Escolas
    onSnapshot(collection(db, "schools"), (snapshot) => {
      const schools: School[] = [];
      snapshot.forEach(doc => schools.push(doc.data() as School));
      this.data.schools = schools;
      this.schoolsSubject.next(schools);
    });

    // 7. Sincronização de Terminais
    onSnapshot(collection(db, "terminals"), (snapshot) => {
      const terminals: Terminal[] = [];
      snapshot.forEach(doc => terminals.push(doc.data() as Terminal));
      this.data.terminals = terminals;
      this.terminalsSubject.next(terminals);
    });

    // 8. Sincronização de Dados Pedagógicos
    onSnapshot(collection(db, "turmas"), (snapshot) => {
      const turmas: Turma[] = [];
      snapshot.forEach(doc => turmas.push(doc.data() as Turma));
      this.data.turmas = turmas;
      this.turmasSubject.next(turmas);
    });
    onSnapshot(collection(db, "cursos"), (snapshot) => {
      const cursos: Curso[] = [];
      snapshot.forEach(doc => cursos.push(doc.data() as Curso));
      this.data.cursos = cursos;
      this.cursosSubject.next(cursos);
    });
    onSnapshot(collection(db, "cargos"), (snapshot) => {
      const cargos: Cargo[] = [];
      snapshot.forEach(doc => cargos.push(doc.data() as Cargo));
      this.data.cargos = cargos;
      this.cargosSubject.next(cargos);
    });
    onSnapshot(collection(db, "setores"), (snapshot) => {
      const setores: SetorEscolar[] = [];
      snapshot.forEach(doc => setores.push(doc.data() as SetorEscolar));
      this.data.setores = setores;
      this.setoresSubject.next(setores);
    });

    // 9. Sincronização de Métricas e Histórico (Limitar a 500 registros para performance)
    onSnapshot(query(collection(db, "wasteEntries"), orderBy("date", "desc")), (snapshot) => {
      const entries: WasteEntry[] = [];
      snapshot.forEach(doc => entries.push(doc.data() as WasteEntry));
      this.data.wasteEntries = entries;
      this.wasteEntriesSubject.next(entries);
    });
    onSnapshot(query(collection(db, "auditLogs"), orderBy("timestamp", "desc")), (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach(doc => logs.push(doc.data() as AuditLogEntry));
      this.data.auditLogs = logs;
      this.auditLogsSubject.next(logs);
    });
    onSnapshot(query(collection(db, "resetHistory"), orderBy("endDate", "desc")), (snapshot) => {
      const history: CycleSnapshot[] = [];
      snapshot.forEach(doc => history.push(doc.data() as CycleSnapshot));
      this.data.resetHistory = history;
      this.resetHistorySubject.next(history);
    });

    // 10. Sincronização de Estados de Usuários (Sempre em tempo real)
    onSnapshot(collection(db, "userStates"), (snapshot) => {
      snapshot.forEach(doc => {
        this.data.userStates[doc.id] = doc.data() as EcosystemUserState;
      });
      this.userStatesSubject.next({ ...this.data.userStates });
      // Se houver um usuário logado, atualiza o saldo dele
      if (this.data.currentUserId) {
        this.syncStateWithUser(this.data.currentUserId);
      }
    });

    // 11. Sincronização de Solicitações de Cadastro
    onSnapshot(query(collection(db, "registrationRequests"), orderBy("createdAt", "desc")), (snapshot) => {
      const requests: RegistrationRequest[] = [];
      snapshot.forEach(doc => requests.push(doc.data() as RegistrationRequest));
      this.data.registrationRequests = requests;
      this.registrationRequestsSubject.next(requests);
    });

    // 12. Sincronização de Lendas (Ecosystem Legends) - Persistência dedicada solicitada pelo USER
    onSnapshot(collection(db, "ecosystemLegends"), (snapshot) => {
      const legends: EcosystemLegend[] = [];
      snapshot.forEach(doc => legends.push(doc.data() as EcosystemLegend));
      this.legendsSubject.next(legends);
      // Após atualizar a lista de lendas, re-sincroniza o estado para atualizar o Escudo
      if (this.data.currentUserId) {
        this.syncStateWithUser(this.data.currentUserId);
      }
    });
  }

  /**
   * Inicializa o serviço carregando os dados salvos no navegador (localStorage).
   */
  initialize() {
    if (typeof window === 'undefined') return;
    this.loadFromStorage(); // Recupera a sessão e dados salvos anteriormente
    this.sanitizeData(); // Limpa dados legados e intrusos
    this.initFirebaseSync(); // Inicia sincronização em tempo real com Firestore

    // Inicializa Identificação de Hardware Local (Resiliente e Persistente)
    this.setupHardwareId();

    // Notifica todos os inscritos sobre os dados carregados
    this.currentUserRaSubject.next(this.data.currentUserRa);
    this.usersSubject.next(this.data.users);
    this.rewardsSubject.next(this.data.rewards);
    this.articlesSubject.next(this.data.articles);
    this.quizTopicsSubject.next(this.data.quizTopics);
    this.participantsSubject.next(this.data.participants);
    this.turmasSubject.next(this.data.turmas);
    this.cursosSubject.next(this.data.cursos);
    this.cargosSubject.next(this.data.cargos || []);
    this.setoresSubject.next(this.data.setores || []);
    this.terminalsSubject.next(this.data.terminals || []);
    this.schoolsSubject.next(this.data.schools || []);
    this.wasteEntriesSubject.next(this.data.wasteEntries || []);

    // 8. Observa estado de autenticação do Firebase
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Busca o RA correspondente ao email no nosso banco de dados
        const user = this.data.users.find(u => u.email?.toLowerCase() === firebaseUser.email?.toLowerCase());
        if (user) {
          this.data.currentUserRa = user.ra!;
          this.data.currentUserId = user.id;
          this.currentUserRaSubject.next(user.ra!);
          this.syncStateWithUser(user.id);
          this.saveToStorage();
        }
      }
    });

    // Sincronização entre abas: Ouve mudanças no localStorage vindas de outras abas (ex: Kiosk)
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        this.loadFromStorage();
        this.notifyAll();
      }
    });

    // Se houver um usuário logado, sincroniza os pontos e ecossistema dele
    if (this.data.currentUserId) {
      this.syncStateWithUser(this.data.currentUserId);
    }
  }

  /**
   * Sincroniza o estado (balance, vitality, etc) com um ID específico.
   * Agora inclui lógica de degradação temporal (Tamagotchi).
   */
  private syncStateWithUser(userId: string) {
    const userState = this.data?.userStates?.[userId] || this.getDefaultState();
    const user = (this.data?.users || []).find(u => u.id === userId);

    // Lógica de Degradação Diária (Tamagotchi)
    // Se o aluno ficar dias sem fazer missões, a vitalidade cai 10% por dia.
    if (userState.lastMissionDate) {
      // REGRA DE PROTEÇÃO LENDÁRIA: Se comprou a Nessie este mês, a vitalidade não baixa.
      // Agora valida via coleção dedicada 'ecosystemLegends'
      const hasLegendaryShield = (() => {
        const legends = this.legendsSubject.value;
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        return legends.some(l => 
          l.studentId === userId && 
          l.month === currentMonth && 
          l.year === currentYear &&
          l.benefitActive
        );
      })();

      if (!hasLegendaryShield) {
        const [day, month, year] = userState.lastMissionDate.split('/').map(Number);
        const lastDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          const degradation = diffDays * 10;
          const newVitality = Math.max(0, userState.vitality - degradation);
          
          // Se a vitalidade mudou, persistimos o "dano" no estado do aluno
          if (newVitality !== userState.vitality) {
            userState.vitality = newVitality;
            this.data.userStates[userId] = userState;
            if (user) user.vitality = newVitality;
            
            // Sincroniza no Firestore silenciosamente
            setDoc(doc(db, "userStates", userId), userState, { merge: true });
          }
        }
      }
    }

    // Se for o usuário logado localmente, atualiza os BehaviorSubjects globais
    if (userId === this.data.currentUserId) {
      this.balanceSubject.next(userState.balance);
      this.vitalitySubject.next(userState.vitality);
      this.purchasedItemsSubject.next(userState.purchasedItems);
      this.lastMissionDateSubject.next(userState.lastMissionDate);
      if (user) this.levelSubject.next(user.level || 'Semente');
    }

    return { ...userState, level: user?.level || 'Semente' };
  }

  /**
   * Atualiza os pontos de um usuário usando seu ID como chave primária de estado.
   * @param identifier RA ou ID do usuário.
   * @param currentBalanceChange Mudança no saldo atual.
   * @param lifetimePointsGain Ganho de pontos vitalícios.
   */
  private syncUserPoints(identifier: string, currentBalanceChange: number, lifetimePointsGain: number) {
    // Resolve o usuário (pode vir por RA do Kiosk ou ID do Admin)
    const student = this.data.users.find(u => 
      u.id === identifier || u.ra?.toUpperCase() === identifier.toUpperCase().trim()
    );

    if (!student) return;

    const userId = student.id;
    const state = this.data.userStates[userId] || this.getDefaultState();
    state.balance += Number(currentBalanceChange);
    this.data.userStates[userId] = state;

    // Se for o usuário ativo (Global ou Kiosk), atualiza os canais de feedback imediato
    if (userId === this.data.currentUserId || student.ra?.toUpperCase() === this.kioskUserRaSubject.value?.toUpperCase()) {
      this.balanceSubject.next(state.balance);
    }

    // Atualiza metadados do aluno para o ranking
    student.points = (Number(student.points) || 0) + Number(lifetimePointsGain);
    student.vitality = state.vitality;
    student.itemsCount = state.purchasedItems.length;

    const score = EcosystemService.calculateTotalScore(student.points, student.vitality || 0, student.itemsCount || 0);
    student.level = this.calculateLevel(score, state.purchasedItems);
    state.level = student.level;

    if (userId === this.data.currentUserId || student.ra?.toUpperCase() === this.kioskUserRaSubject.value?.toUpperCase()) {
      this.levelSubject.next(student.level);
    }

    // Persistência Atômica no Firestore usando ID (Imutável)
    setDoc(doc(db, "users", student.id), student);
    setDoc(doc(db, "userStates", student.id), state);

    this.usersSubject.next([...this.data.users]);
    this.saveToStorage();
  }

  // Getters para acessar os dados atuais
  get users() { return this.usersSubject.value; }
  get allRewards() { return this.data.rewards; }
  get allArticles() { return this.data.articles; }
  get allQuizTopics() { return this.data.quizTopics; }
  get allParticipants() { return this.data.participants; }
  get allTurmas() { return this.data.turmas; }
  get allCursos() { return this.data.cursos; }
  get allCargos() { return this.data.cargos || []; }
  get allSetores() { return this.data.setores || []; }
  get auditLogs() { return this.auditLogsSubject.value; }
  get terminals() { return this.terminalsSubject.value; }
  get schools() { return this.schoolsSubject.value; }
  get wasteEntries() { return this.wasteEntriesSubject.value; }
  get registrationRequests() { return this.registrationRequestsSubject.value; }
  get resetHistory() { return this.resetHistorySubject.value; }

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
  get cargos$() { return this.cargosSubject.asObservable(); }
  get setores$() { return this.setoresSubject.asObservable(); }
  get purchasedItems$() { return this.purchasedItemsSubject.asObservable(); }
  get auditLogs$() { return this.auditLogsSubject.asObservable(); }
  get level$() { return this.levelSubject.asObservable(); }
  get systemSettings$() { return this.systemSettingsSubject.asObservable(); }
  get pendingLogin$() { return this.pendingLoginSubject.asObservable(); }
  get terminals$() { return this.terminalsSubject.asObservable(); }
  get schools$() { return this.schoolsSubject.asObservable(); }
  get wasteEntries$() { return this.wasteEntriesSubject.asObservable(); }
  get userStates() { return this.data.userStates; }
  get userStates$() { return this.userStatesSubject.asObservable(); }
  get registrationRequests$() { return this.registrationRequestsSubject.asObservable(); }
  get resetHistory$() { return this.resetHistorySubject.asObservable(); }
  get legends$() { return this.legendsSubject.asObservable(); }
  get legends() { return this.legendsSubject.value; }

  get balance() { return this.balanceSubject.value; }
  get vitality() { return this.vitalitySubject.value; }
  get purchasedItems() { return this.purchasedItemsSubject.value; }
  get currentUserRa() { return this.currentUserRaSubject.value; }
  get systemSettings() { return this.systemSettingsSubject.value; }
  get hardwareId() { return this._hardwareId; }

  /**
   * Realiza o upload de um avatar para o Firebase Storage e atualiza o usuário.
   */
  async uploadUserAvatar(userId: string, file: File): Promise<string | null> {
    try {
      let downloadURL = '';


      // Geramos o Base64 IMEDIATAMENTE. Como o Storage é restrito no plano, 
      // usamos o Firestore (Base64) como método principal e único para máxima velocidade.
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const targetSize = 200;
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');

            // Lógica de Corte Inteligente (Centralizado)
            const sourceSize = Math.min(img.width, img.height);
            const sourceX = (img.width - sourceSize) / 2;
            const sourceY = (img.height - sourceSize) / 2;

            ctx?.drawImage(
              img,
              sourceX, sourceY, sourceSize, sourceSize, // Área de origem (quadrado central)
              0, 0, targetSize, targetSize             // Área de destino (200x200)
            );

            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.onerror = () => reject(new Error("Erro ao processar imagem"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
        reader.readAsDataURL(file);
      });

      downloadURL = base64Data;

      // 4. Determina a coleção (users, participants, rewards, articles)
      let collectionName = "users";
      let isUserType = true;

      if (userId.startsWith('PART-')) {
        collectionName = "participants";
        isUserType = false;
      } else if (userId.startsWith('reward-')) {
        collectionName = "rewards";
        isUserType = false;
      } else if (userId.startsWith('article-')) {
        collectionName = "articles";
        isUserType = false;
      }

      // Encontra o identificador correto para o Firestore (Prioridade: RA, depois E-mail, depois ID)
      let dbId = userId;
      if (collectionName === "users") {
        const user = this.data.users.find(u => u.id === userId || u.ra === userId || u.email === userId);
        if (user) {
          dbId = user.id;
        }
      }

      // 5. Atualiza o Firestore (Usa 'avatar' para pessoas e 'image' para objetos/pedagógico)
      const docRef = doc(db, collectionName, dbId);
      const updateData = (collectionName === "users" || collectionName === "participants")
        ? { avatar: downloadURL }
        : { image: downloadURL };

      await setDoc(docRef, updateData, { merge: true });

      // 6. Atualiza o estado local
      if (collectionName === "participants") {
        this.data.participants = this.data.participants.map(p => p.id === userId ? { ...p, avatar: downloadURL } : p);
        this.participantsSubject.next(this.data.participants);
      } else if (collectionName === "rewards") {
        this.data.rewards = this.data.rewards.map(r => r.id === userId ? { ...r, image: downloadURL } : r);
        this.rewardsSubject.next(this.data.rewards);
      } else if (collectionName === "articles") {
        this.data.articles = this.data.articles.map(a => a.id === userId ? { ...a, image: downloadURL } : a);
        this.articlesSubject.next(this.data.articles);
      } else {
        this.data.users = this.data.users.map(u => (u.id === userId || u.ra === userId || u.email === userId) ? { ...u, avatar: downloadURL } : u);
        this.usersSubject.next(this.data.users);
      }

      return downloadURL;
    } catch (error) {
      return null;
    }
  }

  /**
   * Atualiza as configurações de hardware do sistema.
   */
  updateSystemSettings(settings: SystemSettings, targetSchoolId?: string) {
    const currentRa = this.currentUserRaSubject.value;
    const currentUser = this.data.users.find(u => u.ra === currentRa);
    const schoolId = targetSchoolId || currentUser?.schoolId;

    if (!schoolId) {
      console.warn("[ECOSYSTEM] Tentativa de salvar configurações sem unidade definida.");
      return;
    }

    this.data.systemSettings = settings;
    this.systemSettingsSubject.next(settings);
    this.saveToStorage();

    // Sincroniza com Firestore no documento da unidade
    setDoc(doc(db, "settings", schoolId), settings).catch(err => {
      // Hardware communication error handled by UI layer
    });
  }

  /**
   * Dispara um evento de login vindo de hardware externo (ESP32).
   */
  triggerHardwareLogin(ra: string, registeredId: string) {
    this.pendingLoginSubject.next({ ra, terminalId: registeredId });
    // Limpa o evento após um curto período para não disparar login duplo
    setTimeout(() => this.pendingLoginSubject.next(null), 2000);
  }

  /**
   * Gera um ID único e imutável para um terminal (SG-TOTEM-XXXX).
   */
  generateTerminalId(): string {
    const chars = '0123456789ABCDEF';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const fullId = `SG-TOTEM-${suffix}`;

    // Verifica unicidade
    const exists = this.data.terminals?.some(t => t.id === fullId);
    if (exists) return this.generateTerminalId();

    return fullId;
  }

  /**
   * Solicita autorização para um novo terminal.
   */
  requestTerminalAuthorization(terminalId: string, hardwareId: string, location: string, schoolId: string) {
    if (!this.data.terminals) this.data.terminals = [];

    // Verifica se o ID já existe
    const idExists = this.data.terminals.some(t => t.id === terminalId);
    if (idExists) return false;

    // Verifica se o hardware já existe
    const existing = this.data.terminals.find(t => t.hardwareId === hardwareId);
    if (existing) return false;

    const newTerminal: Terminal = {
      id: EcosystemService.generateStandardId('totem', schoolId),
      hardwareId: hardwareId.toUpperCase().trim(),
      location: location.toUpperCase().trim(),
      status: 'pending',
      schoolId,
      requestDate: new Date().toISOString(),
      settings: {
        loginMethod: 'all',
      }
    };

    this.data.terminals.push(newTerminal);
    this.terminalsSubject.next([...this.data.terminals]);

    // Sincroniza no Firestore
    setDoc(doc(db, "terminals", newTerminal.id), newTerminal);

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

      // Sincroniza no Firestore
      setDoc(doc(db, "terminals", id), terminal);

      this.logTelemetry({
        action: 'CRUD_UPDATE',
        category: 'SYSTEM',
        details: `Status do terminal ${terminal.location} alterado para ${status.toUpperCase()}`,
        targetEntity: 'terminals',
        targetId: id,
        unitId: schoolId || terminal.schoolId
      });

      this.saveToStorage();
    }
  }

  /**
   * Atualiza as configurações de hardware de um terminal específico.
   */
  updateTerminalSettings(id: string, settings: Partial<Terminal>) {
    if (!this.checkAdminAuth()) return;
    this.data.terminals = this.data.terminals.map(t =>
      t.id === id ? { ...t, ...settings } : t
    );
    this.terminalsSubject.next([...this.data.terminals]);

    // Sincroniza no Firestore
    const updated = this.data.terminals.find(t => t.id === id);
    if (updated) setDoc(doc(db, "terminals", id), updated);

    this.saveToStorage();
    // Log de atualização de terminal suprimido
  }

  /**
   * Remove um terminal.
   */
  deleteTerminal(id: string) {
    if (!this.checkAdminAuth()) return;
    this.data.terminals = this.data.terminals.filter(t => t.id !== id);
    this.terminalsSubject.next([...this.data.terminals]);

    // Remove do Firestore
    deleteDoc(doc(db, "terminals", id));

    this.saveToStorage();
  }

  /**
   * Registra uma nova escola diretamente como ativa (uso do Super Admin).
   */
  async registerSchool(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string) {
    if (!this.checkAdminAuth()) return false;

    const resolvedPassword = initialPassword || schoolData.initialManagerPassword;

    if (!schoolData.managerEmail || !resolvedPassword) {
      return false;
    }

    // Validação de E-mail Único na Rede
    const emailLower = schoolData.managerEmail.toLowerCase().trim();
    if (this.data.users.some(u => u.email?.toLowerCase() === emailLower)) {
      return false;
    }

    const newSchool: School = {
      ...schoolData,
      id: EcosystemService.generateStandardId('school', undefined, { name: schoolData.name, city: schoolData.city }),
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    this.data.schools.push(newSchool);

    // Cria o usuário gestor imediatamente
    if (newSchool.managerEmail && resolvedPassword) {
      const newUser: User = {
        id: EcosystemService.generateStandardId('admin', newSchool.id),
        name: `Gestor ${newSchool.name}`,
        email: newSchool.managerEmail,
        password: await EcosystemService.hashPassword(resolvedPassword),
        role: 'admin',
        schoolId: newSchool.id,
        ra: `G-${Date.now().toString().slice(-4)}`,
        points: 0,
        level: 'Semente',
        status: 'active'
      };
      this.data.users.push(newUser);
      this.usersSubject.next([...this.data.users]);
    }

    this.schoolsSubject.next([...this.data.schools]);

    // Sincroniza Escola no Firestore (Sem a senha no registro permanente)
    const schoolToSave = { ...newSchool };
    delete (schoolToSave as any).initialManagerPassword;
    setDoc(doc(db, "schools", newSchool.id), schoolToSave);

    // Inicializa configurações de hardware da unidade
    setDoc(doc(db, "settings", newSchool.id), this.data.systemSettings || {
      studentLoginMethod: 'all',
      adminLoginMethod: 'all'
    });

    // Se criou gestor, sincroniza ele também usando seu ID único
    if (newSchool.managerEmail) {
      const adminUser = this.data.users.find(u => u.email === newSchool.managerEmail);
      if (adminUser) setDoc(doc(db, "users", adminUser.id), adminUser);
    }

    this.saveToStorage();

    this.logTelemetry({
      action: 'CRUD_CREATE',
      category: 'SYSTEM',
      details: `Nova unidade escolar registrada: ${newSchool.name}`,
      targetEntity: 'schools',
      targetId: newSchool.id,
      unitId: 'MASTER'
    });

    return true;
  }

  /**
   * Solicita o registro de uma nova escola.
   */
  async requestSchoolRegistration(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string) {
    if (!schoolData.managerEmail || !initialPassword) {
      return false;
    }

    const sanitizedData = {
      ...schoolData,
      name: schoolData.name.toUpperCase().trim(),
      city: schoolData.city.toUpperCase().trim(),
      state: schoolData.state.toUpperCase().trim(),
      contactEmail: schoolData.contactEmail?.toLowerCase().trim(),
      managerEmail: schoolData.managerEmail.toLowerCase().trim(),
      initialManagerPassword: initialPassword // Mantemos aqui temporariamente apenas para o objeto que será salvo como 'pending'
    };

    const newSchool: School = {
      ...sanitizedData,
      id: `school-${Date.now()}`,
      status: 'pending',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    this.data.schools.push(newSchool);
    this.schoolsSubject.next([...this.data.schools]);

    try {
      // Sincroniza no Firestore
      await setDoc(doc(db, "schools", newSchool.id), newSchool);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao registrar solicitação de escola:", error);
      return false;
    }
  }

  /**
   * Atualiza o status de uma escola (Aprovação).
   */
  async updateSchoolStatus(id: string, status: 'active' | 'pending' | 'inactive' | 'suspended', initialPassword?: string) {
    if (!this.checkAdminAuth()) return;
    const school = this.data.schools.find(s => s.id === id);
    if (school) {
      school.status = status;
      const resolvedPassword = initialPassword || school.initialManagerPassword;

      // Se estiver ativando, garante que o usuário gestor exista
      if (status === 'active' && school.managerEmail && resolvedPassword) {
        const userExists = this.data.users.find(u => u.email?.toLowerCase() === school.managerEmail?.toLowerCase());
        if (!userExists) {
          const newUser: User = {
            id: EcosystemService.generateStandardId('admin', school.id),
            name: `Gestor ${school.name}`,
            email: school.managerEmail,
            password: await EcosystemService.hashPassword(resolvedPassword),
            role: 'admin',
            schoolId: school.id,
            ra: `G-${Date.now().toString().slice(-4)}`,
            points: 0,
            level: 'Semente',
            status: 'active'
          };
          this.data.users.push(newUser);
          this.usersSubject.next([...this.data.users]);
        }
      }

      this.schoolsSubject.next([...this.data.schools]);

      // Sincroniza Escola no Firestore (Limpa a senha se estiver ativando)
      const schoolToSave = { ...school };
      if (status === 'active') delete (schoolToSave as any).initialManagerPassword;
      setDoc(doc(db, "schools", id), schoolToSave);

      // Inicializa configurações de hardware da unidade (Multi-Tenant)
      setDoc(doc(db, "settings", id), this.data.systemSettings || {
        studentLoginMethod: 'all',
        adminLoginMethod: 'all'
      });

      // Sincroniza novo gestor se criado
      if (status === 'active' && school.managerEmail) {
        const adminUser = this.data.users.find(u => u.email === school.managerEmail);
        if (adminUser) setDoc(doc(db, "users", adminUser.id), adminUser);
      }

      this.saveToStorage();
    }
  }

  /**
   * Atualiza a lista completa de escolas.
   */
  updateSchools(newSchools: School[]) {
    if (!this.checkAdminAuth()) return;
    this.data.schools = newSchools;
    this.schoolsSubject.next([...newSchools]);
    this.saveToStorage();
  }

  /**
   * Remove uma escola da rede de forma segura.
   * Só permite a exclusão se não houver gestores ativos vinculados à unidade
   * e se o Super Admin confirmar com sua senha.
   */
  async deleteSchool(id: string, password?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.checkAdminAuth()) return { success: false, error: 'Não autorizado' };

    // Verificação de Senha do Super Admin
    if (!password) return { success: false, error: 'Confirmação de senha necessária.' };
    const isPasswordValid = await this.verifyPassword(password);
    if (!isPasswordValid) return { success: false, error: 'Senha incorreta. Ação cancelada.' };

    // Regra de Negócio: Primeiro remove os gestores, depois a unidade
    const hasManagers = this.data.users.some(u => u.schoolId === id && u.role === 'admin');
    if (hasManagers) {
      return { 
        success: false, 
        error: 'Bloqueio de Segurança: Remova primeiro os gestores desta unidade antes de excluí-la.' 
      };
    }

    try {
      // Limpeza completa: Escola + Configurações de Unidade
      await Promise.all([
        deleteDoc(doc(db, "schools", id)),
        deleteDoc(doc(db, "settings", id))
      ]);
      
      this.data.schools = this.data.schools.filter(s => s.id !== id);
      this.schoolsSubject.next([...this.data.schools]);
      this.saveToStorage();
      return { success: true };
    } catch (error) {
      throw new Error('Falha no processamento da requisição de remoção.');
    }
  }


  /**
   * Retorna o estado de um usuário específico.
   */
  getUserState(ra: string): EcosystemUserState {
    const cleanRa = ra.toUpperCase().trim();
    return this.data.userStates[cleanRa] || this.getDefaultState();
  }

  private getDefaultState(): EcosystemUserState {
    return {
      balance: 0,
      vitality: 100,
      purchasedItems: [],
      lastMissionDate: null,
      curso: '',
      nessiePurchaseDate: null,
      level: 'Semente'
    };
  }


  /**
   * Verifica se o item especial "Nessie" ainda está disponível para compra este mês.
   * (Limitado a 3 pessoas por mês POR UNIDADE ESCOLAR).
   */
  isNessieAvailable() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentRa = this.currentUserRa;
    const user = this.data.users.find(u => u.ra === currentRa);
    if (!user || !user.schoolId) return false;

    const schoolId = user.schoolId;
    const legends = this.legendsSubject.value;

    const nessieOwnersInMonth = legends.filter(l => 
      l.schoolId === schoolId && 
      l.month === currentMonth && 
      l.year === currentYear
    );

    return nessieOwnersInMonth.length < 3;
  }

  /**
   * Retorna os usuários que atingiram o item lendário no mês vigente.
   */
  getMonthlyLegends(targetSchoolId?: string) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    let sid = targetSchoolId;
    if (!sid) {
      const currentRa = this.currentUserRa;
      const user = this.data.users.find(u => u.ra === currentRa);
      sid = user?.schoolId;
    }

    const dbLegends = this.legendsSubject.value
      .filter(l => {
         if (sid && sid !== 'MASTER') {
            return l.schoolId === sid && l.month === currentMonth && l.year === currentYear;
         }
         return l.month === currentMonth && l.year === currentYear;
      })
      .map(l => l.studentId);

    const fallbackLegends: string[] = [];
    Object.entries(this.data.userStates).forEach(([userId, state]) => {
      if (state.purchasedItems.includes('monstro_lago') || state.nessiePurchaseDate) {
        if (state.nessiePurchaseDate) {
          const [y, m, d] = state.nessiePurchaseDate.split('-');
          if (parseInt(y) === currentYear && parseInt(m) === currentMonth) {
             if (!dbLegends.includes(userId)) fallbackLegends.push(userId);
          }
        } else {
          if (!dbLegends.includes(userId)) fallbackLegends.push(userId);
        }
      }
    });

    const allLegendIds = [...dbLegends, ...fallbackLegends];

    return allLegendIds
      .map(id => {
        const u = this.data.users.find(user => user.id === id);
        const dbL = this.legendsSubject.value.find(l => l.studentId === id);
        const stateDate = this.data.userStates[id]?.nessiePurchaseDate;
        
        let dateToUse = dbL?.purchaseDate || new Date().toISOString();
        if (!dbL?.purchaseDate && stateDate) {
           dateToUse = stateDate.includes('T') ? stateDate : new Date(`${stateDate}T12:00:00Z`).toISOString();
        }

        return {
          ra: u?.ra || '',
          name: dbL?.studentName || u?.name || 'Agente Anônimo',
          avatar: u?.avatar,
          purchaseDate: dateToUse,
          schoolId: dbL?.schoolId || u?.schoolId || 'MASTER'
        };
      })
      .filter(l => {
         if (sid && sid !== 'MASTER') return l.schoolId === sid;
         return true;
      })
      .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
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

        // Sanitização de RA no carregamento (Garante que tudo seja Uppercase)
        if (parsed.users) {
          parsed.users = parsed.users.map((u: any) => ({ ...u, ra: u.ra?.toUpperCase() }));
        }
        if (parsed.userStates) {
          const newStates: any = {};
          Object.entries(parsed.userStates).forEach(([ra, state]) => {
            newStates[ra.toUpperCase()] = state;
          });
          parsed.userStates = newStates;
        }
        if (parsed.currentUserRa) {
          parsed.currentUserRa = parsed.currentUserRa.toUpperCase();
        }

        this.data = { ...this.data, ...parsed };
      } catch (e) {
        console.error('Erro ao carregar dados do ecossistema', e);
      }
    }

    // Carrega logs de auditoria
    const logsStr = localStorage.getItem(AUDIT_LOGS_KEY);
    if (logsStr) {
      this.auditLogsSubject.next(JSON.parse(logsStr));
    }

    // Lógica de reset (para atualizações de versão do sistema)
    let hasChanges = false;
    const RESET_VERSION = 'v22_stable'; // Versão de produção estável
    if ((this.data as any).resetVersion !== RESET_VERSION) {
      this.data.userStates = {};
      this.data.users = [ADMIN_MOCK];
      this.data.schools = [...SCHOOLS_MOCK];
      this.data.turmas = [...TURMAS_MOCK];
      this.data.cursos = [...CURSOS_MOCK];
      this.data.cargos = [...CARGOS_MOCK];
      this.data.setores = [...SETORES_MOCK];
      this.data.terminals = [...TERMINALS_MOCK];
      this.data.systemSettings = {
        studentLoginMethod: 'all',
        adminLoginMethod: 'all'
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
    // currentUserId já é mantido no this.data
    if (this.data.currentUserRa) {
      this.data.userStates[this.data.currentUserRa] = {
        balance: this.balanceSubject.value,
        vitality: this.vitalitySubject.value,
        purchasedItems: this.purchasedItemsSubject.value,
        lastMissionDate: this.lastMissionDateSubject.value,
        nessiePurchaseDate: this.data.userStates[this.data.currentUserRa]?.nessiePurchaseDate || null,
        curso: (this.data.users.find(u => u.ra === this.data.currentUserRa) as any)?.curso,
        level: this.levelSubject.value
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(this.auditLogsSubject.value));
  }

  /**
   * Configura o identificador único de hardware baseado em fingerprinting do navegador.
   * Isso garante que, mesmo limpando o localStorage, o ID permaneça o mesmo para o mesmo dispositivo.
   */
  private async setupHardwareId() {
    if (typeof window === 'undefined') return;

    const hardwareIdKey = `${STORAGE_BASE}_hardware_id`;
    let hid = localStorage.getItem(hardwareIdKey);

    // Se não estiver no cache, calculamos a "impressão digital" (fingerprint) do hardware
    if (!hid) {
      try {
        const fingerprintData = {
          ua: navigator.userAgent,
          screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
          lang: navigator.language,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          cores: navigator.hardwareConcurrency || 0,
          // Canvas Fingerprinting: Gera um hash único baseado em como o navegador renderiza gráficos
          canvas: this.getCanvasFingerprint()
        };

        const rawString = JSON.stringify(fingerprintData);
        const hash = await EcosystemService.hashPassword(rawString);
        hid = `HW-${hash.substring(0, 12).toUpperCase()}`;
        
        localStorage.setItem(hardwareIdKey, hid);
      } catch (e) {
        // Fallback para randômico se o cálculo falhar por restrições de segurança
        hid = `HW-RND-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }
    }

    this._hardwareId = hid;
    // Hardware Fingerprint carregado silenciosamente
  }

  /**
   * Gera uma assinatura visual única baseada na renderização de canvas.
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';
      
      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("SchoolGain_HW_ID", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("SchoolGain_HW_ID", 4, 17);
      
      return canvas.toDataURL();
    } catch (e) {
      return 'canvas-error';
    }
  }

  /**
   * CENTRAL DE TELEMETRIA (REGISTRO OPERACIONAL)
   * --------------------------------------------------------------------------
   * A Telemetria funciona como um registro imutável de eventos do sistema. 
   * Ela armazena cada interação crítica, sendo fundamental para a auditoria 
   * e segurança, permitindo o rastreamento completo de ações e origens.
   */
  async logTelemetry(params: {
    action: AuditActionType | string;
    category: 'AUTH' | 'DATA' | 'ECOSYSTEM' | 'SYSTEM';
    details: string;
    metadata?: any;
    targetEntity?: string;
    targetId?: string;
    unitId?: string;
    studentName?: string;
    points?: number;
  }) {
    const actor = this.data?.users?.find(u => u.ra === this.currentUserRa);
  
    // Função auxiliar para remover campos 'undefined' recursivamente (Firestore não aceita undefined)
    const sanitize = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitize);
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, sanitize(v)])
      );
    };


    const log: AuditLogEntry = sanitize({
      id: `tele-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
      action: params.action,
      category: params.category,
      timestamp: new Date().toISOString(),
      actorId: actor?.id || 'SYSTEM',
      actorName: actor?.name || 'Sistema Autônomo',
      unitId: params.unitId || (actor?.role === 'super_admin' ? 'MASTER' : actor?.schoolId),
      details: params.details,
      metadata: params.metadata,
      targetEntity: params.targetEntity,
      targetId: params.targetId,
      studentName: params.studentName,
      points: params.points
    });


    const newLogs = [log, ...(this.auditLogsSubject.value || [])].slice(0, 500); // Mantém últimos 500 logs localmente
    this.auditLogsSubject.next(newLogs);

    // Persiste no Firestore para auditoria permanente
    try {
      await setDoc(doc(db, "auditLogs", log.id), log);
    } catch (err) {
      console.error("[TELEMETRY] Falha ao persistir log:", err);
    }

    this.saveToStorage();
  }

  /**
   * Identifica o usuário com maior pontuação acumulada no sistema.
   */
  getGlobalLeader() {
    if (!this.data?.users || this.data.users.length === 0) return null;

    const students = this.data.users.filter(u => u.role !== 'admin');
    if (students.length === 0) return null;

    const ranked = students
      .map(u => {
        const ra = u.ra || '';
        const state = this.data?.userStates?.[ra] || this.getDefaultState();
        const score = EcosystemService.calculateTotalScore(u.points || 0, state.vitality, state.purchasedItems.length);
        return { ...u, totalScore: score };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return ranked[0];
  }

  /**
   * Marca a missão diária como completa, concede pontos e RESTAURA VITALIDADE.
   */
  completeDailyMission(points: number) {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    if (this.lastMissionDateSubject.value === today) return false;
    
    if (this.currentUserRa) {
      const state = this.data?.userStates?.[this.currentUserRa] || this.getDefaultState();
      state.lastMissionDate = today;
      
      // Restauração de Vitalidade (+20% por missão cumprida)
      state.vitality = Math.min(100, state.vitality + 20);
      this.vitalitySubject.next(state.vitality);

      if (this.data?.userStates) this.data.userStates[this.currentUserRa] = state;

      this.syncUserPoints(this.currentUserRa, points, points);
      
      this.logTelemetry({
        action: 'MISSION_COMPLETED',
        category: 'ECOSYSTEM',
        details: `Agente alimentou o ecossistema. Vitalidade restaurada para ${state.vitality}% e conquistou ${points} Bio-Coins.`
      });
    }
    return true;
  }

  /**
   * Deduz créditos do saldo do usuário (ex: aquisições).
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

    if (this.currentUserRa) {
      const state = this.data.userStates[this.currentUserRa] || this.getDefaultState();
      state.vitality = newVitality;
      state.balance -= points;
      this.data.userStates[this.currentUserRa] = state;

      this.syncUserPoints(this.currentUserRa, 0, 0); // Dispara a sincronização do estado
    }

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
      'gato': { price: 400, required: 'reparar_grama' },
      'coelho': { price: 250, required: 'reparar_grama' },
      'borboletas': { price: 150, required: 'reparar_grama' },
      'borboletas_2': { price: 200, required: 'borboletas' },
      'borboletas_3': { price: 250, required: 'borboletas_2' },
      'borboletas_4': { price: 300, required: 'borboletas_3' },
      'passaro_3': { price: 150, required: 'arvore_3' },
      'casa': { price: 1500, minVitality: 100, required: 'arvore_1' },
      'barco_1': { price: 500, required: 'limpar_rio' },
      'barco_2': { price: 600, required: 'barco_1' },
      'monstro_lago': { price: 5000, required: 'casa' },
    };

    const upgrade = catalog[item];
    if (this.purchasedItems.includes(item)) return false;
    if (upgrade.minVitality && this.vitality < upgrade.minVitality) return false;

    // Regra de Escassez: Nessie (monstro_lago) limitada a 3 por mês
    if (item === 'monstro_lago' && !this.isNessieAvailable()) {
      return false;
    }

    // Itens que bloqueiam os lendários
    const legendaryItems: EcosystemItem[] = ['casa', 'barco_1', 'barco_2', 'monstro_lago'];
    const isLegendary = legendaryItems.includes(item);

    if (isLegendary) {
      // Verifica apenas itens essenciais (árvores, limpeza, cachorro, gato)
      const essentialItems: EcosystemItem[] = [
        'limpar_rio', 'filtro_ar', 'reparar_grama', 
        'arvore_1', 'arvore_2', 'arvore_3',
        'cachorro'
      ];
      if (essentialItems.some(id => !this.purchasedItems.includes(id))) return false;
    } else if (upgrade.required && !this.purchasedItems.includes(upgrade.required as EcosystemItem)) {
      return false; // Não possui o item requisito (ex: precisa de árvore para ter pássaro)
    }

    if (this.balance < upgrade.price || !this.currentUserRa) return false; // Saldo insuficiente

    // Atualiza a lista de itens comprados
    const newItems = [...this.purchasedItems, item];
    this.purchasedItemsSubject.next(newItems);

    // Persiste a mudança no estado do usuário para o Firestore
    const student = this.data.users.find(u => u.ra === this.currentUserRa);
    if (student) {
      const state = this.data.userStates[student.id] || this.getDefaultState();
      state.purchasedItems = newItems;
      this.data.userStates[student.id] = state;
    }

    let balanceAdjust = -upgrade.price;
    let pointsAdjust = 0;

    // Lógica especial para Nessie: Persistência dedicada em coleção própria (ecosystemLegends)
    if (item === 'monstro_lago') {
      if (!this.isNessieAvailable()) return false;

      const state = this.data.userStates[this.currentUserRa] || this.getDefaultState();
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const dateStr = today.toISOString();
      
      state.nessiePurchaseDate = `${year}-${month}-${today.getDate()}`;
      this.data.userStates[this.currentUserRa] = state;

      if (student) {
        const legendDoc: EcosystemLegend = {
          id: `${student.id}-${month}-${year}`,
          studentId: student.id,
          studentName: student.name,
          schoolId: student.schoolId || 'MASTER',
          month: month,
          year: year,
          purchaseDate: dateStr,
          benefitActive: true
        };

        // Salva na coleção dedicada solicitada pelo USER
        setDoc(doc(db, "ecosystemLegends", legendDoc.id), legendDoc).catch(err => {
          console.error("[FIREBASE] Erro ao salvar lenda dedicada:", err);
        });
      }
    }

    // Se comprar a 'casa' (item máximo), ganha um bônus especial de pontos
    if (item === 'casa') {
      pointsAdjust = 5000;
      balanceAdjust += 5000;
    }

    // Sincroniza e salva
    this.syncUserPoints(this.currentUserRa, balanceAdjust, pointsAdjust);

    this.logTelemetry({
      action: 'ITEM_PURCHASED',
      category: 'ECOSYSTEM',
      details: `Compra de melhoria de ecossistema: ${item}`,
      metadata: { item, cost: upgrade.price }
    });
    return true;
  }

  /**
   * Concede créditos a um usuário específico (Ação Administrativa).
   * Registra a ação no log de auditoria.
   */
  async grantPoints(ra: string, points: number, sector: string, action: string, adminName: string, password?: string, terminalSchoolId?: string): Promise<boolean> {
    if (password) {
      const isMatch = await this.verifyPassword(password);
      if (!isMatch) {
        await this.logTelemetry({
          action: 'LOGIN_FAIL',
          category: 'AUTH',
          details: `Falha de senha administrativa ao tentar conceder pontos para usuário da unidade.`,
          unitId: terminalSchoolId
        });
        return false;
      }
    }

    const currentAdmin = this.data?.users?.find(u => u.ra === this.currentUserRa);
    const isSystemAction = adminName === 'SISTEMA' || adminName === 'SchoolGain Security';

    if (!isSystemAction && (!currentAdmin || (currentAdmin.role !== 'admin' && currentAdmin.role !== 'super_admin'))) {
      console.error('[SECURITY] Tentativa de conceder pontos por usuário não autorizado');
      return false;
    }

    const cleanRa = ra.toUpperCase().trim();
    const student = (this.data?.users || []).find(u => u.ra === cleanRa);
    if (!student) return false;

    this.syncUserPoints(ra, points, points);

    // Registra na Telemetria (Rastreabilidade Total)
    await this.logTelemetry({
      action: 'POINTS_AWARDED',
      category: 'ECOSYSTEM',
      details: `${points} Bio-Coins concedidos a ${student.name} no setor ${sector}. Motivo: ${action}`,
      targetEntity: 'users',
      targetId: student.id,
      studentName: student.name,
      points: points,
      unitId: terminalSchoolId || student.schoolId,
      metadata: { points, sector, action }
    });

    return true;
  }

  /**
   * Registra o processamento de resíduos e atribui créditos ao usuário.
   */
  registerWaste(ra: string, type: WasteType, weightKg: number, terminalSchoolId?: string) {
    const cleanRa = ra.toUpperCase().trim();
    const student = (this.data?.users || []).find(u => u.ra?.toUpperCase() === cleanRa);
    if (!student) {
      console.warn(`[ECOSYSTEM] Tentativa de registro de resíduo para RA não encontrado: ${cleanRa}`);
      return false;
    }

    // 1. Gera pontos baseados no mapeamento de constantes (ex: Plástico=10, Metal=15)
    // Multiplicamos pelo peso apenas se o peso for significativo (> 1kg), caso contrário assume 1 unidade
    const basePoints = POINTS_MAPPING[type] || 0;
    const points = weightKg >= 1 ? Math.floor(weightKg * basePoints) : basePoints;

    const newEntry: WasteEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: type,
      collected: weightKg,
      ra: ra,
      schoolId: terminalSchoolId || student.schoolId
    };

    // Log de registro de resíduos suprimido para produção (Telemetria ativa)

    this.logTelemetry({
      action: 'POINTS_AWARDED',
      category: 'ECOSYSTEM',
      details: `Coleta de resíduos (${type}): ${weightKg}kg convertidos em ${points} Bio-Coins.`,
      studentName: student.name,
      points: points,
      unitId: terminalSchoolId || student.schoolId
    });

    this.addPoints(points, cleanRa);

    this.data.wasteEntries = [...(this.data.wasteEntries || []), newEntry];
    this.wasteEntriesSubject.next([...this.data.wasteEntries]);

    // Salva no Firestore
    setDoc(doc(db, "wasteEntries", newEntry.id), newEntry).catch(err => {
      console.error("[FIREBASE] Erro ao salvar coleta:", err);
    });

    this.saveToStorage();

    return true;
  }

  /**
   * RESET DE CICLO (FINALIZAÇÃO DE PERÍODO)
   * --------------------------------------------------------------------------
   * Este método gerencia o encerramento de um ciclo ou temporada de engajamento. 
   * 
   * Procedimentos executados:
   * 1. Geração de um Snapshot (registro histórico) do estado atual do ranking.
   * 2. Reinicialização da pontuação de todos os usuários para um novo ciclo.
   * 3. Limpeza de entradas de dados, preservando a integridade na Telemetria.
   */
  async performCycleReset(password: string, schoolId?: string) {
    const isMatch = await this.verifyPassword(password);
    if (!isMatch) {
      console.error('[SECURITY] Senha incorreta para reset de ciclo');
      return false;
    }

    const currentAdmin = this.data?.users?.find(u => u.ra === this.currentUserRa);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      console.error('[SECURITY] Tentativa de reset de ciclo por usuário não autorizado');
      return false;
    }

    // 1. GERA SNAPSHOT
    const students = (this.data?.users || []).filter(u => u.role === 'student' && (!schoolId || u.schoolId === schoolId));
    const relevantWaste = (this.data?.wasteEntries || []).filter(w => !schoolId || w.schoolId === schoolId);

    const snapshot: CycleSnapshot = {
      id: `cycle-${Date.now()}`,
      endDate: new Date().toISOString(),
      totalWasteKg: relevantWaste.reduce((acc, curr) => acc + curr.collected, 0),
      totalPoints: students.reduce((acc, curr) => acc + curr.points, 0),
      topStudents: [...students]
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)
        .map(s => ({ name: s.name, points: s.points, ra: s.ra || '' })),
      wasteByType: relevantWaste.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + curr.collected;
        return acc;
      }, {} as Record<string, number>),
      schoolId
    };

    // 2. SALVA NO HISTÓRICO E LOGA TELEMETRIA
    this.data.resetHistory = [snapshot, ...(this.data.resetHistory || [])];
    this.resetHistorySubject.next(this.data.resetHistory);

    await this.logTelemetry({
      action: 'SYSTEM_RESET',
      category: 'SYSTEM',
      details: `Reset de ciclo executado para ${schoolId === 'all' ? 'toda a rede' : `unidade ${schoolId}`}`,
      unitId: schoolId === 'all' ? 'MASTER' : schoolId,
      metadata: { snapshotId: snapshot.id, totalPoints: snapshot.totalPoints, totalWaste: snapshot.totalWasteKg }
    });

    // 3. LIMPEZA DE DADOS (RESET)
    // Zera pontos e níveis dos usuários
    this.data.users = this.data.users.map(u => {
      if (u.role === 'student' && (!schoolId || u.schoolId === schoolId)) {
        return { ...u, points: 0, level: 'Semente' };
      }
      return u;
    });

    // Limpa coletas
    if (this.data.wasteEntries) {
      this.data.wasteEntries = this.data.wasteEntries.filter(w => schoolId && w.schoolId !== schoolId);
    }

    // Limpa logs de auditoria
    if (this.data.auditLogs) {
      this.data.auditLogs = this.data.auditLogs.filter(l => schoolId && l.unitId !== schoolId);
    }

    // Reseta estados de ecossistema (vitalidade e itens)
    Object.keys(this.data.userStates).forEach(id => {
      const user = this.data.users.find(u => u.id === id);
      if (user && (!schoolId || user.schoolId === schoolId)) {
        this.data.userStates[id] = this.getDefaultState();
      }
    });

    // 4. NOTIFICA E PERSISTE NO FIRESTORE
    this.usersSubject.next([...this.data.users]);
    this.wasteEntriesSubject.next([...this.data.wasteEntries]);
    this.auditLogsSubject.next([...this.data.auditLogs]);

    // Salva o snapshot no Firestore
    setDoc(doc(db, "resetHistory", snapshot.id), snapshot);

    // Atualiza todos os usuários resetados no Firestore usando ID único
    this.data.users.forEach(u => {
      if (u.role === 'student' && (!schoolId || u.schoolId === schoolId)) {
        setDoc(doc(db, "users", u.id), u);
      }
    });

    // Limpa estados de ecossistema no Firestore
    Object.keys(this.data.userStates).forEach(id => {
      const user = this.data.users.find(u => u.id === id);
      if (user && (!schoolId || user.schoolId === schoolId)) {
        setDoc(doc(db, "userStates", id), this.data.userStates[id]);
      }
    });

    // Se o usuário logado foi resetado, atualiza saldo local
    if (this.data.currentUserId) {
      this.syncStateWithUser(this.data.currentUserId);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Adiciona pontos genéricos a um usuário.
   */
  addPoints(points: number, studentRa?: string) {
    const targetRa = (studentRa || this.currentUserRa)?.toUpperCase().trim();
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
   * Verifica se um identificador está em período de bloqueio.
   */
  getLockoutStatus(id: string): { isLocked: boolean, remainingSeconds: number } {
    const cleanId = id.trim().toLowerCase();
    const security = this.data.securityState?.[cleanId];

    if (!security || !security.lockoutUntil) return { isLocked: false, remainingSeconds: 0 };

    const now = new Date();
    const lockoutDate = new Date(security.lockoutUntil);

    if (now < lockoutDate) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((lockoutDate.getTime() - now.getTime()) / 1000)
      };
    }

    return { isLocked: false, remainingSeconds: 0 };
  }

  /**
   * Autentica um usuário pelo RA ou RFID.
   */
  async login(id: string, password?: string) {
    const cleanId = id.trim();
    const cleanPassword = password?.trim();
    const securityKey = cleanId.toLowerCase();

    // 1. Verifica Lockout
    const lockout = this.getLockoutStatus(cleanId);
    if (lockout.isLocked) {
      return false;
    }

    // Busca insensível a maiúsculas/minúsculas para RA, RFID e Email
    const user = (this.data?.users || []).find(u =>
      (u.ra && u.ra.toLowerCase() === cleanId.toLowerCase()) ||
      (u.rfid && u.rfid.toLowerCase() === cleanId.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
    );

    if (user) {
      // 2. Verifica se o usuário ou a escola estão ativos
      if (user.status === 'inactive') {
        console.warn(`[AUTH] Tentativa de login de usuário inativo: ${user.name}`);
        return false;
      }

      if (user.schoolId && user.schoolId !== 'global') {
        const school = this.data.schools.find(s => s.id === user.schoolId);
        if (school && (school.status === 'inactive' || school.status === 'suspended')) {
          console.warn(`[AUTH] Tentativa de login vinculada a unidade inativa/suspensa: ${school.name}`);
          return false;
        }
      }

      // 3. Lógica diferenciada por cargo
      if (cleanPassword) {
        if (user.role === 'super_admin') {
          // Super Admins continuam usando a segurança nativa do Firebase Auth
          try {
            await signInWithEmailAndPassword(auth, user.email!, cleanPassword);
          } catch (firebaseError: any) {
            console.error("[FIREBASE] Falha no login do Super Admin:", firebaseError);
            this.handleFailedLogin(securityKey);
            return false;
          }
        } else {
          // Gestores e Usuários utilizam a lógica SHA-256 customizada
          const hashedInput = await EcosystemService.hashPassword(cleanPassword);
          const isMatch = user.password === hashedInput || user.password === cleanPassword;

          if (!isMatch) {
            this.handleFailedLogin(securityKey);
            return false;
          }
        }
      }

      const ra = user.ra!;
      this.data.currentUserRa = ra;
      this.data.currentUserId = user.id;
      this.currentUserRaSubject.next(ra);
      this.syncStateWithUser(user.id);
      this.resetSecurityState(securityKey);

      // Telemetria de Login
      await this.logTelemetry({
        action: 'LOGIN_SUCCESS',
        category: 'AUTH',
        details: `Login realizado com sucesso: ${user.name} (${user.role})`,
      unitId: user.schoolId === 'MASTER' || !user.schoolId ? 'MASTER' : user.schoolId
      });

      this.saveToStorage();
      return true;
    }

    await this.logTelemetry({
      action: 'LOGIN_FAIL',
      category: 'AUTH',
      details: `Falha de autenticação para credencial protegida.`
    });
    this.handleFailedLogin(securityKey);
    return false;
  }

  /**
   * Registra uma falha de login e aplica bloqueio se necessário.
   */
  private handleFailedLogin(id: string) {
    if (!this.data.securityState) this.data.securityState = {};

    const security = this.data.securityState[id] || { failedAttempts: 0, lockoutUntil: null };
    security.failedAttempts += 1;

    // Bloqueio progressivo: 5, 10, 15... falhas
    if (security.failedAttempts >= 5) {
      const minutes = Math.min(60, Math.pow(2, Math.floor(security.failedAttempts / 5)) * 5);
      const lockoutDate = new Date();
      lockoutDate.setMinutes(lockoutDate.getMinutes() + minutes);
      security.lockoutUntil = lockoutDate.toISOString();

      this.grantPoints('SECURITY_ALERT', 0, 'SISTEMA', `BLOQUEIO: ${id} após ${security.failedAttempts} falhas`, 'SchoolGain Security');
    }

    this.data.securityState[id] = security;
    this.saveToStorage();
  }

  /**
   * Reseta o estado de segurança após sucesso.
   */
  private resetSecurityState(id: string) {
    if (this.data.securityState?.[id]) {
      delete this.data.securityState[id];
      this.saveToStorage();
    }
  }

  /**
   * Identifica um usuário especificamente para o Kiosk, sem mudar o login global.
   */
  identifyKioskUser(ra: string | null) {
    const cleanRa = ra?.toUpperCase().trim() || null;
    this.kioskUserRaSubject.next(cleanRa);
    if (cleanRa) {
      const user = this.data.users.find(u => u.ra?.toUpperCase() === cleanRa);
      if (user) {
        this.syncStateWithUser(user.id);
      }
    }
  }


  /**
   * Finaliza a sessão do usuário.
   */
  logout() {
    this.data.currentUserRa = null;
    this.data.currentUserId = null;
    this.currentUserRaSubject.next(null);
    this.balanceSubject.next(0);
    this.vitalitySubject.next(100);
    this.purchasedItemsSubject.next([]);
    this.lastMissionDateSubject.next(null);
    this.saveToStorage();

    // Sign out from Firebase
    signOut(auth).catch(err => console.error("[FIREBASE] Erro ao deslogar:", err));
  }

  // Funções de atualização em massa (usadas no painel admin)
  async updateUsers(newUsers: User[], targetSchoolId?: string): Promise<{ success: boolean, error?: string }> {
    if (!this.checkAdminAuth()) return { success: false, error: 'Não autorizado' };

    try {
      // Validação Global de Dados Críticos Duplicados (Email, RA, RFID)
      const emails = new Map<string, string>();
      const ras = new Map<string, string>();
      const rfids = new Map<string, string>();

      for (const u of newUsers) {
        // 1. Validar Email
        if (u.email) {
          u.email = u.email.toLowerCase().trim();
          if (emails.has(u.email)) {
            return { success: false, error: `Conflito de e-mail: ${u.email}. Já em uso por ${emails.get(u.email)}` };
          }
          emails.set(u.email, u.name);
        }

        // 2. Validar RA
        if (u.ra) {
          u.ra = u.ra.toUpperCase().trim();
          if (ras.has(u.ra)) {
            const conflictMsg = `Conflito de RA: ${u.ra}. O aluno ${ras.get(u.ra)} já utiliza este código.`;
            return { success: false, error: conflictMsg };
          }
          ras.set(u.ra, u.name);
        }

        // 3. Validar RFID
        if (u.rfid) {
          u.rfid = u.rfid.toUpperCase().trim();
          if (rfids.has(u.rfid)) {
            const conflictMsg = `Conflito de RFID: ${u.rfid}. Já em uso por ${rfids.get(u.rfid)}.`;
            return { success: false, error: conflictMsg };
          }
          rfids.set(u.rfid, u.name);
        }

        // 4. Normalizar campos de texto
        if (u.name) u.name = u.name.toUpperCase().trim();
        if (u.turma) u.turma = u.turma.toUpperCase().trim();
        if (u.curso) u.curso = u.curso.toUpperCase().trim();
        if (u.position) u.position = u.position.toUpperCase().trim();
        if (!u.status) u.status = 'active';
      }

      // 1. Identifica usuários removidos
      // Se targetSchoolId for fornecido, apenas remove usuários daquela escola que não estão na nova lista
      const removedUsers = this.data.users.filter(oldU => {
        const isInNewList = newUsers.find(newU => newU.id === oldU.id);
        if (targetSchoolId) {
          return oldU.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      // 2. Mescla os usuários (Preserva usuários de outras escolas se a lista for parcial/filtrada)
      let uniqueUsers: User[];
      if (targetSchoolId) {
        const otherSchoolsUsers = this.data.users.filter(u => u.schoolId !== targetSchoolId);
        uniqueUsers = [...otherSchoolsUsers, ...newUsers];
      } else {
        uniqueUsers = Array.from(new Map(newUsers.map(u => [u.id, u])).values());
      }

      // 3. Identifica quais usuários mudaram para salvar apenas o necessário
      const changedUsers = newUsers.filter(newUser => {
        const oldUser = this.data.users.find(u => u.id === newUser.id);
        return !oldUser || JSON.stringify(oldUser) !== JSON.stringify(newUser);
      });

      const oldData = [...this.data.users];
      this.data.users = uniqueUsers;
      this.usersSubject.next([...uniqueUsers]);

      // Sincroniza apenas os alterados no Firestore
      await Promise.all([
        // Deleta os removidos
        ...removedUsers.flatMap(u => [
          deleteDoc(doc(db, "users", u.id)),
          ...(u.ra ? [deleteDoc(doc(db, "users", u.ra))] : [])
        ]),

        // Salva/Atualiza os novos ou modificados
        ...changedUsers.map(u => {
          const oldUser = oldData.find(old => old.id === u.id);

          // Se o RA mudou, precisamos apagar o documento antigo (que usava o RA como ID)
          if (oldUser && oldUser.ra && oldUser.ra !== u.ra) {
            deleteDoc(doc(db, "users", oldUser.ra)).catch(e => console.error("Erro ao limpar RA antigo:", e));
          }

          return setDoc(doc(db, "users", u.id), u);
        })
      ]);

      // Telemetria
      if (removedUsers.length > 0) {
        await this.logTelemetry({
          action: 'CRUD_DELETE',
          category: 'DATA',
          details: `Exclusão de ${removedUsers.length} usuários.`,
          targetEntity: 'users',
          metadata: { ids: removedUsers.map(u => u.id), names: removedUsers.map(u => u.name) }
        });
      }

      if (changedUsers.length > 0) {
        for (const u of changedUsers) {
          const isNew = !oldData.find(old => old.id === u.id);
          await this.logTelemetry({
            action: isNew ? 'CRUD_CREATE' : 'CRUD_UPDATE',
            category: 'DATA',
            details: `${isNew ? 'Criação' : 'Atualização'} do usuário: ${u.name} (${u.role})`,
            targetEntity: 'users',
            targetId: u.id,
            unitId: u.schoolId,
            metadata: { snapshot: u }
          });
        }
      }

      this.saveToStorage();
      return { success: true };
    } catch (error: any) {
      console.error("[ECOSYSTEM] Erro ao atualizar usuários:", error);
      return { success: false, error: error.message || 'Erro interno no banco de dados' };
    }
  }


  /**
   * Remove um usuário individual do sistema de forma segura.
   * Utiliza a lógica de sincronização do updateUsers para evitar órfãos.
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    
    // Filtra para remover apenas o usuário alvo da sua respectiva unidade
    const otherUsersOfSchool = this.data.users.filter(u => u.schoolId === user.schoolId && u.id !== userId);
    const result = await this.updateUsers(otherUsersOfSchool, user.schoolId);
    return result.success;
  }


  async deleteReward(id: string, targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;
    
    // Se targetSchoolId for fornecido, garante que o item pertence à unidade
    if (targetSchoolId) {
      const reward = this.data.rewards.find(r => r.id === id);
      if (reward && reward.schoolId !== targetSchoolId) return false;
    }

    this.data.rewards = this.data.rewards.filter(r => r.id !== id);
    this.rewardsSubject.next([...this.data.rewards]);
    try {
      const reward = this.data.rewards.find(r => r.id === id);
      await deleteDoc(doc(db, "rewards", id));

      this.logTelemetry({
        action: 'CRUD_DELETE',
        category: 'DATA',
        details: `Recompensa excluída: ${reward?.name || id}`,
        targetEntity: 'rewards',
        targetId: id,
        unitId: targetSchoolId || reward?.schoolId
      });

      this.saveToStorage();
      return true;
    } catch (error) { return false; }
  }

  async deleteArticle(id: string, targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;
    
    if (targetSchoolId) {
      const article = this.data.articles.find(a => a.id === id);
      if (article && article.schoolId !== targetSchoolId) return false;
    }

    this.data.articles = this.data.articles.filter(a => a.id !== id);
    this.articlesSubject.next([...this.data.articles]);
    try {
      const article = this.data.articles.find(a => a.id === id);
      await deleteDoc(doc(db, "articles", id));

      this.logTelemetry({
        action: 'CRUD_DELETE',
        category: 'DATA',
        details: `Artigo excluído: ${article?.title || id}`,
        targetEntity: 'articles',
        targetId: id,
        unitId: targetSchoolId || article?.schoolId
      });

      this.saveToStorage();
      return true;
    } catch (error) { return false; }
  }

  async updateRewards(newRewards: Reward[], targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      const removedItems = this.data.rewards.filter(oldI => {
        const isInNewList = newRewards.find(newI => newI.id === oldI.id);
        if (targetSchoolId) {
          return oldI.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      const changedRewards = newRewards.filter(newR => {
        const oldR = this.data.rewards.find(r => r.id === newR.id);
        return !oldR || JSON.stringify(oldR) !== JSON.stringify(newR);
      });

      // Telemetria CRUD Recompensas
      if (removedItems.length > 0) {
        await this.logTelemetry({
          action: 'CRUD_DELETE',
          category: 'DATA',
          details: `Exclusão de ${removedItems.length} recompensas.`,
          targetEntity: 'rewards',
          metadata: { ids: removedItems.map(i => i.id) }
        });
      }

      for (const r of changedRewards) {
        const isNew = !this.data.rewards.find(old => old.id === r.id);
        await this.logTelemetry({
          action: isNew ? 'CRUD_CREATE' : 'CRUD_UPDATE',
          category: 'DATA',
          details: `${isNew ? 'Criação' : 'Edição'} de recompensa: ${r.name}`,
          targetEntity: 'rewards',
          targetId: r.id,
          unitId: r.schoolId,
          metadata: { snapshot: r }
        });
      }

      // Mesclagem segura e Limpeza de Campos Obsoletos (Remoção do RA)
      let finalRewards: Reward[];
      const sanitizeReward = (r: Reward) => {
        const { ra, ...clean } = r as any;
        return clean as Reward;
      };

      const sanitizedNewRewards = newRewards.map(sanitizeReward);
      const sanitizedChangedRewards = changedRewards.map(sanitizeReward);

      if (targetSchoolId) {
        finalRewards = [
          ...this.data.rewards.filter(r => r.schoolId !== targetSchoolId), 
          ...sanitizedNewRewards
        ];
      } else {
        finalRewards = sanitizedNewRewards;
      }

      this.data.rewards = finalRewards;
      this.rewardsSubject.next(finalRewards);

      // Sincroniza alterados e deleta removidos
      await Promise.all([
        ...removedItems.map(i => deleteDoc(doc(db, "rewards", i.id))),
        ...sanitizedChangedRewards.map(r => setDoc(doc(db, "rewards", r.id), r))
      ]);

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar recompensas:", error);
      return false;
    }
  }

  async updateArticles(newArticles: EducationArticle[], targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      const removedItems = this.data.articles.filter(oldI => {
        const isInNewList = newArticles.find(newI => newI.id === oldI.id);
        if (targetSchoolId) {
          return oldI.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      const changedArticles = newArticles.filter(newA => {
        const oldA = this.data.articles.find(a => a.id === newA.id);
        return !oldA || JSON.stringify(oldA) !== JSON.stringify(newA);
      });

      // Telemetria CRUD Artigos
      if (removedItems.length > 0) {
        await this.logTelemetry({
          action: 'CRUD_DELETE',
          category: 'DATA',
          details: `Exclusão de ${removedItems.length} artigos educativos.`,
          targetEntity: 'articles',
          metadata: { ids: removedItems.map(i => i.id) }
        });
      }

      for (const a of changedArticles) {
        const isNew = !this.data.articles.find(old => old.id === a.id);
        await this.logTelemetry({
          action: isNew ? 'CRUD_CREATE' : 'CRUD_UPDATE',
          category: 'DATA',
          details: `${isNew ? 'Criação' : 'Edição'} de artigo: ${a.title}`,
          targetEntity: 'articles',
          targetId: a.id,
          unitId: a.schoolId,
          metadata: { snapshot: a }
        });
      }

      // Mesclagem segura
      let finalArticles: EducationArticle[];
      if (targetSchoolId) {
        finalArticles = [...this.data.articles.filter(a => a.schoolId !== targetSchoolId), ...newArticles];
      } else {
        finalArticles = newArticles;
      }

      this.data.articles = finalArticles;
      this.articlesSubject.next(finalArticles);

      // Sincroniza alterados e deleta removidos
      await Promise.all([
        ...removedItems.map(i => deleteDoc(doc(db, "articles", i.id))),
        ...changedArticles.map(a => setDoc(doc(db, "articles", a.id), a))
      ]);

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar artigos:", error);
      return false;
    }
  }

  async deleteQuizTopic(id: string, targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;
    
    if (targetSchoolId) {
      const topic = this.data.quizTopics.find(t => t.id === id);
      if (topic && topic.schoolId !== targetSchoolId) return false;
    }

    this.data.quizTopics = this.data.quizTopics.filter(t => t.id !== id);
    this.quizTopicsSubject.next([...this.data.quizTopics]);
    try {
      await deleteDoc(doc(db, "quizTopics", id));
      this.saveToStorage();
      return true;
    } catch (error) { return false; }
  }

  async updateQuizTopics(newTopics: QuizTopic[], targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      // Limpeza de segurança: Remove qualquer item inválido ou sem ID das listas
      const currentTopics = (this.data.quizTopics || []).filter(t => t && t.id);
      const sanitizedNewTopics = (newTopics || []).filter(t => t && t.id);

      const removedItems = currentTopics.filter(oldI => {
        const isInNewList = sanitizedNewTopics.find(newI => newI.id === oldI.id);
        if (targetSchoolId) {
          return oldI.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      const changedTopics = sanitizedNewTopics.filter(newT => {
        const oldT = currentTopics.find(t => t.id === newT.id);
        return !oldT || JSON.stringify(oldT) !== JSON.stringify(newT);
      });

      // Telemetria CRUD Tópicos
      if (removedItems.length > 0) {
        await this.logTelemetry({
          action: 'CRUD_DELETE',
          category: 'DATA',
          details: `Exclusão de ${removedItems.length} tópicos de quiz.`,
          targetEntity: 'quizTopics',
          metadata: { ids: removedItems.map(i => i.id) }
        });
      }

      for (const t of changedTopics) {
        const isNew = !currentTopics.find(old => old.id === t.id);
        await this.logTelemetry({
          action: isNew ? 'CRUD_CREATE' : 'CRUD_UPDATE',
          category: 'DATA',
          details: `${isNew ? 'Criação' : 'Edição'} de tópico de quiz: ${t.name}`,
          targetEntity: 'quizTopics',
          targetId: t.id,
          unitId: t.schoolId,
          metadata: { snapshot: t }
        });
      }

      // Mesclagem segura
      let finalTopics: QuizTopic[];
      if (targetSchoolId) {
        finalTopics = [...currentTopics.filter(t => t.schoolId !== targetSchoolId), ...sanitizedNewTopics];
      } else {
        finalTopics = sanitizedNewTopics;
      }

      this.data.quizTopics = finalTopics;
      this.quizTopicsSubject.next(finalTopics);

      // Sincroniza alterados e deleta removidos (apenas se tiverem ID válido)
      const deletePromises = removedItems.map(i => deleteDoc(doc(db, "quizTopics", i.id)));
      const updatePromises = changedTopics.map(t => setDoc(doc(db, "quizTopics", t.id), t));

      await Promise.all([...deletePromises, ...updatePromises]);

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar tópicos de quiz:", error);
      return false;
    }
  }

  /**
   * Atualiza a lista de participantes (Equipe Sobre) com geração de ID e sincronização.
   */
  async updateParticipants(newParticipants: Participant[]): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      // 1. Identifica itens removidos para apagar no Firestore
      const removedItems = this.data.participants.filter(oldP => 
        !newParticipants.some(newP => newP.id === oldP.id)
      );

      for (const item of removedItems) {
        if (item.id) await deleteDoc(doc(db, "participants", item.id));
      }

      // 2. Processa novos itens e atualizações
      const processedParticipants = newParticipants.map(p => ({
        ...p,
        id: p.id || EcosystemService.generateStandardId('PART')
      }));

      // 3. Salva no Firestore
      for (const p of processedParticipants) {
        await setDoc(doc(db, "participants", p.id), p);
      }

      // 4. Atualiza estado local
      this.data.participants = processedParticipants;
      this.participantsSubject.next(processedParticipants);
      this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar participantes:", error);
      return false;
    }
  }

  async updateTurmas(newTurmas: Turma[], targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      const removedItems = this.data.turmas.filter(oldI => {
        const isInNewList = newTurmas.find(newI => newI.id === oldI.id);
        if (targetSchoolId) {
          return oldI.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      // Telemetria Estrutural (Turmas)
      if (removedItems.length > 0) {
        await this.logTelemetry({
          action: 'CONFIG_CHANGE',
          category: 'DATA',
          details: `Atualização estrutural de turmas na unidade. Excluídas: ${removedItems.length}`,
          targetEntity: 'turmas',
          metadata: { count: newTurmas.length, removed: removedItems.map(i => i.name) }
        });
      }

      // Mesclagem segura
      let finalTurmas: Turma[];
      if (targetSchoolId) {
        finalTurmas = [...this.data.turmas.filter(t => t.schoolId !== targetSchoolId), ...newTurmas];
      } else {
        finalTurmas = newTurmas;
      }

      this.data.turmas = finalTurmas;
      this.turmasSubject.next([...finalTurmas]);

      await Promise.all([
        ...removedItems.map(i => deleteDoc(doc(db, "turmas", i.id))),
        ...newTurmas.map(t => setDoc(doc(db, "turmas", t.id), t))
      ]);
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar turmas:", error);
      return false;
    }
  }

  async updateCursos(newCursos: Curso[], targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      const removedItems = this.data.cursos.filter(oldI => {
        const isInNewList = newCursos.find(newI => newI.id === oldI.id);
        if (targetSchoolId) {
          return oldI.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      if (removedItems.length > 0) {
        await this.logTelemetry({
          action: 'CONFIG_CHANGE',
          category: 'DATA',
          details: `Atualização estrutural de cursos técnicos. Excluídos: ${removedItems.length}`,
          targetEntity: 'cursos',
          metadata: { count: newCursos.length, removed: removedItems.map(i => i.name) }
        });
      }

      let finalCursos: Curso[];
      if (targetSchoolId) {
        finalCursos = [...this.data.cursos.filter(c => c.schoolId !== targetSchoolId), ...newCursos];
      } else {
        finalCursos = newCursos;
      }

      this.data.cursos = finalCursos;
      this.cursosSubject.next([...finalCursos]);

      await Promise.all([
        ...removedItems.map(i => deleteDoc(doc(db, "cursos", i.id))),
        ...newCursos.map(c => setDoc(doc(db, "cursos", c.id), c))
      ]);
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar cursos:", error);
      return false;
    }
  }

  async updateCargos(newCargos: Cargo[], targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      const removedItems = this.data.cargos.filter(oldI => {
        const isInNewList = newCargos.find(newI => newI.id === oldI.id);
        if (targetSchoolId) {
          return oldI.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      if (removedItems.length > 0) {
        await this.logTelemetry({
          action: 'CONFIG_CHANGE',
          category: 'DATA',
          details: `Atualização de cargos administrativos. Excluídos: ${removedItems.length}`,
          targetEntity: 'cargos',
          metadata: { count: newCargos.length, removed: removedItems.map(i => i.name) }
        });
      }

      let finalCargos: Cargo[];
      if (targetSchoolId) {
        finalCargos = [...this.data.cargos.filter(c => c.schoolId !== targetSchoolId), ...newCargos];
      } else {
        finalCargos = newCargos;
      }

      this.data.cargos = finalCargos;
      this.cargosSubject.next([...finalCargos]);

      await Promise.all([
        ...removedItems.map(i => deleteDoc(doc(db, "cargos", i.id))),
        ...newCargos.map(c => setDoc(doc(db, "cargos", c.id), c))
      ]);
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar cargos:", error);
      return false;
    }
  }

  async updateSetores(newSetores: SetorEscolar[], targetSchoolId?: string): Promise<boolean> {
    if (!this.checkAdminAuth()) return false;

    try {
      const removedItems = this.data.setores.filter(oldI => {
        const isInNewList = newSetores.find(newI => newI.id === oldI.id);
        if (targetSchoolId) {
          return oldI.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      if (removedItems.length > 0) {
        await this.logTelemetry({
          action: 'CONFIG_CHANGE',
          category: 'DATA',
          details: `Atualização de setores escolares. Excluídos: ${removedItems.length}`,
          targetEntity: 'setores',
          metadata: { count: newSetores.length, removed: removedItems.map(i => i.name) }
        });
      }

      let finalSetores: SetorEscolar[];
      if (targetSchoolId) {
        finalSetores = [...this.data.setores.filter(s => s.schoolId !== targetSchoolId), ...newSetores];
      } else {
        finalSetores = newSetores;
      }

      this.data.setores = finalSetores;
      this.setoresSubject.next([...finalSetores]);

      await Promise.all([
        ...removedItems.map(i => deleteDoc(doc(db, "setores", i.id))),
        ...newSetores.map(s => setDoc(doc(db, "setores", s.id), s))
      ]);
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("[ECOSYSTEM] Erro ao atualizar setores:", error);
      return false;
    }
  }


  /**
   * Altera a senha de um usuário (principalmente gestores).
   */
  async changePassword(ra: string, newPassword: string) {
    const userIndex = this.data.users.findIndex(u => u.ra === ra);
    if (userIndex !== -1) {
      const hashedPassword = await EcosystemService.hashPassword(newPassword);
      const user = this.data.users[userIndex];
      user.password = hashedPassword;
      user.mustChangePassword = false;

      this.usersSubject.next([...this.data.users]);

      // Sincroniza no Firestore usando ID único
      setDoc(doc(db, "users", user.id), user);

      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Altera a própria senha, exigindo a senha atual.
   */
  async updateMyPassword(currentPassword: string, newPassword: string) {
    const isMatch = await this.verifyPassword(currentPassword);
    if (!isMatch) return false;

    const ra = this.currentUserRaSubject.value;
    if (!ra) return false;
    const user = this.data.users.find(u => u.ra === ra);
    if (!user) return false;

    user.password = await EcosystemService.hashPassword(newPassword);
    user.mustChangePassword = false;

    this.usersSubject.next([...this.data.users]);

    // Sincroniza no Firestore usando ID único
    setDoc(doc(db, "users", user.id), user);

    this.saveToStorage();
    return true;
  }

  /**
   * Verifica se a senha fornecida pertence ao usuário atualmente logado.
   */
  async verifyPassword(password: string): Promise<boolean> {
    const ra = this.currentUserRaSubject.value;
    if (!ra || !this.data?.users) return false;
    const user = this.data.users.find(u => u.ra === ra);
    if (!user || !user.password) return false;

    const hashedInput = await EcosystemService.hashPassword(password);
    return user.password === hashedInput;
  }

  /**
   * Cálculo estático da pontuação total.
   * Considera Bio-Coins, Vitalidade e Itens.
   */
  static calculateTotalScore(points: number, vitality: number, itemsCount: number): number {
    // Prioriza Bio-Coins de coleta e Itens conquistados. 
    // Vitalidade entra como bônus direto (sem multiplicador de 100) para evitar base de 10k.
    return Math.floor(points + (itemsCount * 250) + vitality);
  }

  /**
   * Gera um ID padronizado baseado no tipo, unidade e código aleatório.
   * Padrão: {prefixo}-{schoolId/dados}-{codigo}
   */
  static generateStandardId(prefix: string, schoolId?: string | null, metadata?: { name?: string, city?: string }): string {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    if (prefix === 'super') return `super-${random}`;

    if (prefix === 'school' && metadata?.name && metadata?.city) {
      // 1. Extrai Iniciais (Ignora preposições)
      const stopWords = ['DE', 'DA', 'DO', 'DOS', 'DAS', 'E'];
      const initials = metadata.name
        .toUpperCase()
        .split(' ')
        .filter(word => word.length > 0 && !stopWords.includes(word))
        .map(word => word[0])
        .join('');

      // 2. Sanitiza Cidade (Sem espaços e sem acentos)
      const cleanCity = metadata.city
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s+/g, ''); // Remove espaços

      return `SCH-${initials}-${cleanCity}-${random}`;
    }

    if (prefix === 'rw' || prefix === 'ctd' || prefix === 'trm' || prefix === 'cur' || prefix === 'crg' || prefix === 'str' || prefix === 'qz') {
      const cleanSchoolId = !schoolId || schoolId === 'MASTER' ? 'MASTER' : schoolId.replace('school-', '');
      return `${prefix}-${cleanSchoolId}-${random}`;
    }
    
    // Remove o prefixo 'school-' se existir para o ID ficar mais curto
    const cleanSchoolId = !schoolId || schoolId === 'MASTER' ? 'MASTER' : schoolId.replace('school-', '');
    return `${prefix}-${cleanSchoolId}-${random}`;
  }

  /**
   * Determina a classificação visual do usuário (título honorário).
   */
  private calculateLevel(score: number, purchasedItems?: EcosystemItem[]): UserLevel {
    const items = purchasedItems || this.purchasedItems;

    // Conquistas especiais por itens
    if (items.includes('casa')) return 'Guardião da Lenda';

    // Progressão por pontuação total
    if (score >= 20000) return 'Guardião da Biosfera';
    if (score >= 15000) return 'Floresta';
    if (score >= 10000) return 'Árvore';
    if (score >= 5000) return 'Folha';
    if (score >= 2000) return 'Broto';

    return 'Semente';
  }

  private notifyAll() {
    this.usersSubject.next([...this.data.users]);
    this.wasteEntriesSubject.next([...(this.data.wasteEntries || [])]);
    this.auditLogsSubject.next([...(this.data.auditLogs || [])]);
    this.schoolsSubject.next([...(this.data.schools || [])]);
    this.terminalsSubject.next([...(this.data.terminals || [])]);
    this.rewardsSubject.next([...(this.data.rewards || [])]);
    this.articlesSubject.next([...(this.data.articles || [])]);
    this.systemSettingsSubject.next({ ...this.data.systemSettings });
    this.turmasSubject.next([...(this.data.turmas || [])]);
    this.cursosSubject.next([...(this.data.cursos || [])]);
    this.cargosSubject.next([...(this.data.cargos || [])]);
    this.setoresSubject.next([...(this.data.setores || [])]);

    if (this.data.currentUserRa) {
      this.syncStateWithUser(this.data.currentUserRa);
    }
  }

  /**
   * Remove itens duplicados de uma lista baseada no nome e ID.
   */
  private deduplicateByName<T extends { id: string; name: string; schoolId?: string }>(items: T[]): T[] {
    const unique = new Map<string, T>();
    items.forEach(item => {
      // Chave composta por Nome + Unidade para permitir nomes iguais em escolas diferentes
      const key = `${item.id}-${item.schoolId || 'MASTER'}`;
      const nameKey = `${item.name.toUpperCase().trim()}-${item.schoolId || 'MASTER'}`;
      
      if (!unique.has(key) && !Array.from(unique.values()).some(existing => `${existing.name.toUpperCase().trim()}-${existing.schoolId || 'MASTER'}` === nameKey)) {
        unique.set(key, item);
      }
    });
    return Array.from(unique.values());
  }

  /**
   * Realiza a limpeza de dados (Sanitization).
   * Garante que o sistema não tenha duplicidades ou dados órfãos.
   */
  async sanitizeData() {
    // 1. Migração e Unificação de Configurações (Aposentadoria do ID 'global')
    try {
      const globalSettingsSnap = await getDoc(doc(db, "settings", "global"));
      if (globalSettingsSnap.exists()) {
        const globalData = globalSettingsSnap.data();
        console.log("[MIGRAÇÃO] Dados globais detectados. Iniciando unificação nas unidades...");
        
        // Propaga campos do global para todas as escolas cadastradas
        const schools = this.data.schools;
        await Promise.all(schools.map(async (school) => {
          const schoolSettingsRef = doc(db, "settings", school.id);
          const schoolSettingsSnap = await getDoc(schoolSettingsRef);
          
          if (schoolSettingsSnap.exists()) {
            // Unifica os dados (Prioridade para o que já está na escola, mas preenche buracos do global)
            await setDoc(schoolSettingsRef, { ...globalData, ...schoolSettingsSnap.data() }, { merge: true });
          } else {
            // Se a escola não tinha settings, cria com os dados do global
            await setDoc(schoolSettingsRef, globalData);
          }
        }));

        // Remove o documento global após a unificação bem-sucedida
        await deleteDoc(doc(db, "settings", "global"));
        console.log("[MIGRAÇÃO] Documento 'global' removido com sucesso.");
      }
    } catch (err) {
      console.error("[MIGRAÇÃO] Erro ao unificar configurações:", err);
    }

    // 2. Limpeza de Entidades Estruturais
    this.data.turmas = this.deduplicateByName(this.data.turmas || []);
    this.data.cursos = this.deduplicateByName(this.data.cursos || []);
    this.data.cargos = this.deduplicateByName(this.data.cargos || []);
    this.data.setores = this.deduplicateByName(this.data.setores || []);

    if (!this.data.terminals) this.data.terminals = [];
    if (!this.data.schools) this.data.schools = [];
    if (!this.data.articles) this.data.articles = [];
    if (!this.data.rewards) this.data.rewards = [];
    if (!this.data.participants) this.data.participants = [];
    if (!this.data.quizTopics) this.data.quizTopics = [];

    // 2. Higienização de Entidades (Garante que cada item tenha um schoolId válido)
    const normalize = (items: any[], prefix: string, collection: string) => {
      if (!items) return [];
      return items.map(item => {
        // Garantimos que dados sem unidade não "vazem" como globais indevidamente
        if (!item.schoolId) item.schoolId = 'orphan-fix';
        return item;
      });
    };

    this.data.rewards = normalize(this.data.rewards, 'rw', 'rewards');
    this.data.articles = normalize(this.data.articles, 'ctd', 'articles');
    this.data.turmas = normalize(this.data.turmas, 'trm', 'turmas');
    this.data.cursos = normalize(this.data.cursos, 'cur', 'cursos');
    this.data.cargos = normalize(this.data.cargos, 'crg', 'cargos');
    this.data.setores = normalize(this.data.setores, 'str', 'setores');

    // 3. Gestão de Usuários e Segurança
    const uniqueUsers = new Map<string, User>();
    this.data.users.forEach(u => {
      const secondaryKey = u.email || u.ra;
      if (!uniqueUsers.has(u.id) && (!secondaryKey || !uniqueUsers.has(secondaryKey))) {
        uniqueUsers.set(u.id, u);
        if (secondaryKey) uniqueUsers.set(secondaryKey, u);
      }
    });
    this.data.users = Array.from(new Set(uniqueUsers.values()));

    if (this.data.users.length < 1) {
      this.data.users = [ADMIN_MOCK];
    }

    // GARANTE QUE CADA UNIDADE POSSUA UM GESTOR VINCULADO NO SISTEMA
    this.data.schools.forEach(school => {
      if (school.status === 'active' && school.managerEmail) {
        const gestorExists = this.data.users.some(u => u.email?.toLowerCase() === school.managerEmail?.toLowerCase());
        if (!gestorExists) {
          const newUser: User = {
            id: EcosystemService.generateStandardId('admin', school.id),
            name: `Gestor ${school.name}`,
            email: school.managerEmail,
            password: ADMIN_MOCK.password,
            role: 'admin',
            schoolId: school.id,
            ra: `G-${school.id.split('-')[1] || Date.now().toString().slice(-4)}`,
            points: 0,
            level: 'Semente',
            status: 'active'
          };
          this.data.users.push(newUser);
        }
      }
    });

    this.data.users = this.data.users.map(u => {
      // Normalização Global (Maiúsculas e Trim)
      if (u.name) u.name = u.name.toUpperCase().trim();
      if (u.ra) u.ra = u.ra.toUpperCase().trim();
      if (u.turma) u.turma = u.turma.toUpperCase().trim();
      if (u.curso) u.curso = u.curso.toUpperCase().trim();

      // Garante que usuários administrativos não constem no ranking de pontuação
      if (u.role !== 'student' && u.role !== 'visitor') u.points = 0;

      // AUTO-MIGRAÇÃO: Converte níveis legados para o novo padrão
      if (!u.level || (u.level as string) === 'Iniciante') {
        u.level = 'Semente';
      }

      // AUTO-CORREÇÃO: Garante que o cargo seja sempre minúsculo para os filtros funcionarem
      if (u.role) u.role = u.role.toLowerCase() as any;

      // MUDANÇA: Garante status ativo por padrão
      if (!u.status) u.status = 'active';

      return u;
    });

    // 4. Configurações de Sistema
    if (!this.data.systemSettings) {
      this.data.systemSettings = {
        studentLoginMethod: 'all',
        adminLoginMethod: 'all'
      };
    }

    this.saveToStorage();
    this.notifyAll();
  }

  /**
   * Solicita um novo cadastro de aluno na escola.
   */
  async requestRegistration(data: Omit<RegistrationRequest, 'id' | 'status' | 'createdAt'>) {
    const sanitizedData = {
      ...data,
      name: data.name.toUpperCase().trim(),
      ra: data.ra.toUpperCase().trim(),
      rfid: data.rfid?.toUpperCase().trim(),
      turma: data.turma.toUpperCase().trim(),
      curso: data.curso.toUpperCase().trim()
    };

    const newRequest: RegistrationRequest = {
      ...sanitizedData,
      id: `req-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Sincroniza no Firestore
    await setDoc(doc(db, "registrationRequests", newRequest.id), newRequest);
    return true;
  }

  /**
   * Aprova uma solicitação de cadastro, criando o usuário correspondente.
   */
  async approveRegistration(requestId: string) {
    if (!this.checkAdminAuth()) return false;
    
    const request = this.data.registrationRequests.find(r => r.id === requestId);
    if (!request) return false;

    // 1. Cria o novo usuário
    const newUser: User = {
      id: EcosystemService.generateStandardId('user-student', request.schoolId),
      name: request.name.toUpperCase().trim(),
      ra: request.ra.toUpperCase().trim(),
      rfid: request.rfid?.toUpperCase().trim(),
      turma: request.turma.toUpperCase().trim(),
      curso: request.curso.toUpperCase().trim(),
      role: 'student',
      schoolId: request.schoolId,
      points: 0,
      level: 'Semente',
      status: 'active'
    };

    // 2. Salva o usuário no Firestore
    await setDoc(doc(db, "users", newUser.id), newUser);

    // 3. Remove a solicitação
    await deleteDoc(doc(db, "registrationRequests", requestId));

    // 4. Log de Telemetria
    this.logTelemetry({
      action: 'CRUD_CREATE',
      category: 'DATA',
      details: `Gestor aprovou cadastro do aluno: ${newUser.name}`,
      targetEntity: 'users',
      targetId: newUser.id
    });

    return true;
  }

  /**
   * Rejeita uma solicitação de cadastro.
   */
  async rejectRegistration(requestId: string) {
    if (!this.checkAdminAuth()) return false;
    await deleteDoc(doc(db, "registrationRequests", requestId));
    
    // Log de Telemetria opcional
    this.logTelemetry({
      action: 'CRUD_DELETE',
      category: 'DATA',
      details: `Gestor recusou uma solicitação de cadastro pendente.`
    });

    return true;
  }

  async updateUserStatus(userId: string, status: 'active' | 'inactive') {
    if (!this.checkAdminAuth()) return false;
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      await setDoc(doc(db, "users", userId), { status }, { merge: true });
      this.usersSubject.next([...this.data.users]);
      
      this.logTelemetry({
        action: 'CRUD_UPDATE',
        category: 'DATA',
        details: `Gestor alterou status do usuário ${user.name} para ${status.toUpperCase()}`,
        targetEntity: 'users',
        targetId: userId
      });
      return true;
    }
    return false;
  }
}
