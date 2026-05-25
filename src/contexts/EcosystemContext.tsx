'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { EcosystemService } from '@/lib/ecosystem.service';
import { User, Reward, EducationArticle, Participant, AuditLogEntry, Terminal, TerminalStatus, School, WasteEntry, WasteType, CycleSnapshot, Turma, Curso, Cargo, SetorEscolar, EcosystemItem, QuizTopic, RegistrationRequest, EcosystemLegend, UserLevel, EcosystemUserState } from '@/types/ecosystem';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineDB } from '@/lib/services/offline-db';
import { identifyWasteAction } from '@/app/(app)/waste/actions';

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
  points: number;            // Pontos vitalícios (lifetime)
  vitality: number;          // Percentual de saúde do ecossistema (0-100)
  vitalityActivated: boolean; // Se o ecossistema foi ativado via Quiz
  isMissionDone: boolean;    // Indica se a missão do dia já foi concluída
  purchasedItems: EcosystemItem[]; // Lista de objetos/animais que o aluno já comprou
  level: UserLevel;             // Título do aluno (ex: "Semente", "Árvore")
  completeDailyMission: (points: number, difficulty?: 'easy' | 'medium' | 'hard') => boolean; // Função para ganhar pontos diários
  deductPoints: (points: number) => boolean;         // Função para gastar pontos
  registerAttendance: (status: 'presente' | 'falta') => void; // Registra presença/falta
  buyUpgrade: (item: EcosystemItem) => { success: boolean; error?: string };      // Compra um item para o mundo virtual
  healVitality: (points: number) => { success: boolean; error?: string };         // Recupera saúde do mundo gastando pontos
  allParticipants: Participant[]; // Lista da equipe do projeto
  updateParticipants: (newParticipants: Participant[]) => Promise<boolean>;
  users: User[];              // Lista mestre (legado/ranking)
  students: User[];
  admins: User[];
  staff: User[];
  superAdmins: User[];
  visitors: User[];
  userStates: Record<string, any>;
  allRewards: Reward[];         // Prêmios disponíveis
  allArticles: EducationArticle[];        // Artigos educativos
  allQuizTopics: QuizTopic[];   // Assuntos para o Quiz
  recordQuizCompletion: (topicId: string, score: number, difficulty?: string, numQuestions?: number) => Promise<boolean>;
  currentUserRa: string | null; // RA do aluno logado
  currentUserId: string | null; // ID do aluno logado (Firestore)
  currentUser: User | null;      // Dados completos do aluno logado
  login: (ra: string, password?: string, terminalSchoolId?: string) => Promise<boolean>; // Entrar no sistema
  logout: () => void;             // Sair do sistema
  addPoints: (points: number, studentRa?: string, description?: string) => void; // Dar pontos
  updateUsers: (newUsers: User[], targetSchoolId?: string) => Promise<{ success: boolean, error?: string }>;
  updateRewards: (newRewards: Reward[], targetSchoolId?: string) => Promise<boolean>;
  updateArticles: (newArticles: EducationArticle[], targetSchoolId?: string) => Promise<boolean>;
  updateQuizTopics: (newTopics: QuizTopic[], targetSchoolId?: string) => Promise<boolean>;
  deleteQuizTopic: (id: string, targetSchoolId?: string) => Promise<boolean>;
  deleteReward: (id: string, targetSchoolId?: string) => Promise<boolean>;
  deleteArticle: (id: string, targetSchoolId?: string) => Promise<boolean>;
  allTurmas: Turma[];
  allCursos: Curso[];
  allCargos: Cargo[];
  allSetores: SetorEscolar[];
  updateTurmas: (newTurmas: Turma[], targetSchoolId?: string) => Promise<boolean>;
  updateCursos: (newCursos: Curso[], targetSchoolId?: string) => Promise<boolean>;
  updateCargos: (newCargos: Cargo[], targetSchoolId?: string) => Promise<boolean>;
  updateSetores: (newSetores: SetorEscolar[], targetSchoolId?: string) => Promise<boolean>;
  getUserState: (userId: string) => EcosystemUserState;
  initUserSpecificSync: (userId: string) => void;
  auditLogs: AuditLogEntry[]; // Histórico de pontos dados por admins
  grantPoints: (ra: string, points: number, sector: string, action: string, adminName: string, password?: string, terminalSchoolId?: string) => Promise<boolean>;
  getMonthlyLegends: () => any[]; // Alunos que conseguiram itens raros
  isNessieAvailable: () => boolean; // Verifica se item raro pode ser comprado
  getGlobalLeader: () => any;       // O aluno número 1 do sistema
  grantSightingBonus: (ra: string) => void;
  systemSettings: any;              // Configurações de hardware
  updateSystemSettings: (settings: any, targetSchoolId?: string) => void;
  hardwareId: string | null;
  pendingHardwareLogin: { ra: string, terminalId: string } | null;
  terminals: Terminal[];
  requestTerminalAuthorization: (terminalId: string, hardwareId: string, location: string, schoolId: string) => boolean;
  updateTerminalStatus: (id: string, status: TerminalStatus, schoolId?: string) => void;
  updateTerminalSettings: (id: string, settings: Partial<Terminal>) => void;
  deleteTerminal: (id: string) => void;
  schools: School[];
  requestSchoolRegistration: (data: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string) => Promise<boolean>;
  registerSchool: (data: Omit<School, 'id' | 'status' | 'joinedDate'>, password?: string) => Promise<boolean>;
  updateSchoolStatus: (id: string, status: 'active' | 'pending' | 'inactive' | 'suspended', password?: string) => Promise<void>;
  updateSchools: (newSchools: School[]) => void;
  deleteSchool: (id: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  getLockoutStatus: (id: string) => { isLocked: boolean, remainingSeconds: number };
  registrationRequests: RegistrationRequest[];
  requestRegistration: (data: any) => Promise<{ success: boolean, error?: string }>;
  approveRegistration: (id: string) => Promise<boolean>;
  rejectRegistration: (id: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => Promise<boolean>;
  wasteEntries: WasteEntry[];
  registerWaste: (ra: string, type: WasteType, weightKg: number, terminalSchoolId?: string, customDate?: string) => boolean;
  identifyKioskUser: (ra: string | null) => void;
  resetHistory: CycleSnapshot[];
  performCycleReset: (password: string, schoolId?: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  changePassword: (ra: string, newPassword: string) => Promise<boolean>;
  updateMyPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  generateTerminalId: () => string;
  uploadUserAvatar: (userId: string, file: File) => Promise<string | null>;
  recordArticleRead: (articleId: string) => Promise<boolean>;
  recordRewardRedemption: (rewardId: string) => Promise<boolean>;
  isPreviewMode: boolean;
  isInitializing: boolean;
  displayUser: User | null;
  service: EcosystemService;
  setTargetSchoolId: (id: string | null) => void;
  legends: EcosystemLegend[];
  isOnline: boolean;
  isSyncingOffline: boolean;
}


const EcosystemContext = createContext<EcosystemContextType | null>(null);

export function EcosystemProvider({ children }: { children: React.ReactNode }) {
  const service = useMemo(() => new EcosystemService(), []);

  const [balance, setBalance] = useState(service.balance);
  const [points, setPoints] = useState(service.points);
  const [vitality, setVitality] = useState(service.vitality);
  const [vitalityActivated, setVitalityActivated] = useState(service.vitalityActivated);
  const [isMissionDone, setIsMissionDone] = useState(service.isMissionDone);
  const [purchasedItems, setPurchasedItems] = useState<EcosystemItem[]>(service.purchasedItems);
  const [currentUserRa, setCurrentUserRa] = useState<string | null>(service.currentUserRa);
  const [currentUserId, setCurrentUserId] = useState<string | null>(service.currentUserId);
  const [users, setUsers] = useState<User[]>(service.users);
  const [students, setStudents] = useState<User[]>(service.students);
  const [admins, setAdmins] = useState<User[]>(service.admins);
  const [staff, setStaff] = useState<User[]>(service.staff);
  const [superAdmins, setSuperAdmins] = useState<User[]>(service.superAdmins);
  const [visitors, setVisitors] = useState<User[]>(service.visitors);
  const [level, setLevel] = useState<UserLevel>('Semente');

  const [rewards, setRewards] = useState<any[]>(service.allRewards);
  const [articles, setArticles] = useState<any[]>(service.allArticles);
  const [quizTopics, setQuizTopics] = useState<QuizTopic[]>(service.allQuizTopics);
  const [participants, setParticipants] = useState<Participant[]>(service.allParticipants);
  const [turmas, setTurmas] = useState<Turma[]>(service.allTurmas);
  const [userStates, setUserStates] = useState<Record<string, any>>(service.userStates || {});

   // --- LÓGICA DE PREVIEW (MODO AUDITORIA) ---
  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');
  const qSchoolId = searchParams.get('schoolId');

  const [manualSchoolId, setManualSchoolId] = useState<string | null>(null);

  const targetSchoolId = useMemo(() => {
    // 1. Prioridade para seleção manual (ex: Dropdown de cadastro público ou troca de unidade no Admin)
    if (manualSchoolId) return manualSchoolId;

    // 2. Se for Super Admin, respeita o parâmetro da URL (?schoolId=...)
    const user = users.find(u => u.ra === currentUserRa);
    if (user?.role === 'super_admin' && qSchoolId) return qSchoolId;

    // 3. Se houver parâmetro de URL mesmo sem ser admin (ex: link direto para cadastro de unidade)
    if (qSchoolId) return qSchoolId;

    // 4. Fallback para a unidade do usuário logado
    return user?.schoolId;
  }, [qSchoolId, users, currentUserRa, manualSchoolId]);

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
    if (isPreviewMode && displayUser?.id) {
      return userStates[displayUser.id] || service.getUserState(displayUser.id);
    }
    return null;
  }, [isPreviewMode, displayUser, userStates]); // userStates garante que os pontos atualizem em tempo real no preview

  // Valores efetivos (overridden se em preview)
  const effectiveBalance = isPreviewMode && studentState ? studentState.balance : balance;
  const effectivePoints = isPreviewMode && studentState ? studentState.points : points;
  const effectiveVitality = isPreviewMode && studentState ? studentState.vitality : vitality;
  const effectiveItems = isPreviewMode && studentState ? studentState.purchasedItems : purchasedItems;
  const effectiveLevel = isPreviewMode && studentState ? studentState.level : level;

  const getUserState = (userId: string) => service.getUserState(userId);

  const [cursos, setCursos] = useState<Curso[]>(service.allCursos);
  const [cargos, setCargos] = useState<Cargo[]>(service.allCargos);
  const [setores, setSetores] = useState<SetorEscolar[]>(service.allSetores);
  const [rawAuditLogs, setRawAuditLogs] = useState<AuditLogEntry[]>(service.auditLogs);
  const [systemSettings, setSystemSettings] = useState(service.systemSettings);
  const [pendingHardwareLogin, setPendingHardwareLogin] = useState<{ ra: string, terminalId: string } | null>(null);
  const [terminals, setTerminals] = useState<Terminal[]>(service.terminals);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(service.wasteEntries);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [resetHistory, setResetHistory] = useState<CycleSnapshot[]>(service.resetHistory || []);
  const [schools, setSchools] = useState<School[]>(service.schools);
  const [legends, setLegends] = useState<EcosystemLegend[]>(service.legends);
  const [hardwareId, setHardwareId] = useState<string | null>(service.hardwareId);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Sincronização sob demanda para modo de auditoria/preview
  useEffect(() => {
    if (displayUser?.id) {
      service.initUserSpecificSync(displayUser.id);
    }
  }, [displayUser, service]);

  useEffect(() => {
    const balanceSub = service.balance$.subscribe(setBalance);
    const pointsSub = service.points$.subscribe(setPoints);
    const vitalitySub = service.vitality$.subscribe(setVitality);
    const vitActSub = service.vitalityActivated$.subscribe(setVitalityActivated);
    const raSub = service.currentUserRa$.subscribe(setCurrentUserRa);
    const idSub = service.currentUserId$.subscribe(setCurrentUserId);
    const usersSub = service.users$.subscribe(setUsers);
    const studentsSub = service.students$.subscribe(setStudents);
    const adminsSub = service.admins$.subscribe(setAdmins);
    const staffSub = service.staff$.subscribe(setStaff);
    const superAdminsSub = service.superAdmins$.subscribe(setSuperAdmins);
    const visitorsSub = service.visitors$.subscribe(setVisitors);
    const rewardsSub = service.rewards$.subscribe(setRewards);
    const articlesSub = service.articles$.subscribe(setArticles);
    const topicsSub = service.quizTopics$.subscribe(setQuizTopics);
    const participantsSub = service.participants$.subscribe(setParticipants);
    const turmasSub = service.turmas$.subscribe(setTurmas);
    const cursosSub = service.cursos$.subscribe(setCursos);
    const purchasedItemsSub = service.purchasedItems$.subscribe(setPurchasedItems);
    const auditLogsSub = service.auditLogs$.subscribe(setRawAuditLogs);
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
    const legendsSub = service.legends$.subscribe(setLegends);
    const hardwareIdSub = service.hardwareId$.subscribe(setHardwareId);

    service.initialize();
    
    // Forçamos uma atualização imediata do RA e usuários para evitar o tick de atraso do subscribe
    if (service.currentUserRa) {
      setCurrentUserRa(service.currentUserRa);
    }
    if (service.currentUserId) {
      setCurrentUserId(service.currentUserId);
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
      idSub.unsubscribe();
      usersSub.unsubscribe();
      studentsSub.unsubscribe();
      adminsSub.unsubscribe();
      staffSub.unsubscribe();
      superAdminsSub.unsubscribe();
      visitorsSub.unsubscribe();
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
      legendsSub.unsubscribe();
      hardwareIdSub.unsubscribe();
    };
  }, [service]);

  const isOnline = useNetworkStatus();
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  useEffect(() => {
    if (!isOnline || isInitializing) return;

    let isCancelled = false;

    const performSync = async () => {
      try {
        const pending = await OfflineDB.getPendingDiscards();
        if (pending.length === 0) return;

        setIsSyncingOffline(true);
        // Pequeno atraso intencional para garantir que a rede estabilizou completamente
        await new Promise(r => setTimeout(r, 4000));
        if (isCancelled) return;

        for (const item of pending) {
          if (isCancelled) break;

          const cleanInput = item.studentInput.toUpperCase().trim();
          const student = service.data?.users?.find((u: any) => 
            u.ra?.toUpperCase() === cleanInput || u.rfid?.toUpperCase() === cleanInput
          );

          if (!student || student.status === 'inactive') {
            await OfflineDB.saveFailedDiscard({
              ...item,
              reason: !student ? 'RA ou RFID inválido no banco de dados' : 'Estudante com registro inativo',
              failedAt: new Date().toISOString()
            });
            await OfflineDB.deletePendingDiscard(item.id);
            continue;
          }

          try {
            // Processa a imagem na nuvem com a IA de verdade
            const result = await identifyWasteAction({ photoDataUri: item.capturedPhotoUri });
            
            if (result && (result.isWaste || result.wasteType === 'Não reciclável')) {
              // Registra descarte e credita os pontos retroativamente com o timestamp original da coleta física
              service.registerWaste(
                student.ra || cleanInput,
                result.wasteType as any,
                result.estimatedWeightKg || item.weightKg || 0.05,
                item.terminalId,
                item.timestamp
              );
            } else {
              // Se a IA classificar como imagem inválida ou sem resíduo, rejeita
              await OfflineDB.saveFailedDiscard({
                ...item,
                reason: 'A imagem enviada foi classificada como inválida/sem resíduo',
                failedAt: new Date().toISOString()
              });
            }
          } catch (e: any) {
            // Erro temporário de conexão ou rede na rota de IA, mantém na fila para a próxima tentativa
            console.warn('[OFFLINE-SYNC] Erro temporário ao sincronizar, manterá na fila:', e);
            continue;
          }

          await OfflineDB.deletePendingDiscard(item.id);
        }
      } catch (err) {
        console.error('[OFFLINE-SYNC] Erro crítico no loop de sincronização:', err);
      } finally {
        setIsSyncingOffline(false);
      }
    };

    performSync();

    return () => {
      isCancelled = true;
    };
  }, [isOnline, isInitializing, service, users]);

  const currentUser = useMemo(() => {
    if (!currentUserRa) return null;
    return users.find((u: User) => u.ra === currentUserRa) || null;
  }, [currentUserRa, users]);

  const allRewards = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    return rewards.filter((r: Reward) => (sid && r.schoolId === sid));
  }, [rewards, currentUser, targetSchoolId]);

  const allArticles = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    return articles.filter((a: EducationArticle) => (sid && a.schoolId === sid));
  }, [articles, currentUser, targetSchoolId]);

  const allTurmas = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    return turmas.filter((t: Turma) => (sid && t.schoolId === sid));
  }, [turmas, currentUser, targetSchoolId]);

  const allQuizTopics = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    return quizTopics.filter((t: QuizTopic) => (sid && t.schoolId === sid));
  }, [quizTopics, currentUser, targetSchoolId]);

  const allCursos = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    return cursos.filter((c: Curso) => (sid && c.schoolId === sid));
  }, [cursos, currentUser, targetSchoolId]);

  const auditLogs = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    
    // Super Admin sem targetSchoolId vê tudo (opcional, dependendo da preferência)
    if (currentUser?.role === 'super_admin' && !targetSchoolId) return rawAuditLogs;

    // Se não houver unidade identificada, não mostra nada por segurança
    if (!sid && !isPreviewMode) return [];

    return rawAuditLogs.filter((l: AuditLogEntry) => l.unitId === 'MASTER' || (sid && l.unitId === sid));
  }, [rawAuditLogs, currentUser, targetSchoolId, isPreviewMode]);

  const allCargos = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    return cargos.filter((c: Cargo) => (sid && c.schoolId === sid));
  }, [cargos, currentUser, targetSchoolId]);

  const allSetores = useMemo(() => {
    const sid = targetSchoolId || currentUser?.schoolId;
    return setores.filter((s: SetorEscolar) => (sid && s.schoolId === sid));
  }, [setores, currentUser, targetSchoolId]);

  const completeDailyMission = (points: number, difficulty?: 'easy' | 'medium' | 'hard') => {
    const res = service.completeDailyMission(points, difficulty);
    if (res) {
      setIsMissionDone(true);
    }
    return res;
  };
  const deductPoints = service.deductPoints.bind(service);
  const registerAttendance = service.registerAttendance.bind(service);
  const buyUpgrade = (item: EcosystemItem) => {
    return service.buyUpgrade(item, isPreviewMode && displayUser?.id ? displayUser.id : undefined);
  };
  const healVitality = (points: number) => {
    return service.healVitality(points, isPreviewMode && displayUser?.id ? displayUser.id : undefined);
  };
  const updateParticipants = service.updateParticipants.bind(service);
  const login = (ra: string, pass?: string, terminalSchoolId?: string) => service.login(ra, pass, terminalSchoolId);
  const logout = service.logout.bind(service);
  const addPoints = service.addPoints.bind(service);
  const updateUsers = async (newUsers: User[], targetSchoolId?: string) => await service.updateUsers(newUsers, targetSchoolId);
  const deleteUser = async (userId: string) => await service.deleteUser(userId);
  const deleteReward = async (id: string, sid?: string) => await service.deleteReward(id, sid);
  const deleteArticle = async (id: string, sid?: string) => await service.deleteArticle(id, sid);
  const updateRewards = async (newRewards: Reward[], sid?: string) => await service.updateRewards(newRewards, sid);
  const updateArticles = async (newArticles: EducationArticle[], sid?: string) => await service.updateArticles(newArticles, sid);
  const updateQuizTopics = async (newTopics: QuizTopic[], sid?: string) => await service.updateQuizTopics(newTopics, sid);
  const deleteQuizTopic = async (id: string, sid?: string) => await service.deleteQuizTopic(id, sid);
  const updateTurmas = async (newTurmas: Turma[], sid?: string) => await service.updateTurmas(newTurmas, sid);
  const updateCursos = async (newCursos: Curso[], sid?: string) => await service.updateCursos(newCursos, sid);
  const updateCargos = async (newCargos: Cargo[], sid?: string) => await service.updateCargos(newCargos, sid);
  const updateSetores = async (newSetores: SetorEscolar[], sid?: string) => await service.updateSetores(newSetores, sid);
  const grantPoints = (ra: string, pts: number, sec: string, act: string, adm: string, pass?: string, tSId?: string) => service.grantPoints(ra, pts, sec, act, adm, pass, tSId);
  const getMonthlyLegends = () => service.getMonthlyLegends(targetSchoolId || undefined);
  const isNessieAvailable = () => {
    return service.isNessieAvailable(isPreviewMode && displayUser?.id ? displayUser.id : undefined);
  };
  const getGlobalLeader = service.getGlobalLeader.bind(service);
  const grantSightingBonus = service.grantSightingBonus.bind(service);
  const updateSystemSettings = service.updateSystemSettings.bind(service);
  const requestTerminalAuthorization = service.requestTerminalAuthorization.bind(service);
  const updateTerminalStatus = service.updateTerminalStatus.bind(service);
  const updateTerminalSettings = service.updateTerminalSettings.bind(service);
  const deleteTerminal = service.deleteTerminal.bind(service);
  const requestSchoolRegistration = (data: any, pass?: string) => service.requestSchoolRegistration(data, pass);
  const registerSchool = (data: any, password?: string) => service.registerSchool(data, password);
  const updateSchoolStatus = (id: any, status: any, password?: string) => service.updateSchoolStatus(id, status, password);
  const updateSchools = (newSchools: any) => service.updateSchools(newSchools);
  const deleteSchool = async (id: string, password?: string) => {
    return await service.deleteSchool(id, password);
  };
  const registerWaste = (ra: string, type: WasteType, weightKg: number, tSId?: string, customDate?: string) => service.registerWaste(ra, type, weightKg, tSId, customDate);
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
  const recordArticleRead = (articleId: string) => service.recordArticleRead(articleId);
  const recordQuizCompletion = (topicId: string, score: number, difficulty?: string, numQuestions?: number) => service.recordQuizCompletion(topicId, score, difficulty, numQuestions);
  const recordRewardRedemption = (rewardId: string) => service.recordRewardRedemption(rewardId);
  const updateUserStatus = (uId: string, s: 'active' | 'inactive') => service.updateUserStatus(uId, s);

  // Evita problemas de renderização no servidor (Next.js)
  if (!isMounted) return null;

  return (
    <EcosystemContext.Provider value={{
      balance: effectiveBalance,
      points: effectivePoints,
      vitality: effectiveVitality,
      vitalityActivated,
      isMissionDone,
      purchasedItems: effectiveItems,
      level: effectiveLevel,
      hardwareId,
      completeDailyMission,
      deductPoints,
      registerAttendance,
      buyUpgrade,
      healVitality,
      allParticipants: participants,
      updateParticipants,
      users,
      students,
      admins,
      staff,
      superAdmins,
      visitors,
      allRewards,
      allArticles,
      allQuizTopics: quizTopics,
      currentUserRa,
      currentUserId,
      currentUser: displayUser,
      login,
      logout,
      addPoints,
      updateUsers,
      deleteUser,
      deleteReward,
      deleteArticle,
      updateRewards,
      updateArticles,
      updateQuizTopics,
      deleteQuizTopic,
      allTurmas,
      allCursos,
      allCargos,
      allSetores,
      updateTurmas,
      updateCursos,
      updateCargos,
      updateSetores,
      userStates,
      getUserState,
      initUserSpecificSync: (userId: string) => service.initUserSpecificSync(userId),
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
      recordArticleRead,
      recordQuizCompletion,
      recordRewardRedemption,
      updateUserStatus,
      isPreviewMode,
      isInitializing,
      displayUser,
      service,
      setTargetSchoolId: setManualSchoolId,
      legends,
      isOnline,
      isSyncingOffline
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
