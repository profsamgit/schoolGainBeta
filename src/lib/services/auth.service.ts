import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import type { User } from '@/types/ecosystem';

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
   * Autentica um usuário pelo RA, RFID ou E-mail.
   */
  async login(id: string, password?: string, terminalSchoolId?: string): Promise<boolean> {
    const cleanId = id.trim();
    const cleanPassword = password?.trim();
    const securityKey = cleanId.toLowerCase();

    console.log(`[AUTH-DIAGNOSTIC] --- Início do Processo de Login ---`);
    console.log(`[AUTH-DIAGNOSTIC] Identificador original: "${id}"`);
    console.log(`[AUTH-DIAGNOSTIC] Identificador limpo (cleanId): "${cleanId}"`);
    console.log(`[AUTH-DIAGNOSTIC] Terminal School ID: "${terminalSchoolId}"`);
    console.log(`[AUTH-DIAGNOSTIC] Quantidade de usuários no cache local: ${this.service.data?.users?.length || 0}`);

    // 1. Verifica Lockout
    const lockout = this.getLockoutStatus(cleanId);
    if (lockout.isLocked) {
      console.warn(`[AUTH-DIAGNOSTIC] Login recusado: Usuário está bloqueado temporariamente por excesso de tentativas.`);
      return false;
    }

    // Busca todos os candidatos correspondentes ao identificador (RA, RFID ou E-mail)
    let candidates = (this.service.data?.users || []).filter((u: User) =>
      (u.ra && u.ra.trim().toLowerCase() === cleanId.trim().toLowerCase()) ||
      (u.rfid && u.rfid.trim().toLowerCase() === cleanId.trim().toLowerCase()) ||
      (u.email && u.email.trim().toLowerCase() === cleanId.trim().toLowerCase())
    );

    if (candidates.length === 0) {
      console.log(`[AUTH-DIAGNOSTIC] Nenhum candidato encontrado localmente para o identificador "${cleanId}". Iniciando busca direta no Firestore...`);
      const collections = ['students', 'admins', 'staff', 'super_admins', 'visitors'];
      const { getDocs, query, collection, where } = await import('firebase/firestore');
      
      for (const colName of collections) {
        try {
          const queries = [
            query(collection(db, colName), where("email", "==", cleanId.trim())),
            query(collection(db, colName), where("email", "==", cleanId.trim().toLowerCase())),
            query(collection(db, colName), where("ra", "==", cleanId.trim())),
            query(collection(db, colName), where("ra", "==", cleanId.trim().toUpperCase())),
            query(collection(db, colName), where("rfid", "==", cleanId.trim()))
          ];
          
          for (const q of queries) {
            const snap = await getDocs(q);
            if (!snap.empty) {
              snap.forEach(docSnap => {
                const u = docSnap.data() as User;
                u.id = docSnap.id;
                if (!candidates.some((c: User) => c.id === u.id)) {
                  candidates.push(u);
                  console.log(`[AUTH-DIAGNOSTIC] Usuário encontrado na coleção "${colName}":`, u.name, `(${u.role})`);
                }
              });
            }
          }
        } catch (colErr) {
          console.error(`[AUTH-DIAGNOSTIC] Erro ao buscar na coleção "${colName}":`, colErr);
        }
      }

      if (candidates.length > 0) {
        const currentUsers = [...(this.service.data?.users || [])];
        candidates.forEach((u: User) => {
          const idx = currentUsers.findIndex((existing: User) => existing.id === u.id);
          if (idx !== -1) {
            currentUsers[idx] = u;
            console.log(`[AUTH-DIAGNOSTIC] Atualizando usuário "${u.name}" no cache reativo local.`);
          } else {
            currentUsers.push(u);
            console.log(`[AUTH-DIAGNOSTIC] Injetando usuário "${u.name}" no cache reativo local.`);
          }
        });
        this.service.data.users = currentUsers;
        this.service.usersSubject.next(currentUsers);
        
        candidates.forEach((u: User) => {
          const colKey = this.service.getUserCollection(u.role);
          if (colKey === 'students') {
            const list = [...(this.service.studentsSubject.value || [])];
            const idx = list.findIndex((x: User) => x.id === u.id);
            if (idx !== -1) list[idx] = u;
            else list.push(u);
            this.service.studentsSubject.next(list);
          } else if (colKey === 'admins') {
            const list = [...(this.service.adminsSubject.value || [])];
            const idx = list.findIndex((x: User) => x.id === u.id);
            if (idx !== -1) list[idx] = u;
            else list.push(u);
            this.service.adminsSubject.next(list);
          } else if (colKey === 'super_admins') {
            const list = [...(this.service.superAdminsSubject.value || [])];
            const idx = list.findIndex((x: User) => x.id === u.id);
            if (idx !== -1) list[idx] = u;
            else list.push(u);
            this.service.superAdminsSubject.next(list);
          } else if (colKey === 'staff') {
            const list = [...(this.service.staffSubject.value || [])];
            const idx = list.findIndex((x: User) => x.id === u.id);
            if (idx !== -1) list[idx] = u;
            else list.push(u);
            this.service.staffSubject.next(list);
          } else if (colKey === 'visitors') {
            const list = [...(this.service.visitorsSubject.value || [])];
            const idx = list.findIndex((x: User) => x.id === u.id);
            if (idx !== -1) list[idx] = u;
            else list.push(u);
            this.service.visitorsSubject.next(list);
          }
        });
      }
    }

    console.log(`[AUTH-DIAGNOSTIC] Candidatos correspondentes encontrados: ${candidates.length}`);
    candidates.forEach((c: User, idx: number) => {
      console.log(`[AUTH-DIAGNOSTIC] Candidato [${idx}]: ID=${c.id}, Nome="${c.name}", Role="${c.role}", SchoolId="${c.schoolId}", Status="${c.status}", Email="${c.email}", RA="${c.ra}"`);
    });

    let user = candidates.length > 0 ? candidates[0] : null;

    if (candidates.length > 1) {
      console.log(`[AUTH-DIAGNOSTIC] Múltiplos candidatos encontrados. Refinando seleção...`);
      if (cleanPassword) {
        const hashedInput = await EcosystemService.hashPassword(cleanPassword);
        const matchingPasswordCandidates = candidates.filter((c: User) => {
          if (c.role === 'super_admin') {
            return true; // Mantém super_admins para validação nativa do Firebase
          }
          return c.password === hashedInput || c.password === cleanPassword;
        });

        console.log(`[AUTH-DIAGNOSTIC] Candidatos com senha correspondente: ${matchingPasswordCandidates.length}`);

        if (matchingPasswordCandidates.length === 1) {
          user = matchingPasswordCandidates[0];
        } else if (matchingPasswordCandidates.length > 1) {
          // Em caso de empate na senha, prioriza o que pertence ao terminal ativo
          if (terminalSchoolId) {
            const schoolMatch = matchingPasswordCandidates.find((c: User) => c.schoolId === terminalSchoolId);
            if (schoolMatch) {
              user = schoolMatch;
            } else {
              user = matchingPasswordCandidates[0];
            }
          } else {
            user = matchingPasswordCandidates[0];
          }
        } else {
          // Se nenhum bateu a senha, mantemos o primeiro para que falhe e dispare lockout/erro padrão
          user = candidates[0];
        }
      } else {
        // Sem senha (login por RFID/QR por aproximação no terminal)
        if (terminalSchoolId) {
          const schoolMatch = candidates.find((c: User) => c.schoolId === terminalSchoolId);
          if (schoolMatch) {
            user = schoolMatch;
          } else {
            user = candidates[0];
          }
        } else {
          user = candidates[0];
        }
      }
    }

    if (user) {
      console.log(`[AUTH-DIAGNOSTIC] Candidato selecionado para autenticação: Nome="${user.name}", Role="${user.role}", SchoolId="${user.schoolId}"`);
      // 2. Verifica se o usuário ou a escola estão ativos
      console.log(`[AUTH-DIAGNOSTIC] Verificando status do usuário "${user.name}" (Status: "${user.status}")...`);
      if (user.status === 'inactive') {
        console.warn(`[AUTH-DIAGNOSTIC] Bloqueado: Usuário está inativo.`);
        return false;
      }

      if (user.schoolId && user.schoolId !== 'global') {
        const school = this.service.data.schools.find((s: any) => s.id === user.schoolId);
        console.log(`[AUTH-DIAGNOSTIC] Verificando status da escola "${user.schoolId}"...`);
        if (school) {
          console.log(`[AUTH-DIAGNOSTIC] Escola encontrada: "${school.name}", Status: "${school.status}"`);
          if (school.status === 'inactive' || school.status === 'suspended') {
            console.warn(`[AUTH-DIAGNOSTIC] Bloqueado: Escola do usuário está inativa ou suspensa.`);
            return false;
          }
        } else {
          console.warn(`[AUTH-DIAGNOSTIC] Alerta: Escola com ID "${user.schoolId}" não encontrada localmente no cache.`);
        }
      }

      // 3. Lógica diferenciada por cargo
      if (cleanPassword) {
        console.log(`[AUTH-DIAGNOSTIC] Tipo de autenticação: Por senha.`);
        // INTERCEPTADOR PROATIVO: Auto-Recovery
        // Só tentamos o Firebase Auth primeiro se o e-mail pertencer a um Super Admin no banco,
        // ou se for o e-mail padrão do administrador mock, para evitar erros 400 desnecessários no console para Gestores/Usuários.
        const isSuperAdminEmail = cleanId.toLowerCase() === 'super-admin@schoolgain.com' || 
          (this.service.data?.users || []).some((u: User) => 
            u.role === 'super_admin' && u.email && u.email.trim().toLowerCase() === cleanId.trim().toLowerCase()
          );

        if (cleanId.includes('@') && isSuperAdminEmail) {
          console.log(`[AUTH-DIAGNOSTIC] Usuário identificado como e-mail de Super Admin. Tentando autenticação via Firebase Auth...`);
          try {
            await signInWithEmailAndPassword(auth, cleanId, cleanPassword);
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Sincroniza o hash da senha após o listener onAuthStateChanged restaurar/injetar o usuário
            const loggedUser = (this.service.data?.users || []).find((u: User) =>
              u.email && u.email.trim().toLowerCase() === cleanId.trim().toLowerCase() && u.role === 'super_admin'
            );
            if (loggedUser) {
              const hashedInput = await EcosystemService.hashPassword(cleanPassword);
              if (loggedUser.password !== hashedInput) {
                loggedUser.password = hashedInput;
                await setDoc(doc(db, this.service.getUserCollection(loggedUser.role), loggedUser.id), this.service.sanitizeUserForFirestore(loggedUser));
                console.log("[AUTO-RECOVERY] Hash da senha do Super Admin atualizado no Firestore (Interceptador).");
              }
            }

            console.log(`[AUTH-DIAGNOSTIC] Login do Super Admin via Firebase Auth efetuado com SUCESSO.`);
            return true; // O listener onAuthStateChanged assumirá o controle
          } catch (e: any) {
            console.warn(`[AUTH-DIAGNOSTIC] Falha no login do Super Admin via Firebase Auth (Interceptador - prosseguindo para validação local):`, e.message || e);
            // Não é um Super Admin no Firebase, prossegue para validação local normal.
          }
        }

        if (user.role === 'super_admin') {
          // Super Admins continuam usando a segurança nativa do Firebase Auth
          console.log(`[AUTH-DIAGNOSTIC] Executando autenticação padrão de Super Admin via Firebase Auth...`);
          try {
            await signInWithEmailAndPassword(auth, user.email!.trim(), cleanPassword);

            // Sincroniza o hash da senha no Firestore após sucesso
            const hashedInput = await EcosystemService.hashPassword(cleanPassword);
            if (user.password !== hashedInput) {
              user.password = hashedInput;
              await setDoc(doc(db, this.service.getUserCollection(user.role), user.id), this.service.sanitizeUserForFirestore(user));
              console.log("[AUTO-RECOVERY] Hash da senha do Super Admin atualizado no Firestore (Direto).");
            }
            console.log(`[AUTH-DIAGNOSTIC] Login do Super Admin efetuado com SUCESSO.`);
          } catch (firebaseError: any) {
            console.warn("[FIREBASE] Falha no login do Super Admin no Firebase Auth (tentando local fallback):", firebaseError.message || firebaseError);
            
            // Fallback Local Hash para Super Admins (essencial se criados localmente, se o e-mail mudou, ou se a senha foi resetada localmente)
            const hashedInput = await EcosystemService.hashPassword(cleanPassword);
            const isMatch = user.password === hashedInput || user.password === cleanPassword;
            console.log(`[AUTH-DIAGNOSTIC] Comparação de hash local para Super Admin: ${isMatch ? "SUCESSO" : "FALHA"}`);
            if (!isMatch) {
              this.handleFailedLogin(securityKey);
              return false;
            }
          }
        } else {
          // Gestores e Usuários utilizam a lógica SHA-256 customizada
          const hashedInput = await EcosystemService.hashPassword(cleanPassword);
          console.log(`[AUTH-DIAGNOSTIC] Comparando senha de gestor/usuário.`);
          console.log(`[AUTH-DIAGNOSTIC] Hash da senha digitada: "${hashedInput}"`);
          console.log(`[AUTH-DIAGNOSTIC] Hash da senha no banco: "${user.password}"`);
          
          let isMatch = user.password === hashedInput || user.password === cleanPassword;
          console.log(`[AUTH-DIAGNOSTIC] Resultado da comparação da senha: ${isMatch ? "SUCESSO" : "FALHA"}`);

          if (!isMatch) {
            console.log(`[AUTH-DIAGNOSTIC] Senha incorreta localmente. Buscando documento atualizado no Firestore para evitar cache expirado...`);
            try {
              const colName = this.service.getUserCollection(user.role);
              const { getDoc, doc } = await import('firebase/firestore');
              const freshSnap = await getDoc(doc(db, colName, user.id));
              if (freshSnap.exists()) {
                const freshUser = freshSnap.data() as User;
                freshUser.id = freshSnap.id;
                
                const freshIsMatch = freshUser.password === hashedInput || freshUser.password === cleanPassword;
                console.log(`[AUTH-DIAGNOSTIC] Comparação com a senha do Firestore fresco: ${freshIsMatch ? "SUCESSO" : "FALHA"}`);
                
                if (freshIsMatch) {
                  isMatch = true;
                  user = freshUser;
                  console.log(`[AUTH-DIAGNOSTIC] Match com o Firestore! Sincronizando o cache local com os dados atualizados de "${user.name}".`);
                  
                  // Atualiza o cache local
                  const currentUsers = [...(this.service.data?.users || [])];
                  const idx = currentUsers.findIndex((x: User) => x.id === freshUser.id);
                  if (idx !== -1) {
                    currentUsers[idx] = freshUser;
                  } else {
                    currentUsers.push(freshUser);
                  }
                  this.service.data.users = currentUsers;
                  this.service.usersSubject.next(currentUsers);

                  // Sincroniza também nos subjects específicos
                  const colKey = this.service.getUserCollection(freshUser.role);
                  if (colKey === 'students') {
                    const list = [...(this.service.studentsSubject.value || [])];
                    const sIdx = list.findIndex((x: User) => x.id === freshUser.id);
                    if (sIdx !== -1) list[sIdx] = freshUser;
                    else list.push(freshUser);
                    this.service.studentsSubject.next(list);
                  } else if (colKey === 'admins') {
                    const list = [...(this.service.adminsSubject.value || [])];
                    const sIdx = list.findIndex((x: User) => x.id === freshUser.id);
                    if (sIdx !== -1) list[sIdx] = freshUser;
                    else list.push(freshUser);
                    this.service.adminsSubject.next(list);
                  } else if (colKey === 'super_admins') {
                    const list = [...(this.service.superAdminsSubject.value || [])];
                    const sIdx = list.findIndex((x: User) => x.id === freshUser.id);
                    if (sIdx !== -1) list[sIdx] = freshUser;
                    else list.push(freshUser);
                    this.service.superAdminsSubject.next(list);
                  } else if (colKey === 'staff') {
                    const list = [...(this.service.staffSubject.value || [])];
                    const sIdx = list.findIndex((x: User) => x.id === freshUser.id);
                    if (sIdx !== -1) list[sIdx] = freshUser;
                    else list.push(freshUser);
                    this.service.staffSubject.next(list);
                  } else if (colKey === 'visitors') {
                    const list = [...(this.service.visitorsSubject.value || [])];
                    const sIdx = list.findIndex((x: User) => x.id === freshUser.id);
                    if (sIdx !== -1) list[sIdx] = freshUser;
                    else list.push(freshUser);
                    this.service.visitorsSubject.next(list);
                  }
                }
              }
            } catch (err) {
              console.error("[AUTH-DIAGNOSTIC] Erro ao buscar documento atualizado no Firestore:", err);
            }
          }

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
      console.log(`[AUTH-DIAGNOSTIC] Login efetuado e registrado com sucesso para: "${user.name}" (${user.role})`);
      return true;
    }

    // FALLBACK: Auto-Recovery de Super Admin
    // Se o usuário não foi encontrado no cache local, mas forneceu um email e senha,
    // tentamos autenticar diretamente no Firebase Auth.
    // Se o Firebase autorizar, o listener onAuthStateChanged cuidará da criação dinâmica.
    if (cleanPassword && cleanId.includes('@')) {
      console.log(`[AUTH-DIAGNOSTIC] Iniciando Fallback Auto-Recovery de Super Admin via Firebase Auth para "${cleanId}"...`);
      try {
        await signInWithEmailAndPassword(auth, cleanId, cleanPassword);
        
        // Aguarda brevemente para que o listener global injete o perfil e sincronize
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Sincroniza o hash da senha no Firestore para o Super Admin restaurado
        const restoredUser = (this.service.data?.users || []).find((u: User) =>
          u.email && u.email.trim().toLowerCase() === cleanId.trim().toLowerCase() && u.role === 'super_admin'
        );
        if (restoredUser) {
          const hashedInput = await EcosystemService.hashPassword(cleanPassword);
          if (restoredUser.password !== hashedInput) {
            restoredUser.password = hashedInput;
            await setDoc(doc(db, this.service.getUserCollection(restoredUser.role), restoredUser.id), this.service.sanitizeUserForFirestore(restoredUser));
            console.log("[AUTO-RECOVERY] Hash da senha do Super Admin restaurado atualizado no Firestore.");
          }
        }

        console.log(`[AUTH-DIAGNOSTIC] Fallback Auto-Recovery de Super Admin efetuado com SUCESSO.`);
        return true;
      } catch (err: any) {
        console.warn(`[AUTH-DIAGNOSTIC] Falha no Fallback Auto-Recovery de Super Admin (Credenciais inválidas ou inexistentes):`, err.message || err);
      }
    }

    console.warn(`[AUTH-DIAGNOSTIC] Falha geral de autenticação para o identificador "${cleanId}".`);
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
    if (!user) return false;

    // Utiliza verifyUniversalPassword que possui o fallback do Firebase Auth para super-usuários sem hash local
    const isMatch = await EcosystemService.verifyUniversalPassword(password, user, this.service.data.users);

    // Se a senha bater e for super admin, garante que o hash está salvo no Firestore
    if (isMatch && user.role === 'super_admin') {
      const hashedInput = await EcosystemService.hashPassword(password);
      if (user.password !== hashedInput) {
        user.password = hashedInput;
        try {
          await setDoc(doc(db, this.service.getUserCollection(user.role), user.id), this.service.sanitizeUserForFirestore(user));
          console.log("[AUTO-RECOVERY] Hash da senha do Super Admin sincronizado no Firestore durante verificação.");
        } catch (err) {
          console.error("[AUTO-RECOVERY] Erro ao sincronizar hash da senha na verificação:", err);
        }
      }
    }

    return isMatch;
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
