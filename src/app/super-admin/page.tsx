'use client';

import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { School, Terminal, User, AuditLogEntry, WasteEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Plus, 
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EcosystemService } from '@/lib/ecosystem.service';
import { useState, useMemo } from 'react';
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
    allParticipants,
    updateParticipants,
    updateSchools,
    auditLogs,
    wasteEntries,
    uploadUserAvatar
  } = useEcosystem();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);

  // Estados Compartilhados e de Diálogos
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({ name: '', email: '' });
  const [passFormData, setPassFormData] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [tempGeneratedPass, setTempGeneratedPass] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '', city: '', state: '', contactEmail: '', managerEmail: '', managerPassword: '',
  });
  const [adminPasswordForAction, setAdminPasswordForAction] = useState('');

  const [isDevDialogOpen, setIsDevDialogOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<any>(null);
  const [devFormData, setDevFormData] = useState({ id: '', name: '', role: '', description: '', avatar: '', initials: '' });

  const [isSchoolEditDialogOpen, setIsSchoolEditDialogOpen] = useState(false);
  const [editingSchoolObj, setEditingSchoolObj] = useState<any>(null);
  const [schoolEditData, setSchoolEditData] = useState({ name: '', city: '', state: '', managerEmail: '' });

  const [resetConfirm, setResetConfirm] = useState('');
  const [selectedSchoolForReset, setSelectedSchoolForReset] = useState<string>('all');
  const [isResetting, setIsResetting] = useState(false);

  // Handlers Principais (Orquestração)
  const verifyPassword = async (pass: string) => {
    if (!pass || !currentUser) return false;
    const hashed = await EcosystemService.hashPassword(pass);
    return currentUser.password === hashed;
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
      const res = await registerSchool(newSchool);
      if (res) {
        toast({ title: "Sucesso", description: "Nova escola cadastrada e ativa!" });
        setIsAddDialogOpen(false);
        setNewSchool({ name: '', city: '', state: '', contactEmail: '', managerEmail: '', managerPassword: '' });
        setAdminPasswordForAction('');
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

  const handleSaveDev = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedDevs = [...allParticipants];
    if (editingDev) {
      updatedDevs = updatedDevs.map(d => d.id === editingDev.id ? { ...d, ...devFormData } : d);
    } else {
      updatedDevs.push({ ...devFormData, id: devFormData.id || `participant-${Date.now()}` });
    }
    updateParticipants(updatedDevs);
    toast({ title: "Sucesso", description: "Equipe atualizada!" });
    setIsDevDialogOpen(false);
    setEditingDev(null);
    setDevFormData({ id: '', name: '', role: '', description: '', avatar: '', initials: '' });
  };

  const handleDeleteDev = (id: string) => {
    if (!confirm('Tem certeza que deseja remover este participante?')) return;
    updateParticipants(allParticipants.filter(d => d.id !== id));
    toast({ title: "Sucesso", description: "Participante removido." });
  };

  const handleSaveSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email) {
      toast({ title: "Erro", description: "Nome e E-mail são obrigatórios.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let updatedUsers = [...users];
      if (editingUser) {
        updatedUsers = updatedUsers.map(u => u.id === editingUser.id ? { ...u, name: userFormData.name, email: userFormData.email, ra: userFormData.email } : u);
      } else {
        const newUser = {
          id: `super-${Date.now()}`, name: userFormData.name, email: userFormData.email, ra: userFormData.email,
          role: 'super_admin', password: await EcosystemService.hashPassword('mudar123'), points: 0, level: 'Semente', schoolId: 'global'
        };
        updatedUsers.push(newUser as any);
      }
      updateUsers(updatedUsers);
      toast({ title: "Sucesso", description: editingUser ? "Dados atualizados!" : "Mestre adicionado (Senha padrão: mudar123)" });
      setIsUserFormOpen(false);
      setEditingUser(null);
      setUserFormData({ name: '', email: '' });
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
      const isAuth = await verifyPassword(currentPass);
      if (!isAuth) { toast({ title: "Erro", description: "Senha atual incorreta.", variant: "destructive" }); return; }
      const hashedNewPassword = await EcosystemService.hashPassword(newPass);
      updateUsers(users.map(u => u.id === editingUser.id ? { ...u, password: hashedNewPassword } : u));
      toast({ title: "Sucesso", description: `Senha de ${editingUser.name} alterada!` });
      setIsPasswordDialogOpen(false);
      setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSuperAdmin = (userId: string) => {
    if (users.filter(u => u.role === 'super_admin').length <= 1) { toast({ title: "Ação Negada", description: "Não remova o último Super Admin.", variant: "destructive" }); return; }
    if (userId === currentUser?.id) { toast({ title: "Ação Negada", description: "Você não pode se excluir.", variant: "destructive" }); return; }
    if (confirm("Remover este acesso global permanentemente?")) {
      updateUsers(users.filter(u => u.id !== userId));
      toast({ title: "Removido", description: "Mestre removido da rede." });
    }
  };

  const handleMasterReset = async (user: any) => {
    const pass = prompt('Confirme SUA SENHA de Super Admin para gerar senha temporária:');
    if (!pass) return;
    const isAuth = await verifyPassword(pass);
    if (!isAuth) { toast({ title: "Erro", description: "Senha incorreta.", variant: "destructive" }); return; }
    const tempPass = `SG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const hashedTemp = await EcosystemService.hashPassword(tempPass);
    updateUsers(users.map(u => u.id === user.id ? { ...u, password: hashedTemp, mustChangePassword: true } : u));
    setTempGeneratedPass(tempPass);
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

  const superAdminUsers = useMemo(() => users.filter(u => u.role === 'super_admin'), [users]);
  const unitAdminUsers = useMemo(() => users.filter(u => u.role === 'admin'), [users]);
  const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);
  const totalPoints = useMemo(() => students.reduce((acc, u) => acc + (u.points || 0), 0), [students]);

  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6 space-y-6">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse"><ShieldAlert className="h-12 w-12" /></div>
        <div className="space-y-2"><h2 className="text-3xl font-bold">Acesso Restrito</h2><p className="text-muted-foreground">Área exclusiva para administração central.</p></div>
        <Button asChild className="bg-slate-900"><Link href="/">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary animate-spin-slow" /> Central de Rede Global
            </h1>
            <p className="text-slate-500 font-medium">Gestão de Impacto e Expansão • {currentUser?.name}</p>
          </div>
          <div className="flex gap-3">
             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
               <DialogTrigger asChild>
                 <Button className="gap-2 bg-primary font-black uppercase text-[10px] tracking-widest h-10 px-6">
                   <Plus className="h-4 w-4" /> Cadastrar Escola
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-md">
                 <DialogHeader>
                   <DialogTitle className="text-xl font-black uppercase tracking-tighter">Nova Unidade de Rede</DialogTitle>
                   <DialogDescription>Preencha os dados para ativar uma nova escola.</DialogDescription>
                 </DialogHeader>
                 <form onSubmit={handleManualRegister} className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Instituição</Label><Input required value={newSchool.name} onChange={e => setNewSchool({...newSchool, name: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Cidade</Label><Input required value={newSchool.city} onChange={e => setNewSchool({...newSchool, city: e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Estado</Label><Input required maxLength={2} value={newSchool.state} onChange={e => setNewSchool({...newSchool, state: e.target.value.toUpperCase()})} /></div>
                      </div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-70">E-mail Gestor</Label><Input type="email" required value={newSchool.managerEmail} onChange={e => setNewSchool({...newSchool, managerEmail: e.target.value, contactEmail: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Senha Inicial</Label><Input type="password" required value={newSchool.managerPassword} onChange={e => setNewSchool({...newSchool, managerPassword: e.target.value})} /></div>
                      <div className="space-y-1 p-3 bg-slate-50 rounded-lg border">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sua Senha Master</Label>
                        <Input type="password" required value={adminPasswordForAction} onChange={e => setAdminPasswordForAction(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase text-xs">Ativar Unidade</Button></DialogFooter>
                 </form>
               </DialogContent>
             </Dialog>
             <Button asChild variant="outline" className="h-10"><Link href="/"><ArrowLeft className="h-4 w-4" /> Sair</Link></Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[1000px] h-12 bg-slate-200/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white font-black uppercase text-[10px] tracking-widest">Visão Geral</TabsTrigger>
            <TabsTrigger value="schools" className="rounded-lg data-[state=active]:bg-white font-black uppercase text-[10px] tracking-widest">Rede de Escolas</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white font-black uppercase text-[10px] tracking-widest">Gestão de Ciclo</TabsTrigger>
            <TabsTrigger value="developers" className="rounded-lg data-[state=active]:bg-white font-black uppercase text-[10px] tracking-widest">Desenvolvedores</TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white font-black uppercase text-[10px] tracking-widest">Minha Segurança</TabsTrigger>
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
              activeSchools={schools.filter(s => s.status === 'active')}
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
            />
          </TabsContent>
        </Tabs>
        
        <footer className="pt-12 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pb-12">
          Plataforma SchoolGain v2.0 • Sistema Global de Auditoria e Gestão • TDS 2B 2026
        </footer>
      </div>
    </div>
  );
}
