import { db } from '../firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import type { User, Participant } from '../types';

export class UserService {
  constructor(private service: any) {}

  /**
   * Mapeia o papel do usuário para sua respectiva coleção no Firestore.
   */
  getUserCollection(role: string): string {
    switch (role) {
      case 'student': return 'students';
      case 'admin': return 'admins';
      case 'staff': return 'staff';
      case 'super_admin': return 'super_admins';
      case 'visitor': return 'visitors';
      default: return 'students'; // Fallback para alunos
    }
  }

  /**
   * Remove campos de gamificação do objeto usuário antes de salvar no Firestore.
   */
  sanitizeUserForFirestore(user: User): any {
    const cleanUser = { ...user } as any;
    delete cleanUser.points;
    delete cleanUser.level;
    delete cleanUser.vitality;
    delete cleanUser.itemsCount;
    delete cleanUser.balance;
    return cleanUser;
  }

  /**
   * Funções de atualização em massa (usadas no painel admin)
   */
  async updateUsers(newUsers: User[], targetSchoolId?: string): Promise<{ success: boolean, error?: string }> {
    if (!this.service.checkAdminAuth()) return { success: false, error: 'Não autorizado' };

    try {
      const getRoleLabel = (role: string) => {
        switch(role) {
          case 'admin': return 'O gestor';
          case 'super_admin': return 'O super gestor';
          case 'student': return 'O aluno';
          case 'visitor': return 'O visitante';
          default: return 'O usuário';
        }
      };

      // Filtra usuários que NÃO estão no lote de atualização para checagem global
      const existingOtherUsers = this.service.data.users.filter((u: User) => !newUsers.some(nu => nu.id === u.id));

      // 1. Identifica quais usuários mudaram ou são novos
      const changedUsers = newUsers.filter(newUser => {
        const oldUser = this.service.data.users.find((u: User) => u.id === newUser.id);
        if (!oldUser) return true; // Novo usuário
        return JSON.stringify(oldUser) !== JSON.stringify(newUser);
      });

      for (const u of changedUsers) {
        // 1. Validar Email
        if (u.email) {
          u.email = u.email.toLowerCase().trim();
          
          const internalConflict = newUsers.find(nu => nu.id !== u.id && nu.email?.toLowerCase() === u.email);
          if (internalConflict) {
            return { success: false, error: `Conflito de e-mail: ${u.email}. Já em uso por ${internalConflict.name} (${getRoleLabel(internalConflict.role || '').toLowerCase()}).` };
          }

          const globalConflict = existingOtherUsers.find((ou: User) => ou.email?.toLowerCase() === u.email);
          if (globalConflict) {
            return { success: false, error: `Conflito de e-mail: ${u.email}. Já em uso por ${globalConflict.name} (${getRoleLabel(globalConflict.role || '').toLowerCase()}).` };
          }
        }

        // 2. Validar RA
        if (u.ra) {
          u.ra = u.ra.toUpperCase().trim();
          
          const internalConflict = newUsers.find(nu => nu.id !== u.id && nu.ra?.toUpperCase() === u.ra);
          if (internalConflict) {
             return { success: false, error: `Conflito de RA: ${u.ra}. ${getRoleLabel(internalConflict.role || '')} ${internalConflict.name} já utiliza este código.` };
          }

          const globalConflict = existingOtherUsers.find((ou: User) => ou.ra?.toUpperCase() === u.ra);
          if (globalConflict) {
            return { success: false, error: `Conflito de RA: ${u.ra}. ${getRoleLabel(globalConflict.role || '')} ${globalConflict.name} já utiliza este código.` };
          }
        }

        // 3. Validar RFID
        if (u.rfid) {
          u.rfid = u.rfid.toUpperCase().trim();
          
          const internalConflict = newUsers.find(nu => nu.id !== u.id && nu.rfid?.toUpperCase() === u.rfid);
          if (internalConflict) {
             return { success: false, error: `Conflito de RFID: ${u.rfid}. Já em uso por ${internalConflict.name} (${getRoleLabel(internalConflict.role || '').toLowerCase()}).` };
          }

          const globalConflict = existingOtherUsers.find((ou: User) => ou.rfid?.toUpperCase() === u.rfid);
          if (globalConflict) {
            return { success: false, error: `Conflito de RFID: ${u.rfid}. Já em uso por ${globalConflict.name}.` };
          }
        }

        // 4. Normalizar campos de texto
        if (u.name) u.name = u.name.toUpperCase().trim();
        if (u.turma) u.turma = u.turma.toUpperCase().trim();
        if (u.curso) u.curso = u.curso.toUpperCase().trim();
        if (u.position) u.position = u.position.toUpperCase().trim();
        if (!u.status) u.status = 'active';
      }

      // Identifica usuários removidos
      const removedUsers = this.service.data.users.filter((oldU: User) => {
        const isInNewList = newUsers.find(newU => newU.id === oldU.id);
        if (targetSchoolId) {
          return oldU.schoolId === targetSchoolId && !isInNewList;
        }
        return !isInNewList;
      });

      // 2. Mescla os usuários (Preserva usuários de outras escolas se a lista for parcial/filtrada)
      let uniqueUsers: User[];
      if (targetSchoolId) {
        const otherSchoolsUsers = this.service.data.users.filter((u: User) => u.schoolId !== targetSchoolId);
        uniqueUsers = Array.from(new Map([...otherSchoolsUsers, ...newUsers].map(u => [u.id, u])).values());
      } else {
        uniqueUsers = Array.from(new Map(newUsers.map(u => [u.id, u])).values());
      }

      const oldData = [...this.service.data.users];
      this.service.data.users = uniqueUsers;
      this.service.usersSubject.next([...uniqueUsers]);

      // Sincroniza apenas os alterados no Firestore
      await Promise.all([
        // Deleta os removidos
        ...removedUsers.flatMap((u: User) => [
          deleteDoc(doc(db, this.getUserCollection(u.role), u.id)),
          deleteDoc(doc(db, "userStates", u.id)),
          ...(u.ra ? [deleteDoc(doc(db, this.getUserCollection(u.role), u.ra))] : [])
        ]),

        // Salva/Atualiza os novos ou modificados
        ...changedUsers.flatMap((u: User) => {
          const oldUser = oldData.find(old => old.id === u.id);
          const isNew = !oldUser;
          const ops: Promise<any>[] = [];

          // Se o usuário alterado for o usuário logado atualmente, e o RA mudou, atualiza a sessão local
          if (this.service.data.currentUserId === u.id) {
            if (u.ra && this.service.data.currentUserRa !== u.ra) {
              this.service.data.currentUserRa = u.ra;
              this.service.currentUserRaSubject.next(u.ra);
            }
          }

          // 1. Se o papel mudou, remove o documento da coleção anterior para evitar cadastros duplicados
          if (oldUser && oldUser.role && oldUser.role !== u.role) {
            ops.push(deleteDoc(doc(db, this.getUserCollection(oldUser.role), u.id)).catch(e => console.error("Erro ao limpar role anterior:", e)));
          }

          // 2. Se o ID do usuário for não-padronizado (ex: RA legado), migra em tempo de salvamento
          const isNonStandard = u.id && 
            !u.id.startsWith('user-') && 
            !u.id.startsWith('admin-') && 
            !u.id.startsWith('super-admin-') && 
            !u.id.startsWith('staff-') && 
            !u.id.startsWith('visitor-');

          if (isNonStandard) {
            const role = u.role || 'student';
            const prefix = role === 'super_admin' ? 'super-admin' : 
                           role === 'admin' ? 'admin' : 
                           role === 'staff' ? 'staff' : 
                           role === 'visitor' ? 'visitor' : 'user-student';
            
            const newId = EcosystemService.generateStandardId(prefix as any, u.schoolId || 'orphan-fix');
            const targetCollection = this.getUserCollection(role);
            const updatedUser = { ...u, id: newId };

            // Salva o novo usuário
            ops.push(setDoc(doc(db, targetCollection, newId), this.sanitizeUserForFirestore(updatedUser)));

            // Migra o userStates
            ops.push((async () => {
              const oldStateSnap = await getDoc(doc(db, "userStates", u.id));
              if (oldStateSnap.exists()) {
                const oldState = oldStateSnap.data();
                await setDoc(doc(db, "userStates", newId), { ...oldState, id: newId });
                await deleteDoc(doc(db, "userStates", u.id));
              } else {
                await setDoc(doc(db, "userStates", newId), this.service.getDefaultState(updatedUser));
              }
            })());

            // Deleta o legado
            ops.push(deleteDoc(doc(db, this.getUserCollection(oldUser?.role || role), u.id)).catch(() => {}));

            // Atualiza localmente
            const idx = this.service.data.users.findIndex((user: User) => user.id === u.id);
            if (idx !== -1) {
              this.service.data.users[idx] = updatedUser;
            }
            if (this.service.data.userStates[u.id]) {
              this.service.data.userStates[newId] = { ...this.service.data.userStates[u.id], id: newId };
              delete this.service.data.userStates[u.id];
            }
          } else {
            // Caso padrão (ID já é padrão)
            // Se o RA mudou, precisamos apagar o documento antigo (que usava o RA como ID)
            if (oldUser && oldUser.ra && oldUser.ra !== u.ra) {
              ops.push(deleteDoc(doc(db, this.getUserCollection(u.role), oldUser.ra)).catch(e => console.error("Erro ao limpar RA antigo:", e)));
            }

            ops.push(setDoc(doc(db, this.getUserCollection(u.role), u.id), this.sanitizeUserForFirestore(u)));
            
            if (isNew && (u.role === 'student' || u.role === 'visitor' || u.role === 'staff')) {
              ops.push(setDoc(doc(db, "userStates", u.id), this.service.getDefaultState(u)));
            }
          }
          
          return ops;
        })
      ]);

      // Telemetria
      if (removedUsers.length > 0) {
        await this.service.logTelemetry({
          action: 'CRUD_DELETE',
          category: 'DATA',
          details: `Exclusão de ${removedUsers.length} usuários.`,
          targetEntity: 'users',
          metadata: { ids: removedUsers.map((u: User) => u.id), names: removedUsers.map((u: User) => u.name) }
        });
      }

      if (changedUsers.length > 0) {
        for (const u of changedUsers) {
          const isNew = !oldData.find(old => old.id === u.id);
          await this.service.logTelemetry({
            action: isNew ? 'CRUD_CREATE' : 'CRUD_UPDATE',
            category: 'DATA',
            details: `${isNew ? 'Criação' : 'Atualização'} do usuário: ${u.name} (${u.role})`,
            targetEntity: 'users',
            targetId: u.id,
            unitId: u.schoolId,
            metadata: { snapshot: u }
          });
        }
      }

      this.service.saveToStorage();
      return { success: true };
    } catch (error: any) {
      console.error("[ECOSYSTEM] Erro ao atualizar usuários:", error);
      return { success: false, error: error.message || 'Erro interno no banco de dados' };
    }
  }

  /**
   * Remove um usuário individual do sistema de forma segura.
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;
    const user = this.service.data.users.find((u: User) => u.id === userId);
    if (!user) return false;
    
    // Filtra para remover apenas o usuário alvo da sua respectiva unidade
    const otherUsersOfSchool = this.service.data.users.filter((u: User) => u.schoolId === user.schoolId && u.id !== userId);
    const result = await this.updateUsers(otherUsersOfSchool, user.schoolId);
    return result.success;
  }

  /**
   * Altera status de usuário.
   */
  async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;
    const user = this.service.data.users.find((u: User) => u.id === userId);
    if (user) {
      user.status = status;
      await setDoc(doc(db, this.getUserCollection(user.role), userId), { status }, { merge: true });
      this.service.usersSubject.next([...this.service.data.users]);
      
      this.service.logTelemetry({
        action: 'CRUD_UPDATE',
        category: 'DATA',
        details: `Gestor alterou status do usuário ${user.name} para ${status.toUpperCase()}`,
        targetEntity: 'users',
        targetId: userId
      });
      return true;
    }
    return false;
  }

  updateParticipants(newParticipants: Participant[]): void {
    if (!this.service.checkAdminAuth()) return;
    this.service.data.participants = newParticipants;
    this.service.participantsSubject.next(newParticipants);
    this.service.saveToStorage();
  }
}
