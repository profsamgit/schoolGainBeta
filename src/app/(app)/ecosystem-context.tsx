'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { EcosystemService, EcosystemItem } from '@/lib/ecosystem.service';
import { Participant, AuditLogEntry } from '@/lib/types';

interface EcosystemContextType {
  balance: number;
  vitality: number;
  isMissionDone: boolean;
  purchasedItems: EcosystemItem[];
  completeDailyMission: (points: number) => boolean;
  deductPoints: (points: number) => boolean;
  registerAttendance: (status: 'presente' | 'falta') => void;
  buyUpgrade: (item: EcosystemItem) => boolean;
  healVitality: (points: number) => boolean;
  // Novos campos e métodos
  allParticipants: Participant[];
  updateParticipants: (newParticipants: Participant[]) => void;
  users: any[];
  allRewards: any[];
  allArticles: any[];
  allQuizTopics: string[];
  currentUserRa: string | null;
  currentUser: any | null;
  login: (ra: string) => boolean;
  logout: () => void;
  addPoints: (points: number, studentRa?: string) => void;
  updateUsers: (newUsers: any[]) => void;
  updateRewards: (newRewards: any[]) => void;
  updateArticles: (newArticles: any[]) => void;
  updateQuizTopics: (newTopics: string[]) => void;
  allTurmas: string[];
  allCursos: string[];
  updateTurmas: (newTurmas: string[]) => void;
  updateCursos: (newCursos: string[]) => void;
  getUserState: (ra: string) => any;
  auditLogs: AuditLogEntry[];
  grantPoints: (ra: string, points: number, sector: string, action: string, adminName: string) => boolean;
  getMonthlyLegends: () => any[];
  isNessieAvailable: () => boolean;
  getGlobalLeader: () => any;
  grantSightingBonus: (ra: string) => void;
}

const EcosystemContext = createContext<EcosystemContextType | null>(null);

export function EcosystemProvider({ children }: { children: React.ReactNode }) {
  // O serviço é instanciado uma única vez
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
  const [turmas, setTurmas] = useState<string[]>(service.allTurmas);
  const [cursos, setCursos] = useState<string[]>(service.allCursos);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(service.auditLogs);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Subscrever aos BehaviorSubjects para atualizar o estado do React em tempo real
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
    
    // Inicializar o serviço (disparar carga do localStorage)
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
    };
  }, [service]);

  // Helper para obter o objeto do usuário logado
  const currentUser = useMemo(() => {
    if (!currentUserRa) return null;
    return users.find((u: any) => u.ra === currentUserRa) || null;
  }, [currentUserRa, users]);

  const value = {
    balance,
    vitality,
    isMissionDone,
    purchasedItems,
    completeDailyMission: (points: number) => {
      const res = service.completeDailyMission(points);
      if (res) {
        setIsMissionDone(true);
      }
      return res;
    },
    deductPoints: service.deductPoints.bind(service),
    registerAttendance: service.registerAttendance.bind(service),
    buyUpgrade: (item: EcosystemItem) => {
      return service.buyUpgrade(item);
    },
    healVitality: (points: number) => {
      return service.healVitality(points);
    },
    // Novas exportações
    allParticipants: participants,
    updateParticipants: service.updateParticipants.bind(service),
    users,
    allRewards: rewards,
    allArticles: articles,
    allQuizTopics: quizTopics,
    currentUserRa,
    currentUser,
    login: service.login.bind(service),
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
    grantPoints: service.grantPoints.bind(service),
    getMonthlyLegends: service.getMonthlyLegends.bind(service),
    isNessieAvailable: service.isNessieAvailable.bind(service),
    getGlobalLeader: service.getGlobalLeader.bind(service),
    grantSightingBonus: service.grantSightingBonus.bind(service),
  };

  // Evitar hidratação (SSR) inconsistente
  if (!isMounted) return null;

  return (
    <EcosystemContext.Provider value={value}>
      {children}
    </EcosystemContext.Provider>
  );
}

export function useEcosystem() {
  const context = useContext(EcosystemContext);
  if (!context) {
    throw new Error('useEcosystem must be used within an EcosystemProvider');
  }
  return context;
}
