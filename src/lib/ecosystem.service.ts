import { BehaviorSubject } from 'rxjs';
import { POINTS_MAPPING } from './constants';
import { REWARDS_MOCK, ARTICLES_MOCK, QUIZ_TOPICS_MOCK, ADMIN_MOCK, SCHOOLS_MOCK, PARTICIPANTS_MOCK, TURMAS_MOCK, CURSOS_MOCK, CARGOS_MOCK, SETORES_MOCK, TERMINALS_MOCK } from './data';
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
  EcosystemData
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
const STORAGE_KEY = `${STORAGE_BASE}_ecosystem`;
const AUDIT_LOGS_KEY = `${STORAGE_BASE}_audit_logs`;

/**
 * EcosystemService: O Cérebro do Sistema
 * 
 * Este serviço gerencia toda a lógica de negócio, persistência e reatividade.
 * Ele utiliza o padrão "Service" com RxJS para garantir que a interface reflita
 * as mudanças de dados instantaneamente.
 */
export class EcosystemService {
  
  /**
   * Converte uma string de texto puro em um hash SHA-256 para armazenamento seguro.
   */
  public static async hashPassword(password: string): Promise<string> {
    if (typeof window === 'undefined') return password;
    
    // Fallback para contextos não-seguros (HTTP) onde crypto.subtle não existe
    if (!window.crypto || !window.crypto.subtle) {
      console.warn("[SECURITY] crypto.subtle não disponível. Usando fallback de hash inseguro para desenvolvimento.");
      // Simples "hash" para não travar o sistema em desenvolvimento via IP local (HTTP)
      return password.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0).toString(16);
    }

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
    if (!this.currentUserRa) return false;
    const user = this.data.users.find(u => u.ra?.toUpperCase() === this.currentUserRa?.toUpperCase());
    return !!(user && (user.role === 'admin' || user.role === 'super_admin'));
  }
  
  // Dados iniciais e estrutura de armazenamento
  private data: EcosystemData = {
    users: [ADMIN_MOCK],
    rewards: [...REWARDS_MOCK],
    articles: [...ARTICLES_MOCK],
    quizTopics: [...QUIZ_TOPICS_MOCK],
    currentUserRa: null,
    participants: [...PARTICIPANTS_MOCK],
    turmas: [...TURMAS_MOCK],
    cursos: [...CURSOS_MOCK],
    cargos: [...CARGOS_MOCK],
    setores: [...SETORES_MOCK],
    userStates: {},
    systemSettings: {
      studentLoginMethod: 'all',
      adminLoginMethod: 'all',
      terminalId: 'TERM-01',
      studentCaptureSource: 'browser',
      adminCaptureSource: 'browser',
      studentCaptureDevice: '',
      adminCaptureDevice: '',
      studentCaptureUrl: '',
      adminCaptureUrl: ''
    },
    terminals: [...TERMINALS_MOCK],
    schools: [...SCHOOLS_MOCK],
    securityState: {},
    wasteEntries: [],
    auditLogs: [],
    resetHistory: [],
    resetVersion: 'v22_stable'
  };

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
  private levelSubject = new BehaviorSubject<string>('Iniciante');
  
  // Novos canais para hardware e gestão
  private systemSettingsSubject = new BehaviorSubject<SystemSettings>({
    studentLoginMethod: 'all',
    adminLoginMethod: 'all',
    terminalId: 'TERM-01',
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
      terminalId: 'TERM-01',
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
    this.resetHistorySubject.next(this.data.resetHistory || []);
  }

  /**
   * Conecta aos canais do Firestore para atualizações em tempo real.
   */
  private initFirebaseSync() {
    if (typeof window === 'undefined') return;

    // 1. Sincronização de Usuários
    onSnapshot(collection(db, "users"), (snapshot) => {
      const users: User[] = [];
      snapshot.forEach(doc => users.push(doc.data() as User));
      if (users.length > 0) {
        this.data.users = users;
        this.usersSubject.next(users);
        // Garante que o usuário logado localmente ainda exista no banco
        if (this.data.currentUserRa && !users.find(u => u.ra === this.data.currentUserRa)) {
          this.logout();
        }
      }
    });

    // 2. Sincronização de Recompensas
    onSnapshot(collection(db, "rewards"), (snapshot) => {
      const rewards: Reward[] = [];
      snapshot.forEach(doc => rewards.push(doc.data() as Reward));
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

    // 5. Configurações Globais (SystemSettings)
    // Usamos um documento fixo 'global' na coleção 'settings'
    onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        const settings = docSnap.data() as SystemSettings;
        this.data.systemSettings = settings;
        this.systemSettingsSubject.next(settings);
      } else {
        // Se não existir, cria o padrão no banco
        setDoc(doc(db, "settings", "global"), this.data.systemSettings);
      }
    });

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
      // Se houver um usuário logado, atualiza o saldo dele
      if (this.data.currentUserRa) {
        this.syncStateWithUser(this.data.currentUserRa);
      }
    });
  }

  /**
   * Inicializa o serviço carregando os dados salvos no navegador (localStorage).
   */
  initialize() {
    if (typeof window === 'undefined') return;
    this.sanitizeData(); // Limpa dados legados e intrusos
    this.initFirebaseSync(); // Inicia sincronização em tempo real com Firestore
    
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
        if (user && user.ra !== this.data.currentUserRa) {
          this.data.currentUserRa = user.ra!;
          this.currentUserRaSubject.next(user.ra!);
          this.syncStateWithUser(user.ra!);
          this.saveToStorage();
        }
      }
    });

    // Sincronização entre abas: Ouve mudanças no localStorage vindas de outras abas (ex: Kiosk)
    window.addEventListener('storage', (event) => {
      if (event.key === 'schoolgain_ecosystem_data') {
        console.log('[ECOSYSTEM] Dados atualizados em outra aba, sincronizando...');
        this.loadFromStorage();
        this.notifyAll();
      }
    });

    // Se houver um usuário logado, sincroniza os pontos e ecossistema dele
    if (this.data.currentUserRa) {
      this.syncStateWithUser(this.data.currentUserRa);
    }
  }

  /**
   * Sincroniza o estado (balance, vitality, etc) com um RA específico.
   */
  private syncStateWithUser(ra: string) {
    const cleanRa = ra.toUpperCase().trim();
    const userState = this.data.userStates[cleanRa] || this.getDefaultState();
    const user = this.data.users.find(u => u.ra?.toUpperCase() === cleanRa);
    
    // Se for o usuário global, atualiza os canais globais
    if (cleanRa === this.data.currentUserRa?.toUpperCase()) {
        this.balanceSubject.next(userState.balance);
        this.vitalitySubject.next(userState.vitality);
        this.purchasedItemsSubject.next(userState.purchasedItems);
        this.lastMissionDateSubject.next(userState.lastMissionDate);
        if (user) this.levelSubject.next(user.level || 'Iniciante');
    }
    
    // Sempre retorna os dados para quem pediu (ex: Kiosk)
    return { ...userState, level: user?.level || 'Iniciante' };
  }

  /**
   * Atualiza os pontos de um usuário.
   * @param ra RA do aluno.
   * @param currentBalanceChange Mudança no saldo atual (pode ser negativo se ele gastar).
   * @param lifetimePointsGain Ganho de pontos vitalícios (usado no ranking).
   */
  private syncUserPoints(ra: string, currentBalanceChange: number, lifetimePointsGain: number) {
    const cleanRa = ra.toUpperCase().trim();
    const state = this.data.userStates[cleanRa] || this.getDefaultState();
    state.balance += Number(currentBalanceChange);
    this.data.userStates[cleanRa] = state;

    // Atualiza os canais se o RA for o global OU o do Kiosk
    if (cleanRa === this.data.currentUserRa?.toUpperCase() || cleanRa === this.kioskUserRaSubject.value?.toUpperCase()) {
      this.balanceSubject.next(state.balance);
    }

    // Atualiza a lista global de usuários para refletir no ranking
    const studentIdx = this.data.users.findIndex(u => u.ra?.toUpperCase() === cleanRa);
    if (studentIdx !== -1) {
      const student = this.data.users[studentIdx];
      student.points = (Number(student.points) || 0) + Number(lifetimePointsGain);
      student.vitality = state.vitality;
      student.itemsCount = state.purchasedItems.length;
      
      const score = EcosystemService.calculateTotalScore(student.points, state.vitality, state.purchasedItems.length);
      student.level = this.calculateLevel(score, state.purchasedItems);
      
      if (cleanRa === this.data.currentUserRa?.toUpperCase() || cleanRa === this.kioskUserRaSubject.value?.toUpperCase()) {
        this.levelSubject.next(student.level);
      }
      
      this.data.users[studentIdx] = { ...student };
      
      // Sincroniza Aluno e Estado no Firestore
      setDoc(doc(db, "users", student.ra!), student);
      setDoc(doc(db, "userStates", cleanRa), state);
      
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
  get allCargos() { return this.data.cargos || []; }
  get allSetores() { return this.data.setores || []; }
  get auditLogs() { return this.auditLogsSubject.value; }
  get terminals() { return this.terminalsSubject.value; }
  get schools() { return this.schoolsSubject.value; }
  get wasteEntries() { return this.wasteEntriesSubject.value; }
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
  get resetHistory$() { return this.resetHistorySubject.asObservable(); }

  get balance() { return this.balanceSubject.value; }
  get vitality() { return this.vitalitySubject.value; }
  get purchasedItems() { return this.purchasedItemsSubject.value; }
  get currentUserRa() { return this.currentUserRaSubject.value; }
  get systemSettings() { return this.systemSettingsSubject.value; }

  /**
   * Realiza o upload de um avatar para o Firebase Storage e atualiza o usuário.
   */
  async uploadUserAvatar(userId: string, file: File): Promise<string | null> {
    try {
      // 1. Caminho no Storage: avatars/id-do-usuario
      const storageRef = ref(storage, `avatars/${userId}`);
      
      // 2. Upload do arquivo
      const snapshot = await uploadBytes(storageRef, file);
      
      // 3. Pega a URL pública
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 4. Atualiza o Firestore
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { avatar: downloadURL }, { merge: true });
      
      // 5. Atualiza o estado local
      this.data.users = this.data.users.map(u => 
        u.id === userId ? { ...u, avatar: downloadURL } : u
      );
      this.usersSubject.next(this.data.users);
      
      return downloadURL;
    } catch (error) {
      console.error("[STORAGE] Erro no upload do avatar:", error);
      return null;
    }
  }

  /**
   * Atualiza as configurações de hardware do sistema.
   */
  updateSystemSettings(settings: SystemSettings) {
    this.data.systemSettings = settings;
    this.systemSettingsSubject.next(settings);
    this.saveToStorage();
    
    // Sincroniza com Firestore
    setDoc(doc(db, "settings", "global"), settings).catch(err => {
      console.error("[FIREBASE] Erro ao salvar configurações:", err);
    });
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
      id: terminalId,
      hardwareId,
      location,
      status: 'pending',
      schoolId,
      requestDate: new Date().toISOString(),
      loginMethod: 'all',
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
    console.log(`[ECOSYSTEM] Configurações do terminal ${id} atualizadas:`, settings);
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
  async registerSchool(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>) {
    if (!this.checkAdminAuth()) return false;

    if (!schoolData.managerEmail || !schoolData.managerPassword) {
      console.warn("[VALIDATION] Tentativa de registrar escola sem gestor.");
      return false;
    }

    const newSchool: School = {
      ...schoolData,
      id: `school-${Date.now()}`,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    this.data.schools.push(newSchool);

    // Cria o usuário gestor imediatamente
    if (newSchool.managerEmail) {
      const newUser: User = {
        id: `user-admin-${Date.now()}`,
        name: `Gestor ${newSchool.name}`,
        email: newSchool.managerEmail,
        password: await EcosystemService.hashPassword(newSchool.managerPassword!),
        role: 'admin',
        schoolId: newSchool.id,
        ra: `G-${Date.now().toString().slice(-4)}`,
        points: 0,
        level: 'Semente'
      };
      this.data.users.push(newUser);
      this.usersSubject.next([...this.data.users]);
    }

    this.schoolsSubject.next([...this.data.schools]);
    
    // Sincroniza Escola no Firestore
    setDoc(doc(db, "schools", newSchool.id), newSchool);
    
    // Se criou gestor, sincroniza ele também
    if (newSchool.managerEmail) {
        const adminUser = this.data.users.find(u => u.email === newSchool.managerEmail);
        if (adminUser) setDoc(doc(db, "users", adminUser.ra!), adminUser);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Solicita o registro de uma nova escola.
   */
  requestSchoolRegistration(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>) {
    if (!schoolData.managerEmail || !schoolData.managerPassword) {
      return false;
    }

    const newSchool: School = {
      ...schoolData,
      id: `school-${Date.now()}`,
      status: 'pending',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    this.data.schools.push(newSchool);
    this.schoolsSubject.next([...this.data.schools]);
    
    // Sincroniza no Firestore
    setDoc(doc(db, "schools", newSchool.id), newSchool);
    
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
            password: await EcosystemService.hashPassword(school.managerPassword!),
            role: 'admin',
            schoolId: school.id,
            ra: `G-${Date.now().toString().slice(-4)}`,
            points: 0,
            level: 'Semente'
          };
          this.data.users.push(newUser);
          this.usersSubject.next([...this.data.users]);
        }
      }

      this.schoolsSubject.next([...this.data.schools]);
      
      // Sincroniza Escola no Firestore
      setDoc(doc(db, "schools", id), school);
      
      // Sincroniza novo gestor se criado
      if (status === 'active' && school.managerEmail) {
        const adminUser = this.data.users.find(u => u.email === school.managerEmail);
        if (adminUser) setDoc(doc(db, "users", adminUser.ra!), adminUser);
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
   * Remove uma escola da rede.
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
    const cleanRa = ra.toUpperCase().trim();
    return this.data.userStates[cleanRa] || this.getDefaultState();
  }

  private getDefaultState(): EcosystemUserState {
    return { 
      balance: 5000, 
      vitality: 100, 
      purchasedItems: [], 
      lastMissionDate: null, 
      curso: '', 
      nessiePurchaseDate: undefined 
    };
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
        adminLoginMethod: 'all',
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
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(this.auditLogsSubject.value));
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
    if (this.currentUserRa) {
      const state = this.data.userStates[this.currentUserRa] || this.getDefaultState();
      state.lastMissionDate = today;
      this.data.userStates[this.currentUserRa] = state;
      
      this.syncUserPoints(this.currentUserRa, points, points);
      // O syncUserPoints já salva no Firestore o state atualizado
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
      'coelho': { price: 250, required: 'reparar_grama' },
      'borboletas': { price: 150, required: 'reparar_grama' },
      'borboletas_2': { price: 200, required: 'borboletas' },
      'borboletas_3': { price: 250, required: 'borboletas_2' },
      'casa': { price: 1500, minVitality: 100, required: 'arvore_1' },
      'barco_1': { price: 500, required: 'limpar_rio' },
      'barco_2': { price: 600, required: 'barco_1' },
      'monstro_lago': { price: 5000, required: 'casa' },
    };

    const upgrade = catalog[item];
    if (this.purchasedItems.includes(item)) return false; // Já possui o item
    if (upgrade.minVitality && this.vitality < upgrade.minVitality) return false; // Vitalidade insuficiente

    // Lógica para itens lendários (só podem ser comprados se todos os normais já foram)
    const legendaryItems: EcosystemItem[] = ['casa', 'barco_1', 'barco_2', 'monstro_lago'];
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

    // Lógica especial para Nessie
    if (item === 'monstro_lago') {
      if (!this.isNessieAvailable()) return false;
      
      const state = this.data.userStates[this.currentUserRa] || this.getDefaultState();
      const today = new Date();
      state.nessiePurchaseDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      this.data.userStates[this.currentUserRa] = state;
    }

    // Se comprar a 'casa' (item máximo), ganha um bônus especial de pontos
    if (item === 'casa') {
      pointsAdjust = 5000;
      balanceAdjust += 5000;
    }

    // Sincroniza e salva
    this.syncUserPoints(this.currentUserRa, balanceAdjust, pointsAdjust);
    return true;
  }

  /**
   * Concede pontos a um aluno específico (Usado por Administradores).
   * Registra a ação no log de auditoria.
   */
  async grantPoints(ra: string, points: number, sector: string, action: string, adminName: string, password?: string, terminalSchoolId?: string): Promise<boolean> {
    // 1. Verifica se a senha foi fornecida e é válida (Exigência de Segurança)
    if (password) {
      const isMatch = await this.verifyPassword(password);
      if (!isMatch) {
        console.error('[SECURITY] Senha incorreta para concessão de pontos');
        return false;
      }
    } else {
       console.warn('[SECURITY] Tentativa de concessão de pontos sem verificação de senha');
    }

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
      schoolId: terminalSchoolId || student.schoolId
    };
    this.auditLogsSubject.next([log, ...this.auditLogsSubject.value]);
    
    // Salva no Firestore
    setDoc(doc(db, "auditLogs", log.id), log).catch(err => {
        console.error("[FIREBASE] Erro ao salvar log de auditoria:", err);
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Registra a coleta de um resíduo e atribui pontos ao aluno.
   */
  registerWaste(ra: string, type: WasteType, weightKg: number, terminalSchoolId?: string) {
    const cleanRa = ra.toUpperCase().trim();
    const student = this.data.users.find(u => u.ra?.toUpperCase() === cleanRa);
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

    console.log(`[ECOSYSTEM] Registrando coleta: ${weightKg}kg de ${type} para o aluno ${cleanRa}. Pontos: ${points}`);
    
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
   * Executa o Reset de Ciclo:
   * 1. Gera um snapshot dos dados atuais para o histórico.
   * 2. Zera pontos de todos os alunos.
   * 3. Limpa coletas e logs de auditoria.
   * 4. Limpa estados de ecossistema (opcional, mas recomendado para fresh start).
   */
  async performCycleReset(password: string, schoolId?: string) {
    const isMatch = await this.verifyPassword(password);
    if (!isMatch) {
      console.error('[SECURITY] Senha incorreta para reset de ciclo');
      return false;
    }

    const currentAdmin = this.data.users.find(u => u.ra === this.currentUserRa);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      console.error('[SECURITY] Tentativa de reset de ciclo por usuário não autorizado');
      return false;
    }

    // 1. GERA SNAPSHOT
    const students = this.data.users.filter(u => u.role === 'student' && (!schoolId || u.schoolId === schoolId));
    const relevantWaste = this.data.wasteEntries.filter(w => !schoolId || w.schoolId === schoolId);
    
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

    // 2. SALVA NO HISTÓRICO
    this.data.resetHistory = [snapshot, ...(this.data.resetHistory || [])];
    this.resetHistorySubject.next(this.data.resetHistory);

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
      this.data.auditLogs = this.data.auditLogs.filter(l => schoolId && l.schoolId !== schoolId);
    }

    // Reseta estados de ecossistema (vitalidade e itens)
    Object.keys(this.data.userStates).forEach(ra => {
      const user = this.data.users.find(u => u.ra === ra);
      if (user && (!schoolId || user.schoolId === schoolId)) {
        this.data.userStates[ra] = this.getDefaultState();
      }
    });

    // 4. NOTIFICA E PERSISTE NO FIRESTORE
    this.usersSubject.next([...this.data.users]);
    this.wasteEntriesSubject.next([...this.data.wasteEntries]);
    this.auditLogsSubject.next([...this.data.auditLogs]);
    
    // Salva o snapshot no Firestore
    setDoc(doc(db, "resetHistory", snapshot.id), snapshot);

    // Atualiza todos os usuários resetados no Firestore
    this.data.users.forEach(u => {
        if (u.role === 'student' && (!schoolId || u.schoolId === schoolId)) {
            setDoc(doc(db, "users", u.ra!), u);
        }
    });

    // Limpa estados de ecossistema no Firestore
    Object.keys(this.data.userStates).forEach(ra => {
      const user = this.data.users.find(u => u.ra === ra);
      if (user && (!schoolId || user.schoolId === schoolId)) {
        setDoc(doc(db, "userStates", ra), this.data.userStates[ra]);
      }
    });

    // Se o usuário logado foi resetado, atualiza saldo local
    if (this.currentUserRa) {
      this.syncStateWithUser(this.currentUserRa);
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
    const user = this.data.users.find(u => 
      (u.ra && u.ra.toLowerCase() === cleanId.toLowerCase()) || 
      (u.rfid && u.rfid.toLowerCase() === cleanId.toLowerCase()) || 
      (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
    );

    if (user) {
      // Exige senha apenas para perfis de gestão quando fornecida manualmente
      if (user.role === 'admin' || user.role === 'super_admin') {
        if (cleanPassword) {
          try {
            // Tenta autenticar no Firebase Auth
            await signInWithEmailAndPassword(auth, user.email!, cleanPassword);
          } catch (firebaseError: any) {
            // Se falhar no Firebase, tentamos o fallback local (para facilitar a migração)
            const hashedInput = await EcosystemService.hashPassword(cleanPassword);
            const isMatch = user.password === hashedInput || user.password === cleanPassword;
            
            if (!isMatch) {
              this.handleFailedLogin(securityKey);
              return false;
            }
          }
        }
      }
      
      const ra = user.ra!;
      this.data.currentUserRa = ra;
      this.currentUserRaSubject.next(ra);
      this.syncStateWithUser(ra);
      this.resetSecurityState(securityKey);
      this.saveToStorage();
      return true;
    }

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
      
      this.grantPoints('SECURITY_ALERT', 0, 'SISTEMA', `BLOQUEIO: ${id} após ${security.failedAttempts} falhas`, 'Antigravity Security');
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
      this.syncStateWithUser(cleanRa);
    }
  }


  /**
   * Finaliza a sessão do usuário.
   */
  logout() {
    this.data.currentUserRa = null;
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
  updateUsers(newUsers: User[]) {
    if (!this.checkAdminAuth()) return;
    this.data.users = newUsers;
    this.usersSubject.next([...newUsers]);
    
    // Sincroniza todos no Firestore (pode ser pesado se houver milhares, mas funciona para agora)
    newUsers.forEach(u => setDoc(doc(db, "users", u.ra!), u));
    
    this.saveToStorage();
  }

  updateRewards(newRewards: Reward[]) {
    if (!this.checkAdminAuth()) return;
    this.data.rewards = newRewards;
    this.rewardsSubject.next(newRewards);
    
    // Sincroniza recompensas no Firestore
    newRewards.forEach(r => setDoc(doc(db, "rewards", r.id), r));
    
    this.saveToStorage();
  }

  updateUsers(newUsers: User[]) {
    if (!this.checkAdminAuth()) return;
    this.data.users = newUsers;
    this.usersSubject.next([...newUsers]);
    
    // Sincroniza cada usuário no Firestore
    newUsers.forEach(u => setDoc(doc(db, "users", u.ra!), u));
    this.saveToStorage();
  }

  updateRewards(newRewards: Reward[]) {
    if (!this.checkAdminAuth()) return;
    this.data.rewards = newRewards;
    this.rewardsSubject.next(newRewards);
    
    // Sincroniza prêmios no Firestore
    newRewards.forEach(r => setDoc(doc(db, "rewards", r.id), r));
    this.saveToStorage();
  }

  updateArticles(newArticles: EducationArticle[]) {
    if (!this.checkAdminAuth()) return;
    this.data.articles = newArticles;
    this.articlesSubject.next(newArticles);
    
    // Sincroniza artigos no Firestore
    newArticles.forEach(a => setDoc(doc(db, "articles", a.id), a));
    
    this.saveToStorage();
  }

  updateQuizTopics(newTopics: QuizTopic[]) {
    if (!this.checkAdminAuth()) return;
    this.data.quizTopics = newTopics;
    this.quizTopicsSubject.next(newTopics);
    
    // Salva no Firebase
    newTopics.forEach(topic => {
      setDoc(doc(db, "quizTopics", topic.id), topic);
    });
    
    this.saveToStorage();
  }

  updateParticipants(newParticipants: Participant[]) {
    if (!this.checkAdminAuth()) return;
    this.data.participants = newParticipants;
    this.participantsSubject.next(newParticipants);
    
    // Sincroniza cada participante no Firestore
    newParticipants.forEach(p => {
        setDoc(doc(db, "participants", p.id), p);
    });
    this.saveToStorage();
  }

  updateTurmas(newTurmas: Turma[]) {
    if (!this.checkAdminAuth()) return;
    this.data.turmas = newTurmas;
    this.turmasSubject.next([...newTurmas]);
    
    newTurmas.forEach(t => setDoc(doc(db, "turmas", t.id), t));
    this.saveToStorage();
  }

  updateCursos(newCursos: Curso[]) {
    if (!this.checkAdminAuth()) return;
    this.data.cursos = newCursos;
    this.cursosSubject.next([...newCursos]);
    
    newCursos.forEach(c => setDoc(doc(db, "cursos", c.id), c));
    this.saveToStorage();
  }

  updateCargos(newCargos: Cargo[]) {
    if (!this.checkAdminAuth()) return;
    this.data.cargos = newCargos;
    this.cargosSubject.next([...newCargos]);
    
    newCargos.forEach(c => setDoc(doc(db, "cargos", c.id), c));
    this.saveToStorage();
  }

  updateSetores(newSetores: SetorEscolar[]) {
    if (!this.checkAdminAuth()) return;
    this.data.setores = newSetores;
    this.setoresSubject.next([...newSetores]);
    
    newSetores.forEach(s => setDoc(doc(db, "setores", s.id), s));
    this.saveToStorage();
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
      
      // Sincroniza no Firestore
      setDoc(doc(db, "users", ra), user);
      
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
    
    // Sincroniza no Firestore
    setDoc(doc(db, "users", ra), user);
    
    this.saveToStorage();
    return true;
  }

  /**
   * Verifica se a senha fornecida pertence ao usuário atualmente logado.
   */
  async verifyPassword(password: string): Promise<boolean> {
    const ra = this.currentUserRaSubject.value;
    if (!ra) return false;
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

  private notifyAll() {
    this.usersSubject.next([...this.data.users]);
    this.wasteEntriesSubject.next([...(this.data.wasteEntries || [])]);
    this.auditLogsSubject.next([...(this.data.auditLogs || [])]);
    this.schoolsSubject.next([...(this.data.schools || [])]);
    this.terminalsSubject.next([...(this.data.terminals || [])]);
    this.rewardsSubject.next([...(this.data.rewards || [])]);
    this.articlesSubject.next([...(this.data.articles || [])]);
    this.systemSettingsSubject.next({...this.data.systemSettings});
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
  private deduplicateByName<T extends { id: string; name: string }>(items: T[]): T[] {
    const unique = new Map<string, T>();
    items.forEach(item => {
      // Se não tem o ID e não tem nenhum item com o mesmo nome
      if (!unique.has(item.id) && !Array.from(unique.values()).some(existing => existing.name === item.name)) {
        unique.set(item.id, item);
      }
    });
    return Array.from(unique.values());
  }

  /**
   * Realiza a limpeza de dados (Sanitization).
   * Garante que o sistema não tenha duplicidades ou dados órfãos.
   */
  sanitizeData() {
    // 1. Limpeza de Entidades Estruturais
    this.data.turmas = this.deduplicateByName(this.data.turmas || []);
    this.data.cursos = this.deduplicateByName(this.data.cursos || []);
    this.data.cargos = this.deduplicateByName(this.data.cargos || []);
    this.data.setores = this.deduplicateByName(this.data.setores || []);
    
    if (!this.data.terminals) this.data.terminals = [];
    if (!this.data.schools) this.data.schools = [];
    if (!this.data.articles) this.data.articles = [];
    if (!this.data.rewards) this.data.rewards = [];
    if (!this.data.participants) this.data.participants = [];
    if (!this.data.quizTopics) this.data.quizTopics = QUIZ_TOPICS_MOCK;

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

    // GARANTE QUE CADA ESCOLA TENHA SEU GESTOR NO SISTEMA
    this.data.schools.forEach(school => {
      if (school.status === 'active' && school.managerEmail) {
        const gestorExists = this.data.users.some(u => u.email?.toLowerCase() === school.managerEmail?.toLowerCase());
        if (!gestorExists) {
          const newUser: User = {
            id: `user-admin-${school.id}`,
            name: `Gestor ${school.name}`,
            email: school.managerEmail,
            password: ADMIN_MOCK.password,
            role: 'admin',
            schoolId: school.id,
            ra: `G-${school.id.split('-')[1] || Date.now().toString().slice(-4)}`,
            points: 0,
            level: 'Semente'
          };
          this.data.users.push(newUser);
        }
      }
    });

    this.data.users = this.data.users.map(u => {
      // Garante que não-alunos tenham 0 pontos no ranking
      if (u.role !== 'student' && u.role !== 'visitor') u.points = 0;
      return u;
    });

    // 4. Configurações de Sistema
    if (!this.data.systemSettings) {
      this.data.systemSettings = {
        studentLoginMethod: 'all',
        adminLoginMethod: 'all',
        terminalId: 'TOTEM-01'
      };
    }

    this.saveToStorage();
    this.notifyAll();
  }
}
