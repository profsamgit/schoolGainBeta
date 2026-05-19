import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import type { School, User } from '../types';

export class SchoolService {
  constructor(private service: any) {}

  /**
   * Registra uma nova escola diretamente como ativa (uso do Super Admin).
   */
  async registerSchool(schoolData: Omit<School, 'id' | 'status' | 'joinedDate'>, initialPassword?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

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

    // Sincroniza novo gestor se criado
    if (newSchool.managerEmail) {
      const adminUser = this.service.data.users.find((u: User) => u.email === newSchool.managerEmail);
      if (adminUser) setDoc(doc(db, "users", adminUser.id), adminUser);
    }

    this.service.saveToStorage();
    return true;
  }

  /**
   * Atualiza o status de uma escola (Aprovação).
   */
  async updateSchoolStatus(id: string, status: 'active' | 'pending' | 'inactive' | 'suspended', initialPassword?: string): Promise<void> {
    if (!this.service.checkAdminAuth()) return;
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

      // Sincroniza novo gestor se criado
      if (status === 'active' && school.managerEmail) {
        const adminUser = this.service.data.users.find((u: User) => u.email === school.managerEmail);
        if (adminUser) setDoc(doc(db, "users", adminUser.id), adminUser);
      }

      this.service.saveToStorage();
    }
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
    if (!this.service.checkAdminAuth()) return { success: false, error: 'Não autorizado' };

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
}
