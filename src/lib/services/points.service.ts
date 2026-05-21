import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import type { User, PointTransaction, EcosystemItem, UserLevel } from '@/types/ecosystem';

export class PointsService {
  constructor(private service: any) {}

  /**
   * Determina a classificação visual do usuário (título honorário).
   */
  calculateLevel(score: number, purchasedItems?: EcosystemItem[]): UserLevel {
    const items = purchasedItems || this.service.purchasedItems;

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

  /**
   * Atualiza os pontos de um usuário usando seu ID como chave primária de estado.
   */
  syncUserPoints(identifier: string, currentBalanceChange: number, lifetimePointsGain: number, description?: string): void {
    // Resolve o usuário (pode vir por RA do Kiosk ou ID do Admin)
    const user = this.service.data.users.find((u: User) => 
      u.id === identifier || u.ra?.toUpperCase() === identifier.toUpperCase().trim()
    );

    if (!user) return;

    const userId = user.id;
    const state = this.service.data.userStates[userId] || this.service.getDefaultState(user);
    
    if (!state.pointTransactions) {
      state.pointTransactions = [];
    }

    // Registra ganho ou gasto no Ledger transacional
    if (lifetimePointsGain > 0) {
      const gainTx: PointTransaction = {
        id: EcosystemService.generateStandardId('wst-gn', user.schoolId),
        date: new Date().toISOString(),
        amount: lifetimePointsGain,
        description: description || "Crédito de Bio-Coins"
      };
      state.pointTransactions.push(gainTx);
    }

    if (currentBalanceChange < 0) {
      let amountToDeduct = Math.abs(currentBalanceChange);
      for (const tx of state.pointTransactions) {
        if (tx.amount > 0 && !tx.expired) {
          if (tx.amount >= amountToDeduct) {
            tx.amount -= amountToDeduct;
            if (tx.amount === 0) tx.expired = true;
            amountToDeduct = 0;
            break;
          } else {
            amountToDeduct -= tx.amount;
            tx.amount = 0;
            tx.expired = true;
          }
        }
      }

      const debitTx: PointTransaction = {
        id: EcosystemService.generateStandardId('wst-db', user.schoolId),
        date: new Date().toISOString(),
        amount: currentBalanceChange,
        description: description || "Uso de Bio-Coins / Upgrade",
        expired: true
      };
      state.pointTransactions.push(debitTx);
    }

    state.balance += Number(currentBalanceChange);
    state.points = (Number(state.points) || 0) + Number(lifetimePointsGain);
    state.vitality = (state.vitality !== undefined) ? state.vitality : 100;
    state.vitalityActivated = state.vitalityActivated ?? false;
    state.itemsCount = state.purchasedItems.length;

    const score = EcosystemService.calculateTotalScore(state.points, state.vitality, state.itemsCount);
    state.level = this.calculateLevel(score, state.purchasedItems);
    state.id = user.id;
    state.schoolId = user.schoolId;

    this.service.data.userStates[userId] = state;

    if (userId === this.service.data.currentUserId || user.ra?.toUpperCase() === this.service.kioskUserRaSubject.value?.toUpperCase()) {
      this.service.balanceSubject.next(state.balance);
      this.service.pointsSubject.next(state.points);
      this.service.levelSubject.next(state.level);
    }

    // Persistência Atômica no Firestore usando ID (Imutável)
    setDoc(doc(db, this.service.getUserCollection(user.role), user.id), this.service.sanitizeUserForFirestore(user));
    setDoc(doc(db, "userStates", user.id), state);

    this.service.usersSubject.next([...this.service.data.users]);
    this.service.saveToStorage();
  }

  /**
   * Recalcula a validade dos pontos (30 dias) do usuário em tempo real.
   */
  recalculatePointsValidity(userId: string): void {
    const user = this.service.data.users.find((u: User) => u.id === userId);
    const userState = this.service.data.userStates[userId] || this.service.getDefaultState(user);
    
    if (!userState.pointTransactions) {
      userState.pointTransactions = [];
    }

    const now = new Date();
    const expiryThresholdDays = 30; // 30 dias de validade
    let expiredAmount = 0;

    userState.pointTransactions.forEach((tx: PointTransaction) => {
      if (tx.amount > 0 && !tx.expired) {
        const txDate = new Date(tx.date);
        const diffTime = now.getTime() - txDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays > expiryThresholdDays) {
          tx.expired = true;
          expiredAmount += tx.amount;
        }
      }
    });

    if (expiredAmount > 0) {
      userState.balance = Math.max(0, userState.balance - expiredAmount);
      userState.points = Math.max(0, userState.points - expiredAmount);

      const expiryTx: PointTransaction = {
        id: EcosystemService.generateStandardId('wst-exp', user?.schoolId),
        date: now.toISOString(),
        amount: -expiredAmount,
        description: `Expiração de ${expiredAmount} Bio-Coins inativos (30 dias)`,
        expired: true
      };

      userState.pointTransactions.push(expiryTx);

      userState.itemsCount = userState.purchasedItems.length;
      const score = EcosystemService.calculateTotalScore(userState.points, userState.vitality, userState.itemsCount);
      userState.level = this.calculateLevel(score, userState.purchasedItems);

      this.service.data.userStates[userId] = userState;
      
      if (userId === this.service.data.currentUserId) {
        this.service.balanceSubject.next(userState.balance);
        this.service.pointsSubject.next(userState.points);
        this.service.levelSubject.next(userState.level);
      }

      setDoc(doc(db, "userStates", userId), userState, { merge: true }).catch((err: any) => {
        console.error("[FIREBASE] Erro ao salvar expiração de pontos:", err);
      });
      
      this.service.saveToStorage();
    }
  }

  addPoints(points: number, studentRa?: string, description?: string): void {
    const targetRa = (studentRa || this.service.currentUserRa)?.toUpperCase().trim();
    if (targetRa) {
      this.syncUserPoints(targetRa, points, points, description || "Bônus de Ecossistema");
    }
  }

  grantSightingBonus(ra: string): boolean {
    this.syncUserPoints(ra, 50, 50, "Bônus: Nessie Avistada na Biosfera!");
    return true;
  }

  /**
   * Concede créditos a um usuário específico (Ação Administrativa).
   */
  async grantPoints(ra: string, points: number, sector: string, action: string, adminName: string, password?: string, terminalSchoolId?: string): Promise<boolean> {
    if (password) {
      const isMatch = await this.service.verifyPassword(password);
      if (!isMatch) {
        await this.service.logTelemetry({
          action: 'LOGIN_FAIL',
          category: 'AUTH',
          details: `Falha de senha administrativa ao tentar conceder pontos para usuário da unidade.`,
          unitId: terminalSchoolId
        });
        return false;
      }
    }

    const currentAdmin = this.service.data?.users?.find((u: User) => u.ra === this.service.currentUserRa);
    const isSystemAction = adminName === 'SISTEMA' || adminName === 'SchoolGain Security';

    if (!isSystemAction && (!currentAdmin || (currentAdmin.role !== 'admin' && currentAdmin.role !== 'super_admin'))) {
      console.error('[SECURITY] Tentativa de conceder pontos por usuário não autorizado');
      return false;
    }

    const cleanRa = ra.toUpperCase().trim();
    const student = (this.service.data?.users || []).find((u: User) => u.ra === cleanRa);
    if (!student) return false;

    this.syncUserPoints(ra, points, points, `${action} (${sector})`);

    // Registra na Telemetria (Rastreabilidade Total)
    await this.service.logTelemetry({
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

  completeDailyMission(points: number): boolean {
    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    if (this.service.lastMissionDateSubject.value === today) return false;
    this.service.lastMissionDateSubject.next(today);
    
    if (this.service.currentUserRa) {
      this.syncUserPoints(this.service.currentUserRa, points, points, "Missão Diária Concluída!");
    }
    return true;
  }

  deductPoints(points: number): boolean {
    if (this.service.balance < points || !this.service.currentUserRa) return false;
    this.syncUserPoints(this.service.currentUserRa, -points, 0, "Uso de Bio-Coins / Upgrade");
    return true;
  }

  healVitality(points: number): boolean {
    if (this.service.balance < points || !this.service.currentUserRa) return false;
    const vitalityGain = Math.floor(points / 10);
    const newVitality = Math.min(100, this.service.vitality + vitalityGain);
    if (newVitality === this.service.vitality) return false;
    
    this.service.vitalitySubject.next(newVitality);
    this.syncUserPoints(this.service.currentUserRa, -points, 0, "Restauração de Vitalidade");
    return true;
  }

  registerAttendance(status: 'presente' | 'falta'): void {
    if (status === 'falta') {
      const currentUserId = this.service.data.currentUserId;
      if (currentUserId) {
        const state = this.service.data.userStates[currentUserId];
        if (state) {
          state.vitality = Math.max(0, state.vitality - 20);
          this.service.vitalitySubject.next(state.vitality);
          setDoc(doc(db, "userStates", currentUserId), { vitality: state.vitality }, { merge: true });
        }
      }
      this.service.saveToStorage();
    }
  }

  getGlobalLeader(): User | null {
    if (!this.service.data.users || this.service.data.users.length === 0) return null;
    
    const students = this.service.data.users.filter((u: User) => u.role !== 'admin' && u.role !== 'super_admin');
    if (students.length === 0) return null;

    const ranked = students
      .map((u: User) => {
        const state = this.service.data.userStates[u.id] || this.service.getDefaultState(u);
        const score = EcosystemService.calculateTotalScore(state.points || 0, state.vitality, state.purchasedItems?.length || 0);
        return { ...u, totalScore: score };
      })
      .sort((a: any, b: any) => b.totalScore - a.totalScore);
      
    return ranked[0] || null;
  }
}
