import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { EcosystemService } from '../ecosystem.service';
import type { User } from '../types';

export class AuthService {
  constructor(private service: any) {}

  /**
   * Verifica se um identificador está em período de bloqueio.
   */
  getLockoutStatus(id: string): { isLocked: boolean, remainingSeconds: number } {
    const cleanId = id.trim().toLowerCase();
    const security = this.service.data.securityState?.[cleanId];

    if (!security || !security.lockoutUntil) return { isLocked: false, remainingSeconds: 0 };

    const now = new Date();
    const lockoutDate = new Date(security.lockoutUntil);

    if (now < lockoutDate) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((lockoutDate.getTime() - now.getTime()) / 1000)
      };
    }

    return { isLocked: false, remainingSeconds: 0 };
  }

  /**
   * Autentica um usuário pelo RA ou RFID.
   */
  async login(id: string, password?: string): Promise<boolean> {
    const cleanId = id.trim();
    const cleanPassword = password?.trim();
    const securityKey = cleanId.toLowerCase();

    // 1. Verifica Lockout
    const lockout = this.getLockoutStatus(cleanId);
    if (lockout.isLocked) {
      return false;
    }

    // Busca insensível a maiúsculas/minúsculas para RA, RFID e Email
    const user = (this.service.data?.users || []).find((u: User) =>
      (u.ra && u.ra.toLowerCase() === cleanId.toLowerCase()) ||
      (u.rfid && u.rfid.toLowerCase() === cleanId.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
    );

    if (user) {
      // 2. Verifica se o usuário ou a escola estão ativos
      if (user.status === 'inactive') {
        return false;
      }

      if (user.schoolId && user.schoolId !== 'global') {
        const school = this.service.data.schools.find((s: any) => s.id === user.schoolId);
        if (school && (school.status === 'inactive' || school.status === 'suspended')) {
          return false;
        }
      }

      // 3. Lógica diferenciada por cargo
      if (cleanPassword) {
        if (user.role === 'super_admin') {
          // Super Admins continuam usando a segurança nativa do Firebase Auth
          try {
            await signInWithEmailAndPassword(auth, user.email!, cleanPassword);
          } catch (firebaseError: any) {
            console.error("[FIREBASE] Falha no login do Super Admin:", firebaseError);
            this.handleFailedLogin(securityKey);
            return false;
          }
        } else {
          // Gestores e Usuários utilizam a lógica SHA-256 customizada
          const hashedInput = await EcosystemService.hashPassword(cleanPassword);
          const isMatch = user.password === hashedInput || user.password === cleanPassword;

          if (!isMatch) {
            this.handleFailedLogin(securityKey);
            return false;
          }
        }
      }

      const ra = user.ra!;
      this.service.data.currentUserRa = ra;
      this.service.data.currentUserId = user.id;
      this.service.currentUserRaSubject.next(ra);
      this.service.currentUserIdSubject.next(user.id);
      this.service.syncStateWithUser(user.id);
      
      // Se for gestor, iniciamos a sincronização em massa da unidade
      if ((user.role === 'admin' || user.role === 'super_admin') && user.schoolId) {
        this.service.initAdminSync(user.schoolId);
      }

      this.resetSecurityState(securityKey);

      // Telemetria de Login
      await this.service.logTelemetry({
        action: 'LOGIN_SUCCESS',
        category: 'AUTH',
        details: `Login realizado com sucesso: ${user.name} (${user.role})`,
        unitId: user.schoolId === 'MASTER' || !user.schoolId ? 'MASTER' : user.schoolId
      });

      this.service.saveToStorage();
      return true;
    }

    await this.service.logTelemetry({
      action: 'LOGIN_FAIL',
      category: 'AUTH',
      details: `Falha de autenticação para credencial protegida.`
    });
    this.handleFailedLogin(securityKey);
    return false;
  }

  /**
   * Finaliza a sessão do usuário.
   */
  logout() {
    this.service.data.currentUserRa = null;
    this.service.data.currentUserId = null;
    this.service.currentUserRaSubject.next(null);
    this.service.currentUserIdSubject.next(null);
    this.service.balanceSubject.next(0);
    this.service.vitalitySubject.next(100);
    this.service.purchasedItemsSubject.next([]);
    this.service.lastMissionDateSubject.next(null);
    this.service.saveToStorage();

    // Sign out from Firebase
    signOut(auth).catch(err => console.error("[FIREBASE] Erro ao deslogar:", err));
  }

  /**
   * Verifica se o usuário atual tem permissões de administrador.
   */
  checkAdminAuth(): boolean {
    const ra = this.service.currentUserRa;
    if (!ra) return false;
    const user = this.service.data.users.find((u: User) => u.ra?.toUpperCase() === ra.toUpperCase());
    return !!(user && (user.role === 'admin' || user.role === 'super_admin'));
  }

  /**
   * Registra uma falha de login e aplica bloqueio se necessário.
   */
  handleFailedLogin(id: string) {
    if (!this.service.data.securityState) this.service.data.securityState = {};

    const security = this.service.data.securityState[id] || { failedAttempts: 0, lockoutUntil: null };
    security.failedAttempts += 1;

    // Bloqueio progressivo: 5, 10, 15... falhas
    if (security.failedAttempts >= 5) {
      const minutes = Math.min(60, Math.pow(2, Math.floor(security.failedAttempts / 5)) * 5);
      const lockoutDate = new Date();
      lockoutDate.setMinutes(lockoutDate.getMinutes() + minutes);
      security.lockoutUntil = lockoutDate.toISOString();

      this.service.grantPoints('SECURITY_ALERT', 0, 'SISTEMA', `BLOQUEIO: ${id} após ${security.failedAttempts} falhas`, 'SchoolGain Security');
    }

    this.service.data.securityState[id] = security;
    this.service.saveToStorage();
  }

  /**
   * Reseta o estado de segurança após sucesso.
   */
  resetSecurityState(id: string) {
    if (this.service.data.securityState?.[id]) {
      delete this.service.data.securityState[id];
      this.service.saveToStorage();
    }
  }

  /**
   * Verifica se a senha fornecida pertence ao usuário atualmente logado.
   */
  async verifyPassword(password: string): Promise<boolean> {
    const ra = this.service.currentUserRaSubject.value;
    if (!ra || !this.service.data?.users) return false;
    const user = this.service.data.users.find((u: User) => u.ra === ra);
    if (!user || !user.password) return false;

    const hashedInput = await EcosystemService.hashPassword(password);
    return user.password === hashedInput;
  }
}
