import { BehaviorSubject } from 'rxjs';
import { STUDENT_MOCK, LEADERBOARD_MOCK, REWARDS_MOCK, ARTICLES_MOCK, QUIZ_TOPICS_MOCK, ADMIN_MOCK } from './data';
import { 
  User, 
  Reward, 
  EducationArticle, 
  Participant,
  AuditLogEntry,
  SCHOOL_SECTORS,
  SchoolSector
} from './types';

const TEAM_MOCK: Participant[] = [
  {
    id: 'participant-1',
    name: 'Samuel Coelho de Sá',
    role: 'Professor',
    description: 'Analista de Sistemas - Especialista em Segurança, Redes e Engenharia da Computação',
    avatar: 'https://picsum.photos/seed/prof-samuel/200/200',
    initials: 'SC',
  },
  {
    id: 'participant-2',
    name: 'Lincoln Rodrigues',
    role: 'Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/lincoln/200/200',
    initials: 'LR',
  },
  {
    id: 'participant-3',
    name: 'Michelly Maria',
    role: 'Desenvolvedora',
    description: 'Aluna de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/michelly/200/200',
    initials: 'MM',
  },
  {
    id: 'participant-4',
    name: 'Raphael Guimarães',
    role: 'Desenvolvedor',
    description: 'Aluno de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/raphael/200/200',
    initials: 'RG',
  },
  {
    id: 'participant-5',
    name: 'Safira de Cássia',
    role: 'Desenvolvedora',
    description: 'Aluna de TDS 2B 2026 - CETI Frei José Apicella',
    avatar: 'https://picsum.photos/seed/safira/200/200',
    initials: 'SK',
  },
];

export type EcosystemItem = 
  'filtro_ar' | 'limpar_rio' | 'reparar_grama' | 
  'arvore_1' | 'arvore_2' | 'arvore_3' | 
  'passaro_1' | 'passaro_2' | 
  'peixe_1' | 'peixe_2' | 'peixe_3' | 
  'cachorro' | 'coelho' | 'borboletas' | 'monstro_lago';

export interface EcosystemUserState {
  balance: number;
  vitality: number;
  purchasedItems: EcosystemItem[];
  lastMissionDate: string | null;
  nessiePurchaseDate?: string;
  curso?: string;
}

export interface EcosystemData {
  users: Omit<User, 'email' | 'avatar'>[];
  rewards: Reward[];
  articles: EducationArticle[];
  quizTopics: string[];
  currentUserRa: string | null;
  participants: Participant[];
  turmas: string[];
  cursos: string[];
  userStates: Record<string, EcosystemUserState>;
}

const STORAGE_KEY = 'schoolgain_ecosystem';

export class EcosystemService {
  private STORAGE_PREFIX = 'schoolgain_v8';
  
  private data: EcosystemData = {
    users: [ADMIN_MOCK, ...LEADERBOARD_MOCK],
    rewards: [...REWARDS_MOCK],
    articles: [...ARTICLES_MOCK],
    quizTopics: [...QUIZ_TOPICS_MOCK],
    currentUserRa: null,
    participants: [...TEAM_MOCK],
    turmas: ['1ª Série', '2ª Série', '3ª Série'],
    cursos: ['Técnico em Desenvolvimento de Sistemas', 'Técnico em Agropecuária', 'Gestão Escolar'],
    userStates: {},
  };

  private balanceSubject = new BehaviorSubject<number>(0);
  private vitalitySubject = new BehaviorSubject<number>(100);
  private currentUserRaSubject = new BehaviorSubject<string | null>(null);
  private usersSubject = new BehaviorSubject<any[]>([]);
  private rewardsSubject = new BehaviorSubject<Reward[]>([]);
  private articlesSubject = new BehaviorSubject<EducationArticle[]>([]);
  private quizTopicsSubject = new BehaviorSubject<string[]>([]);
  private participantsSubject = new BehaviorSubject<Participant[]>([]);
  private purchasedItemsSubject = new BehaviorSubject<EcosystemItem[]>([]);
  private lastMissionDateSubject = new BehaviorSubject<string | null>(null);
  private turmasSubject = new BehaviorSubject<string[]>([]);
  private cursosSubject = new BehaviorSubject<string[]>([]);
  private auditLogsSubject = new BehaviorSubject<AuditLogEntry[]>([]);

  constructor() {
    this.usersSubject.next(this.data.users);
    this.rewardsSubject.next(this.data.rewards);
    this.articlesSubject.next(this.data.articles);
    this.quizTopicsSubject.next(this.data.quizTopics);
    this.participantsSubject.next(this.data.participants);
    this.turmasSubject.next(this.data.turmas);
    this.cursosSubject.next(this.data.cursos);
  }

  initialize() {
    if (typeof window === 'undefined') return;
    this.loadFromStorage();
    
    this.currentUserRaSubject.next(this.data.currentUserRa);
    this.usersSubject.next(this.data.users);
    this.rewardsSubject.next(this.data.rewards);
    this.articlesSubject.next(this.data.articles);
    this.quizTopicsSubject.next(this.data.quizTopics);
    this.participantsSubject.next(this.data.participants);
    this.turmasSubject.next(this.data.turmas);
    this.cursosSubject.next(this.data.cursos);

    if (this.data.currentUserRa) {
      this.syncStateWithUser(this.data.currentUserRa);
    }
  }

  private syncStateWithUser(ra: string) {
    const userState = this.data.userStates[ra];
    const userRecord = this.data.users.find(u => u.ra === ra);

    if (userState) {
      if (userRecord && userRecord.points < userState.balance) {
        userRecord.points = userState.balance;
      }
      this.balanceSubject.next(userState.balance);
      this.vitalitySubject.next(userState.vitality);
      this.purchasedItemsSubject.next(userState.purchasedItems);
      this.lastMissionDateSubject.next(userState.lastMissionDate);
    } else if (userRecord) {
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

  private syncUserPoints(ra: string, currentBalanceChange: number, lifetimePointsGain: number) {
    const state = this.data.userStates[ra] || this.getDefaultState();
    state.balance += currentBalanceChange;
    this.data.userStates[ra] = state;

    if (ra === this.currentUserRa) {
      this.balanceSubject.next(state.balance);
    }

    const studentIdx = this.data.users.findIndex(u => u.ra === ra);
    if (studentIdx !== -1) {
      const student = this.data.users[studentIdx];
      student.points = (student.points || 0) + lifetimePointsGain;
      if (student.points < state.balance) student.points = state.balance;
      
      const score = EcosystemService.calculateTotalScore(student.points, state.vitality, state.purchasedItems.length);
      student.level = this.calculateLevel(score, state.purchasedItems);
      
      this.data.users[studentIdx] = { ...student };
      this.usersSubject.next([...this.data.users]);
    }

    this.saveToStorage();
  }

  get users() { return this.usersSubject.value; }
  get allRewards() { return this.data.rewards; }
  get allArticles() { return this.data.articles; }
  get allQuizTopics() { return this.data.quizTopics; }
  get allParticipants() { return this.data.participants; }
  get allTurmas() { return this.data.turmas; }
  get allCursos() { return this.data.cursos; }
  get auditLogs() { return this.auditLogsSubject.value; }

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

  get balance() { return this.balanceSubject.value; }
  get vitality() { return this.vitalitySubject.value; }
  get purchasedItems() { return this.purchasedItemsSubject.value; }
  get currentUserRa() { return this.currentUserRaSubject.value; }

  getUserState(ra: string): EcosystemUserState {
    return this.data.userStates[ra] || this.getDefaultState();
  }

  private getDefaultState(): EcosystemUserState {
    return { balance: 5000, vitality: 0, purchasedItems: [], lastMissionDate: null, curso: '', nessiePurchaseDate: undefined };
  }

  isNessieAvailable() {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${today.getMonth() + 1}`;
    
    const nessieOwnersInMonth = Object.values(this.data.userStates).filter(state => {
      if (!state.purchasedItems.includes('monstro_lago') || !state.nessiePurchaseDate) return false;
      return state.nessiePurchaseDate.startsWith(currentMonth);
    });
    
    return nessieOwnersInMonth.length < 3;
  }

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

  get isMissionDone() {
    const lastDate = this.lastMissionDateSubject.value;
    if (!lastDate) return false;
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return lastDate === today;
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.data = { ...this.data, ...parsed };
      } catch (e) {
        console.error('Error loading ecosystem data', e);
      }
    }

    const logsStr = localStorage.getItem(`${this.STORAGE_PREFIX}_audit_logs`);
    if (logsStr) {
      this.auditLogsSubject.next(JSON.parse(logsStr));
    }

    let hasChanges = false;
    const RESET_VERSION = 'v8_integrity_retest';
    if ((this.data as any).resetVersion !== RESET_VERSION) {
      this.data.userStates = {};
      (this.data as any).resetVersion = RESET_VERSION;
      hasChanges = true;
    }

    this.data.users.forEach(user => {
      if (user.ra && !this.data.userStates[user.ra]) {
        this.data.userStates[user.ra] = this.getDefaultState();
        hasChanges = true;
      }
    });

    if (hasChanges) this.saveToStorage();
  }

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

  completeDailyMission(points: number) {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    if (this.lastMissionDateSubject.value === today) return false;
    this.lastMissionDateSubject.next(today);
    
    if (this.currentUserRa) {
      this.syncUserPoints(this.currentUserRa, points, points);
    }
    return true;
  }

  deductPoints(points: number) {
    if (this.balance < points || !this.currentUserRa) return false;
    this.syncUserPoints(this.currentUserRa, -points, 0);
    return true;
  }

  healVitality(points: number) {
    if (this.balance < points || !this.currentUserRa) return false;
    const vitalityGain = Math.floor(points / 10);
    const newVitality = Math.min(100, this.vitality + vitalityGain);
    if (newVitality === this.vitality) return false;
    
    this.vitalitySubject.next(newVitality);
    this.syncUserPoints(this.currentUserRa, -points, 0);
    return true;
  }

  registerAttendance(status: 'presente' | 'falta') {
    if (status === 'falta') {
      this.vitalitySubject.next(Math.max(0, this.vitality - 20));
      this.saveToStorage();
    }
  }

  buyUpgrade(item: EcosystemItem) {
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
      'monstro_lago': { price: 2000, minVitality: 100 },
    };

    const upgrade = catalog[item];
    if (this.purchasedItems.includes(item)) return false;
    if (upgrade.minVitality && this.vitality < upgrade.minVitality) return false;

    if (item === 'monstro_lago') {
      const foundations = ['filtro_ar', 'limpar_rio', 'reparar_grama'];
      if (foundations.some(f => !this.purchasedItems.includes(f as EcosystemItem))) return false;
      if (!this.isNessieAvailable()) return false;
    } else if (upgrade.required && !this.purchasedItems.includes(upgrade.required as EcosystemItem)) {
      return false;
    }

    if (this.balance < upgrade.price || !this.currentUserRa) return false;

    const newItems = [...this.purchasedItems, item];
    this.purchasedItemsSubject.next(newItems);

    let balanceAdjust = -upgrade.price;
    let pointsAdjust = 0;

    if (item === 'monstro_lago') {
      pointsAdjust = 5000;
      balanceAdjust += 5000;
      
      const state = this.data.userStates[this.currentUserRa] || this.getDefaultState();
      const today = new Date();
      state.nessiePurchaseDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      this.data.userStates[this.currentUserRa] = state;
    }

    this.syncUserPoints(this.currentUserRa, balanceAdjust, pointsAdjust);
    return true;
  }

  grantPoints(ra: string, points: number, sector: string, action: string, adminName: string): boolean {
    const student = this.data.users.find(u => u.ra === ra);
    if (!student) return false;

    this.syncUserPoints(ra, points, points);

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      ra,
      studentName: student.name,
      points,
      sector,
      action,
      timestamp: new Date().toISOString(),
      adminName
    };
    this.auditLogsSubject.next([log, ...this.auditLogsSubject.value]);
    this.saveToStorage();
    return true;
  }

  addPoints(points: number, studentRa?: string) {
    const targetRa = studentRa || this.currentUserRa;
    if (targetRa) {
      this.syncUserPoints(targetRa, points, points);
    }
  }

  grantSightingBonus(ra: string) {
    this.syncUserPoints(ra, 50, 50);
    return true;
  }

  login(ra: string) {
    const user = this.data.users.find(u => u.ra === ra);
    if (user) {
      this.currentUserRaSubject.next(ra);
      this.syncStateWithUser(ra);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  logout() {
    this.currentUserRaSubject.next(null);
    this.balanceSubject.next(0);
    this.vitalitySubject.next(100);
    this.purchasedItemsSubject.next([]);
    this.lastMissionDateSubject.next(null);
    this.saveToStorage();
  }

  updateUsers(newUsers: any[]) {
    this.data.users = newUsers;
    this.usersSubject.next(newUsers);
    this.saveToStorage();
  }

  updateRewards(newRewards: Reward[]) {
    this.data.rewards = newRewards;
    this.rewardsSubject.next(newRewards);
    this.saveToStorage();
  }

  updateArticles(newArticles: EducationArticle[]) {
    this.data.articles = newArticles;
    this.articlesSubject.next(newArticles);
    this.saveToStorage();
  }

  updateQuizTopics(newTopics: string[]) {
    this.data.quizTopics = newTopics;
    this.quizTopicsSubject.next(newTopics);
    this.saveToStorage();
  }

  updateParticipants(newParticipants: Participant[]) {
    this.data.participants = newParticipants;
    this.participantsSubject.next(newParticipants);
    this.saveToStorage();
  }

  updateTurmas(newTurmas: string[]) {
    this.data.turmas = newTurmas;
    this.turmasSubject.next(newTurmas);
    this.saveToStorage();
  }

  updateCursos(newCursos: string[]) {
    this.data.cursos = newCursos;
    this.cursosSubject.next(newCursos);
    this.saveToStorage();
  }

  static calculateTotalScore(points: number, vitality: number, itemsCount: number): number {
    return Math.floor(points + (vitality * 100) + (itemsCount * 500));
  }

  private calculateLevel(score: number, purchasedItems?: EcosystemItem[]): any {
    const items = purchasedItems || this.purchasedItems;
    if (items.includes('monstro_lago')) return 'Guardião da Lenda';
    if (score >= 17000) return 'Guardião da Biosfera';
    if (score >= 14000) return 'Floresta';
    if (score >= 11000) return 'Árvore';
    if (score >= 8000) return 'Folha';
    if (score >= 5000) return 'Broto';
    return 'Semente';
  }
}
