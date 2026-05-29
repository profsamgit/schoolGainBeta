import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import { DEPRECIATION_CONFIG } from '../constants';
import type { 
  EcosystemUserState, 
  DepreciationPhase, 
  DepreciationEvent, 
  EcosystemItem, 
  User, 
  PointTransaction 
} from '@/types/ecosystem';

export class DepreciationService {
  constructor(private service: any) {}

  /**
   * Verifica e aplica depreciação no login.
   * Retorna o último evento de depreciação aplicado, ou null se não houve impacto.
   */
  checkAndApplyDepreciation(userId: string): DepreciationEvent | null {
    const user = this.service.data.users.find((u: User) => u.id === userId);
    if (!user || user.role !== 'student') return null;

    const state = this.service.data.userStates[userId] || this.service.getDefaultState(user);

    if (this.hasLegendImmunity(state)) {
      return null;
    }

    const inactiveDays = this.getInactiveDays(state);
    if (inactiveDays < DEPRECIATION_CONFIG.GRACE_DAYS) {
      return null;
    }

    // Executa as fases elegíveis em ordem cronológica
    const phases: DepreciationPhase[] = ['alert', 'decline', 'collapse', 'extinction'];
    let lastAppliedEvent: DepreciationEvent | null = null;
    let anyApplied = false;

    for (const phase of phases) {
      const phaseConfig = DEPRECIATION_CONFIG.PHASES[phase];
      if (inactiveDays >= phaseConfig.minDays && !this.wasPhaseAlreadyApplied(state, phase)) {
        const event = this.applyPhase(state, phase, inactiveDays);
        if (event) {
          lastAppliedEvent = event;
          anyApplied = true;
          this.logDepreciation(userId, user.name, user.schoolId || '', event);
        }
      }
    }

    if (anyApplied) {
      this.service.data.userStates[userId] = state;
      
      // Sincroniza subjects reativos se for o usuário atual
      if (userId === this.service.data.currentUserId) {
        this.service.balanceSubject.next(state.balance);
        this.service.pointsSubject.next(state.points);
        this.service.vitalitySubject.next(state.vitality);
        this.service.levelSubject.next(state.level);
        this.service.purchasedItemsSubject.next(state.purchasedItems);
      }

      // Persiste no Firestore
      setDoc(doc(db, "userStates", userId), state, { merge: true }).catch((err: any) => {
        console.error("[DEPRECIATION] Erro ao salvar estado depreciado:", err);
      });

      this.service.userStatesSubject.next({ ...this.service.data.userStates });
      this.service.saveToStorage();
    }

    return lastAppliedEvent;
  }

  /**
   * Calcula dias inativos a partir de lastActivityDate.
   */
  private getInactiveDays(state: EcosystemUserState): number {
    if (!state.lastActivityDate) return 0;
    const lastActivity = new Date(state.lastActivityDate).getTime();
    const now = new Date().getTime();
    const diffTime = now - lastActivity;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica imunidade de Guardião da Lenda (30 dias).
   */
  private hasLegendImmunity(state: EcosystemUserState): boolean {
    if (!state.nessiePurchaseDate) return false;
    const purchaseDate = new Date(state.nessiePurchaseDate).getTime();
    const now = new Date().getTime();
    const diffDays = (now - purchaseDate) / (1000 * 60 * 60 * 24);
    return diffDays <= DEPRECIATION_CONFIG.LEGEND_IMMUNITY_DAYS;
  }

  /**
   * Verifica se esta fase já foi aplicada neste ciclo.
   */
  private wasPhaseAlreadyApplied(state: EcosystemUserState, phase: DepreciationPhase): boolean {
    if (!state.depreciationLog || !state.lastActivityDate) return false;
    const lastActivity = new Date(state.lastActivityDate).getTime();
    return state.depreciationLog.some(event => {
      return event.phase === phase && new Date(event.date).getTime() > lastActivity;
    });
  }

  /**
   * Aplica as penalidades da fase ao estado.
   */
  private applyPhase(state: EcosystemUserState, phase: DepreciationPhase, inactiveDays: number): DepreciationEvent {
    const phaseConfig = DEPRECIATION_CONFIG.PHASES[phase];
    
    // 1. Calcular perda de Vitalidade
    const oldVitality = state.vitality !== undefined ? state.vitality : 100;
    let newVitality = oldVitality;
    
    if ('vitalityForceZero' in phaseConfig && phaseConfig.vitalityForceZero) {
      newVitality = 0;
    } else if ('vitalityLossPerDay' in phaseConfig) {
      const loss = inactiveDays * phaseConfig.vitalityLossPerDay;
      newVitality = Math.max(0, oldVitality - loss);
    }
    const vitalityLost = oldVitality - newVitality;
    state.vitality = newVitality;

    // 2. Calcular perda de Coins e Points
    const coinsLost = Math.floor(state.balance * phaseConfig.coinsLossPct);
    const pointsLost = Math.floor(state.points * phaseConfig.pointsLossPct);

    state.balance = Math.max(0, state.balance - coinsLost);
    state.points = Math.max(0, state.points - pointsLost);

    // Registra transação de perda, se houver
    if (pointsLost > 0 || coinsLost > 0) {
      const depTx: PointTransaction = {
        id: EcosystemService.generateStandardId('wst-dep', state.schoolId),
        date: new Date().toISOString(),
        amount: -pointsLost,
        description: `Depreciação (${phase}): -${pointsLost} pts, -${coinsLost} coins`,
        expired: true
      };
      if (!state.pointTransactions) state.pointTransactions = [];
      state.pointTransactions.push(depTx);
    }

    // 3. Remover itens
    let itemsRemoved: EcosystemItem[] = [];
    if (phase === 'collapse') {
      itemsRemoved = state.purchasedItems.filter(item => 
        (DEPRECIATION_CONFIG.COLLAPSE_ITEMS as readonly string[]).includes(item)
      );
      state.purchasedItems = state.purchasedItems.filter(item => 
        !(DEPRECIATION_CONFIG.COLLAPSE_ITEMS as readonly string[]).includes(item)
      );
    } else if (phase === 'extinction') {
      const allToRemove = [...DEPRECIATION_CONFIG.COLLAPSE_ITEMS, ...DEPRECIATION_CONFIG.EXTINCTION_ITEMS] as readonly string[];
      itemsRemoved = state.purchasedItems.filter(item => 
        allToRemove.includes(item)
      );
      state.purchasedItems = state.purchasedItems.filter(item => 
        !allToRemove.includes(item)
      );
    }
    state.itemsCount = state.purchasedItems.length;

    // 4. Recalcular Level
    const score = EcosystemService.calculateTotalScore(state.points, state.vitality, state.itemsCount);
    state.level = this.service.pointsService.calculateLevel(score, state.purchasedItems);

    // 5. Criar evento de log
    const event: DepreciationEvent = {
      date: new Date().toISOString(),
      phase,
      inactiveDays,
      pointsLost,
      coinsLost,
      vitalityLost,
      itemsRemoved
    };

    if (!state.depreciationLog) {
      state.depreciationLog = [];
    }
    state.depreciationLog.push(event);

    return event;
  }

  /**
   * Registra telemetria de auditoria.
   */
  private logDepreciation(userId: string, studentName: string, schoolId: string, event: DepreciationEvent): void {
    const details = `Depreciação (${event.phase}) aplicada. Inativo por ${event.inactiveDays} dias. ` +
      `Perdeu ${event.pointsLost} pts, ${event.coinsLost} coins e ${event.vitalityLost}% de vitalidade. ` +
      `Itens removidos: ${event.itemsRemoved.length} itens (${event.itemsRemoved.join(', ') || 'nenhum'}).`;

    this.service.logTelemetry({
      action: 'DEPRECIATION_APPLIED',
      category: 'ECOSYSTEM',
      details,
      studentName,
      targetEntity: 'users',
      targetId: userId,
      points: -event.pointsLost,
      unitId: schoolId,
      metadata: {
        phase: event.phase,
        inactiveDays: event.inactiveDays,
        pointsLost: event.pointsLost,
        coinsLost: event.coinsLost,
        vitalityLost: event.vitalityLost,
        itemsRemoved: event.itemsRemoved
      }
    }).catch((err: any) => {
      console.error("[DEPRECIATION] Erro ao registrar telemetria:", err);
    });
  }
}
