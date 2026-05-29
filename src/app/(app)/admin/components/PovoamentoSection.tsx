'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  Search, 
  X, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Turma, Curso, Cargo, SetorEscolar } from '@/types/ecosystem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EcosystemService } from '@/lib/ecosystem.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PovoamentoSectionProps {
  allTurmas: Turma[];
  allCursos: Curso[];
  allCargos: Cargo[];
  allSetores: SetorEscolar[];
  targetSchoolId: string | undefined;
  updateTurmas: (newTurmas: Turma[], targetSchoolId?: string) => Promise<boolean>;
  updateCursos: (newCursos: Curso[], targetSchoolId?: string) => Promise<boolean>;
  updateCargos: (newCargos: Cargo[], targetSchoolId?: string) => Promise<boolean>;
  updateSetores: (newSetores: SetorEscolar[], targetSchoolId?: string) => Promise<boolean>;
  handleDelete: (item: any, type: string) => void;
}

export function PovoamentoSection({
  allTurmas,
  allCursos,
  allCargos,
  allSetores,
  targetSchoolId,
  updateTurmas,
  updateCursos,
  updateCargos,
  updateSetores,
  handleDelete
}: PovoamentoSectionProps) {
  const { toast } = useToast();

  // Estados para Controle de Abas, Busca e Inativos
  const [activeTab, setActiveTab] = useState<'turma' | 'curso' | 'cargo' | 'setor'>('turma');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Estados para Gestão de Diálogos
  const [isTurmaDialogOpen] = useState(false); // Mantido por compatibilidade
  const [isCursoDialogOpen] = useState(false); // Mantido por compatibilidade
  const [isCargoDialogOpen] = useState(false); // Mantido por compatibilidade
  const [isSetorDialogOpen] = useState(false); // Mantido por compatibilidade

  // Diálogos específicos reativos
  const [dialogOpenState, setDialogOpenState] = useState({
    turma: false,
    curso: false,
    cargo: false,
    setor: false
  });

  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [editingSetor, setEditingSetor] = useState<SetorEscolar | null>(null);

  const [turmaFormData, setTurmaFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });
  const [cursoFormData, setCursoFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });
  const [cargoFormData, setCargoFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });
  const [setorFormData, setSetorFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });

  // Funções de salvamento (Mantendo exatamente a lógica original)
  const handleSaveTurma = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newTurmas;
    const sid = targetSchoolId || 'global';
    const upperName = turmaFormData.name.toUpperCase().trim();
    
    if (editingTurma) {
      newTurmas = allTurmas.map(t => t.id === editingTurma.id ? { ...t, name: upperName, status: turmaFormData.status } : t);
    } else {
      if (allTurmas.some(t => t.name.toLowerCase() === upperName.toLowerCase())) {
        toast({ title: "Aviso", description: "Esta turma já existe.", variant: "destructive" });
        return;
      }
      const id = EcosystemService.generateStandardId('trm', targetSchoolId);
      newTurmas = [...allTurmas, { id: id, name: upperName, status: turmaFormData.status, schoolId: sid }];
    }

    const success = await updateTurmas(newTurmas, sid);
    
    if (success) {
      setDialogOpenState(prev => ({ ...prev, turma: false }));
      setEditingTurma(null);
      setTurmaFormData({ name: '', status: 'active' });
      toast({ title: "Sucesso", description: "Configuração de turma atualizada." });
    } else {
      toast({ title: "Erro", description: "Não foi possível salvar no banco de dados. Verifique sua conexão e permissões.", variant: "destructive" });
    }
  };

  const handleSaveCurso = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newCursos;
    const sid = targetSchoolId || 'global';
    const upperName = cursoFormData.name.toUpperCase().trim();

    if (editingCurso) {
      newCursos = allCursos.map(c => c.id === editingCurso.id ? { ...c, name: upperName, status: cursoFormData.status } : c);
    } else {
      if (allCursos.some(c => c.name.toLowerCase() === upperName.toLowerCase())) {
        toast({ title: "Aviso", description: "Este curso já existe.", variant: "destructive" });
        return;
      }
      const id = EcosystemService.generateStandardId('cur', targetSchoolId);
      newCursos = [...allCursos, { id: id, name: upperName, status: cursoFormData.status, schoolId: sid }];
    }

    const success = await updateCursos(newCursos, sid);

    if (success) {
      setDialogOpenState(prev => ({ ...prev, curso: false }));
      setEditingCurso(null);
      setCursoFormData({ name: '', status: 'active' });
      toast({ title: "Sucesso", description: "Configuração de curso atualizada." });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar curso no servidor.", variant: "destructive" });
    }
  };

  const handleSaveCargo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newCargos;
    const sid = targetSchoolId || 'global';
    const upperName = cargoFormData.name.toUpperCase().trim();

    if (editingCargo) {
      newCargos = allCargos.map(c => c.id === editingCargo.id ? { ...c, name: upperName, status: cargoFormData.status } : c);
    } else {
      if (allCargos.some(c => c.name.toLowerCase() === upperName.toLowerCase())) {
        toast({ title: "Aviso", description: "Este cargo já existe.", variant: "destructive" });
        return;
      }
      const id = EcosystemService.generateStandardId('crg', targetSchoolId);
      newCargos = [...allCargos, { id: id, name: upperName, status: cargoFormData.status, schoolId: sid }];
    }

    const success = await updateCargos(newCargos, sid);

    if (success) {
      setDialogOpenState(prev => ({ ...prev, cargo: false }));
      setEditingCargo(null);
      setCargoFormData({ name: '', status: 'active' });
      toast({ title: "Sucesso", description: "Cargo administrativo atualizado." });
    } else {
      toast({ title: "Erro", description: "Falha ao sincronizar cargo.", variant: "destructive" });
    }
  };

  const handleSaveSetor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newSetores;
    const sid = targetSchoolId || 'global';
    const upperName = setorFormData.name.toUpperCase().trim();
    
    if (editingSetor) {
      newSetores = allSetores.map(s => s.id === editingSetor.id ? { ...s, name: upperName, status: setorFormData.status } : s);
    } else {
      if (allSetores.some(s => s.name.toLowerCase() === upperName.toLowerCase())) {
        toast({ title: "Aviso", description: "Este setor já existe.", variant: "destructive" });
        return;
      }
      const id = EcosystemService.generateStandardId('set', targetSchoolId);
      newSetores = [...allSetores, { id: id, name: upperName, status: setorFormData.status, schoolId: sid }];
    }

    const success = await updateSetores(newSetores, sid);

    if (success) {
      setDialogOpenState(prev => ({ ...prev, setor: false }));
      setEditingSetor(null);
      setSetorFormData({ name: '', status: 'active' });
      toast({ title: "Sucesso", description: "Setor administrativo atualizado." });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar setor.", variant: "destructive" });
    }
  };

  // Toggles de status em lote rápidos (Semelhante ao comportamento de status de usuários)
  const toggleTurmaStatus = async (turma: Turma, checked: boolean) => {
    const sid = targetSchoolId || 'global';
    const newStatus: 'active' | 'inactive' = checked ? 'active' : 'inactive';
    const newTurmas = allTurmas.map(t => t.id === turma.id ? { ...t, status: newStatus } : t);
    const success = await updateTurmas(newTurmas, sid);
    if (success) {
      toast({ title: "Sucesso", description: `Status da turma ${turma.name} atualizado.` });
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar status da turma.", variant: "destructive" });
    }
  };

  const toggleCursoStatus = async (curso: Curso, checked: boolean) => {
    const sid = targetSchoolId || 'global';
    const newStatus: 'active' | 'inactive' = checked ? 'active' : 'inactive';
    const newCursos = allCursos.map(c => c.id === curso.id ? { ...c, status: newStatus } : c);
    const success = await updateCursos(newCursos, sid);
    if (success) {
      toast({ title: "Sucesso", description: `Status do curso ${curso.name} atualizado.` });
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar status do curso.", variant: "destructive" });
    }
  };

  const toggleCargoStatus = async (cargo: Cargo, checked: boolean) => {
    const sid = targetSchoolId || 'global';
    const newStatus: 'active' | 'inactive' = checked ? 'active' : 'inactive';
    const newCargos = allCargos.map(c => c.id === cargo.id ? { ...c, status: newStatus } : c);
    const success = await updateCargos(newCargos, sid);
    if (success) {
      toast({ title: "Sucesso", description: `Status do cargo ${cargo.name} atualizado.` });
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar status do cargo.", variant: "destructive" });
    }
  };

  const toggleSetorStatus = async (setor: SetorEscolar, checked: boolean) => {
    const sid = targetSchoolId || 'global';
    const newStatus: 'active' | 'inactive' = checked ? 'active' : 'inactive';
    const newSetores = allSetores.map(s => s.id === setor.id ? { ...s, status: newStatus } : s);
    const success = await updateSetores(newSetores, sid);
    if (success) {
      toast({ title: "Sucesso", description: `Status do setor ${setor.name} atualizado.` });
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar status do setor.", variant: "destructive" });
    }
  };

  // Filtros Reativos de Listas
  const filteredTurmas = useMemo(() => {
    return allTurmas
      .filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : t.status !== 'inactive';
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allTurmas, searchTerm, showInactive]);

  const filteredCursos = useMemo(() => {
    return allCursos
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : c.status !== 'inactive';
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCursos, searchTerm, showInactive]);

  const filteredCargos = useMemo(() => {
    return allCargos
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : c.status !== 'inactive';
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCargos, searchTerm, showInactive]);

  const filteredSetores = useMemo(() => {
    return allSetores
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : s.status !== 'inactive';
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allSetores, searchTerm, showInactive]);

  // Função dinâmica para abrir modal de criação
  const handleAddNewItem = () => {
    if (activeTab === 'turma') {
      setEditingTurma(null);
      setTurmaFormData({ name: '', status: 'active' });
      setDialogOpenState(prev => ({ ...prev, turma: true }));
    } else if (activeTab === 'curso') {
      setEditingCurso(null);
      setCursoFormData({ name: '', status: 'active' });
      setDialogOpenState(prev => ({ ...prev, curso: true }));
    } else if (activeTab === 'cargo') {
      setEditingCargo(null);
      setCargoFormData({ name: '', status: 'active' });
      setDialogOpenState(prev => ({ ...prev, cargo: true }));
    } else if (activeTab === 'setor') {
      setEditingSetor(null);
      setSetorFormData({ name: '', status: 'active' });
      setDialogOpenState(prev => ({ ...prev, setor: true }));
    }
  };

  const getNewButtonLabel = () => {
    switch (activeTab) {
      case 'turma': return 'Nova Turma';
      case 'curso': return 'Novo Curso';
      case 'cargo': return 'Novo Cargo';
      case 'setor': return 'Novo Setor';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Guia Informativo de Povoamento e Estrutura */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-6 text-slate-800 dark:text-white backdrop-blur-xl shadow-lg">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
            <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Guia de Povoamento e Estrutura Escolar</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
              Defina a estrutura organizacional e acadêmica da escola antes de realizar novos cadastros:
            </p>
            <ul className="text-[11px] text-slate-650 dark:text-slate-350 space-y-1.5 list-disc pl-4 mt-2 font-semibold">
              <li><strong className="text-slate-800 dark:text-white">Séries e Turmas / Cursos</strong>: Necessários para organizar os alunos matriculados e permitir o filtro correto nos rankings e relatórios acadêmicos.</li>
              <li><strong className="text-slate-800 dark:text-white">Cargos e Setores</strong>: Utilizados para organizar o corpo corporativo (funcionários e voluntários) e registrar suas participações.</li>
              <li><strong className="text-slate-800 dark:text-white">Ordem Recomendada</strong>: Cadastre a estrutura de Povoamento nesta aba antes de adicionar novos usuários na aba do Corpo Acadêmico.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PAINEL DE ESTRUTURA UNIFICADO (Idêntico ao Corpo Acadêmico) */}
      <Card className="border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 dark:hover:border-indigo-500/10 transition-all duration-300 text-slate-800 dark:text-white">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-md">
                <Building2 className="h-5 w-5" />
             </div>
             <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">Povoamento e Estrutura</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Gestão de turmas, cursos técnicos, cargos operacionais e setores da unidade escolar.</CardDescription>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 p-2 rounded-xl shadow-md">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Inativos</Label>
              <Switch 
                checked={showInactive} 
                onCheckedChange={setShowInactive}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
            <Button onClick={handleAddNewItem} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-11 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-indigo-500/10">
              <Plus className="h-4 w-4" /> {getNewButtonLabel()}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Barra de Pesquisa */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Pesquisar registro por nome..." 
              className="pl-12 h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={(v: any) => {
              setActiveTab(v);
              setSearchTerm('');
            }} 
            className="w-full space-y-6"
          >
            <div className="w-full overflow-x-auto no-scrollbar pb-1">
              <TabsList className="!inline-flex w-max min-w-full justify-start h-14 bg-slate-100/80 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-2xl backdrop-blur-xl">
                <TabsTrigger value="turma" className="flex-1 shrink-0 min-w-max gap-2 uppercase font-black text-[10px] tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl data-[state=active]:bg-indigo-600 dark:data-[state=active]:bg-indigo-500 data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all duration-300">
                  Turmas ({allTurmas.filter(t => showInactive ? true : t.status !== 'inactive').length})
                </TabsTrigger>
                <TabsTrigger value="curso" className="flex-1 shrink-0 min-w-max gap-2 uppercase font-black text-[10px] tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl data-[state=active]:bg-indigo-600 dark:data-[state=active]:bg-indigo-500 data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all duration-300">
                  Cursos ({allCursos.filter(c => showInactive ? true : c.status !== 'inactive').length})
                </TabsTrigger>
                <TabsTrigger value="cargo" className="flex-1 shrink-0 min-w-max gap-2 uppercase font-black text-[10px] tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl data-[state=active]:bg-indigo-600 dark:data-[state=active]:bg-indigo-500 data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all duration-300">
                  Cargos ({allCargos.filter(c => showInactive ? true : c.status !== 'inactive').length})
                </TabsTrigger>
                <TabsTrigger value="setor" className="flex-1 shrink-0 min-w-max gap-2 uppercase font-black text-[10px] tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl data-[state=active]:bg-indigo-600 dark:data-[state=active]:bg-indigo-500 data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all duration-300">
                  Setores ({allSetores.filter(s => showInactive ? true : s.status !== 'inactive').length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: SÉRIES E TURMAS */}
            <TabsContent value="turma">
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-950/50 overflow-hidden shadow-2xl animate-in fade-in duration-200">
                <Table>
                  <TableHeader className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200/60 dark:border-white/10">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Série / Turma</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Código do Registro</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Status</TableHead>
                      <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTurmas.length > 0 ? filteredTurmas.map((turma) => (
                      <TableRow key={turma.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-md">
                              <Users className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{turma.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{turma.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={turma.status !== 'inactive'} 
                              onCheckedChange={(checked) => toggleTurmaStatus(turma, checked)}
                              className="data-[state=checked]:bg-indigo-500"
                            />
                            <Badge className={`text-[9px] uppercase font-bold ${turma.status === 'inactive' ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                              {turma.status === 'inactive' ? 'Inativo' : 'Ativo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
                              onClick={() => {
                                setEditingTurma(turma);
                                setTurmaFormData({ name: turma.name, status: turma.status });
                                setDialogOpenState(prev => ({ ...prev, turma: true }));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Excluir"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5 rounded-full"
                              onClick={() => handleDelete(turma, 'turma')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest">Nenhuma turma encontrada</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TAB: CURSOS TÉCNICOS */}
            <TabsContent value="curso">
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-950/50 overflow-hidden shadow-2xl animate-in fade-in duration-200">
                <Table>
                  <TableHeader className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200/60 dark:border-white/10">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Curso Técnico</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Código do Registro</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Status</TableHead>
                      <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCursos.length > 0 ? filteredCursos.map((curso) => (
                      <TableRow key={curso.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-md">
                              <GraduationCap className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{curso.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{curso.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={curso.status !== 'inactive'} 
                              onCheckedChange={(checked) => toggleCursoStatus(curso, checked)}
                              className="data-[state=checked]:bg-indigo-500"
                            />
                            <Badge className={`text-[9px] uppercase font-bold ${curso.status === 'inactive' ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                              {curso.status === 'inactive' ? 'Inativo' : 'Ativo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
                              onClick={() => {
                                setEditingCurso(curso);
                                setCursoFormData({ name: curso.name, status: curso.status });
                                setDialogOpenState(prev => ({ ...prev, curso: true }));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Excluir"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5 rounded-full"
                              onClick={() => handleDelete(curso, 'curso')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest">Nenhum curso encontrado</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TAB: CARGOS OPERACIONAIS */}
            <TabsContent value="cargo">
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-950/50 overflow-hidden shadow-2xl animate-in fade-in duration-200">
                <Table>
                  <TableHeader className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200/60 dark:border-white/10">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Cargo Operacional</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Código do Registro</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Status</TableHead>
                      <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCargos.length > 0 ? filteredCargos.map((cargo) => (
                      <TableRow key={cargo.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-md">
                              <Briefcase className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cargo.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{cargo.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={cargo.status !== 'inactive'} 
                              onCheckedChange={(checked) => toggleCargoStatus(cargo, checked)}
                              className="data-[state=checked]:bg-indigo-500"
                            />
                            <Badge className={`text-[9px] uppercase font-bold ${cargo.status === 'inactive' ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                              {cargo.status === 'inactive' ? 'Inativo' : 'Ativo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
                              onClick={() => {
                                setEditingCargo(cargo);
                                setCargoFormData({ name: cargo.name, status: cargo.status });
                                setDialogOpenState(prev => ({ ...prev, cargo: true }));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Excluir"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5 rounded-full"
                              onClick={() => handleDelete(cargo, 'cargo')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest">Nenhum cargo encontrado</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TAB: SETORES E DEPARTAMENTOS */}
            <TabsContent value="setor">
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-950/50 overflow-hidden shadow-2xl animate-in fade-in duration-200">
                <Table>
                  <TableHeader className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200/60 dark:border-white/10">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Setor / Departamento</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Código do Registro</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Status</TableHead>
                      <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSetores.length > 0 ? filteredSetores.map((setor) => (
                      <TableRow key={setor.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-md">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{setor.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{setor.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={setor.status !== 'inactive'} 
                              onCheckedChange={(checked) => toggleSetorStatus(setor, checked)}
                              className="data-[state=checked]:bg-indigo-500"
                            />
                            <Badge className={`text-[9px] uppercase font-bold ${setor.status === 'inactive' ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                              {setor.status === 'inactive' ? 'Inativo' : 'Ativo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
                              onClick={() => {
                                setEditingSetor(setor);
                                setSetorFormData({ name: setor.name, status: setor.status });
                                setDialogOpenState(prev => ({ ...prev, setor: true }));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Excluir"
                              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5 rounded-full"
                              onClick={() => handleDelete(setor, 'setor')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest">Nenhum setor encontrado</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* DIALOGS */}
      <Dialog open={dialogOpenState.turma} onOpenChange={(val) => setDialogOpenState(p => ({ ...p, turma: val }))}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400">{editingTurma ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">Configure os dados da turma para agrupamento de alunos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTurma} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Nome da Turma</Label>
              <Input value={turmaFormData.name} onChange={e => setTurmaFormData({...turmaFormData, name: e.target.value})} placeholder="Ex: 1 Ano A" className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Status</Label>
              <Select value={turmaFormData.status} onValueChange={(v: any) => setTurmaFormData({...turmaFormData, status: v})}>
                <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Ativa</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpenState.curso} onOpenChange={(val) => setDialogOpenState(p => ({ ...p, curso: val }))}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400">{editingCurso ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">Gerencie os cursos oferecidos pela unidade escolar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCurso} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Nome do Curso</Label>
              <Input value={cursoFormData.name} onChange={e => setCursoFormData({...cursoFormData, name: e.target.value})} placeholder="Ex: Informática" className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Status</Label>
              <Select value={cursoFormData.status} onValueChange={(v: any) => setCursoFormData({...cursoFormData, status: v})}>
                <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Ativo</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpenState.cargo} onOpenChange={(val) => setDialogOpenState(p => ({ ...p, cargo: val }))}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400">{editingCargo ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">Defina as funções e cargos dos colaboradores.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCargo} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Nome do Cargo</Label>
              <Input value={cargoFormData.name} onChange={e => setCargoFormData({...cargoFormData, name: e.target.value})} placeholder="Ex: Coordenador" className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Status</Label>
              <Select value={cargoFormData.status} onValueChange={(v: any) => setCargoFormData({...cargoFormData, status: v})}>
                <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Ativo</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpenState.setor} onOpenChange={(val) => setDialogOpenState(p => ({ ...p, setor: val }))}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400">{editingSetor ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">Organize os setores administrativos e pedagógicos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSetor} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Nome do Setor</Label>
              <Input value={setorFormData.name} onChange={e => setSetorFormData({...setorFormData, name: e.target.value})} placeholder="Ex: Secretaria" className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Status</Label>
              <Select value={setorFormData.status} onValueChange={(v: any) => setSetorFormData({...setorFormData, status: v})}>
                <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Ativo</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
