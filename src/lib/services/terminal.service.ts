import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { EcosystemService } from '../ecosystem.service';
import type { Terminal, TerminalStatus } from '@/types/ecosystem';

export class TerminalService {
  constructor(private service: any) {}

  /**
   * Solicita autorização para um novo terminal.
   */
  requestTerminalAuthorization(terminalId: string, hardwareId: string, location: string, schoolId: string): boolean {
    if (!this.service.data.terminals) this.service.data.terminals = [];

    // Verifica se o ID já existe
    const idExists = this.service.data.terminals.some((t: Terminal) => t.id === terminalId);
    if (idExists) return false;

    // Verifica se o hardware já existe
    const existing = this.service.data.terminals.find((t: Terminal) => t.hardwareId === hardwareId);
    if (existing) return false;

    const newTerminal: Terminal = {
      id: EcosystemService.generateStandardId('totem', schoolId),
      hardwareId: hardwareId.toUpperCase().trim(),
      location: location.toUpperCase().trim(),
      status: 'pending',
      schoolId,
      requestDate: new Date().toISOString(),
      settings: {
        loginMethod: 'all',
      }
    };

    this.service.data.terminals.push(newTerminal);
    this.service.terminalsSubject.next([...this.service.data.terminals]);

    // Sincroniza no Firestore
    setDoc(doc(db, "terminals", newTerminal.id), newTerminal);

    this.service.saveToStorage();
    return true;
  }

  /**
   * Atualiza o status de um terminal.
   */
  updateTerminalStatus(id: string, status: TerminalStatus, schoolId?: string): void {
    if (!this.service.checkAdminAuth()) return;
    const terminal = this.service.data.terminals.find((t: Terminal) => t.id === id);
    if (terminal) {
      terminal.status = status;
      if (schoolId) terminal.schoolId = schoolId;
      this.service.terminalsSubject.next([...this.service.data.terminals]);

      // Sincroniza no Firestore
      setDoc(doc(db, "terminals", id), terminal);

      this.service.logTelemetry({
        action: 'CRUD_UPDATE',
        category: 'SYSTEM',
        details: `Status do terminal ${terminal.location} alterado para ${status.toUpperCase()}`,
        targetEntity: 'terminals',
        targetId: id,
        unitId: schoolId || terminal.schoolId
      });

      this.service.saveToStorage();
    }
  }

  /**
   * Atualiza as configurações de hardware de um terminal específico.
   */
  updateTerminalSettings(id: string, settings: Partial<Terminal>): void {
    if (!this.service.checkAdminAuth()) return;
    this.service.data.terminals = this.service.data.terminals.map((t: Terminal) =>
      t.id === id ? { ...t, ...settings } : t
    );
    this.service.terminalsSubject.next([...this.service.data.terminals]);

    // Sincroniza no Firestore
    const updated = this.service.data.terminals.find((t: Terminal) => t.id === id);
    if (updated) setDoc(doc(db, "terminals", id), updated);

    this.service.saveToStorage();
  }

  /**
   * Remove um terminal.
   */
  deleteTerminal(id: string): void {
    if (!this.service.checkAdminAuth()) return;
    this.service.data.terminals = this.service.data.terminals.filter((t: Terminal) => t.id !== id);
    this.service.terminalsSubject.next([...this.service.data.terminals]);

    // Remove do Firestore
    deleteDoc(doc(db, "terminals", id));

    this.service.saveToStorage();
  }

  /**
   * Dispara um evento de login vindo de hardware externo (ESP32).
   */
  triggerHardwareLogin(ra: string, registeredId: string): void {
    this.service.pendingLoginSubject.next({ ra, terminalId: registeredId });
    // Limpa o evento após um curto período para não disparar login duplo
    setTimeout(() => this.service.pendingLoginSubject.next(null), 2000);
  }

  /**
   * Gera um ID único e imutável para um terminal (SG-TOTEM-XXXX).
   */
  generateTerminalId(): string {
    const chars = '0123456789ABCDEF';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const fullId = `SG-TOTEM-${suffix}`;

    // Verifica unicidade
    const exists = this.service.data.terminals?.some((t: Terminal) => t.id === fullId);
    if (exists) return this.generateTerminalId();

    return fullId;
  }
}
