'use client';

import { useEcosystem } from '@/contexts/EcosystemContext';
import { School, Terminal, User, AuditLogEntry, WasteEntry } from '@/types/ecosystem';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Plus,
  ArrowLeft,
  ShieldAlert,
  Activity,
  Leaf
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EcosystemService } from '@/lib/ecosystem.service';
import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

// Novos Componentes Modularizados
import { OverviewSection } from './components/OverviewSection';
import { SchoolSection } from './components/SchoolSection';
import { CycleSection } from './components/CycleSection';
import { TeamSection } from './components/TeamSection';
import { SecuritySection } from './components/SecuritySection';
import { TelemetrySection } from './components/TelemetrySection';

export default function SuperAdminPage() {
  const {
    schools,
    updateSchoolStatus,
    deleteSchool,
    registerSchool,
    users,
    terminals,
    currentUser,
    updateMyPassword,
    resetHistory,
    performCycleReset,
    updateUsers,
    deleteUser,
    allParticipants,
    updateParticipants,
    updateSchools,
    auditLogs,
    wasteEntries,
    uploadUserAvatar,
    allCargos,
    allSetores,
    userStates,
    logout
  } = useEcosystem();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);

  // Estados Compartilhados e de Diálogos
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'super_admin' as 'super_admin' | 'admin',
    schoolId: '',
    ra: '',
    rfid: '',
    confirmPassword: ''
  });
  const [passFormData, setPassFormData] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [tempGeneratedPass, setTempGeneratedPass] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRFIDCapturing, setIsRFIDCapturing] = useState(false);

  // RFID Scanner Logic
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRFIDCapturing) return;
      
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) buffer = '';
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 5) {
          setUserFormData((prev: any) => ({ ...prev, rfid: buffer.toUpperCase() }));
          setIsRFIDCapturing(false);
          toast({ title: "Cartão Capturado", description: `ID: ${buffer}` });
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRFIDCapturing, toast]);
  const [newSchool, setNewSchool] = useState({
    name: '', city: '', state: '', contactEmail: '', managerEmail: '', initialManagerPassword: '',
  });
  const [adminPasswordForAction, setAdminPasswordForAction] = useState('');

  const [isDevDialogOpen, setIsDevDialogOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<any>(null);
  const [devFormData, setDevFormData] = useState({ id: '', name: '', role: '', description: '', avatar: '', initials: '' });

  const [isSchoolEditDialogOpen, setIsSchoolEditDialogOpen] = useState(false);
  const [editingSchoolObj, setEditingSchoolObj] = useState<any>(null);
  const [schoolEditData, setSchoolEditData] = useState({ name: '', city: '', state: '', managerEmail: '' });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [deletePassword, setDeletePassword] = useState('');

  const [resetConfirm, setResetConfirm] = useState('');
  const [selectedSchoolForReset, setSelectedSchoolForReset] = useState<string>('all');
  const [isResetting, setIsResetting] = useState(false);

  // Handlers Principais (Orquestração)
  const verifyPassword = async (pass: string) => {
    return await EcosystemService.verifyUniversalPassword(pass, currentUser, users);
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isAuth = await verifyPassword(adminPasswordForAction);
      if (!isAuth) {
        toast({ title: "Não autorizado", description: "Senha de Super Admin incorreta.", variant: "destructive" });
        return;
      }
      // Validação de E-mail Duplicado (Global)
      const managerEmailLower = newSchool.managerEmail.toLowerCase().trim();
      const existingUser = users.find(u => u.email?.toLowerCase() === managerEmailLower);
      if (existingUser) {
        toast({ 
          title: "Conflito de Cadastro", 
          description: `O e-mail "${newSchool.managerEmail}" já pertence ao usuário "${existingUser.name}". Use um e-mail único para o gestor.`, 
          variant: "destructive" 
        });
        return;
      }

      const sanitizedSchool = {
        ...newSchool,
        name: newSchool.name.toUpperCase().trim(),
        city: newSchool.city.toUpperCase().trim(),
        state: newSchool.state.toUpperCase().trim(),
        contactEmail: newSchool.contactEmail.toLowerCase().trim(),
        managerEmail: newSchool.managerEmail.toLowerCase().trim()
      };

      const res = await registerSchool(sanitizedSchool, sanitizedSchool.initialManagerPassword);
      if (res) {
        toast({ title: "Sucesso", description: "Nova escola cadastrada e ativa!" });
        setIsAddDialogOpen(false);
        setNewSchool({ name: '', city: '', state: '', contactEmail: '', managerEmail: '', initialManagerPassword: '' });
        setAdminPasswordForAction('');
      } else {
        toast({ 
          title: "Erro de Validação", 
          description: "Não foi possível registrar a escola. Verifique se o e-mail do gestor já está em uso ou se faltam dados.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao cadastrar escola.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isAuth = await verifyPassword(adminPasswordForAction);
      if (!isAuth) {
        toast({ title: "Não autorizado", description: "Senha de Super Admin incorreta.", variant: "destructive" });
        return;
      }
      const updatedSchools = schools.map(s => s.id === editingSchoolObj.id ? { ...s, ...schoolEditData } : s);
      updateSchools(updatedSchools);
      toast({ title: "Sucesso", description: "Dados da escola atualizados!" });
      setIsSchoolEditDialogOpen(false);
      setEditingSchoolObj(null);
      setAdminPasswordForAction('');
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar escola.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDev = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedDevs = [...allParticipants];
    if (editingDev) {
      updatedDevs = updatedDevs.map(d => d.id === editingDev.id ? { ...d, ...devFormData } : d);
    } else {
      updatedDevs.push({ ...devFormData });
    }
    const success = await updateParticipants(updatedDevs);
    if (success) {
      toast({ title: "Sucesso", description: "Equipe atualizada!" });
      setIsDevDialogOpen(false);
      setEditingDev(null);
      setDevFormData({ id: '', name: '', role: '', description: '', avatar: '', initials: '' });
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar a equipe.", variant: "destructive" });
    }
  };

  const handleDeleteDev = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este participante?')) return;
    const success = await updateParticipants(allParticipants.filter(d => d.id !== id));
    if (success) {
      toast({ title: "Sucesso", description: "Participante removido." });
    } else {
      toast({ title: "Erro", description: "Falha ao remover o participante.", variant: "destructive" });
    }
  };

  const handleSaveSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email) {
      toast({ title: "Erro", description: "Nome e E-mail são obrigatórios.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Validação de E-mail Duplicado
      const emailLower = userFormData.email.toLowerCase().trim();
      const duplicate = users.find(u => u.email?.toLowerCase() === emailLower && u.id !== editingUser?.id);
      if (duplicate) {
        toast({ title: "E-mail Duplicado", description: `O e-mail ${emailLower} já está sendo usado por outro usuário (${duplicate.name}).`, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const isAuth = await verifyPassword(adminPasswordForAction);
      if (!isAuth) {
        toast({ title: "Não autorizado", description: "Senha incorreta. Operação cancelada.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      let updatedUsers = [...users];
      if (editingUser) {
        // Garantir que estamos editando o objeto correto e atualizando todos os campos necessários
        updatedUsers = updatedUsers.map(u =>
          u.id === editingUser.id
            ? {
              ...u,
              name: userFormData.name.toUpperCase().trim(),
              email: emailLower,
              ra: userFormData.ra?.toUpperCase().trim() || u.ra,
              schoolId: userFormData.role === 'super_admin' ? 'global' : userFormData.schoolId,
              rfid: userFormData.rfid?.toUpperCase().trim() || u.rfid || ''
            }
            : u
        );
      } else {
        let prefix = 'user';
        if (userFormData.role === 'super_admin') prefix = 'super-admin';
        else if (userFormData.role === 'admin') prefix = 'admin';

        if (!editingUser && userFormData.password !== userFormData.confirmPassword) {
          toast({ title: "Erro de Senha", description: "As senhas não coincidem.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }

        const newUser = {
          id: `${prefix}-${Date.now()}`,
          name: userFormData.name.toUpperCase().trim(),
          email: emailLower,
          ra: userFormData.ra?.toUpperCase().trim() || Math.random().toString(36).substring(2, 14).toUpperCase().padEnd(12, '0'),
          role: userFormData.role,
          password: userFormData.password || 'mudar123',
          schoolId: userFormData.role === 'super_admin' ? 'global' : userFormData.schoolId,
          rfid: userFormData.rfid?.toUpperCase().trim() || ''
        };
        updatedUsers.push(newUser as any);
      }

      // Validação local antes de enviar para o serviço para dar feedback preciso
      const raConflict = updatedUsers.find((u, index) => 
        u.ra && updatedUsers.some((other, oIdx) => index !== oIdx && other.ra?.toUpperCase() === u.ra?.toUpperCase())
      );
      if (raConflict) {
        toast({ title: "Conflito de Identidade", description: `O RA/QR Code "${raConflict.ra}" já está em uso por outro usuário.`, variant: "destructive" });
        return;
      }

      const rfidConflict = updatedUsers.find((u, index) => 
        u.rfid && updatedUsers.some((other, oIdx) => index !== oIdx && other.rfid?.toUpperCase() === u.rfid?.toUpperCase())
      );
      if (rfidConflict) {
        toast({ title: "Conflito de Hardware", description: `O cartão RFID "${rfidConflict.rfid}" já está vinculado a outro usuário.`, variant: "destructive" });
        return;
      }

      const emailConflict = updatedUsers.find((u, index) => 
        u.email && updatedUsers.some((other, oIdx) => index !== oIdx && other.email?.toLowerCase() === u.email?.toLowerCase())
      );
      if (emailConflict) {
        toast({ title: "Conflito de Cadastro", description: `O e-mail "${emailConflict.email}" já está registrado no sistema.`, variant: "destructive" });
        return;
      }

      const result = await updateUsers(updatedUsers);
      if (!result.success) {
        toast({ title: "Erro na Operação", description: result.error || "Falha ao salvar. Verifique se o e-mail já não pertence a outro usuário da rede.", variant: "destructive" });
        return;
      }

      const roleName = userFormData.role === 'super_admin' ? "Mestre" : "Gestor de Unidade";
      toast({ title: "Sucesso", description: editingUser ? `${roleName} atualizado!` : `${roleName} adicionado!` });
      setAdminPasswordForAction('');
      setIsUserFormOpen(false);
      setEditingUser(null);
      setUserFormData({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'super_admin', 
        schoolId: 'global', 
        ra: '', 
        rfid: '', 
        confirmPassword: '' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPass, newPass, confirmPass } = passFormData;
    if (newPass !== confirmPass) { toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" }); return; }
    if (newPass.length < 6) { toast({ title: "Erro", description: "Mínimo 6 caracteres.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const adminPass = prompt(`Confirme SUA SENHA de Super Admin para alterar a senha de ${editingUser.name}:`);
      if (!adminPass) { setIsSubmitting(false); return; }
      const isAuth = await verifyPassword(adminPass);
      if (!isAuth) { toast({ title: "Erro", description: "Sua senha de Super Admin está incorreta.", variant: "destructive" }); return; }

      const result = await updateUsers(users.map(u => u.id === editingUser.id ? { ...u, password: newPass } : u));

      if (result.success) {
        toast({ title: "Sucesso", description: `Senha de ${editingUser.name} alterada!` });
        setIsPasswordDialogOpen(false);
        setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
      } else {
        toast({ title: "Erro", description: result.error || "Não foi possível atualizar a senha.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSuperAdmin = async (userToDelete: User) => {
    const userId = userToDelete.id;
    if (!userToDelete) return;

    if (userToDelete.role === 'super_admin' && users.filter(u => u.role === 'super_admin').length <= 1) {
      toast({ title: "Ação Negada", description: "Não remova o último Super Admin.", variant: "destructive" });
      return;
    }

    if (userId === currentUser?.id) {
      const activeSuperAdmins = users.filter(u => u.role === 'super_admin');
      if (activeSuperAdmins.length <= 1) {
        toast({ title: "Ação Negada", description: "Você é o único Super Admin ativo. Crie ou ative outro antes de remover sua conta.", variant: "destructive" });
        return;
      }
      
      const confirmSelf = window.confirm("ATENÇÃO: Você está prestes a EXCLUIR SUA PRÓPRIA CONTA! Você será deslogado imediatamente. Tem certeza que deseja prosseguir?");
      if (!confirmSelf) return;
    }

    const roleName = userToDelete.role === 'super_admin' ? "Mestre Global" : "Gestor de Unidade";
    
    if (!adminPasswordForAction) {
      toast({ title: "Confirmação Necessária", description: "Digite sua senha de mestre para autorizar a exclusão.", variant: "destructive" });
      return;
    }

    const isAuth = await verifyPassword(adminPasswordForAction);
    if (!isAuth) {
      toast({ title: "Erro de Autenticação", description: "Senha incorreta. A exclusão foi cancelada.", variant: "destructive" });
      return;
    }

    const success = await deleteUser(userId);
    setAdminPasswordForAction('');
    if (!success) {
      toast({ title: "Erro na Exclusão", description: "Não foi possível excluir o usuário.", variant: "destructive" });
    } else {
      toast({ title: "Removido", description: `${roleName} removido com sucesso.` });
      if (userId === currentUser?.id) {
        logout();
      }
    }
  };

  const handleMasterReset = async (user: any) => {
    if (!adminPasswordForAction) {
      toast({ title: "Senha Necessária", description: "Confirme sua senha para gerar uma nova credencial.", variant: "destructive" });
      return;
    }
    const isAuth = await verifyPassword(adminPasswordForAction);
    if (!isAuth) { toast({ title: "Erro", description: "Senha incorreta.", variant: "destructive" }); return; }
    const tempPass = `SG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const result = await updateUsers(
      users.map(u => u.id === user.id ? { ...u, password: tempPass, mustChangePassword: true } : u),
      user.schoolId
    );
    if (result && !result.success) {
      toast({ title: "Erro na Operação", description: result.error || "Não foi possível redefinir a senha.", variant: "destructive" });
      return;
    }
    setTempGeneratedPass(tempPass);
    setAdminPasswordForAction('');
    setEditingUser(user);
    toast({ title: "Reset Concluído!" });
  };

  const handleAvatarUpload = async (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingUserId(userId);
    try {
      const url = await uploadUserAvatar(userId, file);
      if (url) toast({ title: "Sucesso", description: "Foto atualizada!" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha no upload.", variant: "destructive" });
    } finally {
      setUploadingUserId(null);
    }
  };

  const handleCycleReset = () => {
    if (resetConfirm !== 'REINICIAR') { toast({ title: "Erro", description: "Digite REINICIAR.", variant: "destructive" }); return; }
    if (!adminPasswordForAction) { toast({ title: "Erro", description: "Digite sua senha.", variant: "destructive" }); return; }
    setIsResetting(true);
    performCycleReset(adminPasswordForAction, selectedSchoolForReset === 'all' ? undefined : selectedSchoolForReset).then(success => {
      if (success) {
        toast({ title: "Ciclo Reiniciado" });
        setResetConfirm('');
        setAdminPasswordForAction('');
        setActiveTab('history');
      } else {
        toast({ title: "Erro", description: "Senha incorreta.", variant: "destructive" });
      }
      setIsResetting(false);
    });
  };

  const isValidStandardId = (id: string) => {
    return id && (
      id.startsWith('super-admin-') || 
      id.startsWith('admin-') || 
      id.startsWith('user-') || 
      id.startsWith('staff-') || 
      id.startsWith('visitor-')
    );
  };

  const superAdminUsers = useMemo(() => users.filter(u => u.role === 'super_admin' && isValidStandardId(u.id)), [users]);
  const unitAdminUsers = useMemo(() => users.filter(u => u.role === 'admin' && isValidStandardId(u.id)), [users]);
  const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);
  const totalPoints = useMemo(() => students.reduce((acc, u) => acc + (userStates[u.id]?.points || 0), 0), [students, userStates]);

  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#070913] items-center justify-center p-4 text-slate-100 overflow-hidden font-sans">
        <style>{`
          .cyber-grid {
            background-size: 30px 30px;
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          }
        `}</style>
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/5 blur-[120px] animate-pulse" />
          <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
        </div>
        <div className="relative z-10 w-full max-w-md backdrop-blur-3xl bg-slate-950/40 border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/5 overflow-hidden p-8 sm:p-10 text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white">Acesso Restrito</h2>
            <p className="text-slate-400 text-xs font-semibold">Esta área é restrita para a administração central global.</p>
          </div>
          <Button asChild className="w-full h-14 text-sm font-bold uppercase tracking-wider bg-slate-900 border border-white/5 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
            <Link href="/">Voltar para o Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 overflow-hidden font-sans">
      <style>{`
        .cyber-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
      `}</style>
      
      {/* Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] right-[-15%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[130px] animate-pulse" style={{ animationDuration: '14s' }} />
        <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_80%,transparent_100%)]" />
      </div>

      <div className="relative z-10 p-6 space-y-8 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] select-none">
                <Leaf className="h-7 w-7 text-indigo-400 fill-indigo-500/20 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-[0.1em] bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text">
                Central de Rede Global
              </h1>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-12">
              Gestão de Impacto e Expansão • <span className="text-indigo-400">{currentUser?.name}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl border border-indigo-400/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:scale-[1.01] active:scale-95 transition-all">
                  <Plus className="h-4 w-4" /> Cadastrar Escola
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0a0f24]/90 backdrop-blur-3xl border border-white/10 text-white shadow-2xl rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Nova Unidade de Rede</DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">Preencha os dados para ativar uma nova escola.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleManualRegister} className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Instituição</Label>
                      <Input required value={newSchool.name} onChange={e => setNewSchool({ ...newSchool, name: e.target.value })} className="bg-slate-950 border-white/10 rounded-xl focus:border-indigo-500/50 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Cidade</Label>
                        <Input required value={newSchool.city} onChange={e => setNewSchool({ ...newSchool, city: e.target.value })} className="bg-slate-950 border-white/10 rounded-xl focus:border-indigo-500/50 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Estado</Label>
                        <Input required maxLength={2} value={newSchool.state} onChange={e => setNewSchool({ ...newSchool, state: e.target.value.toUpperCase() })} className="bg-slate-950 border-white/10 rounded-xl focus:border-indigo-500/50 text-white" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">E-mail Gestor</Label>
                      <Input type="email" required value={newSchool.managerEmail} onChange={e => setNewSchool({ ...newSchool, managerEmail: e.target.value, contactEmail: e.target.value })} className="bg-slate-950 border-white/10 rounded-xl focus:border-indigo-500/50 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Senha Inicial</Label>
                      <Input type="password" required value={newSchool.initialManagerPassword} onChange={e => setNewSchool({ ...newSchool, initialManagerPassword: e.target.value })} className="bg-slate-950 border-white/10 rounded-xl focus:border-indigo-500/50 text-white" />
                    </div>
                    <div className="space-y-2 p-4 bg-slate-950/60 rounded-2xl border border-indigo-500/20">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block ml-1">Sua Senha Master</Label>
                      <Input type="password" required value={adminPasswordForAction} onChange={e => setAdminPasswordForAction(e.target.value)} className="bg-slate-950 border-white/10 rounded-xl focus:border-indigo-500/50 text-white" />
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase text-xs rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-400/20 shadow-md">
                      {isSubmitting ? 'Ativando...' : 'Ativar Unidade'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button asChild variant="outline" className="h-11 border-white/10 hover:bg-white/5 text-slate-300 hover:text-white rounded-xl uppercase font-bold tracking-wider text-[10px]">
              <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> Sair</Link>
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="!flex !w-full h-16 bg-slate-950/80 p-1.5 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl overflow-x-auto">
            <TabsTrigger value="overview" className="flex-1 !inline-flex rounded-xl text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300">Visão Geral</TabsTrigger>
            <TabsTrigger value="schools" className="flex-1 !inline-flex rounded-xl text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300">Rede de Escolas</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 !inline-flex rounded-xl text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300">Gestão de Ciclo</TabsTrigger>
            <TabsTrigger value="telemetry" className="flex-1 !inline-flex rounded-xl text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300">Telemetria</TabsTrigger>
            <TabsTrigger value="developers" className="flex-1 !inline-flex rounded-xl text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300">Equipe</TabsTrigger>
            <TabsTrigger value="account" className="flex-1 !inline-flex rounded-xl text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-indigo-300 data-[state=active]:border data-[state=active]:border-indigo-500/30 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewSection
              activeSchools={schools.filter(s => s.status === 'active')}
              pendingSchools={schools.filter(s => s.status === 'pending')}
              totalPoints={totalPoints}
              studentsCount={students.length}
              terminals={terminals}
              auditLogs={auditLogs}
              wasteEntries={wasteEntries}
              deleteSchool={deleteSchool}
              updateSchoolStatus={updateSchoolStatus}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="schools">
            <SchoolSection
              schools={schools.filter(s => s.status !== 'pending')}
              terminals={terminals}
              deleteSchool={deleteSchool}
              updateSchoolStatus={updateSchoolStatus}
              isSchoolEditDialogOpen={isSchoolEditDialogOpen}
              setIsSchoolEditDialogOpen={setIsSchoolEditDialogOpen}
              editingSchoolObj={editingSchoolObj}
              setEditingSchoolObj={setEditingSchoolObj}
              schoolEditData={schoolEditData}
              setSchoolEditData={setSchoolEditData}
              adminPasswordForAction={adminPasswordForAction}
              setAdminPasswordForAction={setAdminPasswordForAction}
              handleUpdateSchool={handleUpdateSchool}
              isSubmitting={isSubmitting}
              toast={toast}
              setActiveTab={setActiveTab}
              deletePassword={deletePassword}
              setDeletePassword={setDeletePassword}
              isDeleteDialogOpen={isDeleteDialogOpen}
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
              schoolToDelete={schoolToDelete}
              setSchoolToDelete={setSchoolToDelete}
            />
          </TabsContent>

          <TabsContent value="history">
            <CycleSection
              schools={schools}
              resetHistory={resetHistory}
              resetConfirm={resetConfirm}
              setResetConfirm={setResetConfirm}
              selectedSchoolForReset={selectedSchoolForReset}
              setSelectedSchoolForReset={setSelectedSchoolForReset}
              adminPasswordForAction={adminPasswordForAction}
              setAdminPasswordForAction={setAdminPasswordForAction}
              handleCycleReset={handleCycleReset}
              isResetting={isResetting}
            />
          </TabsContent>

          <TabsContent value="developers">
            <TeamSection
              allParticipants={allParticipants}
              isDevDialogOpen={isDevDialogOpen}
              setIsDevDialogOpen={setIsDevDialogOpen}
              editingDev={editingDev}
              setEditingDev={setEditingDev}
              devFormData={devFormData}
              setDevFormData={setDevFormData}
              handleDeleteDev={handleDeleteDev}
              handleSaveDev={handleSaveDev}
              uploadUserAvatar={uploadUserAvatar}
              uploadingUserId={uploadingUserId}
              setUploadingUserId={setUploadingUserId}
            />
          </TabsContent>

          <TabsContent value="account">
            <SecuritySection
              superAdminUsers={superAdminUsers}
              unitAdminUsers={unitAdminUsers}
              schools={schools}
              currentUser={currentUser!}
              isUserFormOpen={isUserFormOpen}
              setIsUserFormOpen={setIsUserFormOpen}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              userFormData={userFormData}
              setUserFormData={setUserFormData}
              isPasswordDialogOpen={isPasswordDialogOpen}
              setIsPasswordDialogOpen={setIsPasswordDialogOpen}
              passFormData={passFormData}
              setPassFormData={setPassFormData}
              handleSaveSuperAdmin={handleSaveSuperAdmin}
              handleUpdatePassword={handleUpdatePassword}
              handleDeleteSuperAdmin={handleDeleteSuperAdmin}
              handleMasterReset={handleMasterReset}
              handleAvatarUpload={handleAvatarUpload}
              uploadingUserId={uploadingUserId}
              tempGeneratedPass={tempGeneratedPass}
              setTempGeneratedPass={setTempGeneratedPass}
              isSubmitting={isSubmitting}
              toast={toast}
              handleCycleReset={handleCycleReset}
              isResetting={isResetting}
              resetConfirm={resetConfirm}
              setResetConfirm={setResetConfirm}
              allCargos={allCargos}
              allSetores={allSetores}
              adminPasswordForAction={adminPasswordForAction}
              setAdminPasswordForAction={setAdminPasswordForAction}
              isRFIDCapturing={isRFIDCapturing}
              setIsRFIDCapturing={setIsRFIDCapturing}
            />
          </TabsContent>

          <TabsContent value="telemetry">
            <TelemetrySection logs={auditLogs} schools={schools} />
          </TabsContent>
        </Tabs>

        <footer className="pt-12 text-center text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pb-12 border-t border-white/5 mt-12">
          Plataforma SchoolGain v2.0 • Sistema Global de Auditoria e Gestão • TDS 2B 2026
        </footer>
      </div>
    </div>
  );
}
