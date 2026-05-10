'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Edit, Trash2, GraduationCap, Briefcase, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Turma, Curso, Cargo, SetorEscolar } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PovoamentoSectionProps {
  allTurmas: Turma[];
  allCursos: Curso[];
  allCargos: Cargo[];
  allSetores: SetorEscolar[];
  targetSchoolId: string | undefined;
  updateTurmas: (newTurmas: Turma[]) => void;
  updateCursos: (newCursos: Curso[]) => void;
  updateCargos: (newCargos: Cargo[]) => void;
  updateSetores: (newSetores: SetorEscolar[]) => void;
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

  const handleSaveTurma = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newTurmas;
    if (editingTurma) {
      newTurmas = allTurmas.map(t => t.id === editingTurma.id ? { ...t, ...turmaFormData } : t);
    } else {
      if (allTurmas.some(t => t.name.toLowerCase() === turmaFormData.name.toLowerCase())) {
        toast({ title: "Aviso", description: "Esta turma já existe.", variant: "destructive" });
        return;
      }
      newTurmas = [...allTurmas, { id: `turma-${Date.now()}`, name: turmaFormData.name, status: turmaFormData.status, schoolId: targetSchoolId }];
    }
    updateTurmas(newTurmas);
    setIsTurmaDialogOpen(false);
    setEditingTurma(null);
    setTurmaFormData({ name: '', status: 'active' });
    toast({ title: "Sucesso", description: "Configuração de turma atualizada." });
  };

  const handleSaveCurso = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newCursos;
    if (editingCurso) {
      newCursos = allCursos.map(c => c.id === editingCurso.id ? { ...c, ...cursoFormData } : c);
    } else {
      if (allCursos.some(c => c.name.toLowerCase() === cursoFormData.name.toLowerCase())) {
        toast({ title: "Aviso", description: "Este curso já existe.", variant: "destructive" });
        return;
      }
      newCursos = [...allCursos, { id: `curso-${Date.now()}`, name: cursoFormData.name, status: cursoFormData.status, schoolId: targetSchoolId }];
    }
    updateCursos(newCursos);
    setIsCursoDialogOpen(false);
    setEditingCurso(null);
    setCursoFormData({ name: '', status: 'active' });
    toast({ title: "Sucesso", description: "Configuração de curso atualizada." });
  };

  const handleSaveCargo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newCargos;
    if (editingCargo) {
      newCargos = allCargos.map(c => c.id === editingCargo.id ? { ...c, ...cargoFormData } : c);
    } else {
      if (allCargos.some(c => c.name.toLowerCase() === cargoFormData.name.toLowerCase())) {
        toast({ title: "Aviso", description: "Este cargo já existe.", variant: "destructive" });
        return;
      }
      newCargos = [...allCargos, { id: `cargo-${Date.now()}`, name: cargoFormData.name, status: cargoFormData.status, schoolId: targetSchoolId }];
    }
    updateCargos(newCargos);
    setIsCargoDialogOpen(false);
    setEditingCargo(null);
    setCargoFormData({ name: '', status: 'active' });
    toast({ title: "Sucesso", description: "Cargo administrativo atualizado." });
  };

  const handleSaveSetor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let newSetores;
    if (editingSetor) {
      newSetores = allSetores.map(s => s.id === editingSetor.id ? { ...s, ...setorFormData } : s);
    } else {
      if (allSetores.some(s => s.name.toLowerCase() === setorFormData.name.toLowerCase())) {
        toast({ title: "Aviso", description: "Este setor já existe.", variant: "destructive" });
        return;
      }
      newSetores = [...allSetores, { id: `setor-${Date.now()}`, name: setorFormData.name, status: setorFormData.status, schoolId: targetSchoolId }];
    }
    updateSetores(newSetores);
    setIsSetorDialogOpen(false);
    setEditingSetor(null);
    setSetorFormData({ name: '', status: 'active' });
    toast({ title: "Sucesso", description: "Setor operacional atualizado." });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* GESTÃO DE TURMAS */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Séries e Turmas</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
              onClick={() => {
                setEditingTurma(null);
                setTurmaFormData({ name: '', status: 'active' });
                setIsTurmaDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allTurmas?.map((turma, idx) => (
                <div key={turma.id || `turma-${idx}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${turma.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={`text-xs font-bold ${turma.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{turma.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                      onClick={() => {
                        setEditingTurma(turma);
                        setTurmaFormData({ name: turma.name, status: turma.status });
                        setIsTurmaDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(turma, 'turma')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allTurmas?.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma turma cadastrada.</p>}
            </div>
          </CardContent>
        </Card>

        {/* GESTÃO DE CURSOS */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Cursos Técnicos</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
              onClick={() => {
                setEditingCurso(null);
                setCursoFormData({ name: '', status: 'active' });
                setIsCursoDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allCursos?.map((curso, idx) => (
                <div key={curso.id || `curso-${idx}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${curso.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={`text-xs font-bold ${curso.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{curso.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                      onClick={() => {
                        setEditingCurso(curso);
                        setCursoFormData({ name: curso.name, status: curso.status });
                        setIsCursoDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(curso, 'curso')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allCursos?.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum curso cadastrado.</p>}
            </div>
          </CardContent>
        </Card>

        {/* GESTÃO DE CARGOS */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-rose-600" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Cargos Operacionais</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
              onClick={() => {
                setEditingCargo(null);
                setCargoFormData({ name: '', status: 'active' });
                setIsCargoDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allCargos?.map((cargo, idx) => (
                <div key={cargo.id || `cargo-${idx}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${cargo.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={`text-xs font-bold ${cargo.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{cargo.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                      onClick={() => {
                        setEditingCargo(cargo);
                        setCargoFormData({ name: cargo.name, status: cargo.status });
                        setIsCargoDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(cargo, 'cargo')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allCargos?.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum cargo cadastrado.</p>}
            </div>
          </CardContent>
        </Card>

        {/* GESTÃO DE SETORES */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Setores / Departamentos</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
              onClick={() => {
                setEditingSetor(null);
                setSetorFormData({ name: '', status: 'active' });
                setIsSetorDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allSetores?.map((setor, idx) => (
                <div key={setor.id || `setor-${idx}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${setor.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span className={`text-xs font-bold ${setor.status === 'inactive' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{setor.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                      onClick={() => {
                        setEditingSetor(setor);
                        setSetorFormData({ name: setor.name, status: setor.status });
                        setIsSetorDialogOpen(true);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(setor, 'setor')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {allSetores?.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum setor cadastrado.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIALOGS */}
      <Dialog open={isTurmaDialogOpen} onOpenChange={setIsTurmaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTurma ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
            <DialogDescription>Configure os dados da turma para agrupamento de alunos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTurma} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Turma</Label>
              <Input value={turmaFormData.name} onChange={e => setTurmaFormData({...turmaFormData, name: e.target.value})} placeholder="Ex: 1 Ano A" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={turmaFormData.status} onValueChange={(v: any) => setTurmaFormData({...turmaFormData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCursoDialogOpen} onOpenChange={setIsCursoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCurso ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
            <DialogDescription>Gerencie os cursos oferecidos pela unidade escolar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCurso} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Curso</Label>
              <Input value={cursoFormData.name} onChange={e => setCursoFormData({...cursoFormData, name: e.target.value})} placeholder="Ex: Informtica" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={cursoFormData.status} onValueChange={(v: any) => setCursoFormData({...cursoFormData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCargo ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
            <DialogDescription>Defina as funções e cargos dos colaboradores.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCargo} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cargo</Label>
              <Input value={cargoFormData.name} onChange={e => setCargoFormData({...cargoFormData, name: e.target.value})} placeholder="Ex: Coordenador" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={cargoFormData.status} onValueChange={(v: any) => setCargoFormData({...cargoFormData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSetorDialogOpen} onOpenChange={setIsSetorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetor ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
            <DialogDescription>Organize os setores administrativos e pedagógicos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSetor} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Setor</Label>
              <Input value={setorFormData.name} onChange={e => setSetorFormData({...setorFormData, name: e.target.value})} placeholder="Ex: Secretaria" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={setorFormData.status} onValueChange={(v: any) => setSetorFormData({...setorFormData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
