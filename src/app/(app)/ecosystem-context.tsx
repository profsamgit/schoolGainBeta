'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { EcosystemService, EcosystemItem } from '@/lib/ecosystem.service';
import { Participant, AuditLogEntry, Terminal, TerminalStatus, School, WasteEntry, WasteType, CycleSnapshot, Turma, Curso } from '@/lib/types';

/**
 * EcosystemContextType: Define o contrato do que está disponível para a interface.
 * 
 * Imagine que este contexto é um "Controle Remoto" para o sistema.
 * Qualquer componente que segurar este controle pode ver o saldo, 
 * a vitalidade e realizar ações como comprar itens ou fazer login.
 */
interface EcosystemContextType {
  balance: number;           // Bio-Coins (saldo) do aluno logado
  vitality: number;          // Percentual de saúde do ecossistema (0-100)
  isMissionDone: boolean;    // Indica se a missão do dia já foi concluída
  purchasedItems: EcosystemItem[]; // Lista de objetos/animais que o aluno já comprou
  level: string;             // Título do aluno (ex: "Semente", "Árvore")
  completeDailyMission: (points: number) => boolean; // Função para ganhar pontos diários
  deductPoints: (points: number) => boolean;         // Função para gastar pontos
  registerAttendance: (status: 'presente' | 'falta') => void; // Registra presença/falta
  buyUpgrade: (item: EcosystemItem) => boolean;      // Compra um item para o mundo virtual
  healVitality: (points: number) => boolean;         // Recupera saúde do mundo gastando pontos
  allParticipants: Participant[]; // Lista da equipe do projeto
  updateParticipants: (newParticipants: Participant[]) => void;
  users: any[];              // Lista de todos os alunos (para ranking)
  allRewards: any[];         // Prêmios disponíveis
  allArticles: any[];        // Artigos educativos
  allQuizTopics: string[];   // Assuntos para o Quiz
  currentUserRa: string | null; // RA do aluno logado
  currentUser: any | null;      // Dados completos do aluno logado
  login: (ra: string, password?: string) => Promise<boolean>; // Entrar no sistema
  logout: () => void;             // Sair do sistema
  addPoints: (points: number, studentRa?: string) => void; // Dar pontos
  updateUsers: (newUsers: any[]) => void;
  updateRewards: (newRewards: any[]) => void;
  updateArticles: (newArticles: any[]) => void;
  updateQuizTopics: (newTopics: string[]) => void;
  allTurmas: Turma[];
  allCursos: Curso[];
  updateTurmas: (newTurmas: Turma[]) => void;
  updateCursos: (newCursos: Curso[]) => void;
  getUserState: (ra: string) => any;
  auditLogs: AuditLogEntry[]; // Histórico de pontos dados por admins
  grantPoints: (ra: string, points: number, sector: string, action: string, adminName: string, password?: string) => Promise<boolean>;
  getMonthlyLegends: () => any[]; // Alunos que conseguiram itens raros
  isNessieAvailable: () => boolean; // Verifica se item raro pode ser comprado
  getGlobalLeader: () => any;       // O aluno número 1 do sistema
  grantSightingBonus: (ra: string) => void;
  systemSettings: any;              // Configurações de hardware
  updateSystemSettings: (settings: any) => void;
  pendingHardwareLogin: { ra: string, terminalId: string } | null;
  terminals: Terminal[];
  requestTerminalAuthorization: (hardwareId: string, location: string, schoolId: string) => boolean;
  updateTerminalStatus: (id: string, status: TerminalStatus, schoolId?: string) => void;
  deleteTerminal: (id: string) => void;
  schools: School[];
  requestSchoolRegistration: (data: Omit<School, 'id' | 'status' | 'joinedDate'>) => boolean;
  registerSchool: (data: Omit<School, 'id' | 'status' | 'joinedDate'>) => Promise<boolean>;
  updateSchoolStatus: (id: string, status: 'active' | 'pending') => void;
  updateSchools: (newSchools: School[]) => void;
  deleteSchool: (id: string) => void;
  getLockoutStatus: (id: string) => { isLocked: boolean, remainingSeconds: number };
  wasteEntries: WasteEntry[];
  registerWaste: (ra: string, type: WasteType, weightKg: number) => boolean;
  identifyKioskUser: (ra: string | null) => void;
  resetHistory: CycleSnapshot[];
  performCycleReset: (password: string, schoolId?: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  changePassword: (ra: string, newPassword: string) => Promise<boolean>;
  updateMyPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const EcosystemContext = createContext<EcosystemContextType | null>(null);

export function EcosystemProvider({ children }: { children: React.ReactNode }) {
  const service = useMemo(() => new EcosystemService(), []);

  const [balance, setBalance] = useState(service.balance);
  const [vitality, setVitality] = useState(service.vitality);
  const [isMissionDone, setIsMissionDone] = useState(service.isMissionDone);
  const [purchasedItems, setPurchasedItems] = useState<EcosystemItem[]>(service.purchasedItems);
  const [currentUserRa, setCurrentUserRa] = useState<string | null>(service.currentUserRa);
  const [users, setUsers] = useState<any[]>(service.users);
  const [rewards, setRewards] = useState<any[]>(service.allRewards);
  const [articles, setArticles] = useState<any[]>(service.allArticles);
  const [quizTopics, setQuizTopics] = useState<string[]>(service.allQuizTopics);
  const [participants, setParticipants] = useState<Participant[]>(service.allParticipants);
  const [turmas, setTurmas] = useState<Turma[]>(service.allTurmas);
  const [cursos, setCursos] = useState<Curso[]>(service.allCursos);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(service.auditLogs);
  const [level, setLevel] = useState<string>('Iniciante');
  const [systemSettings, setSystemSettings] = useState(service.systemSettings);
  const [pendingHardwareLogin, setPendingHardwareLogin] = useState<{ ra: string, terminalId: string } | null>(null);
  const [terminals, setTerminals] = useState<Terminal[]>(service.terminals);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(service.wasteEntries);
  const [resetHistory, setResetHistory] = useState<CycleSnapshot[]>(service.resetHistory || []);
  const [schools, setSchools] = useState<School[]>(service.schools);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const balanceSub = service.balance$.subscribe(setBalance);
    const vitalitySub = service.vitality$.subscribe(setVitality);
    const raSub = service.currentUserRa$.subscribe(setCurrentUserRa);
    const usersSub = service.users$.subscribe(setUsers);
    const rewardsSub = service.rewards$.subscribe(setRewards);
    const articlesSub = service.articles$.subscribe(setArticles);
    const topicsSub = service.quizTopics$.subscribe(setQuizTopics);
    const participantsSub = service.participants$.subscribe(setParticipants);
    const turmasSub = service.turmas$.subscribe(setTurmas);
    const cursosSub = service.cursos$.subscribe(setCursos);
    const purchasedItemsSub = service.purchasedItems$.subscribe(setPurchasedItems);
    const auditLogsSub = service.auditLogs$.subscribe(setAuditLogs);
    const levelSub = service.level$.subscribe(setLevel);
    const settingsSub = service.systemSettings$.subscribe(setSystemSettings);
    const pendingLoginSub = service.pendingLogin$.subscribe(setPendingHardwareLogin);
    const terminalsSub = service.terminals$.subscribe(setTerminals);
    const wasteEntriesSub = service.wasteEntries$.subscribe(setWasteEntries);
    const resetHistorySub = service.resetHistory$.subscribe(setResetHistory);
    const schoolsSub = service.schools$.subscribe(setSchools);
    
    service.initialize();
    setIsMounted(true);
    
    return () => {
      balanceSub.unsubscribe();
      vitalitySub.unsubscribe();
      raSub.unsubscribe();
      usersSub.unsubscribe();
      rewardsSub.unsubscribe();
      articlesSub.unsubscribe();
      topicsSub.unsubscribe();
      participantsSub.unsubscribe();
      turmasSub.unsubscribe();
      cursosSub.unsubscribe();
      purchasedItemsSub.unsubscribe();
      auditLogsSub.unsubscribe();
      levelSub.unsubscribe();
      settingsSub.unsubscribe();
      pendingLoginSub.unsubscribe();
      terminalsSub.unsubscribe();
      wasteEntriesSub.unsubscribe();
      resetHistorySub.unsubscribe();
      schoolsSub.unsubscribe();
    };
  }, [service]);

  const currentUser = useMemo(() => {
    if (!currentUserRa) return null;
    return users.find((u: any) => u.ra === currentUserRa) || null;
  }, [currentUserRa, users]);

  const value = {
    balance,
    vitality,
    isMissionDone,
    purchasedItems,
    level,
    completeDailyMission: (points: number) => {
      const res = service.completeDailyMission(points);
      if (res) {
        setIsMissionDone(true);
      }
      return res;
    },
    deductPoints: service.deductPoints.bind(service),
    registerAttendance: service.registerAttendance.bind(service),
    buyUpgrade: (item: EcosystemItem) => service.buyUpgrade(item),
    healVitality: (points: number) => service.healVitality(points),
    allParticipants: participants,
    updateParticipants: service.updateParticipants.bind(service),
    users,
    allRewards: rewards,
    allArticles: articles,
    allQuizTopics: quizTopics,
    currentUserRa,
    currentUser,
    login: (ra: string, pass?: string) => service.login(ra, pass),
    logout: service.logout.bind(service),
    addPoints: service.addPoints.bind(service),
    updateUsers: service.updateUsers.bind(service),
    updateRewards: service.updateRewards.bind(service),
    updateArticles: service.updateArticles.bind(service),
    updateQuizTopics: service.updateQuizTopics.bind(service),
    allTurmas: turmas,
    allCursos: cursos,
    updateTurmas: service.updateTurmas.bind(service),
    updateCursos: service.updateCursos.bind(service),
    getUserState: service.getUserState.bind(service),
    auditLogs,
    grantPoints: (ra: string, pts: number, sec: string, act: string, adm: string, pass?: string) => service.grantPoints(ra, pts, sec, act, adm, pass),
    getMonthlyLegends: service.getMonthlyLegends.bind(service),
    isNessieAvailable: service.isNessieAvailable.bind(service),
    getGlobalLeader: service.getGlobalLeader.bind(service),
    grantSightingBonus: service.grantSightingBonus.bind(service),
    systemSettings,
    updateSystemSettings: service.updateSystemSettings.bind(service),
    pendingHardwareLogin,
    terminals,
    requestTerminalAuthorization: service.requestTerminalAuthorization.bind(service),
    updateTerminalStatus: service.updateTerminalStatus.bind(service),
    deleteTerminal: service.deleteTerminal.bind(service),
    schools,
    requestSchoolRegistration: service.requestSchoolRegistration.bind(service),
    registerSchool: (data: any) => service.registerSchool(data),
    updateSchoolStatus: (id: any, status: any) => service.updateSchoolStatus(id, status),
    updateSchools: (newSchools: any) => service.updateSchools(newSchools),
    deleteSchool: (id: any) => service.deleteSchool(id),
    wasteEntries,
    registerWaste: service.registerWaste.bind(service),
    identifyKioskUser: service.identifyKioskUser.bind(service),
    resetHistory,
    performCycleReset: (pass: string, sId?: string) => service.performCycleReset(pass, sId),
    verifyPassword: (pass: string) => service.verifyPassword(pass),
    changePassword: service.changePassword.bind(service),
    updateMyPassword: async (current: string, newPass: string) => service.updateMyPassword(current, newPass),
    getLockoutStatus: service.getLockoutStatus.bind(service),
  };

  // Evita problemas de renderização no servidor (Next.js)
  if (!isMounted) return null;

  return (
    <EcosystemContext.Provider value={value}>
      {children}
    </EcosystemContext.Provider>
  );
}

/**
 * useEcosystem: O Hook de Acesso
 * 
 * É a forma mais fácil de usar o sistema em qualquer lugar.
 * Exemplo: const { balance, buyUpgrade } = useEcosystem();
 */
export function useEcosystem() {
  const context = useContext(EcosystemContext);
  if (!context) {
    throw new Error('useEcosystem deve ser usado dentro de um EcosystemProvider');
  }
  return context;
}
