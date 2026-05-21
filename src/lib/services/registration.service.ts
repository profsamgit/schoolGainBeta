import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import type { RegistrationRequest, User } from '@/types/ecosystem';

export class RegistrationService {
  constructor(private service: any) {}

  /**
   * Solicita um novo cadastro de aluno na escola.
   */
  async requestRegistration(data: Omit<RegistrationRequest, 'id' | 'status' | 'createdAt'>): Promise<{ success: boolean, error?: string }> {
    const sanitizedData = {
      ...data,
      name: data.name.toUpperCase().trim(),
      ra: data.ra.toUpperCase().trim(),
      rfid: data.rfid?.toUpperCase().trim(),
      turma: data.turma.toUpperCase().trim(),
      curso: data.curso.toUpperCase().trim()
    };

    // 1. Verifica se já existe um usuário cadastrado com este RA
    const existingUserByRa = this.service.data.users.find((u: User) => u.ra?.toUpperCase() === sanitizedData.ra);
    if (existingUserByRa) {
      return { success: false, error: 'Este RA já está cadastrado no sistema.' };
    }

    // 2. Verifica se já existe um usuário cadastrado com o mesmo nome e mesma turma
    const existingUserByNameAndTurma = this.service.data.users.find((u: User) => 
      u.name?.toUpperCase().trim() === sanitizedData.name &&
      u.turma?.toUpperCase().trim() === sanitizedData.turma
    );
    if (existingUserByNameAndTurma) {
      return { success: false, error: 'Este aluno já possui um cadastro ativo nesta turma.' };
    }

    // 3. Verifica se já existe uma solicitação pendente com o mesmo RA
    const duplicateRequestByRa = this.service.data.registrationRequests.some((req: any) => 
      req.ra?.toUpperCase() === sanitizedData.ra && 
      req.status === 'pending'
    );
    if (duplicateRequestByRa) {
      return { success: false, error: 'Já existe uma solicitação de cadastro pendente com este RA.' };
    }

    // 4. Verifica se já existe uma solicitação pendente com o mesmo nome e mesma turma
    const duplicateRequestByNameAndTurma = this.service.data.registrationRequests.some((req: any) => 
      req.name.toUpperCase().trim() === sanitizedData.name && 
      req.turma.toUpperCase().trim() === sanitizedData.turma &&
      req.status === 'pending'
    );
    if (duplicateRequestByNameAndTurma) {
      return { success: false, error: 'Já existe uma solicitação de cadastro pendente para este aluno nesta turma.' };
    }

    const newRequest: RegistrationRequest = {
      ...sanitizedData,
      id: `req-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Sincroniza no Firestore
    await setDoc(doc(db, "registrationRequests", newRequest.id), newRequest);
    return { success: true };
  }

  /**
   * Aprova uma solicitação de cadastro, criando o usuário correspondente.
   */
  async approveRegistration(requestId: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;
    
    const request = this.service.data.registrationRequests.find((r: any) => r.id === requestId);
    if (!request) return false;

    // 1. Cria o novo usuário
    const newUser: User = {
      id: EcosystemService.generateStandardId('user-student', request.schoolId),
      name: request.name.toUpperCase().trim(),
      ra: request.ra.toUpperCase().trim(),
      rfid: request.rfid?.toUpperCase().trim(),
      turma: request.turma.toUpperCase().trim(),
      curso: request.curso.toUpperCase().trim(),
      role: 'student',
      schoolId: request.schoolId,
      status: 'active'
    };

    // 2. Salva o usuário no Firestore (Sanitizado)
    await setDoc(doc(db, this.service.getUserCollection(newUser.role), newUser.id), this.service.sanitizeUserForFirestore(newUser));

    // NOVO: Inicializa o estado de vitalidade e Bio-Coins para o novo usuário
    await setDoc(doc(db, "userStates", newUser.id), this.service.getDefaultState(newUser));

    // 3. Remove a solicitação
    await deleteDoc(doc(db, "registrationRequests", requestId));

    // 4. Log de Telemetria
    this.service.logTelemetry({
      action: 'CRUD_CREATE',
      category: 'DATA',
      details: `Gestor aprovou cadastro do aluno: ${newUser.name}`,
      targetEntity: 'users',
      targetId: newUser.id
    });

    return true;
  }

  /**
   * Rejeita uma solicitação de cadastro.
   */
  async rejectRegistration(requestId: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;
    await deleteDoc(doc(db, "registrationRequests", requestId));
    
    this.service.logTelemetry({
      action: 'CRUD_DELETE',
      category: 'DATA',
      details: `Gestor recusou uma solicitação de cadastro pendente.`
    });

    return true;
  }
}
