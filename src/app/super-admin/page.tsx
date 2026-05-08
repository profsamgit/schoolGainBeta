'use client';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
  LayoutDashboard,
  Mail,
  Lock,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function SuperAdminPage() {
  const { schools, updateSchoolStatus, deleteSchool, users, terminals, currentUser, updateMyPassword } = useEcosystem();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Estados para troca de senha
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const students = users.filter(u => u.role === 'student');
  const totalPoints = students.reduce((acc, u) => acc + (u.points || 0), 0);
  const activeSchools = schools.filter(s => s.status === 'active');
  const pendingSchools = schools.filter(s => s.status === 'pending');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    const res = await updateMyPassword(currentPass, newPass);
    if (res) {
      toast({ title: "Sucesso", description: "Senha alterada com sucesso!" });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      toast({ title: "Erro", description: "Senha atual incorreta.", variant: "destructive" });
    }
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
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary animate-spin-slow" />
              Central de Rede Global
            </h1>
            <p className="text-slate-500 font-medium italic">Gestão de Impacto e Expansão • {currentUser?.name}</p>
          </div>
          <div className="flex gap-3">
             <Button asChild className="gap-2 bg-slate-900 hover:bg-black text-white">
               <Link href="/"><ArrowLeft className="h-4 w-4" /> Sair</Link>
             </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px] h-12 bg-slate-200/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="schools" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest">
              Rede de Escolas
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
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 italic">
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
                    <div className="text-center py-12 text-slate-400 italic text-sm">
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

          {/* ABA: REDE DE ESCOLAS (LISTA DETALHADA) */}
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
                           <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">Ativo</Badge>
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
                {activeSchools.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4">
                     <Building2 className="h-12 w-12 text-slate-200 mx-auto" />
                     <p className="text-slate-500 italic">Nenhuma escola ativa na rede ainda.</p>
                     <Button variant="outline" onClick={() => setActiveTab('overview')}>Ver Solicitações</Button>
                  </div>
                )}
             </div>
          </TabsContent>

          {/* ABA: MINHA CONTA / SEGURANÇA */}
          <TabsContent value="account" className="animate-in fade-in duration-500">
             <div className="max-w-2xl mx-auto">
                <Card className="border-none shadow-xl overflow-hidden">
                   <div className="h-2 bg-slate-900"></div>
                   <CardHeader>
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck className="h-8 w-8" />
                         </div>
                         <div>
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Segurança da Rede</CardTitle>
                            <CardDescription>Gerencie suas credenciais de acesso mestre.</CardDescription>
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent>
                      <form onSubmit={handlePasswordChange} className="space-y-6">
                         <div className="grid gap-4">
                            <div className="space-y-2">
                               <Label htmlFor="currentPass" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha Atual</Label>
                               <Input 
                                 id="currentPass" 
                                 type="password" 
                                 className="h-12 border-slate-200" 
                                 required 
                                 value={currentPass}
                                 onChange={e => setCurrentPass(e.target.value)}
                               />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label htmlFor="newPass" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Senha</Label>
                                  <Input 
                                    id="newPass" 
                                    type="password" 
                                    className="h-12 border-slate-200" 
                                    required 
                                    value={newPass}
                                    onChange={e => setNewPass(e.target.value)}
                                  />
                               </div>
                               <div className="space-y-2">
                                  <Label htmlFor="confirmPass" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmar Senha</Label>
                                  <Input 
                                    id="confirmPass" 
                                    type="password" 
                                    className="h-12 border-slate-200" 
                                    required 
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                  />
                               </div>
                            </div>
                         </div>
                         <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-black font-black uppercase text-xs tracking-widest gap-2 shadow-lg">
                            <Save className="h-4 w-4" /> Salvar Novas Credenciais
                         </Button>
                      </form>
                   </CardContent>
                   <CardFooter className="bg-slate-50 border-t p-6">
                      <div className="flex items-start gap-3">
                         <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                         <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            <strong>Atenção:</strong> Esta é sua conta mestre de rede. A alteração da senha afetará o acesso global à Central de Rede. Certifique-se de guardar suas novas credenciais com segurança.
                         </p>
                      </div>
                   </CardFooter>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
        
        <footer className="pt-12 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pb-12">
          Plataforma SchoolGain v2.0 • Sistema Global de Auditoria e Gestão • TDS 2B 2026
        </footer>
      </div>
    </div>
  );
}
