import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import { POINTS_MAPPING } from '../constants';
import type { WasteEntry, WasteType, CycleSnapshot, User } from '@/types/ecosystem';

export class WasteService {
  constructor(private service: any) {}

  /**
   * Registra o processamento de resíduos e atribui créditos ao usuário.
   */
  registerWaste(ra: string, type: WasteType, weightKg: number, terminalSchoolId?: string, customDate?: string): boolean {
    const cleanRa = ra.toUpperCase().trim();
    const student = (this.service.data?.users || []).find((u: User) => u.ra?.toUpperCase() === cleanRa);
    if (!student) {
      return false;
    }

    // Gera pontos baseados no mapeamento de constantes (ex: Plástico=10, Metal=15)
    // Multiplicamos pelo peso apenas se o peso for significativo (> 1kg), caso contrário assume 1 unidade
    const basePoints = POINTS_MAPPING[type] || 0;
    const points = weightKg >= 1 ? Math.floor(weightKg * basePoints) : basePoints;

    const newEntry: WasteEntry = {
      id: EcosystemService.generateStandardId('wst', student.schoolId),
      date: customDate || new Date().toISOString(),
      type: type,
      collected: weightKg,
      studentId: student.id,
      schoolId: terminalSchoolId || student.schoolId,
      points: points
    };

    this.service.logTelemetry({
      action: 'POINTS_AWARDED',
      category: 'ECOSYSTEM',
      details: `Coleta de resíduos (${type}): ${weightKg}kg convertidos em ${points} Bio-Coins.`,
      studentName: student.name,
      targetId: student.id,
      points: points,
      unitId: terminalSchoolId || student.schoolId
    });

    this.service.addPoints(points, cleanRa, `Coleta de ${type} (${weightKg.toFixed(3)} kg)`);

    this.service.data.wasteEntries = [...(this.service.data.wasteEntries || []), newEntry];
    this.service.wasteEntriesSubject.next([...this.service.data.wasteEntries]);

    // Salva no Firestore
    setDoc(doc(db, "wasteEntries", newEntry.id), newEntry).catch(err => {
      console.error("[FIREBASE] Erro ao salvar coleta:", err);
    });

    this.service.saveToStorage();
    return true;
  }

  /**
   * Finaliza um ciclo de coletas, gera snapshot de histórico, zera pontuações e limpa logs.
   */
  async performCycleReset(password: string, schoolId?: string): Promise<boolean> {
    const isMatch = await this.service.verifyPassword(password);
    if (!isMatch) {
      console.error('[SECURITY] Senha incorreta para reset de ciclo');
      return false;
    }

    const currentAdmin = this.service.data?.users?.find((u: User) => u.ra === this.service.currentUserRa);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      console.error('[SECURITY] Tentativa de reset de ciclo por usuário não autorizado');
      return false;
    }

    // 1. GERA SNAPSHOT
    const participants = (this.service.data?.users || []).filter((u: User) => (u.role === 'student' || u.role === 'staff' || u.role === 'admin') && (!schoolId || u.schoolId === schoolId));
    const relevantWaste = (this.service.data?.wasteEntries || []).filter((w: any) => !schoolId || w.schoolId === schoolId);

    const snapshot: CycleSnapshot = {
      id: `cycle-${Date.now()}`,
      endDate: new Date().toISOString(),
      totalWasteKg: relevantWaste.reduce((acc: number, curr: any) => acc + curr.collected, 0),
      totalPoints: participants.reduce((acc: number, curr: User) => {
        const state = this.service.data.userStates[curr.id] || this.service.getDefaultState(curr);
        return acc + (state.points || 0);
      }, 0),
      topStudents: [...participants]
        .sort((a: User, b: User) => {
          const stateA = this.service.data.userStates[a.id] || this.service.getDefaultState(a);
          const stateB = this.service.data.userStates[b.id] || this.service.getDefaultState(b);
          return (stateB.points || 0) - (stateA.points || 0);
        })
        .slice(0, 5)
        .map((s: User) => {
          const state = this.service.data.userStates[s.id] || this.service.getDefaultState(s);
          return { name: s.name, points: state.points || 0, studentId: s.id };
        }),
      wasteByType: relevantWaste.reduce((acc: any, curr: any) => {
        acc[curr.type] = (acc[curr.type] || 0) + curr.collected;
        return acc;
      }, {} as Record<string, number>),
      schoolId
    };

    // 2. SALVA NO HISTÓRICO E LOGA TELEMETRIA
    this.service.data.resetHistory = [snapshot, ...(this.service.data.resetHistory || [])];
    this.service.resetHistorySubject.next(this.service.data.resetHistory);

    await this.service.logTelemetry({
      action: 'SYSTEM_RESET',
      category: 'SYSTEM',
      details: `Reset de ciclo executado para ${!schoolId || schoolId === 'all' ? 'toda a rede' : `unidade ${schoolId}`}`,
      unitId: !schoolId || schoolId === 'all' ? 'MASTER' : schoolId,
      metadata: { snapshotId: snapshot.id, totalPoints: snapshot.totalPoints, totalWaste: snapshot.totalWasteKg }
    });

    // 3. LIMPEZA DE DADOS (RESET)
    // Zera pontos e níveis dos usuários no userStates
    for (const u of participants) {
      const state = this.service.data.userStates[u.id] || this.service.getDefaultState(u);
      state.points = 0;
      state.level = 'Semente';
      state.id = u.id;
      state.schoolId = u.schoolId;
      
      this.service.data.userStates[u.id] = state;
      await setDoc(doc(db, "userStates", u.id), state);
    }

    // Sincroniza as listas locais para refletir os novos estados zerados
    this.service.syncCombinedUsers(false);

    // Limpa coletas (localmente e no Firestore)
    if (this.service.data.wasteEntries) {
      const wasteToDelete = this.service.data.wasteEntries.filter((w: any) => !schoolId || w.schoolId === schoolId);
      for (const w of wasteToDelete) {
        deleteDoc(doc(db, "wasteEntries", w.id)).catch(err => console.error("Erro ao deletar coleta:", err));
      }
      this.service.data.wasteEntries = this.service.data.wasteEntries.filter((w: any) => schoolId && w.schoolId !== schoolId);
    }

    // Limpa logs de auditoria (localmente e no Firestore)
    if (this.service.data.auditLogs) {
      const logsToDelete = this.service.data.auditLogs.filter((l: any) => !schoolId || l.unitId === schoolId);
      for (const l of logsToDelete) {
        deleteDoc(doc(db, "auditLogs", l.id)).catch(err => console.error("Erro ao deletar log:", err));
      }
      this.service.data.auditLogs = this.service.data.auditLogs.filter((l: any) => schoolId && l.unitId !== schoolId);
    }

    // Reseta estados de ecossistema (vitalidade e itens)
    Object.keys(this.service.data.userStates).forEach(id => {
      const user = this.service.data.users.find((u: User) => u.id === id);
      if (user && (!schoolId || user.schoolId === schoolId)) {
        this.service.data.userStates[id] = this.service.getDefaultState(user);
      }
    });

    // 4. NOTIFICA E PERSISTE NO FIRESTORE
    this.service.usersSubject.next([...this.service.data.users]);
    this.service.wasteEntriesSubject.next([...this.service.data.wasteEntries]);
    this.service.auditLogsSubject.next([...this.service.data.auditLogs]);

    // Salva o snapshot no Firestore
    setDoc(doc(db, "resetHistory", snapshot.id), snapshot);

    // Atualiza todos os usuários resetados no Firestore usando ID único
    this.service.data.users.forEach((u: User) => {
      if (u.role === 'student' && (!schoolId || u.schoolId === schoolId)) {
        setDoc(doc(db, this.service.getUserCollection(u.role), u.id), this.service.sanitizeUserForFirestore(u));
      }
    });

    // Limpa estados de ecossistema no Firestore
    Object.keys(this.service.data.userStates).forEach(id => {
      const user = this.service.data.users.find((u: User) => u.id === id);
      if (user && (!schoolId || user.schoolId === schoolId)) {
        setDoc(doc(db, "userStates", id), this.service.data.userStates[id]);
      }
    });

    // Se o usuário logado foi resetado, atualiza saldo local
    if (this.service.data.currentUserId) {
      this.service.syncStateWithUser(this.service.data.currentUserId);
    }

    this.service.saveToStorage();
    return true;
  }
}
