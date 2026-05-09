'use client';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { Participant, Turma, Curso, School, Terminal, TerminalStatus } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  School as SchoolIcon, 
  ShieldAlert, 
  Trash2, 
  TrendingUp, 
  Users, 
  Zap,
  ArrowLeft,
  Mail,
  Lock,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Save,
  Plus,
  Edit,
  RotateCcw,
  History,
  Download,
  BarChart3,
  Trophy,
  BookOpen,
  GraduationCap
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
    allTurmas,
    allCursos,
    updateTurmas,
    updateCursos
  } = useEcosystem();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Estados para Gestão de Super Admins
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: ''
  });

  // Estados para troca de senha (unificado)
  const [passFormData, setPassFormData] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: ''
  });
  const [tempGeneratedPass, setTempGeneratedPass] = useState<string | null>(null);

  // Estados para cadastro manual de escola
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    city: '',
    state: '',
    contactEmail: '',
    managerEmail: '',
    managerPassword: '',
  });
  const [adminPasswordForAction, setAdminPasswordForAction] = useState('');

  // Estados para Gestão de Desenvolvedores
  const [isDevDialogOpen, setIsDevDialogOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<any>(null);
  const [devFormData, setDevFormData] = useState({
    name: '',
    role: '',
    description: '',
    avatar: '',
    initials: ''
  });

  // Estados para Edição de Escola
  const [isSchoolEditDialogOpen, setIsSchoolEditDialogOpen] = useState(false);
  const [editingSchoolObj, setEditingSchoolObj] = useState<any>(null);
  const [schoolEditData, setSchoolEditData] = useState({
    name: '',
    city: '',
    state: '',
    managerEmail: ''
  });
  
  // Estados para Gestão de Turmas e Cursos
  const [isTurmaDialogOpen, setIsTurmaDialogOpen] = useState(false);
  const [isCursoDialogOpen, setIsCursoDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [turmaFormData, setTurmaFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });
  const [cursoFormData, setCursoFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });

  const verifyPassword = async (pass: string) => {
    if (!pass || !currentUser) return false;
    const hashed = await EcosystemService.hashPassword(pass);
    return currentUser.password === hashed;
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Verifica senha do Super Admin antes de cadastrar
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

      const updatedSchools = schools.map(s => s.id === editingSchoolObj.id ? {
        ...s,
        ...schoolEditData
      } : s);

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
      updatedDevs.push({
        id: `participant-${Date.now()}`,
        ...devFormData
      });
    }
    updateParticipants(updatedDevs);
    toast({ title: "Sucesso", description: "Equipe atualizada!" });
    setIsDevDialogOpen(false);
    setEditingDev(null);
    setDevFormData({ name: '', role: '', description: '', avatar: '', initials: '' });
  };

  const handleDeleteDev = (id: string) => {
    if (!confirm('Tem certeza que deseja remover este participante?')) return;
    const updatedDevs = allParticipants.filter(d => d.id !== id);
    updateParticipants(updatedDevs);
    toast({ title: "Sucesso", description: "Participante removido." });
  };

  const students = users.filter(u => u.role === 'student');
  const totalPoints = students.reduce((acc, u) => acc + (u.points || 0), 0);
  const activeSchools = schools.filter(s => s.status === 'active');
  const pendingSchools = schools.filter(s => s.status === 'pending');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPass, newPass, confirmPass } = passFormData;

    if (newPass !== confirmPass) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    
    const res = await updateMyPassword(currentPass, newPass);
    if (res) {
      toast({ title: "Sucesso", description: "Senha alterada com sucesso!" });
      setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
    } else {
      toast({ title: "Erro", description: "Senha atual incorreta.", variant: "destructive" });
    }
  };

  const superAdminUsers = useMemo(() => users.filter(u => u.role === 'super_admin'), [users]);
  const unitAdminUsers = useMemo(() => users.filter(u => u.role === 'admin'), [users]);

  const handleSaveTurma = (e: React.FormEvent) => {
    e.preventDefault();
    let newTurmas;
    if (editingTurma) {
      newTurmas = allTurmas.map(t => t.id === editingTurma.id ? { ...t, ...turmaFormData } : t);
    } else {
      newTurmas = [...allTurmas, { id: `turma-${Date.now()}`, ...turmaFormData }];
    }
    updateTurmas(newTurmas);
    setIsTurmaDialogOpen(false);
    setEditingTurma(null);
    setTurmaFormData({ name: '', status: 'active' });
    toast({ title: "Sucesso", description: "Turma atualizada." });
  };

  const handleSaveCurso = (e: React.FormEvent) => {
    e.preventDefault();
    let newCursos;
    if (editingCurso) {
      newCursos = allCursos.map(c => c.id === editingCurso.id ? { ...c, ...cursoFormData } : c);
    } else {
      newCursos = [...allCursos, { id: `curso-${Date.now()}`, ...cursoFormData }];
    }
    updateCursos(newCursos);
    setIsCursoDialogOpen(false);
    setEditingCurso(null);
    setCursoFormData({ name: '', status: 'active' });
    toast({ title: "Sucesso", description: "Curso atualizado." });
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
        updatedUsers = updatedUsers.map(u => u.id === editingUser.id ? {
          ...u,
          name: userFormData.name,
          email: userFormData.email,
          ra: userFormData.email,
        } : u);
      } else {
        // Para novos usuários, pedimos senha na criação? 
        // O usuário pediu para separar. Vamos manter um fluxo de criação com senha inicial,
        // mas a EDIÇÃO será separada.
        toast({ title: "Aviso", description: "Use o botão de chave para definir a senha após criar." });
        const newUser = {
          id: `super-${Date.now()}`,
          name: userFormData.name,
          email: userFormData.email,
          ra: userFormData.email,
          role: 'super_admin',
          password: await EcosystemService.hashPassword('mudar123'), // Senha padrão inicial
          points: 0,
          level: 'Semente',
          schoolId: 'global'
        };
        updatedUsers.push(newUser as any);
      }

      updateUsers(updatedUsers);
      toast({ title: "Sucesso", description: editingUser ? "Dados atualizados!" : "Mestre adicionado (Senha padrão: mudar123)" });
      setIsUserFormOpen(false);
      setEditingUser(null);
      setUserFormData({ name: '', email: '' });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao processar operação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPass, newPass, confirmPass } = passFormData;

    if (newPass !== confirmPass) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    if (newPass.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Verifica se a senha de autorização está correta
      const isAuth = await verifyPassword(currentPass);
      if (!isAuth) {
        toast({ title: "Erro", description: "Sua senha atual está incorreta.", variant: "destructive" });
        return;
      }

      const hashedNewPassword = await EcosystemService.hashPassword(newPass);
      const updatedUsers = users.map(u => u.id === editingUser.id ? {
        ...u,
        password: hashedNewPassword
      } : u);

      updateUsers(updatedUsers);
      toast({ title: "Sucesso", description: `Senha de ${editingUser.name} alterada!` });
      setIsPasswordDialogOpen(false);
      setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar senha.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSuperAdmin = (userId: string) => {
    if (superAdminUsers.length <= 1) {
      toast({ title: "Ação Negada", description: "Não é possível remover o único Super Admin do sistema.", variant: "destructive" });
      return;
    }

    if (userId === currentUser?.id) {
      toast({ title: "Ação Negada", description: "Você não pode se auto-excluir enquanto estiver logado.", variant: "destructive" });
      return;
    }

    if (confirm("Tem certeza? Este usuário perderá todo o acesso global imediatamente.")) {
      updateUsers(users.filter(u => u.id !== userId));
      toast({ title: "Removido", description: "Mestre removido da rede." });
    }
  };

  const handleMasterReset = async (user: any) => {
    if (!adminPasswordForAction) {
      toast({ title: "Erro", description: "Confirme sua senha de Super Admin no campo abaixo antes de resetar.", variant: "destructive" });
      return;
    }

    const isAuth = await verifyPassword(adminPasswordForAction);
    if (!isAuth) {
      toast({ title: "Erro", description: "Senha de Super Admin incorreta.", variant: "destructive" });
      return;
    }

    const tempPass = `SG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const hashedTemp = await EcosystemService.hashPassword(tempPass);

    const updatedUsers = users.map(u => u.id === user.id ? {
      ...u,
      password: hashedTemp,
      mustChangePassword: true
    } : u);

    updateUsers(updatedUsers);
    setTempGeneratedPass(tempPass);
    setEditingUser(user);
    toast({ title: "Reset Concluído!", description: "Senha temporária gerada com sucesso." });
  };

  const [resetConfirm, setResetConfirm] = useState('');
  const [selectedSchoolForReset, setSelectedSchoolForReset] = useState<string>('all');
  const [isResetting, setIsResetting] = useState(false);

  const handleCycleReset = () => {
    if (resetConfirm !== 'REINICIAR') {
      toast({ title: "Erro", description: "Digite REINICIAR para confirmar.", variant: "destructive" });
      return;
    }
    if (!adminPasswordForAction) {
      toast({ title: "Erro", description: "Digite sua senha para confirmar.", variant: "destructive" });
      return;
    }
    setIsResetting(true);
    const targetSchoolId = selectedSchoolForReset === 'all' ? undefined : selectedSchoolForReset;
    performCycleReset(adminPasswordForAction, targetSchoolId).then(success => {
      if (success) {
        const schoolName = selectedSchoolForReset === 'all' ? 'Toda a Rede' : schools.find(s => s.id === selectedSchoolForReset)?.name;
        toast({ title: "Ciclo Reiniciado", description: `Dados de ${schoolName} foram arquivados e zerados.` });
        setResetConfirm('');
        setAdminPasswordForAction('');
        setActiveTab('history');
      } else {
        toast({ title: "Erro", description: "Senha incorreta ou falha no reset.", variant: "destructive" });
      }
      setIsResetting(false);
    });
  };

  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6 space-y-6">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-muted-foreground">Esta área é exclusiva para a administração central da rede.</p>
        </div>
        <Button asChild size="lg" className="bg-slate-900 hover:bg-black">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* HEADER ESTRATÉGICO */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary animate-spin-slow" />
              Central de Rede Global
            </h1>
            <p className="text-slate-500 font-medium">Gestão de Impacto e Expansão • {currentUser?.name}</p>
          </div>
          <div className="flex gap-3">
             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
               <DialogTrigger asChild>
                 <Button className="gap-2 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest h-10 px-6">
                   <Plus className="h-4 w-4" /> Cadastrar Escola
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-md">
                 <DialogHeader>
                   <DialogTitle className="text-xl font-black uppercase tracking-tighter">Nova Unidade de Rede</DialogTitle>
                   <DialogDescription>Preencha os dados para ativar uma nova escola imediatamente.</DialogDescription>
                 </DialogHeader>
                 <form onSubmit={handleManualRegister} className="space-y-4 pt-4">
                   <div className="grid gap-4">
                     <div className="space-y-1">
                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome da Instituição</Label>
                       <Input required value={newSchool.name} onChange={e => setNewSchool({...newSchool, name: e.target.value})} placeholder="Ex: CETI Frei José Apicella" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Cidade</Label>
                          <Input required value={newSchool.city} onChange={e => setNewSchool({...newSchool, city: e.target.value})} placeholder="Guadalupe" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Estado (UF)</Label>
                          <Input required maxLength={2} value={newSchool.state} onChange={e => setNewSchool({...newSchool, state: e.target.value.toUpperCase()})} placeholder="PI" />
                        </div>
                     </div>
                     <div className="space-y-1">
                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">E-mail Administrativo</Label>
                       <Input type="email" required value={newSchool.managerEmail} onChange={e => setNewSchool({...newSchool, managerEmail: e.target.value, contactEmail: e.target.value})} placeholder="gestor@escola.com" />
                     </div>
                     <div className="space-y-1">
                       <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Senha Inicial do Gestor</Label>
                       <Input type="password" required value={newSchool.managerPassword} onChange={e => setNewSchool({...newSchool, managerPassword: e.target.value})} placeholder="••••••••" />
                     </div>
                      <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sua Senha (Super Admin)</Label>
                        <Input 
                          type="password" 
                          required 
                          value={adminPasswordForAction} 
                          onChange={e => setAdminPasswordForAction(e.target.value)} 
                          placeholder="Confirme sua identidade" 
                        />
                      </div>
                   </div>
                   <DialogFooter className="pt-4">
                     <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase text-xs tracking-widest">
                       {isSubmitting ? 'Processando...' : 'Ativar Unidade na Rede'}
                     </Button>
                   </DialogFooter>
                 </form>
               </DialogContent>
             </Dialog>
             <Button asChild variant="outline" className="gap-2 h-10 border-slate-200 hover:bg-slate-100">
               <Link href="/"><ArrowLeft className="h-4 w-4" /> Sair</Link>
             </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[1000px] h-12 bg-slate-200/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="schools" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
              Rede de Escolas
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
              Gestão de Ciclo
            </TabsTrigger>
            <TabsTrigger value="developers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
              Desenvolvedores
            </TabsTrigger>
            <TabsTrigger value="academic" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
               Acadêmico
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
              Minha Segurança
            </TabsTrigger>
          </TabsList>

          {/* ABA: VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
            {/* MÉTRICAS DE REDE */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20 overflow-hidden relative group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <CardContent className="pt-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Escolas Parceiras</p>
                      <h3 className="text-4xl font-black mt-1">{activeSchools.length}</h3>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg"><SchoolIcon className="h-5 w-5" /></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/90">
                    <TrendingUp className="h-3 w-3" /> Expansão de rede ativa
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 text-white border-none shadow-lg overflow-hidden relative group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                <CardContent className="pt-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio-Coins na Rede</p>
                      <h3 className="text-3xl font-black mt-1 text-emerald-400">{(totalPoints / 1000).toFixed(1)}k</h3>
                    </div>
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Zap className="h-5 w-5" /></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                    Moeda global estabilizada
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Agentes Ativos</p>
                      <h3 className="text-3xl font-black mt-1">{students.length}</h3>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Users className="h-5 w-5" /></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600">
                    Alunos engajados na causa
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Totens Ativos</p>
                      <h3 className="text-3xl font-black mt-1">{terminals.filter(t => t.status === 'active').length}</h3>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Zap className="h-5 w-5" /></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-600">
                    Hardware IoT operando
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* SOLICITAÇÕES PENDENTES */}
              <Card className="lg:col-span-1 border-amber-100 bg-amber-50/30">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Novas Solicitações
                  </CardTitle>
                  <CardDescription>Aprovação de novos parceiros.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingSchools.map(school => (
                    <div key={school.id} className="p-4 bg-white border border-amber-200 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                          <SchoolIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{school.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{school.city}, {school.state}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-[10px] font-bold text-red-600 hover:bg-red-50"
                          onClick={() => deleteSchool(school.id)}
                        >
                          Recusar
                        </Button>
                        <Button 
                          size="sm" 
                          className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700"
                          onClick={async () => {
                            await updateSchoolStatus(school.id, 'active');
                            toast({ title: "Escola Aprovada", description: `${school.name} agora faz parte da rede.` });
                          }}
                        >
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingSchools.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      Nenhuma solicitação aguardando.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ÚLTIMOS EVENTOS DE REDE */}
              <Card className="lg:col-span-2 border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Atividade Recente da Rede</CardTitle>
                  <CardDescription>Monitoramento em tempo real de novos ingressos.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-6">
                      <div className="flex gap-4">
                         <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0"></div>
                         <div className="space-y-1">
                            <p className="text-sm font-bold">Nova Unidade Integrada</p>
                            <p className="text-xs text-muted-foreground">O terminal em Guadalupe/PI registrou 50 descartes na última hora.</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Há 15 minutos</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0"></div>
                         <div className="space-y-1">
                            <p className="text-sm font-bold">Meta de Sustentabilidade</p>
                            <p className="text-xs text-muted-foreground">A rede atingiu a marca de 50.000 Bio-Coins distribuídos.</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Há 2 horas</p>
                         </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

<TabsContent value="schools" className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeSchools.map((school) => (
                  <Card key={school.id} className="group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden flex flex-col">
                     <div className="h-1.5 bg-primary/20 group-hover:bg-primary transition-colors"></div>
                     <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                           <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <Building2 className="h-6 w-6" />
                           </div>
                           <div className="flex gap-1">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                                 onClick={() => {
                                   setEditingSchoolObj(school);
                                   setSchoolEditData({
                                     name: school.name,
                                     city: school.city,
                                     state: school.state,
                                     managerEmail: school.managerEmail || school.contactEmail || ''
                                   });
                                   setIsSchoolEditDialogOpen(true);
                                 }}
                               >
                                  <Edit className="h-4 w-4" />
                               </Button>
                               <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-6">Ativo</Badge>
                            </div>
                        </div>
                        <CardTitle className="mt-4 text-xl font-bold tracking-tight">{school.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter">
                           <Globe className="h-3 w-3" /> {school.city} • {school.state}
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4 flex-1">
                        <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <div className="text-[10px]">
                                 <p className="font-black uppercase tracking-widest text-slate-500 scale-[0.8] origin-left">Login do Gestor</p>
                                 <p className="font-mono text-slate-900 font-bold">{school.managerEmail || school.contactEmail}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <div className="text-[10px]">
                                 <p className="font-black uppercase tracking-widest text-slate-500 scale-[0.8] origin-left">Parceiro desde</p>
                                 <p className="text-slate-900 font-bold">{new Date(school.joinedDate).toLocaleDateString('pt-BR')}</p>
                              </div>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center py-2">
                           <div>
                              <p className="text-xl font-black text-primary">0</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Alunos</p>
                           </div>
                           <div>
                              <p className="text-xl font-black text-slate-900">{terminals.filter(t => t.schoolId === school.id).length}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Totens</p>
                           </div>
                        </div>
                     </CardContent>
                     <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 gap-3">
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="flex-1 font-black uppercase text-[10px] tracking-widest h-10 border-primary/20 text-primary hover:bg-primary hover:text-white"
                           asChild
                        >
                           <Link href={`/admin?schoolId=${school.id}`}>
                              <ExternalLink className="mr-2 h-3 w-3" /> Entrar na Unidade
                           </Link>
                        </Button>
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50"
                           onClick={() => {
                              if(confirm(`Encerrar parceria com ${school.name}? Todos os dados desta unidade serão arquivados.`)) {
                                 deleteSchool(school.id);
                                 toast({ title: "Escola Removida", description: "O acesso desta unidade foi revogado." });
                              }
                           }}
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </CardFooter>
                  </Card>
                ))}
                
                {/* MODAL DE EDIÇÃO DE ESCOLA */}
                <Dialog open={isSchoolEditDialogOpen} onOpenChange={setIsSchoolEditDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Edit className="h-5 w-5 text-primary" /> Ajustar Escola
                      </DialogTitle>
                      <DialogDescription>Corrija os dados institucionais da unidade.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSchool} className="space-y-4 pt-4">
                      <div className="grid gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome da Instituição</Label>
                          <Input required value={schoolEditData.name} onChange={e => setSchoolEditData({...schoolEditData, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Cidade</Label>
                             <Input required value={schoolEditData.city} onChange={e => setSchoolEditData({...schoolEditData, city: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Estado (UF)</Label>
                             <Input required maxLength={2} value={schoolEditData.state} onChange={e => setSchoolEditData({...schoolEditData, state: e.target.value.toUpperCase()})} />
                           </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">E-mail Administrativo</Label>
                          <Input type="email" required value={schoolEditData.managerEmail} onChange={e => setSchoolEditData({...schoolEditData, managerEmail: e.target.value})} />
                        </div>
                        
                        <div className="space-y-1 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-amber-700">Confirmação de Identidade</Label>
                          <Input 
                            type="password" 
                            required 
                            value={adminPasswordForAction} 
                            onChange={e => setAdminPasswordForAction(e.target.value)} 
                            placeholder="Sua senha de Super Admin" 
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase text-xs tracking-widest">
                          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {activeSchools.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4">
                     <Building2 className="h-12 w-12 text-slate-200 mx-auto" />
                     <p className="text-slate-500">Nenhuma escola ativa na rede ainda.</p>
                     <Button variant="outline" onClick={() => setActiveTab('overview')}>Ver Solicitações</Button>
                  </div>
                )}
             </div>
          </TabsContent>

          {/* ABA: MINHA CONTA / SEGURANÇA (CRUD SUPER ADMINS) */}
          <TabsContent value="account" className="animate-in fade-in duration-500 space-y-6">
                         <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                   <div className="h-1.5 bg-slate-900"></div>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-8">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                            <ShieldAlert className="h-6 w-6" />
                         </div>
                         <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                               Equipe de Gestão Global
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Administradores com acesso total a toda a rede SchoolGain.</CardDescription>
                         </div>
                      </div>
                      
                      <Dialog open={isUserFormOpen} onOpenChange={(open) => {
                        setIsUserFormOpen(open);
                        if (!open) {
                          setEditingUser(null);
                          setUserFormData({ name: '', email: '' });
                        }
                      }}>
                        <DialogTrigger asChild>
                           <Button className="bg-slate-900 font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-6">
                              <Plus className="h-4 w-4" /> Novo Mestre
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                           <DialogHeader>
                              <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                                {editingUser ? `Editar Mestre: ${editingUser.name}` : 'Cadastrar Novo Super Admin'}
                              </DialogTitle>
                              <DialogDescription>
                                Altere o nome e e-mail de acesso. A senha deve ser alterada separadamente.
                              </DialogDescription>
                           </DialogHeader>
                           <form onSubmit={handleSaveSuperAdmin} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</Label>
                                 <Input 
                                   required 
                                   value={userFormData.name}
                                   onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                                   placeholder="Ex: Carlos Andrade"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail (Login)</Label>
                                 <Input 
                                   type="email"
                                   required 
                                   value={userFormData.email}
                                   onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                                   placeholder="gestor@schoolgain.com"
                                 />
                              </div>
                              <DialogFooter className="pt-4">
                                 <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900">
                                    {isSubmitting ? 'Processando...' : editingUser ? 'Atualizar Dados' : 'Salvar Novo Mestre'}
                                 </Button>
                              </DialogFooter>
                           </form>
                        </DialogContent>
                      </Dialog>

                      {/* MODAL DE TROCA DE SENHA SEPARADO */}
                      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
                        setIsPasswordDialogOpen(open);
                        if (!open) {
                          setEditingUser(null);
                          setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
                        }
                      }}>
                        <DialogContent>
                           <DialogHeader>
                              <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" /> Alterar Senha: {editingUser?.name}
                              </DialogTitle>
                              <DialogDescription>
                                {editingUser?.id === currentUser?.id 
                                  ? 'Confirme sua senha atual para definir uma nova.' 
                                  : 'Digite SUA SENHA de Super Admin para autorizar o reset.'}
                              </DialogDescription>
                           </DialogHeader>
                           <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
                              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sua Senha Atual (Confirmação)</Label>
                                 <Input 
                                   type="password"
                                   required 
                                   value={passFormData.currentPass}
                                   onChange={e => setPassFormData({...passFormData, currentPass: e.target.value})}
                                   placeholder="Confirme sua identidade"
                                 />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Senha</Label>
                                    <Input 
                                      type="password"
                                      required
                                      value={passFormData.newPass}
                                      onChange={e => setPassFormData({...passFormData, newPass: e.target.value})}
                                      placeholder="Mínimo 6 chars"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmar</Label>
                                    <Input 
                                      type="password"
                                      required
                                      value={passFormData.confirmPass}
                                      onChange={e => setPassFormData({...passFormData, confirmPass: e.target.value})}
                                      placeholder="Repita a senha"
                                    />
                                 </div>
                              </div>
                              <DialogFooter className="pt-4">
                                 <Button type="submit" disabled={isSubmitting} className="w-full bg-primary font-black uppercase text-xs tracking-widest">
                                    {isSubmitting ? 'Atualizando...' : 'Confirmar Nova Senha'}
                                 </Button>
                              </DialogFooter>
                           </form>
                        </DialogContent>
                      </Dialog>
                   </CardHeader>
                   <CardContent>
                      <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm">
                           <thead className="bg-slate-50">
                              <tr>
                                 <th className="px-4 py-3 text-left font-black uppercase text-[10px] tracking-widest text-slate-500">Nome</th>
                                 <th className="px-4 py-3 text-left font-black uppercase text-[10px] tracking-widest text-slate-500">Acesso</th>
                                 <th className="px-4 py-3 text-right font-black uppercase text-[10px] tracking-widest text-slate-500">Ações</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {superAdminUsers.map((user, idx) => (
                                <tr key={`${user.id}-${user.email}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                   <td className="px-4 py-4 font-bold text-slate-900">
                                      <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                            {user.name.charAt(0)}
                                         </div>
                                         {user.name}
                                         {user.id === currentUser?.id && <Badge className="bg-emerald-500 text-[8px] font-black uppercase tracking-widest">Você</Badge>}
                                      </div>
                                   </td>
                                   <td className="px-4 py-4 text-slate-500 font-mono text-xs">{user.email}</td>
                                   <td className="px-4 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           title="Alterar Senha"
                                           className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                           onClick={() => {
                                             setEditingUser(user);
                                             setIsPasswordDialogOpen(true);
                                           }}
                                         >
                                            <Lock className="h-4 w-4" />
                                         </Button>
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           title="Editar Dados"
                                           className="h-8 w-8 text-slate-400 hover:text-slate-900"
                                           onClick={() => {
                                             setEditingUser(user);
                                             setUserFormData({
                                               name: user.name,
                                               email: user.email || '',
                                             });
                                             setIsUserFormOpen(true);
                                           }}
                                         >
                                            <Edit className="h-4 w-4" />
                                         </Button>
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           title="Excluir"
                                           className="h-8 w-8 text-slate-400 hover:text-red-600"
                                           onClick={() => handleDeleteSuperAdmin(user.id)}
                                         >
                                            <Trash2 className="h-4 w-4" />
                                         </Button>
                                      </div>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                   </CardContent>
                </Card>

                {/* GESTORES DE UNIDADE (VISUAL PREMIUM) */}
                <Card className="border-none shadow-2xl overflow-hidden mt-12 bg-white/50 backdrop-blur-sm">
                   <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-primary/80"></div>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-8">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Building2 className="h-6 w-6" />
                         </div>
                         <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                               Gestores das Unidades
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Controle centralizado de todos os administradores locais da rede.</CardDescription>
                         </div>
                      </div>
                      <Badge variant="outline" className="h-8 px-4 border-slate-200 bg-white text-slate-600 font-black uppercase tracking-widest text-[10px]">
                        {unitAdminUsers.length} Administradores
                      </Badge>
                   </CardHeader>
                   <CardContent className="px-6 pb-8">
                      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                           <thead className="bg-slate-50/50 border-b border-slate-100">
                              <tr>
                                 <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Identificação do Gestor</th>
                                 <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Unidade Escolar</th>
                                 <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Acesso</th>
                                 <th className="px-6 py-4 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Ações de Controle</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {unitAdminUsers.length > 0 ? unitAdminUsers.map((user, idx) => (
                                <tr key={`${user.id}-${user.email}-${idx}`} className="group hover:bg-slate-50/80 transition-all duration-200">
                                   <td className="px-6 py-5 font-bold text-slate-900">
                                      <div className="flex items-center gap-4">
                                         <div className="relative">
                                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black uppercase group-hover:scale-110 transition-transform">
                                               {user.name.charAt(0)}
                                            </div>
                                            {user.mustChangePassword && (
                                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 border-2 border-white rounded-full animate-pulse" />
                                            )}
                                         </div>
                                         <div className="flex flex-col">
                                            <span className="text-sm font-bold tracking-tight">{user.name}</span>
                                            {user.mustChangePassword && (
                                              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Troca Obrigatória Pendente</span>
                                            )}
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-5">
                                      <div className="flex items-center gap-2">
                                         <SchoolIcon className="h-3 w-3 text-slate-400" />
                                         <span className="text-xs font-semibold text-slate-600 uppercase tracking-tighter">
                                           {schools.find(s => s.id === user.schoolId)?.name || 'Sem Escola'}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-5 text-slate-400 font-mono text-[10px] group-hover:text-slate-900 transition-colors">
                                      {user.email || user.ra}
                                   </td>
                                   <td className="px-6 py-5 text-right">
                                      <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           title="Master Reset (Senha Temporária)"
                                           className="h-9 w-9 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                           onClick={() => handleMasterReset(user)}
                                         >
                                            <ShieldCheck className="h-5 w-5" />
                                         </Button>
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           title="Editar Dados"
                                           className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                           onClick={() => {
                                             setEditingUser(user);
                                             setUserFormData({
                                               name: user.name,
                                               email: user.email || user.ra || '',
                                             });
                                             setIsUserFormOpen(true);
                                           }}
                                         >
                                            <Edit className="h-4 w-4" />
                                         </Button>
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           title="Excluir"
                                           className="h-9 w-9 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                           onClick={() => handleDeleteSuperAdmin(user.id)}
                                         >
                                            <Trash2 className="h-4 w-4" />
                                         </Button>
                                      </div>
                                   </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                       <Users className="h-12 w-12" />
                                       <p className="text-xs font-black uppercase tracking-widest italic">Nenhum gestor cadastrado na rede</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                      </div>
                   </CardContent>
                </Card>

                {/* MODAL DE RESULTADO DO RESET (SENHA TEMPORÁRIA) */}
                <Dialog open={!!tempGeneratedPass} onOpenChange={(open) => { if(!open) setTempGeneratedPass(null); }}>
                  <DialogContent className="sm:max-w-md bg-amber-50 border-amber-200">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tighter text-amber-900 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-600" /> Senha Gerada!
                      </DialogTitle>
                      <DialogDescription className="text-amber-800">
                        Envie esta senha para <strong>{editingUser?.name}</strong>. Ele será obrigado a trocá-la no primeiro acesso.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 bg-white p-4 rounded-xl border-2 border-amber-200 justify-center">
                       <span className="text-3xl font-black font-mono tracking-[0.3em] text-slate-900">
                          {tempGeneratedPass}
                       </span>
                    </div>
                    <DialogFooter className="sm:justify-start">
                      <Button type="button" variant="outline" className="w-full border-amber-300 text-amber-900 font-bold uppercase tracking-widest text-[10px]" onClick={() => setTempGeneratedPass(null)}>
                        Copiei, fechar aviso
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="space-y-6">
                   <Card className="bg-slate-900 text-white border-none shadow-xl">
                      <CardContent className="pt-6 space-y-4">
                         <div className="flex items-start gap-3">
                            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                            <div>
                               <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Proteção Master Ativa</p>
                               <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                  Como Super Admin, você detém a chave mestra da rede SchoolGain. 
                                  A alteração de senhas agora exige sua confirmação de identidade em tempo real para prevenir acessos não autorizados.
                                </p>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                </div>
          </TabsContent>

          {/* ABA: HISTÓRICO DE CICLOS */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Histórico de Encerramentos
                    </CardTitle>
                    <CardDescription>Consulte os dados de ciclos que já foram finalizados.</CardDescription>
                </CardHeader>
                <CardContent>
                    {resetHistory.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl space-y-3">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                            <p className="text-muted-foreground font-medium">Nenhum ciclo foi encerrado ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resetHistory.map((snapshot) => (
                                <Card key={snapshot.id} className="bg-slate-50/50 border-none shadow-sm hover:shadow-md transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-sm font-bold uppercase tracking-tight">
                                                    Ciclo Finalizado {snapshot.schoolId ? `- ${schools.find(s => s.id === snapshot.schoolId)?.name || 'Escola Removida'}` : '(Global)'}
                                                </CardTitle>
                                                <CardDescription className="text-xs">Data: {new Date(snapshot.endDate).toLocaleString('pt-BR')}</CardDescription>
                                            </div>
                                            <Badge variant="outline" className="bg-white">ID: {snapshot.id.split('-')[1]}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Coleta Total</p>
                                                <p className="text-xl font-black">{snapshot.totalWasteKg.toFixed(1)} kg</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pontos Gerados</p>
                                                <p className="text-xl font-black text-primary">{snapshot.totalPoints} pts</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Líder do Ciclo</p>
                                                <p className="text-sm font-bold truncate">{snapshot.topStudents[0]?.name || '---'}</p>
                                            </div>
                                            <div className="flex items-end justify-end">
                                                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs font-bold uppercase">
                                                    <Download className="h-3 w-3" /> Relatório CSV
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 bg-white rounded-lg border border-primary/5">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-1">
                                                <Trophy className="h-3 w-3 text-amber-500" /> Top 3 Estudantes
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {snapshot.topStudents.slice(0, 3).map((s, idx) => (
                                                    <div key={s.ra} className="text-center p-2 rounded bg-amber-50/30 border border-amber-100/50">
                                                        <p className="text-[10px] font-bold truncate">{s.name}</p>
                                                        <p className="text-xs font-black text-amber-700">{s.points} pts</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-red-200 shadow-lg bg-red-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <ShieldAlert className="h-5 w-5" />
                        Zona de Perigo
                    </CardTitle>
                    <CardDescription className="text-red-800/70 font-medium">Ações irreversíveis que impactam toda a rede SchoolGain.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-white border border-red-100 rounded-xl space-y-4">
                        <div>
                            <h4 className="font-bold text-red-950 flex items-center gap-2 uppercase tracking-tighter">
                                <RotateCcw className="h-4 w-4" /> Reiniciar Ciclo de Sustentabilidade
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Esta ação irá zerar todos os Bio-Coins, ecossistemas virtuais e coletas da unidade selecionada. 
                                Os dados serão arquivados e não poderão ser editados.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Selecione a Unidade</Label>
                            <select 
                                className="w-full h-10 px-3 py-2 rounded-md border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                                value={selectedSchoolForReset}
                                onChange={(e) => setSelectedSchoolForReset(e.target.value)}
                            >
                                <option value="all">🌐 TODA A REDE (GLOBAL)</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>🏫 {school.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Digite <span className="text-red-600">REINICIAR</span> para confirmar</Label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="REINICIAR" 
                                    className="border-red-200 focus-visible:ring-red-500 uppercase font-black tracking-widest"
                                    value={resetConfirm}
                                    onChange={(e) => setResetConfirm(e.target.value)}
                                />
                                <Input 
                                    type="password"
                                    placeholder="Sua Senha" 
                                    className="border-red-200 focus-visible:ring-red-500 font-black tracking-widest"
                                    value={adminPasswordForAction}
                                    onChange={(e) => setAdminPasswordForAction(e.target.value)}
                                />
                                <Button 
                                    variant="destructive" 
                                    className="font-black uppercase tracking-tighter gap-2 px-6 shrink-0"
                                    disabled={resetConfirm !== 'REINICIAR' || !adminPasswordForAction || isResetting}
                                    onClick={handleCycleReset}
                                >
                                    {isResetting ? 'Processando...' : 'Zerar Tudo'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: GESTÃO DE DESENVOLVEDORES */}
          <TabsContent value="developers" className="space-y-6">
            <Card className="border-primary/10 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Equipe de Desenvolvimento
                        </CardTitle>
                        <CardDescription>Gerencie as pessoas que aparecem na tela Sobre do sistema.</CardDescription>
                    </div>
                    <Dialog open={isDevDialogOpen} onOpenChange={(open) => {
                        setIsDevDialogOpen(open);
                        if (!open) {
                            setEditingDev(null);
                            setDevFormData({ name: '', role: '', description: '', avatar: '', initials: '' });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="font-black uppercase text-xs tracking-widest gap-2">
                                <Plus className="h-4 w-4" /> Adicionar Membro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                                    {editingDev ? 'Editar Membro' : 'Novo Membro na Equipe'}
                                </DialogTitle>
                                <DialogDescription>Estes dados serão exibidos publicamente na página Sobre.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveDev} className="space-y-4 pt-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome Completo</Label>
                                        <Input required value={devFormData.name} onChange={e => setDevFormData({...devFormData, name: e.target.value})} placeholder="João Silva" className="font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Sigla</Label>
                                        <Input required maxLength={2} value={devFormData.initials} onChange={e => setDevFormData({...devFormData, initials: e.target.value.toUpperCase()})} placeholder="JS" className="font-black text-center" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Cargo/Função</Label>
                                    <Input required value={devFormData.role} onChange={e => setDevFormData({...devFormData, role: e.target.value})} placeholder="Líder Desenvolvedor" className="font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Descrição Curta</Label>
                                    <textarea 
                                        className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required 
                                        value={devFormData.description} 
                                        onChange={e => setDevFormData({...devFormData, description: e.target.value})} 
                                        placeholder="Especialista em React e UI Design..." 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">URL do Avatar</Label>
                                    <Input value={devFormData.avatar} onChange={e => setDevFormData({...devFormData, avatar: e.target.value})} placeholder="https://api.dicebear.com/..." className="text-xs" />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" className="w-full h-12 font-black uppercase text-xs tracking-widest">
                                        {editingDev ? 'Salvar Alterações' : 'Cadastrar Membro'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {allParticipants?.map((dev) => (
                            <div key={dev.id} className="flex flex-col p-4 rounded-xl border border-slate-100 bg-white/50 group relative hover:border-primary/30 transition-all shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                                        <AvatarImage src={dev.avatar} alt={dev.name} />
                                        <AvatarFallback className="font-black text-xl">{dev.initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-bold text-slate-900 leading-tight">{dev.name}</h4>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-tighter">{dev.role}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">{dev.description}</p>
                                
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8 bg-white border-slate-100 text-slate-400 hover:text-primary hover:border-primary/30"
                                        onClick={() => {
                                            setEditingDev(dev);
                                            setDevFormData({
                                                name: dev.name,
                                                role: dev.role,
                                                description: dev.description,
                                                avatar: dev.avatar,
                                                initials: dev.initials
                                            });
                                            setIsDevDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8 bg-white border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200"
                                        onClick={() => handleDeleteDev(dev.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: CONFIGURAÇÕES ACADÊMICAS (CRUD TURMAS E CURSOS) */}
          <TabsContent value="academic" className="animate-in fade-in duration-500 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* GESTÃO DE TURMAS */}
              <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="h-1.5 bg-indigo-500"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-6 pt-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-tighter">Séries e Turmas</CardTitle>
                      <CardDescription>Defina as turmas disponíveis na rede.</CardDescription>
                    </div>
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => {
                      setEditingTurma(null);
                      setTurmaFormData({ name: '', status: 'active' });
                      setIsTurmaDialogOpen(true);
                    }}>
                    <Plus className="h-4 w-4" /> Nova Turma
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allTurmas?.map(turma => (
                      <div key={turma.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-all group">
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${turma.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span className={`font-bold ${turma.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{turma.name}</span>
                          {turma.status === 'inactive' && <Badge variant="secondary" className="text-[8px] uppercase tracking-widest">Inativo</Badge>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                            onClick={() => {
                              setEditingTurma(turma);
                              setTurmaFormData({ name: turma.name, status: turma.status });
                              setIsTurmaDialogOpen(true);
                            }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => {
                              if(confirm('Deseja excluir esta turma?')) {
                                updateTurmas(allTurmas.filter(t => t.id !== turma.id));
                              }
                            }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* GESTÃO DE CURSOS */}
              <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="h-1.5 bg-amber-500"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-6 pt-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-tighter">Cursos Técnicos</CardTitle>
                      <CardDescription>Gerencie as especializações acadêmicas.</CardDescription>
                    </div>
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => {
                      setEditingCurso(null);
                      setCursoFormData({ name: '', status: 'active' });
                      setIsCursoDialogOpen(true);
                    }}>
                    <Plus className="h-4 w-4" /> Novo Curso
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allCursos?.map(curso => (
                      <div key={curso.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-amber-200 transition-all group">
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${curso.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span className={`font-bold ${curso.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{curso.name}</span>
                          {curso.status === 'inactive' && <Badge variant="secondary" className="text-[8px] uppercase tracking-widest">Inativo</Badge>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-600"
                            onClick={() => {
                              setEditingCurso(curso);
                              setCursoFormData({ name: curso.name, status: curso.status });
                              setIsCursoDialogOpen(true);
                            }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => {
                              if(confirm('Deseja excluir este curso?')) {
                                updateCursos(allCursos.filter(c => c.id !== curso.id));
                              }
                            }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MODAIS DE EDIÇÃO */}
            <Dialog open={isTurmaDialogOpen} onOpenChange={setIsTurmaDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-black uppercase tracking-tighter">Configurar Turma</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveTurma} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome da Turma</Label>
                    <Input required value={turmaFormData.name} onChange={e => setTurmaFormData({...turmaFormData, name: e.target.value})} placeholder="Ex: 1ª Série A" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status de Operação</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                      value={turmaFormData.status}
                      onChange={e => setTurmaFormData({...turmaFormData, status: e.target.value as any})}
                    >
                      <option value="active">Ativo (Visível para Alunos)</option>
                      <option value="inactive">Inativo (Oculto)</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 uppercase font-black tracking-widest text-xs h-12">Salvar Turma</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCursoDialogOpen} onOpenChange={setIsCursoDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-black uppercase tracking-tighter">Configurar Curso</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveCurso} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Curso</Label>
                    <Input required value={cursoFormData.name} onChange={e => setCursoFormData({...cursoFormData, name: e.target.value})} placeholder="Ex: Informática" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status de Operação</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                      value={cursoFormData.status}
                      onChange={e => setCursoFormData({...cursoFormData, status: e.target.value as any})}
                    >
                      <option value="active">Ativo (Visível para Alunos)</option>
                      <option value="inactive">Inativo (Oculto)</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full bg-amber-600 uppercase font-black tracking-widest text-xs h-12">Salvar Curso</Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
        
        <footer className="pt-12 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pb-12">
          Plataforma SchoolGain v2.0 • Sistema Global de Auditoria e Gestão • TDS 2B 2026
        </footer>
      </div>
    </div>
  );
}
