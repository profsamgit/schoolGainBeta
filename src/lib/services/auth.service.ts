import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
        // INTERCEPTADOR PROATIVO: Auto-Recovery
        // Só tentamos o Firebase Auth primeiro se o e-mail pertencer a um Super Admin no banco,
        // ou se for o e-mail padrão do administrador mock, para evitar erros 400 desnecessários no console para Gestores/Usuários.
        const isSuperAdminEmail = cleanId.toLowerCase() === 'super-admin@schoolgain.com' || 
          (this.service.data?.users || []).some((u: User) => 
            u.role === 'super_admin' && u.email && u.email.toLowerCase() === cleanId.toLowerCase()
          );

        if (cleanId.includes('@') && isSuperAdminEmail) {
          try {
            await signInWithEmailAndPassword(auth, cleanId, cleanPassword);
            await new Promise(resolve => setTimeout(resolve, 1500));
            return true; // O listener onAuthStateChanged assumirá o controle
          } catch (e) {
            // Não é um Super Admin no Firebase, prossegue para validação local normal.
          }
        }

        if (user.role === 'super_admin') {
          // Super Admins continuam usando a segurança nativa do Firebase Auth
          try {
            await signInWithEmailAndPassword(auth, user.email!, cleanPassword);
          } catch (firebaseError: any) {
            console.warn("[FIREBASE] Falha no login do Super Admin no Firebase Auth, tentando local fallback:", firebaseError);
            
            // Fallback Local Hash para Super Admins (essencial se criados localmente, se o e-mail mudou, ou se a senha foi resetada localmente)
            const hashedInput = await EcosystemService.hashPassword(cleanPassword);
            const isMatch = user.password === hashedInput || user.password === cleanPassword;
            if (!isMatch) {
              this.handleFailedLogin(securityKey);
              return false;
            }
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

    // FALLBACK: Auto-Recovery de Super Admin
    // Se o usuário não foi encontrado no cache local, mas forneceu um email e senha,
    // tentamos autenticar diretamente no Firebase Auth.
    // Se o Firebase autorizar, o listener onAuthStateChanged cuidará da criação dinâmica.
    if (cleanPassword && cleanId.includes('@')) {
      try {
        await signInWithEmailAndPassword(auth, cleanId, cleanPassword);
        
        // Aguarda brevemente para que o listener global injete o perfil e sincronize
        await new Promise(resolve => setTimeout(resolve, 1500));
        return true;
      } catch (err) {
        // Falhou no firebase também, prossegue para o log de erro padrão abaixo
      }
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
    const userId = this.service.currentUserId;
    if (!ra && !userId) return false;
    const user = this.service.data.users.find((u: User) => 
      (ra && u.ra?.toUpperCase() === ra.toUpperCase()) || 
      (userId && u.id === userId)
    );
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

  /**
   * Altera a senha de um usuário (principalmente gestores).
   */
  async changePassword(ra: string, newPassword: string): Promise<boolean> {
    const userIndex = this.service.data.users.findIndex((u: User) => u.ra === ra);
    if (userIndex !== -1) {
      const hashedPassword = await EcosystemService.hashPassword(newPassword);
      const user = this.service.data.users[userIndex];
      user.password = hashedPassword;
      user.mustChangePassword = false;

      this.service.usersSubject.next([...this.service.data.users]);

      // Sincroniza no Firestore usando ID único
      await setDoc(doc(db, this.service.getUserCollection(user.role), user.id), this.service.sanitizeUserForFirestore(user));

      this.service.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Altera a própria senha, exigindo a senha atual.
   */
  async updateMyPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const ra = this.service.currentUserRaSubject.value;
    if (!ra) return false;
    
    const user = this.service.data.users.find((u: User) => u.ra === ra);
    if (!user) return false;

    const hashedCurrent = await EcosystemService.hashPassword(currentPassword);
    const isStoredHashed = user.password && user.password.length === 64;
    
    const isMatch = isStoredHashed 
      ? user.password === hashedCurrent 
      : user.password === currentPassword;

    if (isMatch) {
      user.password = await EcosystemService.hashPassword(newPassword);
      this.service.usersSubject.next([...this.service.data.users]);
      
      // Sincroniza no Firestore usando ID único
      await setDoc(doc(db, this.service.getUserCollection(user.role), user.id), this.service.sanitizeUserForFirestore(user));
      
      this.service.saveToStorage();
      return true;
    }
    return false;
  }
}
