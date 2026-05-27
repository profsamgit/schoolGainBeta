'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Leaf, Gift, History, Plus, ArrowLeft, Edit, Trash2, MoreHorizontal, Camera, Loader2, Lock, Eye 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Reward, AuditLogEntry, Turma, Curso } from '@/types/ecosystem';

interface EconomicSectionProps {
  rewards: Reward[];
  auditLogs: AuditLogEntry[];
  filteredUsersForAdmin: any[];
  viewMode: 'list' | 'form';
  itemType: 'user' | 'reward' | 'article' | 'turma' | 'curso' | 'cargo' | 'setor' | null;
  isNew: boolean;
  isSubmitting: boolean;
  rewardForm: any;
  onSubmit: (values: any) => void;
  handleEdit: (item: any, type: any) => void;
  handleDelete: (item: any, type: any) => void;
  handleNew: (type: any) => void;
  closeAllForms: () => void;
  rewardSearch: string;
  setRewardSearch: (search: string) => void;
  grantRa: string;
  setGrantRa: (ra: string) => void;
  grantAction: string;
  setGrantAction: (action: string) => void;
  grantPointsValue: number;
  setGrantPointsValue: (points: number) => void;
  grantPassword: string;
  setGrantPassword: (pass: string) => void;
  handleGrantSubmit: () => void;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (open: boolean) => void;
  selectedItem: any;
  confirmDelete: () => void;
  uploadUserAvatar: (id: string, file: File) => Promise<string | null>;
  uploadingUserId: string | null;
  setUploadingUserId: (id: string | null) => void;
  securityPassword: string;
  setSecurityPassword: (val: string) => void;
  allTurmas?: Turma[];
  allCursos?: Curso[];
  userStates: Record<string, any>;
}

export function EconomicSection({
  rewards,
  auditLogs,
  filteredUsersForAdmin,
  viewMode,
  itemType,
  isNew,
  isSubmitting,
  rewardForm,
  onSubmit,
  handleEdit,
  handleDelete,
  handleNew,
  closeAllForms,
  rewardSearch,
  setRewardSearch,
  grantRa,
  setGrantRa,
  grantAction,
  setGrantAction,
  grantPointsValue,
  setGrantPointsValue,
  grantPassword,
  setGrantPassword,
  handleGrantSubmit,
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  selectedItem,
  confirmDelete,
  uploadUserAvatar,
  uploadingUserId,
  setUploadingUserId,
  securityPassword,
  setSecurityPassword,
  allTurmas = [],
  allCursos = [],
  userStates
}: EconomicSectionProps) {
  const [grantStudentSearch, setGrantStudentSearch] = useState('');
  const [grantTurmaFilter, setGrantTurmaFilter] = useState('all');
  const [grantCursoFilter, setGrantCursoFilter] = useState('all');
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const filteredRewards = useMemo(() => {
    return rewards
      .filter(r => r.name.toLowerCase().includes(rewardSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rewards, rewardSearch]);

  const sortedStudents = useMemo(() => {
    // Se não houver filtro de turma, curso ou busca ativa, não mostra alunos (conforme solicitação do usuário)
    if (grantTurmaFilter === 'all' && grantCursoFilter === 'all' && !grantStudentSearch) {
      return [];
    }

    return [...filteredUsersForAdmin]
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(grantStudentSearch.toLowerCase()) ||
                             u.ra?.toLowerCase().includes(grantStudentSearch.toLowerCase());
        const matchesTurma = grantTurmaFilter === 'all' || u.turma === grantTurmaFilter;
        const matchesCurso = grantCursoFilter === 'all' || u.curso === grantCursoFilter;
        
        return u.role === 'student' && matchesSearch && matchesTurma && matchesCurso;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredUsersForAdmin, grantStudentSearch, grantTurmaFilter, grantCursoFilter]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.action === 'POINTS_AWARDED' || 
      log.action === 'ITEM_PURCHASED' ||
      (log.metadata && (log.metadata.points !== undefined || log.metadata.cost !== undefined)) ||
      log.points !== undefined
    );
  }, [auditLogs]);

  if (viewMode === 'form' && itemType === 'reward') {
    return (
      <Card className="border border-slate-200/60 dark:border-indigo-500/20 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl text-slate-800 dark:text-white animate-in fade-in duration-300">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-indigo-50/50 dark:bg-indigo-950/30 px-6 py-5">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight text-indigo-650 dark:text-indigo-400">{isNew ? 'Nova Recompensa' : 'Editar Recompensa'}</CardTitle>
            <CardDescription className="text-slate-550 dark:text-slate-400 text-xs mt-1">Defina o prêmio e o custo em Bio-Coins.</CardDescription>
          </div>
          <Button variant="ghost" onClick={closeAllForms} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl gap-2 font-bold text-xs uppercase"><ArrowLeft className="h-4 w-4" />Voltar</Button>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...rewardForm}><form onSubmit={rewardForm.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
            <FormField control={rewardForm.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Nome do Prêmio</FormLabel>
                <FormControl><Input {...field} className="h-12 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={rewardForm.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Descrição Detalhada</FormLabel>
                <FormControl><Textarea {...field} className="h-20 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={rewardForm.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Custo (Bio-Coins)</FormLabel>
                  <FormControl><Input type="number" {...field} className="h-12 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={rewardForm.control} name="imageHint" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400 ml-1">Dica Visual (Emoji/Icon)</FormLabel>
                  <FormControl><Input {...field} placeholder="Ex: 🎁" className="h-12 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400 ml-1">Imagem do Prêmio</Label>
              <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
                <div className="relative group/avatar h-24 w-24 rounded-xl border-4 border-slate-200 dark:border-slate-950 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-lg shrink-0">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage src={rewardForm.watch('image')} className="object-cover" />
                    <AvatarFallback className="text-2xl font-black bg-slate-200 dark:bg-slate-900 text-slate-550 dark:text-slate-300">
                      {rewardForm.watch('name')?.charAt(0) || '🎁'}
                    </AvatarFallback>
                  </Avatar>
                  {rewardForm.watch('image') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={() => setPreviewAvatar(rewardForm.watch('image'))} 
                        className="cursor-pointer hover:scale-110 transition-transform" 
                        title="Visualizar Foto"
                      >
                        <Eye className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Suba uma imagem clara do prêmio. Resolução ideal: 200x200px (Quadrada).</p>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="relative overflow-hidden bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl gap-2 font-bold text-[10px] uppercase tracking-wider h-10 px-4 flex-1"
                      disabled={uploadingUserId === 'new-reward'}
                    >
                      {uploadingUserId === 'new-reward' ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-505 dark:text-indigo-400" /> Subindo...</>
                      ) : (
                        <><Camera className="mr-2 h-4 w-4" /> Escolher Imagem</>
                      )}
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const rewardId = rewardForm.getValues('id');
                          try {
                            setUploadingUserId('new-reward');
                            const url = await uploadUserAvatar(rewardId, file);
                            if (url) rewardForm.setValue('image', url);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setUploadingUserId(null);
                          }
                        }} 
                      />
                    </Button>
                    {rewardForm.watch('image') && (
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl h-10 w-10 p-0 flex items-center justify-center"
                        title="Visualizar Foto"
                        onClick={() => setPreviewAvatar(rewardForm.watch('image'))}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2 mt-6 animate-pulse">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lock className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Confirmação de Segurança</span>
              </div>
              <input 
                type="text" 
                name="dummy-username-safeguard" 
                autoComplete="username" 
                className="sr-only" 
                tabIndex={-1} 
                aria-hidden="true" 
                readOnly 
                value="" 
              />
              <Input 
                type="password" 
                required 
                value={securityPassword} 
                onChange={(e) => setSecurityPassword(e.target.value)} 
                placeholder="Digite sua senha de segurança ou Master" 
                className="h-12 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-amber-500/50 font-bold"
              />
              <p className="text-[9px] text-amber-600 dark:text-amber-500/65 font-medium italic">Autorização necessária para salvar recompensas no sistema.</p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200/60 dark:border-white/5 mt-6">
              <Button type="button" variant="ghost" onClick={closeAllForms} className="text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl shadow-xl transition-all">{isSubmitting ? 'Salvando...' : 'Salvar Recompensa'}</Button>
            </div>
          </form></Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Guia Informativo Econômico */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-6 text-slate-800 dark:text-white backdrop-blur-xl shadow-lg">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
            <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Guia Econômico e Reconhecimento de Mérito</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
              Gerencie a economia de Bio-Coins, conceda pontuações de incentivo e administre o catálogo de recompensas:
            </p>
            <ul className="text-[11px] text-slate-650 dark:text-slate-350 space-y-1.5 list-disc pl-4 mt-2 font-semibold">
              <li><strong className="text-slate-800 dark:text-white">Reconhecimento de Mérito</strong>: Permite a atribuição manual de Bio-Coins/pontos para alunos engajados. Para efetivar o bônus, informe a justificativa e sua senha de gestor.</li>
              <li><strong className="text-slate-800 dark:text-white">Recompensas (Shop)</strong>: Cadastre ou edite prêmios e defina seus custos em Bio-Coins. Eles aparecerão no app do aluno para troca/resgate.</li>
              <li><strong className="text-slate-800 dark:text-white">Histórico de Transações</strong>: Auditoria completa e cronológica de todas as moedas emitidas ou debitadas na escola.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
          <Card className="overflow-hidden relative bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-500/20 text-slate-900 dark:text-white rounded-[2rem] shadow-2xl p-6 backdrop-blur-xl">
              <CardHeader className="pb-2 p-0">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-650 dark:text-emerald-400 opacity-80">Saldo da Unidade</CardTitle>
              </CardHeader>
               <CardContent className="p-0 mt-3 relative z-10">
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredUsersForAdmin.reduce((acc, curr) => acc + ((userStates[curr.id]?.points ?? curr.points) || 0), 0).toLocaleString('pt-BR')}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">BIO-COINS</span>
                  </div>
                  <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12 pointer-events-none"><Leaf className="h-32 w-32 animate-pulse" /></div>
              </CardContent>
          </Card>
          
          <Card className="overflow-hidden relative bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-[2rem] shadow-2xl p-6 backdrop-blur-xl hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all">
              <CardHeader className="pb-2 p-0">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 dark:text-slate-400">Total de Prêmios</CardTitle>
              </CardHeader>
               <CardContent className="p-0 mt-3">
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredRewards.length}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ATIVOS</span>
                  </div>
              </CardContent>
          </Card>
          
          <Card className="overflow-hidden relative bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-[2rem] shadow-2xl p-6 backdrop-blur-xl hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all">
              <CardHeader className="pb-2 p-0">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 dark:text-slate-400">Transações</CardTitle>
              </CardHeader>
               <CardContent className="p-0 mt-3">
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredAuditLogs.length}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">REGISTROS</span>
                  </div>
              </CardContent>
          </Card>
      </div>

               {/* RECONHECIMENTO DE MÉRITO */}
          <Card className="border border-slate-200/60 dark:border-indigo-500/20 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-950/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/15 dark:hover:border-indigo-500/30 transition-all duration-300 text-slate-800 dark:text-white">
            <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-indigo-50/50 dark:bg-indigo-950/30 px-6 py-5">
              <CardTitle className="flex items-center gap-2 uppercase tracking-tight text-indigo-650 dark:text-indigo-400 font-black text-sm"><Leaf className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Reconhecimento de Mérito</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {/* Linha 1: Filtros e Seleção */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">1. Filtrar por Turma</Label>
                  <Select value={grantTurmaFilter || ""} onValueChange={setGrantTurmaFilter}>
                    <SelectTrigger className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue placeholder="Todas as Turmas" /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white">
                      <SelectItem value="all" className="hover:bg-indigo-500/10">Todas as Turmas</SelectItem>
                      {[...allTurmas].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                        <SelectItem key={t.id} value={t.name} className="hover:bg-indigo-500/10">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">2. Filtrar por Curso</Label>
                  <Select value={grantCursoFilter || ""} onValueChange={setGrantCursoFilter}>
                    <SelectTrigger className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue placeholder="Todos os Cursos" /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white">
                      <SelectItem value="all" className="hover:bg-indigo-500/10">Todos os Cursos</SelectItem>
                      {[...allCursos].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                        <SelectItem key={c.id} value={c.name} className="hover:bg-indigo-500/10">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">3. Identificar Aluno</Label>
                  <Select onValueChange={setGrantRa} value={grantRa || ""}>
                    <SelectTrigger className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10">
                      <SelectValue placeholder="Selecione o aluno..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white max-h-[300px]">
                      <div className="p-2 sticky top-0 bg-white dark:bg-slate-950 z-10 border-b border-slate-200/60 dark:border-white/5 mb-1">
                        <Input 
                          placeholder="Pesquisar por nome..." 
                          className="h-8 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 text-slate-850 dark:text-white" 
                          value={grantStudentSearch}
                          onChange={(e) => setGrantStudentSearch(e.target.value)}
                        />
                      </div>
                      {sortedStudents.map(u => (
                        <SelectItem key={u.id} value={u.ra || ''} className="hover:bg-indigo-500/10">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-xs uppercase">{u.name}</span>
                            <span className="text-[9px] opacity-60">RA: {u.ra}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {sortedStudents.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-500 italic">
                          {grantTurmaFilter === 'all' && grantCursoFilter === 'all' && !grantStudentSearch 
                            ? "Selecione uma turma ou curso para listar os alunos." 
                            : "Nenhum aluno encontrado."}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Linha 2: Ação e Atribuição */}
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">4. Descrição da Ação</Label>
                  <Input 
                    placeholder="Ex: Ajudou na horta, comportamento exemplar..." 
                    value={grantAction} 
                    onChange={(e) => setGrantAction(e.target.value)} 
                    className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-850 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10 shadow-sm" 
                  />
                </div>
                <div className="md:col-span-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">5. PTS</Label>
                  <Input 
                    type="number" 
                    value={grantPointsValue} 
                    onChange={(e) => setGrantPointsValue(Number(e.target.value))} 
                    className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10 shadow-sm text-emerald-600 dark:text-emerald-400" 
                  />
                </div>
                <div className="md:col-span-2 flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">6. Sua Senha (Gestor)</Label>
                    <input 
                      type="text" 
                      name="dummy-username-safeguard" 
                      autoComplete="username" 
                      className="sr-only" 
                      tabIndex={-1} 
                      aria-hidden="true" 
                      readOnly 
                      value="" 
                    />
                    <Input 
                      type="password" 
                      value={grantPassword} 
                      onChange={(e) => setGrantPassword(e.target.value)} 
                      placeholder="Autorizar" 
                      className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10 shadow-sm"
                    />
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black rounded-xl shadow-lg transition-transform hover:scale-105 h-10 w-12 flex items-center justify-center" 
                    onClick={handleGrantSubmit}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 dark:border-indigo-500/20 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all duration-300 text-slate-800 dark:text-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-indigo-50/50 dark:bg-indigo-950/30 px-6 py-5">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Recompensas</CardTitle>
                <CardDescription className="text-slate-550 dark:text-slate-400 text-xs mt-1">Catálogo de prêmios por troca de pontos da Bio-Shop.</CardDescription>
              </div>
              <Button onClick={() => handleNew('reward')} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-11 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-indigo-500/10">
                <Gift className="h-4 w-4" /> Nova Recompensa
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/20 border border-slate-200/60 dark:border-indigo-500/10 rounded-2xl shadow-md">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block ml-1">Pesquisar Prêmio</Label>
                 <Input placeholder="Buscar por nome..." value={rewardSearch} onChange={(e) => setRewardSearch(e.target.value)} className="h-12 bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" />
              </div>
              
              <div className="rounded-2xl border border-slate-200/60 dark:border-indigo-500/10 bg-white/40 dark:bg-slate-950/30 overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-indigo-50/50 dark:bg-indigo-950/40 border-b border-slate-200/60 dark:border-indigo-500/10">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Nome</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Custo</TableHead>
                      <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRewards.length > 0 ? filteredRewards.map((reward) => (
                      <TableRow key={reward.id} className={isDeleteConfirmOpen && selectedItem?.id === reward.id ? 'bg-rose-500/10 dark:bg-rose-950/20 hover:bg-rose-500/20 dark:hover:bg-rose-950/30' : 'hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors group'}>
                        <TableCell className="font-bold text-sm text-slate-800 dark:text-slate-200 px-6 py-4 flex items-center gap-3">
                          <div className="relative group/avatar">
                            <Avatar className="h-10 w-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 group-hover/avatar:border-indigo-500/50 transition-all overflow-hidden shadow-md shrink-0">
                              <AvatarImage src={reward.image || undefined} className="object-cover" />
                              <AvatarFallback className="text-xs font-black bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                {reward.imageHint || '🎁'}
                              </AvatarFallback>
                            </Avatar>
                            {reward.image && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 rounded-xl transition-opacity">
                                <button 
                                  type="button" 
                                  onClick={() => setPreviewAvatar(reward.image!)} 
                                  className="cursor-pointer hover:scale-110 transition-transform" 
                                  title="Visualizar Foto"
                                >
                                  <Eye className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span>{reward.name}</span>
                        </TableCell>
                        <TableCell className="font-black text-indigo-650 dark:text-indigo-400 px-3">{reward.cost} Bio-Coins</TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl shadow-2xl p-1 min-w-[120px]">
                              <DropdownMenuItem onClick={() => handleEdit(reward, 'reward')} className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 cursor-pointer font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg"><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(reward, 'reward')} className="text-rose-600 hover:bg-rose-500/10 cursor-pointer font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest italic">Nenhuma recompensa encontrada.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 dark:border-indigo-500/20 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all duration-300 text-slate-800 dark:text-white">
              <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-indigo-50/50 dark:bg-indigo-950/30 px-6 py-5">
                <CardTitle className="flex items-center gap-2 uppercase tracking-tight text-slate-800 dark:text-slate-200"><History className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-pulse" /> Histórico de Transações</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Auditoria completa de atribuição de pontos e trocas na unidade.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="hidden md:block rounded-2xl border border-slate-200/60 dark:border-indigo-500/10 bg-white/40 dark:bg-slate-950/30 overflow-hidden shadow-2xl">
                  <Table>
                    <TableHeader className="bg-indigo-50/50 dark:bg-indigo-950/40 border-b border-slate-200/60 dark:border-indigo-500/10">
                      <TableRow>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Data</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Aluno</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ação Realizada</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Setor</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Gestor</TableHead>
                        <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Bônus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredAuditLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors">
                          <TableCell className="text-[10px] text-slate-500 dark:text-slate-400 px-6 py-4">{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                            {log.studentName || log.metadata?.studentName || (log.action === 'ITEM_PURCHASED' ? log.actorName : 'N/A')}
                          </TableCell>
                          <TableCell className="text-xs italic text-slate-600 dark:text-slate-300">
                            {log.details || log.action?.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-black tracking-tighter uppercase px-2 py-0.5 rounded shadow-sm">
                              {log.metadata?.sector || log.unitId || 'Geral'}
                            </Badge>
                          </TableCell>
                          <TableCell className="italic text-slate-500 dark:text-slate-400 text-xs">
                            {log.adminName || (log.actorName === (log.studentName || log.metadata?.studentName || (log.action === 'ITEM_PURCHASED' ? log.actorName : '')) ? '-' : log.actorName) || 'Sistema'}
                          </TableCell>
                          <TableCell className={`text-right px-6 py-4 font-black ${
                            log.points || log.metadata?.points ? 'text-emerald-600 dark:text-emerald-400' : 
                            log.metadata?.cost ? 'text-rose-650 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {log.points || log.metadata?.points ? `+${log.points || log.metadata?.points} PTS` : 
                             log.metadata?.cost ? `-${log.metadata.cost} PTS` : '-'}
                          </TableCell>
                        </TableRow>
                    ))}
                    {filteredAuditLogs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest">Sem transações registradas nesta unidade.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards View for Transactions */}
                <div className="md:hidden space-y-3">
                  {filteredAuditLogs.map((log) => {
                    const isCredit = log.points || log.metadata?.points;
                    const isDebit = log.metadata?.cost;
                    const formattedDate = new Date(log.timestamp).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={log.id} className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 shadow-md flex flex-col gap-2.5 text-slate-800 dark:text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{formattedDate}</span>
                          <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                            {log.metadata?.sector || log.unitId || 'Geral'}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-slate-200/60 dark:border-white/5 pt-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {log.studentName || log.metadata?.studentName || (log.action === 'ITEM_PURCHASED' ? log.actorName : 'N/A')}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            {log.details || log.action?.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Gestor: <strong className="text-slate-700 dark:text-slate-300">{log.adminName || (log.actorName === (log.studentName || log.metadata?.studentName || (log.action === 'ITEM_PURCHASED' ? log.actorName : '')) ? '-' : log.actorName) || 'Sistema'}</strong></span>
                          <span className={`font-black text-xs ${
                            isCredit ? "text-emerald-600 dark:text-emerald-400" : isDebit ? "text-rose-650 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
                          }`}>
                            {isCredit ? `+${log.points || log.metadata?.points} PTS` : isDebit ? `-${log.metadata.cost} PTS` : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredAuditLogs.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-100/50 dark:bg-slate-950/20 border border-dashed border-slate-200/60 dark:border-white/10 rounded-2xl">
                      Sem transações registradas nesta unidade.
                    </div>
                  )}
                </div>
              </CardContent>
          </Card>


      {/* DIÁLOGO DE PREVISÃO DE IMAGEM DA RECOMPENSA */}
      <Dialog open={!!previewAvatar} onOpenChange={(open) => !open && setPreviewAvatar(null)}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-[2rem] p-6 shadow-2xl flex flex-col items-center justify-center gap-4">
          <DialogHeader className="w-full text-center">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-indigo-650 dark:text-indigo-400">Visualizar Recompensa</DialogTitle>
          </DialogHeader>
          <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-indigo-500/30 bg-slate-150 dark:bg-slate-950/60 flex items-center justify-center">
            {previewAvatar ? (
              <img src={previewAvatar} alt="Preview Reward" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-slate-500">Nenhuma imagem cadastrada</span>
            )}
          </div>
          <DialogFooter className="w-full pt-2">
            <Button type="button" onClick={() => setPreviewAvatar(null)} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
