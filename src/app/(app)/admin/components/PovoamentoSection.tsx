'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Edit, Trash2, GraduationCap, Briefcase, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Turma, Curso, Cargo, SetorEscolar } from '@/types/ecosystem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EcosystemService } from '@/lib/ecosystem.service';

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

  // Estados para Gestão de Turmas e Cursos
  const [isTurmaDialogOpen, setIsTurmaDialogOpen] = useState(false);
  const [isCursoDialogOpen, setIsCursoDialogOpen] = useState(false);
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [isSetorDialogOpen, setIsSetorDialogOpen] = useState(false);

  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [editingSetor, setEditingSetor] = useState<SetorEscolar | null>(null);

  const [turmaFormData, setTurmaFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });
  const [cursoFormData, setCursoFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });
  const [cargoFormData, setCargoFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });
  const [setorFormData, setSetorFormData] = useState({ name: '', status: 'active' as 'active' | 'inactive' });

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
      setIsTurmaDialogOpen(false);
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
      setIsCursoDialogOpen(false);
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
      setIsCargoDialogOpen(false);
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
      const id = EcosystemService.generateStandardId('str', targetSchoolId);
      newSetores = [...allSetores, { id: id, name: upperName, status: setorFormData.status, schoolId: sid }];
    }

    const success = await updateSetores(newSetores, sid);

    if (success) {
      setIsSetorDialogOpen(false);
      setEditingSetor(null);
      setSetorFormData({ name: '', status: 'active' });
      toast({ title: "Sucesso", description: "Setor operacional atualizado." });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar setor.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid gap-6 md:grid-cols-2">
        {/* GESTÃO DE TURMAS */}
        <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-slate-950/20 px-6 py-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-200">Séries e Turmas</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
              onClick={() => {
                setEditingTurma(null);
                setTurmaFormData({ name: '', status: 'active' });
                setIsTurmaDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {[...allTurmas]?.sort((a, b) => a.name.localeCompare(b.name)).map((turma, idx) => (
                <div key={turma.id || `turma-${idx}`} className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-xl hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${turma.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-600'}`}></span>
                    <span className={`text-xs font-bold ${turma.status === 'inactive' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{turma.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg"
                      onClick={() => {
                        setEditingTurma(turma);
                        setTurmaFormData({ name: turma.name, status: turma.status });
                        setIsTurmaDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg"
                      onClick={() => handleDelete(turma, 'turma')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allTurmas?.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold tracking-widest">Nenhuma turma cadastrada.</p>}
            </div>
          </CardContent>
        </Card>

        {/* GESTÃO DE CURSOS */}
        <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-slate-950/20 px-6 py-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-200">Cursos Técnicos</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
              onClick={() => {
                setEditingCurso(null);
                setCursoFormData({ name: '', status: 'active' });
                setIsCursoDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {[...allCursos]?.sort((a, b) => a.name.localeCompare(b.name)).map((curso, idx) => (
                <div key={curso.id || `curso-${idx}`} className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-xl hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${curso.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-600'}`}></span>
                    <span className={`text-xs font-bold ${curso.status === 'inactive' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{curso.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg"
                      onClick={() => {
                        setEditingCurso(curso);
                        setCursoFormData({ name: curso.name, status: curso.status });
                        setIsCursoDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg"
                      onClick={() => handleDelete(curso, 'curso')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allCursos?.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold tracking-widest">Nenhum curso cadastrado.</p>}
            </div>
          </CardContent>
        </Card>

        {/* GESTÃO DE CARGOS */}
        <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-slate-950/20 px-6 py-5">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-rose-400" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-200">Cargos Operacionais</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
              onClick={() => {
                setEditingCargo(null);
                setCargoFormData({ name: '', status: 'active' });
                setIsCargoDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {[...allCargos]?.sort((a, b) => a.name.localeCompare(b.name)).map((cargo, idx) => (
                <div key={cargo.id || `cargo-${idx}`} className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-xl hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${cargo.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-600'}`}></span>
                    <span className={`text-xs font-bold ${cargo.status === 'inactive' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{cargo.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg"
                      onClick={() => {
                        setEditingCargo(cargo);
                        setCargoFormData({ name: cargo.name, status: cargo.status });
                        setIsCargoDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg"
                      onClick={() => handleDelete(cargo, 'cargo')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allCargos?.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold tracking-widest">Nenhum cargo cadastrado.</p>}
            </div>
          </CardContent>
        </Card>

        {/* GESTÃO DE SETORES */}
        <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-slate-950/20 px-6 py-5">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-200">Setores / Departamentos</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
              onClick={() => {
                setEditingSetor(null);
                setSetorFormData({ name: '', status: 'active' });
                setIsSetorDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {[...allSetores]?.sort((a, b) => a.name.localeCompare(b.name)).map((setor, idx) => (
                <div key={setor.id || `setor-${idx}`} className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-xl hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${setor.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-600'}`}></span>
                    <span className={`text-xs font-bold ${setor.status === 'inactive' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{setor.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg"
                      onClick={() => {
                        setEditingSetor(setor);
                        setSetorFormData({ name: setor.name, status: setor.status });
                        setIsSetorDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg"
                      onClick={() => handleDelete(setor, 'setor')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allSetores?.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold tracking-widest">Nenhum setor cadastrado.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIALOGS */}
      <Dialog open={isTurmaDialogOpen} onOpenChange={setIsTurmaDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-400">{editingTurma ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">Configure os dados da turma para agrupamento de alunos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTurma} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Turma</Label>
              <Input value={turmaFormData.name} onChange={e => setTurmaFormData({...turmaFormData, name: e.target.value})} placeholder="Ex: 1 Ano A" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
              <Select value={turmaFormData.status} onValueChange={(v: any) => setTurmaFormData({...turmaFormData, status: v})}>
                <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10">Ativa</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCursoDialogOpen} onOpenChange={setIsCursoDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-400">{editingCurso ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">Gerencie os cursos oferecidos pela unidade escolar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCurso} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Curso</Label>
              <Input value={cursoFormData.name} onChange={e => setCursoFormData({...cursoFormData, name: e.target.value})} placeholder="Ex: Informática" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
              <Select value={cursoFormData.status} onValueChange={(v: any) => setCursoFormData({...cursoFormData, status: v})}>
                <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10">Ativo</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-400">{editingCargo ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">Defina as funções e cargos dos colaboradores.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCargo} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Cargo</Label>
              <Input value={cargoFormData.name} onChange={e => setCargoFormData({...cargoFormData, name: e.target.value})} placeholder="Ex: Coordenador" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
              <Select value={cargoFormData.status} onValueChange={(v: any) => setCargoFormData({...cargoFormData, status: v})}>
                <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10">Ativo</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSetorDialogOpen} onOpenChange={setIsSetorDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-400">{editingSetor ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">Organize os setores administrativos e pedagógicos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSetor} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Setor</Label>
              <Input value={setorFormData.name} onChange={e => setSetorFormData({...setorFormData, name: e.target.value})} placeholder="Ex: Secretaria" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
              <Select value={setorFormData.status} onValueChange={(v: any) => setSetorFormData({...setorFormData, status: v})}>
                <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10">Ativo</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-indigo-500/10">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
