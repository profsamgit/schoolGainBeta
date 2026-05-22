import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import type { School, User, Turma, Curso, Cargo, SetorEscolar } from '@/types/ecosystem';

export class SchoolService {
  constructor(private service: any) {}

  /**
   * Solicita um novo cadastro de interesse de escola (status pending).
   */
  async requestSchoolRegistration(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string): Promise<boolean> {
    const resolvedPassword = initialPassword || schoolData.initialManagerPassword;

    if (!schoolData.managerEmail || !resolvedPassword) {
      return false;
    }

    // Validação de E-mail Único na Rede
    const emailLower = schoolData.managerEmail.toLowerCase().trim();
    if (this.service.data.users.some((u: User) => u.email?.toLowerCase() === emailLower)) {
      return false;
    }

    const newSchool: School = {
      ...schoolData,
      id: EcosystemService.generateStandardId('school', undefined, { name: schoolData.name, city: schoolData.city }),
      status: 'pending',
      joinedDate: new Date().toISOString().split('T')[0],
      initialManagerPassword: resolvedPassword
    };

    this.service.data.schools.push(newSchool);
    this.service.schoolsSubject.next([...this.service.data.schools]);

    // Sincroniza Escola no Firestore como Pendente
    await setDoc(doc(db, "schools", newSchool.id), newSchool);

    // Inicializa configurações de hardware da unidade
    await setDoc(doc(db, "settings", newSchool.id), this.service.data.systemSettings || {
      studentLoginMethod: 'all',
      adminLoginMethod: 'all'
    });

    this.service.saveToStorage();
    return true;
  }

  /**
   * Registra uma nova escola diretamente como ativa (uso do Super Admin).
   */
  async registerSchool(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string): Promise<boolean> {
    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    if (currentUser?.role !== 'super_admin') return false;

    const resolvedPassword = initialPassword || schoolData.initialManagerPassword;

    if (!schoolData.managerEmail || !resolvedPassword) {
      return false;
    }

    // Validação de E-mail Único na Rede
    const emailLower = schoolData.managerEmail.toLowerCase().trim();
    if (this.service.data.users.some((u: User) => u.email?.toLowerCase() === emailLower)) {
      return false;
    }

    const newSchool: School = {
      ...schoolData,
      id: EcosystemService.generateStandardId('school', undefined, { name: schoolData.name, city: schoolData.city }),
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    this.service.data.schools.push(newSchool);

    // Cria o usuário gestor imediatamente
    if (newSchool.managerEmail && resolvedPassword) {
      const newUser: User = {
        id: EcosystemService.generateStandardId('admin', newSchool.id),
        name: `Gestor ${newSchool.name}`,
        email: newSchool.managerEmail,
        password: await EcosystemService.hashPassword(resolvedPassword),
        role: 'admin',
        schoolId: newSchool.id,
        ra: `G-${Date.now().toString().slice(-4)}`,
        status: 'active'
      };
      this.service.data.users.push(newUser);
      this.service.usersSubject.next([...this.service.data.users]);
    }

    this.service.schoolsSubject.next([...this.service.data.schools]);

    // Sincroniza Escola no Firestore (Sem a senha no registro permanente)
    const schoolToSave = { ...newSchool };
    delete (schoolToSave as any).initialManagerPassword;
    setDoc(doc(db, "schools", newSchool.id), schoolToSave);

    // Inicializa configurações de hardware da unidade
    setDoc(doc(db, "settings", newSchool.id), this.service.data.systemSettings || {
      studentLoginMethod: 'all',
      adminLoginMethod: 'all'
    });

    // Sincroniza novo gestor se criado (usando a coleção mapeada correta e higienização)
    if (newSchool.managerEmail) {
      const adminUser = this.service.data.users.find((u: User) => u.email === newSchool.managerEmail);
      if (adminUser) {
        setDoc(
          doc(db, this.service.getUserCollection(adminUser.role), adminUser.id),
          this.service.sanitizeUserForFirestore(adminUser)
        );
      }
    }

    this.service.saveToStorage();
    return true;
  }

  /**
   * Atualiza o status de uma escola (Aprovação).
   */
  async updateSchoolStatus(id: string, status: 'active' | 'pending' | 'inactive' | 'suspended', initialPassword?: string): Promise<void> {
    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    if (currentUser?.role !== 'super_admin') return;
    const school = this.service.data.schools.find((s: School) => s.id === id);
    if (school) {
      school.status = status;
      const resolvedPassword = initialPassword || school.initialManagerPassword;

      // Se estiver ativando, garante que o usuário gestor exista
      if (status === 'active' && school.managerEmail && resolvedPassword) {
        const userExists = this.service.data.users.find((u: User) => u.email?.toLowerCase() === school.managerEmail?.toLowerCase());
        if (!userExists) {
          const newUser: User = {
            id: EcosystemService.generateStandardId('admin', school.id),
            name: `Gestor ${school.name}`,
            email: school.managerEmail,
            password: await EcosystemService.hashPassword(resolvedPassword),
            role: 'admin',
            schoolId: school.id,
            ra: `G-${Date.now().toString().slice(-4)}`,
            status: 'active'
          };
          this.service.data.users.push(newUser);
          this.service.usersSubject.next([...this.service.data.users]);
        }
      }

      this.service.schoolsSubject.next([...this.service.data.schools]);

      // Sincroniza Escola no Firestore (Limpa a senha se estiver ativando)
      const schoolToSave = { ...school };
      if (status === 'active') delete (schoolToSave as any).initialManagerPassword;
      setDoc(doc(db, "schools", id), schoolToSave);

      // Inicializa configurações de hardware da unidade (Multi-Tenant)
      setDoc(doc(db, "settings", id), this.service.data.systemSettings || {
        studentLoginMethod: 'all',
        adminLoginMethod: 'all'
      });

      // Sincroniza novo gestor se criado (usando a coleção mapeada correta e higienização)
      if (status === 'active' && school.managerEmail) {
        const adminUser = this.service.data.users.find((u: User) => u.email === school.managerEmail);
        if (adminUser) {
          setDoc(
            doc(db, this.service.getUserCollection(adminUser.role), adminUser.id),
            this.service.sanitizeUserForFirestore(adminUser)
          );
        }
      }

      this.service.saveToStorage();
    }
  }

  /**
   * Atualiza as configurações de hardware do sistema.
   */
  async updateSystemSettings(settings: any, targetSchoolId?: string): Promise<void> {
    this.service.data.systemSettings = settings;
    this.service.systemSettingsSubject.next(settings);
    
    const sid = targetSchoolId || this.service.data.users.find((u: any) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa)?.schoolId;
    if (sid) {
      await setDoc(doc(db, "settings", sid), settings, { merge: true });
    }
    this.service.saveToStorage();
  }

  /**
   * Atualiza a lista completa de escolas.
   */
  updateSchools(newSchools: School[]): void {
    if (!this.service.checkAdminAuth()) return;
    this.service.data.schools = newSchools;
    this.service.schoolsSubject.next([...newSchools]);
    this.service.saveToStorage();
  }

  /**
   * Remove uma escola da rede de forma segura.
   */
  async deleteSchool(id: string, password?: string): Promise<{ success: boolean; error?: string }> {
    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    if (currentUser?.role !== 'super_admin') return { success: false, error: 'Não autorizado' };

    // Verificação de Senha do Super Admin
    if (!password) return { success: false, error: 'Confirmação de senha necessária.' };
    const isPasswordValid = await this.service.verifyPassword(password);
    if (!isPasswordValid) return { success: false, error: 'Senha incorreta. Ação cancelada.' };

    // Regra de Negócio: Primeiro remove os gestores, depois a unidade
    const hasManagers = this.service.data.users.some((u: User) => u.schoolId === id && u.role === 'admin');
    if (hasManagers) {
      return { 
        success: false, 
        error: 'Bloqueio de Segurança: Remova primeiro os gestores desta unidade antes de excluí-la.' 
      };
    }

    try {
      // Limpeza completa: Escola + Configurações de Unidade
      await Promise.all([
        deleteDoc(doc(db, "schools", id)),
        deleteDoc(doc(db, "settings", id))
      ]);
      
      this.service.data.schools = this.service.data.schools.filter((s: School) => s.id !== id);
      this.service.schoolsSubject.next([...this.service.data.schools]);
      this.service.saveToStorage();
      return { success: true };
    } catch (error) {
      throw new Error('Falha no processamento da requisição de remoção.');
    }
  }

  async updateTurmas(newTurmas: Turma[], sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    if (!currentUser) return false;

    let activeSchoolId = sid || currentUser.schoolId;
    if (currentUser.role === 'admin') {
      activeSchoolId = currentUser.schoolId;
    }
    if (!activeSchoolId) return false;

    // Garante que todos os novos/modificados pertencem ao activeSchoolId
    const invalid = newTurmas.find(t => t.schoolId !== activeSchoolId);
    if (invalid) return false;

    const otherSchoolsTurmas = (this.service.data.turmas || []).filter((t: Turma) => t.schoolId !== activeSchoolId);
    const currentSchoolOldTurmas = (this.service.data.turmas || []).filter((t: Turma) => t.schoolId === activeSchoolId);
    const oldIds = currentSchoolOldTurmas.map((t: Turma) => t.id);
    const newIds = newTurmas.map((t: Turma) => t.id);
    const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));
    
    for (const t of newTurmas) {
      await setDoc(doc(db, "turmas", t.id), t);
    }
    
    for (const id of deletedIds) {
      await deleteDoc(doc(db, "turmas", id));
    }

    const combinedTurmas = [...otherSchoolsTurmas, ...newTurmas];
    this.service.data.turmas = combinedTurmas;
    this.service.turmasSubject.next([...combinedTurmas]);
    this.service.saveToStorage();
    return true;
  }

  async updateCursos(newCursos: Curso[], sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    if (!currentUser) return false;

    let activeSchoolId = sid || currentUser.schoolId;
    if (currentUser.role === 'admin') {
      activeSchoolId = currentUser.schoolId;
    }
    if (!activeSchoolId) return false;

    const invalid = newCursos.find(c => c.schoolId !== activeSchoolId);
    if (invalid) return false;

    const otherSchoolsCursos = (this.service.data.cursos || []).filter((c: Curso) => c.schoolId !== activeSchoolId);
    const currentSchoolOldCursos = (this.service.data.cursos || []).filter((c: Curso) => c.schoolId === activeSchoolId);
    const oldIds = currentSchoolOldCursos.map((c: Curso) => c.id);
    const newIds = newCursos.map((c: Curso) => c.id);
    const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));

    for (const c of newCursos) {
      await setDoc(doc(db, "cursos", c.id), c);
    }

    for (const id of deletedIds) {
      await deleteDoc(doc(db, "cursos", id));
    }

    const combinedCursos = [...otherSchoolsCursos, ...newCursos];
    this.service.data.cursos = combinedCursos;
    this.service.cursosSubject.next([...combinedCursos]);
    this.service.saveToStorage();
    return true;
  }

  async updateCargos(newCargos: Cargo[], sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    if (!currentUser) return false;

    let activeSchoolId = sid || currentUser.schoolId;
    if (currentUser.role === 'admin') {
      activeSchoolId = currentUser.schoolId;
    }
    if (!activeSchoolId) return false;

    const invalid = newCargos.find(c => c.schoolId !== activeSchoolId);
    if (invalid) return false;

    const otherSchoolsCargos = (this.service.data.cargos || []).filter((c: Cargo) => c.schoolId !== activeSchoolId);
    const currentSchoolOldCargos = (this.service.data.cargos || []).filter((c: Cargo) => c.schoolId === activeSchoolId);
    const oldIds = currentSchoolOldCargos.map((c: Cargo) => c.id);
    const newIds = newCargos.map((c: Cargo) => c.id);
    const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));

    for (const c of newCargos) {
      await setDoc(doc(db, "cargos", c.id), c);
    }

    for (const id of deletedIds) {
      await deleteDoc(doc(db, "cargos", id));
    }

    const combinedCargos = [...otherSchoolsCargos, ...newCargos];
    this.service.data.cargos = combinedCargos;
    this.service.cargosSubject.next([...combinedCargos]);
    this.service.saveToStorage();
    return true;
  }

  async updateSetores(newSetores: SetorEscolar[], sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    if (!currentUser) return false;

    let activeSchoolId = sid || currentUser.schoolId;
    if (currentUser.role === 'admin') {
      activeSchoolId = currentUser.schoolId;
    }
    if (!activeSchoolId) return false;

    const invalid = newSetores.find(s => s.schoolId !== activeSchoolId);
    if (invalid) return false;

    const otherSchoolsSetores = (this.service.data.setores || []).filter((s: SetorEscolar) => s.schoolId !== activeSchoolId);
    const currentSchoolOldSetores = (this.service.data.setores || []).filter((s: SetorEscolar) => s.schoolId === activeSchoolId);
    const oldIds = currentSchoolOldSetores.map((s: SetorEscolar) => s.id);
    const newIds = newSetores.map((s: SetorEscolar) => s.id);
    const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));

    for (const s of newSetores) {
      await setDoc(doc(db, "setores", s.id), s);
    }

    for (const id of deletedIds) {
      await deleteDoc(doc(db, "setores", id));
    }

    const combinedSetores = [...otherSchoolsSetores, ...newSetores];
    this.service.data.setores = combinedSetores;
    this.service.setoresSubject.next([...combinedSetores]);
    this.service.saveToStorage();
    return true;
  }
}
