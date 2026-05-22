import { BehaviorSubject } from 'rxjs';
import { db, auth, storage } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
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
} from '@/types/ecosystem';

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

  public static isCheckingPassword = false;

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

  /**
   * verifyUniversalPassword: Sistema de Autenticação Multi-Camada
   *
   * Verifica se uma senha é válida através de 3 níveis, na ordem:
   *   1. Senha do usuário atual (hash SHA-256 ou texto puro legado)
   *   2. Senha de qualquer Super Admin (serve como chave mestra do sistema)
   *   3. Firebase Authentication (fallback para Super Admins sem senha local definida)
   * Essa abordagem permite que gestores e super admins usem a mesma senha para
   * confirmar ações críticas sem precisar de um campo separado.
   */
  static async verifyUniversalPassword(password: string, currentUser: User | null, allUsers: User[]): Promise<boolean> {
    if (!password || !currentUser) return false;
    const providedHash = await this.hashPassword(password);

    // 1. Verifica se é a senha do usuário atual (Local Hash ou Plaintext)
    if (currentUser.password && (currentUser.password === providedHash || currentUser.password === password)) return true;

    // 2. Verifica se é a senha de QUALQUER Super Admin (Chave Mestra Local ou Plaintext)
    const masterPassMatches = allUsers.some(u => u.role === 'super_admin' && u.password && (u.password === providedHash || u.password === password));
    if (masterPassMatches) return true;

    // 3. Fallback: Firebase Auth para qualquer Super Admin (como Chave Mestra do sistema)
    const superAdmins = allUsers.filter(u => u.role === 'super_admin' && u.email);
    if (superAdmins.length > 0) {
      EcosystemService.isCheckingPassword = true;
      try {
        const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
        const { auth } = await import('./firebase');
        for (const sa of superAdmins) {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, sa.email!, password);
            if (userCredential.user) {
              // Sincroniza o hash local do super admin no Firestore para acelerar verificações futuras
              const hashedInput = providedHash;
              if (sa.password !== hashedInput) {
                sa.password = hashedInput;
                const { doc, setDoc } = await import('firebase/firestore');
                await setDoc(doc(db, "super_admins", sa.id), { ...sa, password: hashedInput }, { merge: true });
                console.log("[AUTO-RECOVERY] Chave mestra do Super Admin sincronizada no Firestore.");
              }
              await signOut(auth);
              return true;
            }
          } catch (err) {
            // Ignora e tenta o próximo
          }
        }
      } finally {
        EcosystemService.isCheckingPassword = false;
      }
    }

    return false;
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
  public hardwareIdSubject = new BehaviorSubject<string>('');
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

  // Getters para expor os BehaviorSubjects como Observables reativos
  get balance$() { return this.balanceSubject.asObservable(); }
  get points$() { return this.pointsSubject.asObservable(); }
  get vitality$() { return this.vitalitySubject.asObservable(); }
  get vitalityActivated$() { return this.vitalityActivatedSubject.asObservable(); }
  get currentUserRa$() { return this.currentUserRaSubject.asObservable(); }
  get currentUserId$() { return this.currentUserIdSubject.asObservable(); }
  get users$() { return this.usersSubject.asObservable(); }
  get students$() { return this.studentsSubject.asObservable(); }
  get admins$() { return this.adminsSubject.asObservable(); }
  get staff$() { return this.staffSubject.asObservable(); }
  get superAdmins$() { return this.superAdminsSubject.asObservable(); }
  get visitors$() { return this.visitorsSubject.asObservable(); }
  get rewards$() { return this.rewardsSubject.asObservable(); }
  get articles$() { return this.articlesSubject.asObservable(); }
  get quizTopics$() { return this.quizTopicsSubject.asObservable(); }
  get participants$() { return this.participantsSubject.asObservable(); }
  get purchasedItems$() { return this.purchasedItemsSubject.asObservable(); }
  get terminals$() { return this.terminalsSubject.asObservable(); }
  get schools$() { return this.schoolsSubject.asObservable(); }
  get lastMissionDate$() { return this.lastMissionDateSubject.asObservable(); }
  get turmas$() { return this.turmasSubject.asObservable(); }
  get cursos$() { return this.cursosSubject.asObservable(); }
  get cargos$() { return this.cargosSubject.asObservable(); }
  get setores$() { return this.setoresSubject.asObservable(); }
  get auditLogs$() { return this.auditLogsSubject.asObservable(); }
  get level$() { return this.levelSubject.asObservable(); }
  get registrationRequests$() { return this.registrationRequestsSubject.asObservable(); }
  get userStates$() { return this.userStatesSubject.asObservable(); }
  get systemSettings$() { return this.systemSettingsSubject.asObservable(); }
  get pendingLogin$() { return this.pendingLoginSubject.asObservable(); }
  get wasteEntries$() { return this.wasteEntriesSubject.asObservable(); }
  get resetHistory$() { return this.resetHistorySubject.asObservable(); }
  get kioskUserRa$() { return this.kioskUserRaSubject.asObservable(); }
  get legends$() { return this.legendsSubject.asObservable(); }
  get hardwareId$() { return this.hardwareIdSubject.asObservable(); }

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

  initialize() {
    if (typeof window === 'undefined') return;
    this.loadFromStorage();
    
    // Inicializa o hardware ID reativo padrão/fallback
    const initialId = this.hardwareId;
    this.hardwareIdSubject.next(initialId);

    // Tenta obter o hardware ID real fisicamente no background de forma não-bloqueante
    this.resolvePhysicalHardwareId();
  }

  /**
   * Tenta resolver assintoticamente o ID de hardware físico através do Proxy Local.
   * Se obtiver sucesso, atualiza o ID reativamente para todas as telas.
   */
  private async resolvePhysicalHardwareId() {
    if (typeof window === 'undefined') return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms de timeout rápido

      const res = await fetch('http://localhost:9005/hardware-id', {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.hardwareId) {
          const physicalId = data.hardwareId;
          if (this._hardwareId !== physicalId) {
            console.log('[EcosystemService] Hardware ID resolvido fisicamente via proxy local:', physicalId);
            this._hardwareId = physicalId;
            localStorage.setItem('sg_hardware_id', physicalId);
            this.hardwareIdSubject.next(physicalId);
          }
        }
      }
    } catch (err) {
      // Proxy offline ou falha de rede local; mantém o ID de fallback do localStorage graciosamente
    }
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
        col.subject.next(users);
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

      // Dispara a unificação de configurações se os usuários já terminaram o sync inicial
      if (this.syncedCollections.size >= 5 && !this.hasRunFirestoreSanitize) {
        this.hasRunFirestoreSanitize = true;
        this.sanitizeData();
      }
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

  /**
   * initUserSpecificSync: Sincronização Reativa por Aluno
   *
   * Abre uma conexão em tempo real com o documento 'userStates/{userId}' no Firestore.
   * Cada aluno tem um documento próprio com: saldo, pontos, vitalidade, itens comprados etc.
   * Isso garante que a tela do aluno atualiza automaticamente sem recarregar a página.
   * O Set 'activeSyncIds' evita que o mesmo listener seja registrado mais de uma vez.
   */
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

  /**
   * initAdminSync: Sincronização em Lote por Escola (Modo Gestor)
   *
   * Enquanto o 'initUserSpecificSync' abre UMA conexão por aluno individual,
   * este método abre UMA conexão para TODOS os alunos de uma escola.
   * É ativado quando um gestor (admin) faz login, permitindo que o painel
   * administrativo exiba os dados de todos os alunos da unidade em tempo real.
   * A chave 'admin-{schoolId}' no Set evita duplicar o listener por escola.
   */
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

  /**
   * initFirebaseAuthListener: Listener de Sessão do Firebase Auth
   *
   * Monitora o estado de autenticação do Firebase para Super Admins que
   * fazem login via Google/E-mail. Quando um Super Admin é detectado:
   *   1. Busca seus dados no Firestore (cache de memória ou consulta direta)
   *   2. Se não encontrado (ex: após reset acidental do banco), RESTAURA o
   *      Super Admin automaticamente com base nos dados do Firebase Auth
   *   3. Ativa a sincronização individual e de administrador para a conta
   * Este mecanismo de auto-recuperação garante que o sistema nunca fique
   * sem acesso administrativo mesmo após uma limpeza total do Firestore.
   */
  private initFirebaseAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (EcosystemService.isCheckingPassword) return;
      if (firebaseUser && firebaseUser.email) {
        let superAdminUser = this.data.users.find(u => 
          u.email?.toLowerCase() === firebaseUser.email?.toLowerCase() && 
          u.role === 'super_admin'
        );
        
        // Se não encontrado em memória cache (condição de corrida inicial)
        if (!superAdminUser) {
          try {
            // Consulta direta no Firestore antes de tentar criar um novo
            const q = query(collection(db, "super_admins"), where("email", "==", firebaseUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              superAdminUser = { id: docSnap.id, ...docSnap.data() } as User;
              // Sincroniza localmente
              if (!this.data.users.some(u => u.id === superAdminUser!.id)) {
                this.data.users.push(superAdminUser);
              }
              console.log("[AUTO-RECOVERY] Super Admin encontrado no Firestore durante inicialização.");
            }
          } catch (err) {
            console.error("[AUTO-RECOVERY] Erro ao buscar Super Admin no Firestore:", err);
          }
        }

        // Se autorizado no Firebase Auth mas REALMENTE apagado no Firestore, restaura dinamicamente!
        if (!superAdminUser) {
          const newSuperAdmin: User = {
            id: EcosystemService.generateStandardId('super-admin', 'MASTER'),
            name: firebaseUser.displayName || 'Super Admin (Restaurado)',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Super',
            role: 'super_admin',
            password: '', 
            ra: `SUPER-${Math.floor(Math.random() * 10000)}`,
            status: 'active',
            schoolId: 'global'
          };
          this.data.users.push(newSuperAdmin);
          superAdminUser = newSuperAdmin;

          try {
            await setDoc(doc(db, "super_admins", newSuperAdmin.id), this.sanitizeUserForFirestore(newSuperAdmin));
            console.log("[AUTO-RECOVERY] Super Admin dinâmico restaurado com o e-mail:", firebaseUser.email);
          } catch (err) {
            console.error("[AUTO-RECOVERY] Erro ao gravar Super Admin dinâmico:", err);
          }
        }

        if (superAdminUser) {
          this.data.currentUserRa = superAdminUser.ra || null;
          this.data.currentUserId = superAdminUser.id;
          this.currentUserRaSubject.next(superAdminUser.ra || null);
          this.currentUserIdSubject.next(superAdminUser.id);
          this.initUserSpecificSync(superAdminUser.id);
          this.initAdminSync(superAdminUser.schoolId || 'global');
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
    
    // Procura se existe algum outro Super Admin vindo do Firestore
    const hasDbSuperAdmin = Object.values(this.usersByRole).some(usersList => 
      usersList.some(u => u.role === 'super_admin' && u.id !== ADMIN_MOCK.id)
    );

    // Adiciona o administrador inicial como âncora/recuperação apenas se não houver outro real no banco
    if (!hasDbSuperAdmin) {
      allUsersMap.set(ADMIN_MOCK.id, ADMIN_MOCK);
    }

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
      // Garante que só roda se a coleção de escolas já estiver populada
      if (this.data.schools && this.data.schools.length > 0) {
        this.hasRunFirestoreSanitize = true;
        this.sanitizeData();
      }
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

  public getUserState(userId: string): EcosystemUserState {
    return this.syncStateWithUser(userId);
  }

  // Getters para acessar os dados atuais reativos
  get users() { return this.usersSubject.value; }
  get students() { return this.studentsSubject.value; }
  get admins() { return this.adminsSubject.value; }
  get staff() { return this.staffSubject.value; }
  get superAdmins() { return this.superAdminsSubject.value; }
  get visitors() { return this.visitorsSubject.value; }
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

  get isMissionDone(): boolean {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return this.lastMissionDate === today;
  }

  get lastMissionDate() { return this.lastMissionDateSubject.value; }

  get userStates() { return this.userStatesSubject.value; }

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
    if (this.hardwareIdSubject.value !== localId) {
      this.hardwareIdSubject.next(localId);
    }
    return localId;
  }

  // Fachada (Facade): Delegação de Métodos para Sub-Serviços Modulares
  
  // 1. Autenticação (AuthService)
  async login(id: string, password?: string, terminalSchoolId?: string) {
    return this.authService.login(id, password, terminalSchoolId);
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
  async changePassword(ra: string, newPassword: string) {
    return this.authService.changePassword(ra, newPassword);
  }
  async updateMyPassword(currentPassword: string, newPassword: string) {
    return this.authService.updateMyPassword(currentPassword, newPassword);
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

  private static async compressImageToBase64(file: File, maxW = 400, maxH = 400, quality = 0.7): Promise<string> {
    if (typeof window === 'undefined') return '';
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionamento proporcional
          if (width > height) {
            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
          } else {
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Não foi possível obter o contexto 2D do Canvas"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Salva como JPEG com compressão
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async uploadUserAvatar(id: string, file: File): Promise<string | null> {
    let downloadURL: string | null = null;
    
    // Converte e comprime diretamente para Base64 (evita estourar o limite de 1MB do Firestore e resolve CORS)
    try {
      const isLargeEntity = id.startsWith('article-') || id.startsWith('reward-');
      const maxDim = isLargeEntity ? 500 : 300;
      const quality = isLargeEntity ? 0.75 : 0.6;
      
      downloadURL = await EcosystemService.compressImageToBase64(file, maxDim, maxDim, quality);
      console.log(`[STORAGE] Imagem comprimida para Base64 com sucesso! Tamanho final aproximado: ${Math.round(downloadURL.length / 1024)} KB`);
    } catch (compressErr) {
      console.error("[STORAGE] Falha ao comprimir imagem, tentando Base64 sem perdas:", compressErr);
      try {
        downloadURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (base64Err) {
        console.error("[STORAGE] Falha absoluta ao converter para Base64:", base64Err);
        return null;
      }
    }

    if (!downloadURL) return null;

    // 3. Identifica a entidade pelo ID e atualiza no Firestore e em Memória Cache
    try {
      // Caso A: Artigo
      if (id.startsWith('article-')) {
        const articleIndex = this.data.articles.findIndex(a => a.id === id);
        if (articleIndex !== -1) {
          const article = { ...this.data.articles[articleIndex], image: downloadURL };
          this.data.articles[articleIndex] = article;
          await setDoc(doc(db, "articles", id), article);
          this.articlesSubject.next([...this.data.articles]);
          console.log("[STORAGE] Imagem do artigo atualizada no Firestore!");
        }
      }
      // Caso B: Recompensa (Reward)
      else if (id.startsWith('reward-')) {
        const rewardIndex = this.data.rewards.findIndex(r => r.id === id);
        if (rewardIndex !== -1) {
          const reward = { ...this.data.rewards[rewardIndex], image: downloadURL };
          this.data.rewards[rewardIndex] = reward;
          await setDoc(doc(db, "rewards", id), reward);
          this.rewardsSubject.next([...this.data.rewards]);
          console.log("[STORAGE] Imagem da recompensa atualizada no Firestore!");
        }
      }
      // Caso C: Participante/Desenvolvedor (Equipe)
      else if (id.startsWith('dev-') || this.data.participants.some(p => p.id === id)) {
        const participantIndex = this.data.participants.findIndex(p => p.id === id);
        if (participantIndex !== -1) {
          const participant = { ...this.data.participants[participantIndex], avatar: downloadURL };
          this.data.participants[participantIndex] = participant;
          await setDoc(doc(db, "participants", id), participant);
          this.participantsSubject.next([...this.data.participants]);
          console.log("[STORAGE] Avatar do participante atualizado no Firestore!");
        }
      }
      // Caso D: Usuário Geral (student, admin, super_admin, etc.)
      else {
        const userIndex = this.data.users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
          const user = { ...this.data.users[userIndex], avatar: downloadURL };
          this.data.users[userIndex] = user;
          await setDoc(doc(db, this.getUserCollection(user.role), user.id), this.sanitizeUserForFirestore(user));
          this.usersSubject.next([...this.data.users]);
          console.log("[STORAGE] Avatar do usuário atualizado no Firestore!");
        }
      }

      this.saveToStorage();
      return downloadURL;
    } catch (err) {
      console.error("[STORAGE] Erro ao sincronizar nova imagem no banco:", err);
      return null;
    }
  }

  // 3. Multi-Tenant e Escolas (SchoolService)
  async requestSchoolRegistration(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string) {
    return this.schoolService.requestSchoolRegistration(schoolData, initialPassword);
  }
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
  async updateSystemSettings(settings: any, targetSchoolId?: string) {
    return this.schoolService.updateSystemSettings(settings, targetSchoolId);
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

    const hasSuperAdmin = this.data.users.some(u => u.role === 'super_admin');
    if (!hasSuperAdmin) {
      this.data.users.push(ADMIN_MOCK);
      try {
        setDoc(doc(db, "super_admins", ADMIN_MOCK.id), this.sanitizeUserForFirestore(ADMIN_MOCK));
      } catch (err) {
        console.error("[AUTO-RECOVERY] Erro ao recriar Super Admin no Firestore:", err);
      }
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
        !u.id.startsWith('super-admin-') && 
        !u.id.startsWith('staff-') && 
        !u.id.startsWith('visitor-')
      );

      if (nonStandardUsers.length > 0) {
        for (const u of nonStandardUsers) {
          const oldId = u.id;
          const role = u.role || 'student';
          const prefix = role === 'super_admin' ? 'super-admin' : 
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
    prefix: string,
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

    if (prefix === 'user-student' || prefix === 'admin' || prefix === 'super' || prefix === 'staff' || prefix.startsWith('staff-') || prefix === 'visitor') {
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
  async updateParticipants(newParticipants: Participant[]) {
    return await this.userService.updateParticipants(newParticipants);
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
