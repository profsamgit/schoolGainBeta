'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Leaf, Gift, History, Plus, ArrowLeft, Edit, Trash2, MoreHorizontal, Camera, Loader2, Lock 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Reward, AuditLogEntry } from '@/lib/types';

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
  setSecurityPassword
}: EconomicSectionProps) {

  const filteredRewards = useMemo(() => {
    return rewards.filter(r => r.name.toLowerCase().includes(rewardSearch.toLowerCase()));
  }, [rewards, rewardSearch]);

  const filteredAuditLogs = auditLogs; // Já filtrado por schoolId no parent

  if (viewMode === 'form' && itemType === 'reward') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
          <div><CardTitle>{isNew ? 'Nova Recompensa' : 'Editar Recompensa'}</CardTitle><CardDescription>Defina o prêmio e o custo em Bio-Coins.</CardDescription></div>
          <Button variant="ghost" onClick={closeAllForms}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...rewardForm}><form onSubmit={rewardForm.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
            <FormField control={rewardForm.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome do Prêmio</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={rewardForm.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição Detalhada</FormLabel><FormControl><Textarea {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={rewardForm.control} name="cost" render={({ field }) => (
                <FormItem><FormLabel>Custo (Bio-Coins)</FormLabel><FormControl><Input type="number" {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={rewardForm.control} name="imageHint" render={({ field }) => (
                <FormItem><FormLabel>Dica Visual (Emoji/Icon)</FormLabel><FormControl><Input {...field} placeholder="Ex: 🎁" className="bg-white" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Imagem do Prêmio</Label>
              <div className="flex items-center gap-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Avatar className="h-24 w-24 rounded-xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                  <AvatarImage src={rewardForm.watch('image')} className="object-cover" />
                  <AvatarFallback className="text-2xl font-black bg-slate-900 text-white">
                    {rewardForm.watch('name')?.charAt(0) || '🎁'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1">
                  <p className="text-xs font-medium text-slate-500">Suba uma imagem clara do prêmio. Resolução ideal: 200x200px (Quadrada).</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="relative overflow-hidden group/upload"
                    disabled={uploadingUserId === 'new-reward'}
                  >
                    {uploadingUserId === 'new-reward' ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subindo...</>
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
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2 mt-6">
              <div className="flex items-center gap-2 text-amber-900">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Confirmação de Segurança</span>
              </div>
              <Input 
                type="password" 
                required 
                value={securityPassword} 
                onChange={(e) => setSecurityPassword(e.target.value)} 
                placeholder="Sua senha ou senha Master" 
                className="bg-white border-amber-200"
              />
              <p className="text-[9px] text-amber-700 font-medium">Autorização necessária para salvar recompensas.</p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
              <Button type="button" variant="ghost" onClick={closeAllForms}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Recompensa'}</Button>
            </div>
          </form></Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-emerald-900 text-white overflow-hidden relative">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-400 opacity-80">Saldo da Unidade</CardTitle>
              </CardHeader>
               <CardContent>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredUsersForAdmin.reduce((acc, curr) => acc + (curr.points || 0), 0).toLocaleString('pt-BR')}</span>
                      <span className="text-xs font-bold text-emerald-400">BIO-COINS</span>
                  </div>
                  <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><Leaf className="h-32 w-32" /></div>
              </CardContent>
          </Card>
          <Card className="bg-slate-900 text-white">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Total de Prêmios</CardTitle>
              </CardHeader>
               <CardContent>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredRewards.length}</span>
                      <span className="text-xs font-bold text-slate-400">ATIVOS</span>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-slate-900 text-white">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Transações</CardTitle>
              </CardHeader>
               <CardContent>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredAuditLogs.length}</span>
                      <span className="text-xs font-bold text-slate-400">REGISTROS</span>
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="space-y-6">
          {/* RECONHECIMENTO DE MÉRITO */}
          <Card className="border-emerald-100 shadow-sm bg-emerald-50/20">
            <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 uppercase tracking-tighter text-emerald-700 font-black text-sm"><Leaf className="h-5 w-5" /> Reconhecimento de Mérito</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identificar Aluno (RA)</Label>
                  <Select onValueChange={setGrantRa} value={grantRa}>
                    <SelectTrigger className="bg-white border-emerald-200"><SelectValue placeholder="Selecione o aluno..." /></SelectTrigger>
                    <SelectContent>{filteredUsersForAdmin.filter(u => u.role === 'student').map(u => <SelectItem key={u.id} value={u.ra || ''}>{u.name} ({u.ra})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição da Ação</Label>
                  <Input placeholder="Ex: Ajudou na horta..." value={grantAction} onChange={(e) => setGrantAction(e.target.value)} className="bg-white border-emerald-200" />
                </div>
                <div className="md:col-span-1 flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">PTS</Label>
                    <Input type="number" value={grantPointsValue} onChange={(e) => setGrantPointsValue(Number(e.target.value))} className="bg-white border-emerald-200" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Sua Senha (Gestor)</Label>
                    <Input type="password" value={grantPassword} onChange={(e) => setGrantPassword(e.target.value)} placeholder="Confirme para autorizar" className="bg-white border-emerald-200" />
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleGrantSubmit}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Recompensas</CardTitle><CardDescription>Catálogo de prêmios por pontos.</CardDescription></div>
              <Button onClick={() => handleNew('reward')}><Gift className="mr-2 h-4 w-4" />Nova Recompensa</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Pesquisar Prêmio</Label>
                 <Input placeholder="Buscar por nome..." value={rewardSearch} onChange={(e) => setRewardSearch(e.target.value)} className="bg-white" />
              </div>
              
              <div className="mb-4">
                 {/* Redundância removida: O painel de exclusão global agora gerencia isso */}
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Custo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredRewards.length > 0 ? filteredRewards.map((reward) => (
                    <TableRow key={reward.id} className={isDeleteConfirmOpen && selectedItem?.id === reward.id ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{reward.name}</TableCell>
                      <TableCell>{reward.cost} Bio-Coins</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(reward, 'reward')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(reward, 'reward')} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">Nenhuma recompensa encontrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 uppercase tracking-tighter"><History className="h-6 w-6 text-primary" /> Histórico de Transações</CardTitle><CardDescription>Auditoria completa de atribuição de pontos na unidade.</CardDescription></CardHeader>
              <CardContent>
              <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Aluno</TableHead><TableHead>Ação Realizada</TableHead><TableHead>Setor</TableHead><TableHead>Gestor</TableHead><TableHead className="text-right">Bônus</TableHead></TableRow></TableHeader>
                  <TableBody>
                  {filteredAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="font-bold">{log.studentName || log.metadata?.studentName || 'N/A'}</TableCell>
                        <TableCell className="text-xs italic text-slate-600">{log.details || log.action}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">
                            {log.metadata?.sector || 'Geral'}
                          </Badge>
                        </TableCell>
                        <TableCell className="italic text-slate-400 text-xs">{log.adminName || log.actorName}</TableCell>
                        <TableCell className="text-right font-black text-emerald-600">
                          {log.points || log.metadata?.points ? `+${log.points || log.metadata?.points} PTS` : '-'}
                        </TableCell>
                      </TableRow>
                  ))}
                  {filteredAuditLogs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 uppercase text-[10px] font-black tracking-widest">Sem transações registradas nesta unidade.</TableCell></TableRow>}
                  </TableBody>
              </Table>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
