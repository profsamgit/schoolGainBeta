import { BehaviorSubject } from 'rxjs';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Modelos de Dados e Estruturas de Mock
import { ADMIN_MOCK } from './data';
import type { 
  User, 
  Reward, 
  EducationArticle, 
  Participant, 
  School, 
  Turma, 
  Curso, 
  Cargo, 
  SetorEscolar, 
  Terminal, 
  QuizTopic, 
  EcosystemData, 
  EcosystemUserState, 
  BehaviorTelemetryEntry, 
  SystemSettings, 
  RegistrationRequest, 
  CycleSnapshot, 
  EcosystemLegend,
  EcosystemItem,
  UserLevel,
  WasteType,
  TerminalStatus,
  AuditLogEntry,
  WasteEntry
} from './types';

// Importações dos Sub-Serviços Modulares (Facade Pattern)
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { SchoolService } from './services/school.service';
import { TerminalService } from './services/terminal.service';
import { PointsService } from './services/points.service';
import { WasteService } from './services/waste.service';
import { PedagogicalService } from './services/pedagogical.service';
import { RegistrationService } from './services/registration.service';

const STORAGE_BASE = 'schoolgain_eco';
const STORAGE_KEY = 'schoolgain_ecosystem_data';
const AUDIT_LOGS_KEY = `${STORAGE_BASE}_audit_logs`;

export class EcosystemService {

  // Instâncias dos Sub-Serviços Modulares
  private authService = new AuthService(this);
  private userService = new UserService(this);
  private schoolService = new SchoolService(this);
  private terminalService = new TerminalService(this);
  private pointsService = new PointsService(this);
  private wasteService = new WasteService(this);
  private pedagogicalService = new PedagogicalService(this);
  private registrationService = new RegistrationService(this);

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
   */
  public checkAdminAuth(): boolean {
    return this.authService.checkAdminAuth();
  }

  // Dados iniciais e estrutura de armazenamento
  public data: EcosystemData = {
    users: [ADMIN_MOCK],
    students: [],
    admins: [],
    staff: [],
    superAdmins: [],
    visitors: [],
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

  // BehaviorSubjects (RxJS) para Reatividade no Frontend
  public balanceSubject = new BehaviorSubject<number>(0);
  public pointsSubject = new BehaviorSubject<number>(0);
  public vitalitySubject = new BehaviorSubject<number>(100);
  public vitalityActivatedSubject = new BehaviorSubject<boolean>(false);
  public currentUserRaSubject = new BehaviorSubject<string | null>(null);
  public currentUserIdSubject = new BehaviorSubject<string | null>(null);
  private activeSyncIds = new Set<string>();

  public usersSubject = new BehaviorSubject<User[]>([ADMIN_MOCK]);
  public studentsSubject = new BehaviorSubject<User[]>([]);
  public adminsSubject = new BehaviorSubject<User[]>([]);
  public staffSubject = new BehaviorSubject<User[]>([]);
  public superAdminsSubject = new BehaviorSubject<User[]>([]);
  public visitorsSubject = new BehaviorSubject<User[]>([]);
  public rewardsSubject = new BehaviorSubject<Reward[]>([]);
  public articlesSubject = new BehaviorSubject<EducationArticle[]>([]);
  public quizTopicsSubject = new BehaviorSubject<QuizTopic[]>([]);
  public participantsSubject = new BehaviorSubject<Participant[]>([]);
  public purchasedItemsSubject = new BehaviorSubject<EcosystemItem[]>([]);
  public terminalsSubject = new BehaviorSubject<Terminal[]>([]);
  public schoolsSubject = new BehaviorSubject<School[]>([]);
  public lastMissionDateSubject = new BehaviorSubject<string | null>(null);
  public turmasSubject = new BehaviorSubject<Turma[]>([]);
  public cursosSubject = new BehaviorSubject<Curso[]>([]);
  public cargosSubject = new BehaviorSubject<Cargo[]>([]);
  public setoresSubject = new BehaviorSubject<SetorEscolar[]>([]);
  public auditLogsSubject = new BehaviorSubject<AuditLogEntry[]>([]);
  public levelSubject = new BehaviorSubject<UserLevel>('Semente');
  public registrationRequestsSubject = new BehaviorSubject<RegistrationRequest[]>([]);
  public userStatesSubject = new BehaviorSubject<Record<string, EcosystemUserState>>({}); // Estado de cada aluno indexado pelo ID

  public systemSettingsSubject = new BehaviorSubject<SystemSettings>({
    studentLoginMethod: 'all',
    adminLoginMethod: 'all',
    studentCaptureSource: 'browser',
    adminCaptureSource: 'browser',
    studentCaptureDevice: '',
    adminCaptureDevice: '',
    studentCaptureUrl: '',
    adminCaptureUrl: ''
  });
  public pendingLoginSubject = new BehaviorSubject<{ ra: string, terminalId: string } | null>(null);
  public wasteEntriesSubject = new BehaviorSubject<WasteEntry[]>([]);
  public resetHistorySubject = new BehaviorSubject<CycleSnapshot[]>([]);
  public kioskUserRaSubject = new BehaviorSubject<string | null>(null);
  public legendsSubject = new BehaviorSubject<EcosystemLegend[]>([]);

  private usersByRole: Record<string, User[]> = {
    students: [],
    admins: [],
    super_admins: [],
    visitors: []
  };
  private syncedCollections = new Set<string>();
  private hasRunFirestoreSanitize = false;

  constructor() {
    // Inicializa os canais com os dados iniciais
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
    this.wasteEntriesSubject.next(this.data.wasteEntries || []);
    this.registrationRequestsSubject.next(this.data.registrationRequests || []);
    this.resetHistorySubject.next(this.data.resetHistory || []);

    this.loadFromStorage();
    this.initFirebaseSync();
    this.initFirebaseAuthListener();
  }

  /**
   * Conecta aos canais do Firestore para atualizações em tempo real.
   */
  private initFirebaseSync() {
    if (typeof window === 'undefined') return;

    // 1. Sincronização de Usuários por Coleções Dedicadas
    const collectionsToSync = [
      { name: 'students', subject: this.studentsSubject, dataKey: 'students' },
      { name: 'admins', subject: this.adminsSubject, dataKey: 'admins' },
      { name: 'staff', subject: this.staffSubject, dataKey: 'staff' },
      { name: 'super_admins', subject: this.superAdminsSubject, dataKey: 'superAdmins' },
      { name: 'visitors', subject: this.visitorsSubject, dataKey: 'visitors' }
    ];

    collectionsToSync.forEach(col => {
      onSnapshot(query(collection(db, col.name), limit(1000)), (snapshot) => {
        const users: User[] = [];
        snapshot.forEach(docSnap => {
          const u = docSnap.data() as User;
          u.id = docSnap.id;
          users.push(u);
        });

        this.usersByRole[col.name] = users;
        this.syncedCollections.add(col.name);
        this.syncCombinedUsers(snapshot.metadata.fromCache);
      });
    });

    // 2. MIGRADOR DE LEGADO: Move usuários da coleção 'users' para suas novas coleções
    onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) return;
      
      snapshot.forEach(async (docSnap) => {
        const u = docSnap.data() as User;
        const userId = docSnap.id;
        const targetCollection = this.getUserCollection(u.role || 'student');
        
        try {
          await setDoc(doc(db, targetCollection, userId), { ...u, id: userId });
          await deleteDoc(doc(db, "users", userId));
        } catch (err) {
          console.error("[MIGRATION] Erro ao migrar usuário:", userId, err);
        }
      });
    });

    // 3. Sincronização de Recompensas
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

    // 4. Sincronização de Artigos
    onSnapshot(collection(db, "articles"), (snapshot) => {
      const articles: EducationArticle[] = [];
      snapshot.forEach(doc => articles.push(doc.data() as EducationArticle));
      if (articles.length > 0) {
        this.data.articles = articles;
        this.articlesSubject.next(articles);
      }
    });

    // 5. Sincronização de Participantes
    onSnapshot(collection(db, "participants"), (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach(doc => participants.push(doc.data() as Participant));
      if (participants.length > 0) {
        this.data.participants = participants;
        this.participantsSubject.next(participants);
      }
    });

    // 6. Configurações por Unidade
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
          setDoc(doc(db, "settings", settingsId), this.data.systemSettings);
        }
      });
    } else {
      this.systemSettingsSubject.next(this.data.systemSettings);
    }

    // 7. Sincronização de Tópicos de Quiz
    onSnapshot(collection(db, "quizTopics"), (snapshot) => {
      const topics: QuizTopic[] = [];
      snapshot.forEach(doc => topics.push(doc.data() as QuizTopic));
      if (topics.length > 0) {
        this.data.quizTopics = topics;
        this.quizTopicsSubject.next(topics);
      }
    });

    // 8. Sincronização de Escolas
    onSnapshot(collection(db, "schools"), (snapshot) => {
      const schools: School[] = [];
      snapshot.forEach(doc => schools.push(doc.data() as School));
      this.data.schools = schools;
      this.schoolsSubject.next(schools);
    });

    // 9. Sincronização de Terminais
    onSnapshot(collection(db, "terminals"), (snapshot) => {
      const terminals: Terminal[] = [];
      snapshot.forEach(doc => terminals.push(doc.data() as Terminal));
      this.data.terminals = terminals;
      this.terminalsSubject.next(terminals);
    });

    // 10. Sincronização de Dados Pedagógicos
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

    // 11. Sincronização de Métricas
    onSnapshot(query(collection(db, "wasteEntries"), orderBy("date", "desc"), limit(200)), (snapshot) => {
      const entries: WasteEntry[] = [];
      snapshot.forEach(doc => entries.push(doc.data() as WasteEntry));
      this.data.wasteEntries = entries;
      this.wasteEntriesSubject.next(entries);
    });
    onSnapshot(query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(200)), (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach(doc => logs.push(doc.data() as AuditLogEntry));
      this.data.auditLogs = logs;
      this.auditLogsSubject.next(logs);
    });
    onSnapshot(query(collection(db, "resetHistory"), orderBy("endDate", "desc"), limit(50)), (snapshot) => {
      const history: CycleSnapshot[] = [];
      snapshot.forEach(doc => history.push(doc.data() as CycleSnapshot));
      this.data.resetHistory = history;
      this.resetHistorySubject.next(history);
    });

    if (this.data.currentUserId) {
      this.initUserSpecificSync(this.data.currentUserId);
      const user = this.data.users.find(u => u.id === this.data.currentUserId);
      if (user && (user.role === 'admin' || user.role === 'super_admin') && user.schoolId) {
         this.initAdminSync(user.schoolId);
      }
    }

    // 12. Sincronização de Solicitações de Cadastro
    onSnapshot(query(collection(db, "registrationRequests"), orderBy("createdAt", "desc"), limit(100)), (snapshot) => {
      const requests: RegistrationRequest[] = [];
      snapshot.forEach(doc => requests.push(doc.data() as RegistrationRequest));
      this.data.registrationRequests = requests;
      this.registrationRequestsSubject.next(requests);
    });

    // 13. Sincronização de Lendas
    onSnapshot(collection(db, "ecosystemLegends"), (snapshot) => {
      const legends: EcosystemLegend[] = [];
      snapshot.forEach(doc => legends.push(doc.data() as EcosystemLegend));
      this.legendsSubject.next(legends);
      if (this.data.currentUserId) {
        this.syncStateWithUser(this.data.currentUserId);
      }
    });
  }

  public initUserSpecificSync(userId: string) {
    if (this.activeSyncIds.has(userId)) return;
    this.activeSyncIds.add(userId);

    onSnapshot(doc(db, "userStates", userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as EcosystemUserState;
        const docId = docSnap.id;
        const student = this.data.users.find(u => u.id === docId || u.ra === docId);
        
        const finalId = student?.id || docId;
        const normalizedState = {
          ...data,
          id: finalId
        };

        this.data.userStates[finalId] = normalizedState;
        this.userStatesSubject.next({ ...this.data.userStates });
        this.syncStateWithUser(finalId);
      }
    });
  }

  public initAdminSync(schoolId: string) {
    if (!schoolId || this.activeSyncIds.has(`admin-${schoolId}`)) return;
    this.activeSyncIds.add(`admin-${schoolId}`);

    onSnapshot(query(collection(db, "userStates"), where("schoolId", "==", schoolId)), (snapshot) => {
      const currentStates = { ...this.data.userStates };
      let hasChanges = false;

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as EcosystemUserState;
        const docId = change.doc.id;
        if (docId === this.data.currentUserId) return;

        currentStates[docId] = { ...data, id: docId };
        hasChanges = true;
      });

      if (hasChanges) {
        this.data.userStates = currentStates;
        this.userStatesSubject.next({ ...currentStates });
      }
    });
  }

  private initFirebaseAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = this.data.users.find(u => u.email?.toLowerCase() === firebaseUser.email?.toLowerCase());
        if (user && user.role === 'super_admin') {
          this.data.currentUserRa = user.ra || null;
          this.data.currentUserId = user.id;
          this.currentUserRaSubject.next(user.ra || null);
          this.currentUserIdSubject.next(user.id);
          this.initUserSpecificSync(user.id);
          this.initAdminSync(user.schoolId || 'global');
          this.saveToStorage();
        }
      }
    });
  }

  /**
   * Mescla os usuários lidos de todas as coleções em uma única lista centralizada.
   */
  public syncCombinedUsers(isCacheUpdate = false) {
    const allUsersMap = new Map<string, User>();
    allUsersMap.set(ADMIN_MOCK.id, ADMIN_MOCK);

    Object.values(this.usersByRole).forEach(usersList => {
      usersList.forEach(u => {
        if (u.id) allUsersMap.set(u.id, u);
      });
    });

    const combinedList = Array.from(allUsersMap.values());
    this.data.users = combinedList;
    this.usersSubject.next(combinedList);

    // Se carregou tudo e não rodou a sanitização inicial ainda
    const targetCollectionsCount = 5;
    if (this.syncedCollections.size >= targetCollectionsCount && !this.hasRunFirestoreSanitize && !isCacheUpdate) {
      this.hasRunFirestoreSanitize = true;
      this.sanitizeData();
    }

    if (this.data.currentUserId) {
      this.syncStateWithUser(this.data.currentUserId);
    }
  }

  /**
   * Sincroniza o estado de pontuação, moedas e itens de um usuário com as variáveis reativas.
   */
  public syncStateWithUser(userId: string): EcosystemUserState {
    const user = this.data.users.find(u => u.id === userId || u.ra === userId);
    const userState = this.data.userStates[user?.id || userId] || this.getDefaultState(user);

    this.pointsService.recalculatePointsValidity(user?.id || userId);

    if (user?.id === this.data.currentUserId || user?.ra === this.data.currentUserRa) {
      this.balanceSubject.next(userState.balance);
      this.pointsSubject.next(userState.points);
      this.vitalitySubject.next(userState.vitality !== undefined ? userState.vitality : 100);
      this.vitalityActivatedSubject.next(userState.vitalityActivated ?? false);
      this.purchasedItemsSubject.next(userState.purchasedItems);
      this.lastMissionDateSubject.next(userState.lastMissionDate);
      this.levelSubject.next(userState.level || 'Semente');
    }

    return { ...userState, level: userState.level || 'Semente' };
  }

  // Getters para acessar os dados atuais reativos
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
  get registrationRequests() { return this.registrationRequestsSubject.value; }
  get currentUserRa() { return this.data.currentUserRa; }
  get currentUserId() { return this.data.currentUserId; }
  get balance() { return this.balanceSubject.value; }
  get points() { return this.pointsSubject.value; }
  get vitality() { return this.vitalitySubject.value; }
  public get vitalityActivated() { return this.vitalityActivatedSubject.value; }
  get purchasedItems() { return this.purchasedItemsSubject.value; }
  get level() { return this.levelSubject.value; }
  get systemSettings() { return this.systemSettingsSubject.value; }
  get legends() { return this.legendsSubject.value; }

  get hardwareId(): string {
    if (typeof window === 'undefined') return 'SG-VIRTUAL-HW';
    if (this._hardwareId) return this._hardwareId;
    let localId = localStorage.getItem('sg_hardware_id');
    if (!localId) {
      const chars = '0123456789ABCDEF';
      let unique = '';
      for (let i = 0; i < 8; i++) {
        unique += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      localId = `SG-HW-${unique}`;
      localStorage.setItem('sg_hardware_id', localId);
    }
    this._hardwareId = localId;
    return localId;
  }

  // Fachada (Facade): Delegação de Métodos para Sub-Serviços Modulares
  
  // 1. Autenticação (AuthService)
  async login(id: string, password?: string) {
    return this.authService.login(id, password);
  }
  logout() {
    this.authService.logout();
  }
  async verifyPassword(password: string) {
    return this.authService.verifyPassword(password);
  }
  getLockoutStatus(id: string) {
    return this.authService.getLockoutStatus(id);
  }

  // 2. Gestão de Usuários (UserService)
  getUserCollection(role: string) {
    return this.userService.getUserCollection(role);
  }
  sanitizeUserForFirestore(user: User) {
    return this.userService.sanitizeUserForFirestore(user);
  }
  async updateUsers(newUsers: User[], targetSchoolId?: string) {
    return this.userService.updateUsers(newUsers, targetSchoolId);
  }
  async deleteUser(userId: string) {
    return this.userService.deleteUser(userId);
  }
  async updateUserStatus(userId: string, status: 'active' | 'inactive') {
    return this.userService.updateUserStatus(userId, status);
  }

  // 3. Multi-Tenant e Escolas (SchoolService)
  async registerSchool(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string) {
    return this.schoolService.registerSchool(schoolData, initialPassword);
  }
  async updateSchoolStatus(id: string, status: 'active' | 'pending' | 'inactive' | 'suspended', initialPassword?: string) {
    return this.schoolService.updateSchoolStatus(id, status, initialPassword);
  }
  updateSchools(newSchools: School[]) {
    this.schoolService.updateSchools(newSchools);
  }
  async deleteSchool(id: string, password?: string) {
    return this.schoolService.deleteSchool(id, password);
  }

  // 4. Terminais e Totens (TerminalService)
  requestTerminalAuthorization(terminalId: string, hardwareId: string, location: string, schoolId: string) {
    return this.terminalService.requestTerminalAuthorization(terminalId, hardwareId, location, schoolId);
  }
  updateTerminalStatus(id: string, status: TerminalStatus, schoolId?: string) {
    this.terminalService.updateTerminalStatus(id, status, schoolId);
  }
  updateTerminalSettings(id: string, settings: Partial<Terminal>) {
    this.terminalService.updateTerminalSettings(id, settings);
  }
  deleteTerminal(id: string) {
    this.terminalService.deleteTerminal(id);
  }
  triggerHardwareLogin(ra: string, registeredId: string) {
    this.terminalService.triggerHardwareLogin(ra, registeredId);
  }
  generateTerminalId() {
    return this.terminalService.generateTerminalId();
  }

  // 5. Gamificação e Pontos (PointsService)
  syncUserPoints(identifier: string, currentBalanceChange: number, lifetimePointsGain: number, description?: string) {
    this.pointsService.syncUserPoints(identifier, currentBalanceChange, lifetimePointsGain, description);
  }
  recalculatePointsValidity(userId: string) {
    this.pointsService.recalculatePointsValidity(userId);
  }
  addPoints(points: number, studentRa?: string, description?: string) {
    this.pointsService.addPoints(points, studentRa, description);
  }
  grantSightingBonus(ra: string) {
    return this.pointsService.grantSightingBonus(ra);
  }
  async grantPoints(ra: string, points: number, sector: string, action: string, adminName: string, password?: string, terminalSchoolId?: string) {
    return this.pointsService.grantPoints(ra, points, sector, action, adminName, password, terminalSchoolId);
  }
  calculateLevel(score: number, purchasedItems?: EcosystemItem[]) {
    return this.pointsService.calculateLevel(score, purchasedItems);
  }

  // 6. Reciclagem e Resíduos (WasteService)
  registerWaste(ra: string, type: WasteType, weightKg: number, terminalSchoolId?: string) {
    return this.wasteService.registerWaste(ra, type, weightKg, terminalSchoolId);
  }
  async performCycleReset(password: string, schoolId?: string) {
    return this.wasteService.performCycleReset(password, schoolId);
  }

  // 7. Artigos, Quizzes e Resgates (PedagogicalService)
  async recordArticleRead(articleId: string) {
    return this.pedagogicalService.recordArticleRead(articleId);
  }
  async recordQuizCompletion(topicId: string, score: number, difficulty?: string, numQuestions?: number) {
    return this.pedagogicalService.recordQuizCompletion(topicId, score, difficulty, numQuestions);
  }
  async recordRewardRedemption(rewardId: string) {
    return this.pedagogicalService.recordRewardRedemption(rewardId);
  }
  isNessieAvailable() {
    return this.pedagogicalService.isNessieAvailable();
  }
  getMonthlyLegends(targetSchoolId?: string) {
    return this.pedagogicalService.getMonthlyLegends(targetSchoolId);
  }

  // 8. Aprovação de Cadastro (RegistrationService)
  async requestRegistration(data: Omit<RegistrationRequest, 'id' | 'status' | 'createdAt'>) {
    return this.registrationService.requestRegistration(data);
  }
  async approveRegistration(requestId: string) {
    return this.registrationService.approveRegistration(requestId);
  }
  async rejectRegistration(requestId: string) {
    return this.registrationService.rejectRegistration(requestId);
  }

  /**
   * Retorna as configurações iniciais de estado para um novo usuário.
   */
  public getDefaultState(user?: User): EcosystemUserState {
    return {
      id: user?.id || 'visitor-fix',
      points: 0,
      balance: 0,
      vitality: 0, 
      vitalityActivated: false,
      purchasedItems: [],
      itemsCount: 0,
      level: 'Semente',
      schoolId: user?.schoolId || 'global',
      pointTransactions: [],
      curso: user?.curso || null,
      lastMissionDate: null,
      readArticles: []
    };
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
    setDoc(doc(db, this.getUserCollection(user.role), user.id), this.sanitizeUserForFirestore(user));

    this.saveToStorage();
    return true;
  }

  public static calculateTotalScore(points: number, vitality: number, itemsCount: number): number {
    return Math.floor(points + (itemsCount * 250) + vitality);
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
   * Persiste as preferências de telemetria no log de auditoria.
   */
  async logTelemetry(entry: Omit<BehaviorTelemetryEntry, 'id' | 'timestamp'>) {
    if (typeof window === 'undefined') return;

    const currentUserId = this.data.currentUserId || 'system';
    const currentUser = this.data.users.find(u => u.id === currentUserId);

    const log: AuditLogEntry = {
      ...entry,
      id: EcosystemService.generateStandardId('log', entry.unitId || 'MASTER'),
      timestamp: new Date().toISOString(),
      actorId: entry.actorId || currentUserId,
      actorName: entry.actorName || currentUser?.name || 'Sistema'
    };


    this.data.auditLogs = [log, ...(this.data.auditLogs || [])].slice(0, 100);
    this.auditLogsSubject.next([...this.data.auditLogs]);

    try {
      await setDoc(doc(db, "auditLogs", log.id), log);
    } catch (e) {
      console.error("[TELEMETRY] Falha ao enviar telemetria:", e);
    }

    this.saveToStorage();
  }

  // Métodos de Persistência Local (LocalStorage Fallback)
  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...this.data,
        securityState: this.data.securityState || {}
      }));
    } catch (e) {
      console.error("[STORAGE] Falha ao persistir dados locais:", e);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.resetVersion === this.data.resetVersion) {
          this.data = {
            ...this.data,
            ...parsed,
            users: parsed.users || [ADMIN_MOCK],
            userStates: parsed.userStates || {},
            securityState: parsed.securityState || {},
            systemSettings: parsed.systemSettings || this.data.systemSettings
          };
        }
      }
    } catch (e) {
      console.error("[STORAGE] Erro ao carregar dados locais:", e);
    }
  }

  /**
   * Realiza a limpeza de dados (Sanitization).
   */
  async sanitizeData() {
    try {
      const globalSettingsSnap = await getDoc(doc(db, "settings", "global"));
      if (globalSettingsSnap.exists()) {
        const globalData = globalSettingsSnap.data();
        const schools = this.data.schools;
        await Promise.all(schools.map(async (school) => {
          const schoolSettingsRef = doc(db, "settings", school.id);
          const schoolSettingsSnap = await getDoc(schoolSettingsRef);
          
          if (schoolSettingsSnap.exists()) {
            await setDoc(schoolSettingsRef, { ...globalData, ...schoolSettingsSnap.data() }, { merge: true });
          } else {
            await setDoc(schoolSettingsRef, globalData);
          }
        }));
        await deleteDoc(doc(db, "settings", "global"));
      }
    } catch (err) {
      console.error("[MIGRAÇÃO] Erro ao unificar configurações:", err);
    }

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

    const normalize = (items: any[]) => {
      if (!items) return [];
      return items.map(item => {
        if (!item.schoolId) item.schoolId = 'orphan-fix';
        return item;
      });
    };

    this.data.rewards = normalize(this.data.rewards);
    this.data.articles = normalize(this.data.articles);
    this.data.turmas = normalize(this.data.turmas);
    this.data.cursos = normalize(this.data.cursos);
    this.data.cargos = normalize(this.data.cargos);
    this.data.setores = normalize(this.data.setores);

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
            status: 'active'
          };
          this.data.users.push(newUser);
        }
      }
    });

    this.data.users = this.data.users.map(u => {
      if (u.name) u.name = u.name.toUpperCase().trim();
      if (u.ra) u.ra = u.ra.toUpperCase().trim();
      if (u.turma) u.turma = u.turma.toUpperCase().trim();
      if (u.curso) u.curso = u.curso.toUpperCase().trim();
      if (u.role) u.role = u.role.toLowerCase() as any;
      if (!u.status) u.status = 'active';
      return u;
    });

    // Migração de Identificadores não-padronizados (ex: RA bruto '74509512007')
    try {
      const nonStandardUsers = this.data.users.filter(u => 
        u.id && 
        !u.id.startsWith('user-') && 
        !u.id.startsWith('admin-') && 
        !u.id.startsWith('super-') && 
        !u.id.startsWith('staff-') && 
        !u.id.startsWith('visitor-')
      );

      if (nonStandardUsers.length > 0) {
        for (const u of nonStandardUsers) {
          const oldId = u.id;
          const role = u.role || 'student';
          const prefix = role === 'super_admin' ? 'super' : 
                         role === 'admin' ? 'admin' : 
                         role === 'staff' ? 'staff' : 
                         role === 'visitor' ? 'visitor' : 'user-student';
          
          const newId = EcosystemService.generateStandardId(prefix as any, u.schoolId || 'orphan-fix');
          const targetCollection = this.getUserCollection(role);
          const updatedUser = { ...u, id: newId };

          await setDoc(doc(db, targetCollection, newId), this.sanitizeUserForFirestore(updatedUser));
          
          const oldStateSnap = await getDoc(doc(db, "userStates", oldId));
          if (oldStateSnap.exists()) {
            const oldState = oldStateSnap.data();
            await setDoc(doc(db, "userStates", newId), { ...oldState, id: newId });
            await deleteDoc(doc(db, "userStates", oldId));
          } else {
            await setDoc(doc(db, "userStates", newId), this.getDefaultState(updatedUser));
          }

          await deleteDoc(doc(db, targetCollection, oldId));
          
          this.data.users = this.data.users.map(user => user.id === oldId ? updatedUser : user);
          if (this.data.userStates[oldId]) {
            this.data.userStates[newId] = { ...this.data.userStates[oldId], id: newId };
            delete this.data.userStates[oldId];
          }

          if (this.data.currentUserId === oldId) {
            this.data.currentUserId = newId;
            this.currentUserIdSubject.next(newId);
          }

          await this.logTelemetry({
            action: 'USER_ID_MIGRATED',
            category: 'AUTH',
            details: `ID de usuário migrado do RA legado ${oldId} para o padrão ${newId}`,
            unitId: u.schoolId || 'MASTER'
          });
        }
      }
    } catch (err) {
      console.error("[MIGRATION] Erro ao migrar IDs não-padronizados:", err);
    }

    if (!this.data.systemSettings) {
      this.data.systemSettings = {
        studentLoginMethod: 'all',
        adminLoginMethod: 'all'
      };
    }

    this.saveToStorage();
    this.notifyAll();
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

  private deduplicateByName<T extends { id: string; name: string; schoolId?: string }>(items: T[]): T[] {
    const unique = new Map<string, T>();
    items.forEach(item => {
      const key = `${item.id}-${item.schoolId || 'MASTER'}`;
      unique.set(key, item);
    });
    return Array.from(unique.values());
  }

  /**
   * Utilitário global para criação de IDs únicos.
   */
  public static generateStandardId(
    prefix: 'user-student' | 'admin' | 'super' | 'staff' | 'visitor' | 'school' | 'totem' | 'rw' | 'ctd' | 'trm' | 'cur' | 'crg' | 'str' | 'log' | 'wst' | 'wst-gn' | 'wst-db' | 'wst-exp' | 'qz',
    schoolId?: string,
    additional?: { name?: string; city?: string }
  ): string {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    if (prefix === 'school') {
      const cleanName = (additional?.name || 'sch')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 8)
        .toUpperCase();

      const cleanCity = (additional?.city || 'city')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 3)
        .toUpperCase();

      return `school-${cleanName}-${cleanCity}-${random}`;
    }

    if (prefix === 'user-student' || prefix === 'admin' || prefix === 'super' || prefix === 'staff' || prefix === 'visitor') {
      const initials = (additional?.name || 'std')
        .split(' ')
        .map(n => n.charAt(0))
        .join('')
        .toLowerCase()
        .substring(0, 3)
        .toUpperCase();

      const cleanSchoolId = !schoolId || schoolId === 'MASTER' ? 'MASTER' : schoolId.replace('school-', '');
      const initialsBlock = initials ? `${initials}-` : '';

      return `${prefix}-${cleanSchoolId}-${initialsBlock}${random}`;
    }

    const cleanSchoolId = !schoolId || schoolId === 'MASTER' ? 'MASTER' : schoolId.replace('school-', '');
    return `${prefix}-${cleanSchoolId}-${random}`;
  }

  // Points & Vitality Facades (PointsService)
  completeDailyMission(points: number) {
    return this.pointsService.completeDailyMission(points);
  }
  deductPoints(points: number) {
    return this.pointsService.deductPoints(points);
  }
  healVitality(points: number) {
    return this.pointsService.healVitality(points);
  }
  registerAttendance(status: 'presente' | 'falta') {
    this.pointsService.registerAttendance(status);
  }
  getGlobalLeader() {
    return this.pointsService.getGlobalLeader();
  }

  // Shop & Upgrades (PedagogicalService)
  buyUpgrade(item: EcosystemItem) {
    return this.pedagogicalService.buyUpgrade(item);
  }

  // School, Turmas, Cursos (SchoolService)
  updateTurmas(newTurmas: Turma[], sid?: string) {
    return this.schoolService.updateTurmas(newTurmas, sid);
  }
  updateCursos(newCursos: Curso[], sid?: string) {
    return this.schoolService.updateCursos(newCursos, sid);
  }
  updateCargos(newCargos: Cargo[], sid?: string) {
    return this.schoolService.updateCargos(newCargos, sid);
  }
  updateSetores(newSetores: SetorEscolar[], sid?: string) {
    return this.schoolService.updateSetores(newSetores, sid);
  }

  // CRUD & Users (UserService)
  updateParticipants(newParticipants: Participant[]) {
    this.userService.updateParticipants(newParticipants);
  }

  // Pedagogical CRUD (PedagogicalService)
  updateRewards(newRewards: Reward[], sid?: string) {
    return this.pedagogicalService.updateRewards(newRewards, sid);
  }
  updateArticles(newArticles: EducationArticle[], sid?: string) {
    return this.pedagogicalService.updateArticles(newArticles, sid);
  }
  updateQuizTopics(newTopics: QuizTopic[], sid?: string) {
    return this.pedagogicalService.updateQuizTopics(newTopics, sid);
  }
  deleteReward(id: string, sid?: string) {
    return this.pedagogicalService.deleteReward(id, sid);
  }
  deleteArticle(id: string, sid?: string) {
    return this.pedagogicalService.deleteArticle(id, sid);
  }
  deleteQuizTopic(id: string, sid?: string) {
    return this.pedagogicalService.deleteQuizTopic(id, sid);
  }
}
