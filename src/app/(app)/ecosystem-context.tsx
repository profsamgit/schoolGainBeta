'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { EcosystemService } from '@/lib/ecosystem.service';
import { User, Reward, EducationArticle, Participant, AuditLogEntry, Terminal, TerminalStatus, School, WasteEntry, WasteType, CycleSnapshot, Turma, Curso, Cargo, SetorEscolar, EcosystemItem, QuizTopic, RegistrationRequest } from '@/lib/types';

/**
 * ============================================================================
 * ECOSYSTEM CONTEXT: DISTRIBUIÇÃO DE ESTADO
 * ============================================================================
 * Este contexto atua como o sistema de distribuição de dados para a interface.
 * 
 * Sua função é propagar as informações processadas pelo EcosystemService para 
 * todos os componentes da aplicação, garantindo que a interface do usuário 
 * reflita o estado global de forma síncrona e eficiente.
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
  users: User[];              // Lista de todos os alunos (para ranking)
  userStates: Record<string, any>;
  allRewards: Reward[];         // Prêmios disponíveis
  allArticles: EducationArticle[];        // Artigos educativos
  allQuizTopics: QuizTopic[];   // Assuntos para o Quiz
  currentUserRa: string | null; // RA do aluno logado
  currentUser: User | null;      // Dados completos do aluno logado
  login: (ra: string, password?: string) => Promise<boolean>; // Entrar no sistema
  logout: () => void;             // Sair do sistema
  addPoints: (points: number, studentRa?: string) => void; // Dar pontos
  updateUsers: (newUsers: User[]) => Promise<boolean>;
  updateRewards: (newRewards: Reward[]) => Promise<void>;
  updateArticles: (newArticles: EducationArticle[]) => Promise<void>;
  updateQuizTopics: (newTopics: QuizTopic[]) => Promise<void>;
  allTurmas: Turma[];
  allCursos: Curso[];
  allCargos: Cargo[];
  allSetores: SetorEscolar[];
  updateTurmas: (newTurmas: Turma[]) => void;
  updateCursos: (newCursos: Curso[]) => void;
  updateCargos: (newCargos: Cargo[]) => void;
  updateSetores: (newSetores: SetorEscolar[]) => void;
  getUserState: (ra: string) => any;
  auditLogs: AuditLogEntry[]; // Histórico de pontos dados por admins
  grantPoints: (ra: string, points: number, sector: string, action: string, adminName: string, password?: string, terminalSchoolId?: string) => Promise<boolean>;
  getMonthlyLegends: () => any[]; // Alunos que conseguiram itens raros
  isNessieAvailable: () => boolean; // Verifica se item raro pode ser comprado
  getGlobalLeader: () => any;       // O aluno número 1 do sistema
  grantSightingBonus: (ra: string) => void;
  systemSettings: any;              // Configurações de hardware
  updateSystemSettings: (settings: any) => void;
  hardwareId: string | null;
  pendingHardwareLogin: { ra: string, terminalId: string } | null;
  terminals: Terminal[];
  requestTerminalAuthorization: (terminalId: string, hardwareId: string, location: string, schoolId: string) => boolean;
  updateTerminalStatus: (id: string, status: TerminalStatus, schoolId?: string) => void;
  updateTerminalSettings: (id: string, settings: Partial<Terminal>) => void;
  deleteTerminal: (id: string) => void;
  schools: School[];
  requestSchoolRegistration: (data: Omit<School, 'id' | 'status' | 'joinedDate'>) => boolean;
  registerSchool: (data: Omit<School, 'id' | 'status' | 'joinedDate'>) => Promise<boolean>;
  updateSchoolStatus: (id: string, status: 'active' | 'pending' | 'inactive' | 'suspended') => Promise<void>;
  updateSchools: (newSchools: School[]) => void;
  deleteSchool: (id: string) => void;
  getLockoutStatus: (id: string) => { isLocked: boolean, remainingSeconds: number };
  registrationRequests: RegistrationRequest[];
  requestRegistration: (data: any) => Promise<boolean>;
  approveRegistration: (id: string) => Promise<boolean>;
  rejectRegistration: (id: string) => Promise<boolean>;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => Promise<boolean>;
  wasteEntries: WasteEntry[];
  registerWaste: (ra: string, type: WasteType, weightKg: number, terminalSchoolId?: string) => boolean;
  identifyKioskUser: (ra: string | null) => void;
  resetHistory: CycleSnapshot[];
  performCycleReset: (password: string, schoolId?: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  changePassword: (ra: string, newPassword: string) => Promise<boolean>;
  updateMyPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  generateTerminalId: () => string;
  uploadUserAvatar: (userId: string, file: File) => Promise<string | null>;
  isPreviewMode: boolean;
  isInitializing: boolean;
  displayUser: User | null;
  service: EcosystemService;
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
  const [level, setLevel] = useState<string>('Semente');

  const [rewards, setRewards] = useState<any[]>(service.allRewards);
  const [articles, setArticles] = useState<any[]>(service.allArticles);
  const [quizTopics, setQuizTopics] = useState<QuizTopic[]>(service.allQuizTopics);
  const [participants, setParticipants] = useState<Participant[]>(service.allParticipants);
  const [turmas, setTurmas] = useState<Turma[]>(service.allTurmas);
  const [userStates, setUserStates] = useState<Record<string, any>>(service.userStates || {});

  // --- LÓGICA DE PREVIEW (MODO AUDITORIA) ---
  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');

  const isPreviewMode = useMemo(() => {
    return !!(previewId && (currentUserRa && users.find(u => u.ra === currentUserRa)?.role?.includes('admin')));
  }, [previewId, currentUserRa, users]);

  const displayUser = useMemo(() => {
    if (isPreviewMode) {
      return users.find(u => u.id === previewId) || null;
    }
    return users.find(u => u.ra === currentUserRa) || null;
  }, [isPreviewMode, previewId, users, currentUserRa]);

  const studentState = useMemo(() => {
    if (isPreviewMode && displayUser?.ra) {
      return service.getUserState(displayUser.ra);
    }
    return null;
  }, [isPreviewMode, displayUser, users]); // users dependência para garantir re-sync

  // Valores efetivos (overridden se em preview)
  const effectiveBalance = isPreviewMode && studentState ? studentState.balance : balance;
  const effectiveVitality = isPreviewMode && studentState ? studentState.vitality : vitality;
  const effectiveItems = isPreviewMode && studentState ? studentState.purchasedItems : purchasedItems;
  const effectiveLevel = isPreviewMode && studentState ? studentState.level : level;

  const getUserState = (ra: string) => service.getUserState(ra);

  const [cursos, setCursos] = useState<Curso[]>(service.allCursos);
  const [cargos, setCargos] = useState<Cargo[]>(service.allCargos);
  const [setores, setSetores] = useState<SetorEscolar[]>(service.allSetores);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(service.auditLogs);
  const [systemSettings, setSystemSettings] = useState(service.systemSettings);
  const [pendingHardwareLogin, setPendingHardwareLogin] = useState<{ ra: string, terminalId: string } | null>(null);
  const [terminals, setTerminals] = useState<Terminal[]>(service.terminals);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(service.wasteEntries);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [resetHistory, setResetHistory] = useState<CycleSnapshot[]>(service.resetHistory || []);
  const [schools, setSchools] = useState<School[]>(service.schools);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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
    const cargosSub = service.cargos$.subscribe(setCargos);
    const sectorsSub = service.setores$.subscribe(setSetores);
    const regReqSub = service.registrationRequests$.subscribe(setRegistrationRequests);
    const userStatesSub = service.userStates$.subscribe(setUserStates);

    service.initialize();
    
    // Forçamos uma atualização imediata do RA e usuários para evitar o tick de atraso do subscribe
    if (service.currentUserRa) {
      setCurrentUserRa(service.currentUserRa);
    }
    setUsers([...service.users]);

    // Lógica de liberação de inicialização:
    // Esperamos um pouco para dar tempo do Firebase Auth e Firestore dispararem os primeiros snapshots
    const checkAuthAndFinalize = () => {
      setTimeout(() => {
        setIsInitializing(false);
        setIsMounted(true);
      }, 300); // Aumentado para 300ms para maior estabilidade em conexões lentas
    };

    checkAuthAndFinalize();

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
      cargosSub.unsubscribe();
      sectorsSub.unsubscribe();
      regReqSub.unsubscribe();
      userStatesSub.unsubscribe();
    };
  }, [service]);

  const currentUser = useMemo(() => {
    if (!currentUserRa) return null;
    return users.find((u: User) => u.ra === currentUserRa) || null;
  }, [currentUserRa, users]);

  const completeDailyMission = (points: number) => {
    const res = service.completeDailyMission(points);
    if (res) {
      setIsMissionDone(true);
    }
    return res;
  };
  const deductPoints = service.deductPoints.bind(service);
  const registerAttendance = service.registerAttendance.bind(service);
  const buyUpgrade = (item: EcosystemItem) => service.buyUpgrade(item);
  const healVitality = (points: number) => service.healVitality(points);
  const updateParticipants = service.updateParticipants.bind(service);
  const login = (ra: string, pass?: string) => service.login(ra, pass);
  const logout = service.logout.bind(service);
  const addPoints = service.addPoints.bind(service);
  const updateUsers = async (newUsers: User[]) => await service.updateUsers(newUsers);
  const updateRewards = async (newRewards: Reward[]) => await service.updateRewards(newRewards);
  const updateArticles = async (newArticles: EducationArticle[]) => await service.updateArticles(newArticles);
  const updateQuizTopics = async (newTopics: QuizTopic[]) => await service.updateQuizTopics(newTopics);
  const updateTurmas = service.updateTurmas.bind(service);
  const updateCursos = service.updateCursos.bind(service);
  const updateCargos = service.updateCargos.bind(service);
  const updateSetores = service.updateSetores.bind(service);
  const grantPoints = (ra: string, pts: number, sec: string, act: string, adm: string, pass?: string, tSId?: string) => service.grantPoints(ra, pts, sec, act, adm, pass, tSId);
  const getMonthlyLegends = service.getMonthlyLegends.bind(service);
  const isNessieAvailable = service.isNessieAvailable.bind(service);
  const getGlobalLeader = service.getGlobalLeader.bind(service);
  const grantSightingBonus = service.grantSightingBonus.bind(service);
  const updateSystemSettings = service.updateSystemSettings.bind(service);
  const requestTerminalAuthorization = service.requestTerminalAuthorization.bind(service);
  const updateTerminalStatus = service.updateTerminalStatus.bind(service);
  const updateTerminalSettings = service.updateTerminalSettings.bind(service);
  const deleteTerminal = service.deleteTerminal.bind(service);
  const requestSchoolRegistration = service.requestSchoolRegistration.bind(service);
  const registerSchool = (data: any) => service.registerSchool(data);
  const updateSchoolStatus = (id: any, status: any) => service.updateSchoolStatus(id, status);
  const updateSchools = (newSchools: any) => service.updateSchools(newSchools);
  const deleteSchool = (id: any) => service.deleteSchool(id);
  const registerWaste = (ra: string, type: WasteType, weightKg: number, tSId?: string) => service.registerWaste(ra, type, weightKg, tSId);
  const identifyKioskUser = service.identifyKioskUser.bind(service);
  const performCycleReset = (pass: string, sId?: string) => service.performCycleReset(pass, sId);
  const verifyPassword = (pass: string) => service.verifyPassword(pass);
  const changePassword = service.changePassword.bind(service);
  const updateMyPassword = async (current: string, newPass: string) => service.updateMyPassword(current, newPass);
  const requestRegistration = (data: any) => service.requestRegistration(data);
  const approveRegistration = (id: string) => service.approveRegistration(id);
  const rejectRegistration = (id: string) => service.rejectRegistration(id);
  const getLockoutStatus = service.getLockoutStatus.bind(service);
  const generateTerminalId = service.generateTerminalId.bind(service);
  const uploadUserAvatar = (uId: string, f: File) => service.uploadUserAvatar(uId, f);
  const updateUserStatus = (uId: string, s: 'active' | 'inactive') => service.updateUserStatus(uId, s);

  // Evita problemas de renderização no servidor (Next.js)
  if (!isMounted) return null;

  return (
    <EcosystemContext.Provider value={{
      balance: effectiveBalance,
      vitality: effectiveVitality,
      isMissionDone,
      purchasedItems: effectiveItems,
      level: effectiveLevel,
      hardwareId: service.hardwareId,
      completeDailyMission,
      deductPoints,
      registerAttendance,
      buyUpgrade,
      healVitality,
      allParticipants: participants,
      updateParticipants,
      users,
      allRewards: rewards,
      allArticles: articles,
      allQuizTopics: quizTopics,
      currentUserRa,
      currentUser: displayUser,
      login,
      logout,
      addPoints,
      updateUsers,
      updateRewards,
      updateArticles,
      updateQuizTopics,
      allTurmas: turmas,
      allCursos: cursos,
      allCargos: cargos,
      allSetores: setores,
      updateTurmas,
      updateCursos,
      updateCargos,
      updateSetores,
      userStates,
      getUserState,
      auditLogs,
      grantPoints,
      getMonthlyLegends,
      isNessieAvailable,
      getGlobalLeader,
      grantSightingBonus,
      systemSettings,
      updateSystemSettings,
      pendingHardwareLogin,
      terminals,
      requestTerminalAuthorization,
      updateTerminalStatus,
      updateTerminalSettings,
      deleteTerminal,
      schools,
      requestSchoolRegistration,
      registerSchool,
      updateSchoolStatus,
      updateSchools,
      deleteSchool,
      getLockoutStatus,
      registrationRequests,
      requestRegistration,
      approveRegistration,
      rejectRegistration,
      wasteEntries,
      registerWaste,
      identifyKioskUser,
      resetHistory,
      performCycleReset,
      verifyPassword,
      changePassword,
      updateMyPassword,
      generateTerminalId,
      uploadUserAvatar,
      updateUserStatus,
      isPreviewMode,
      isInitializing,
      displayUser,
      service
    }}>
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
