'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, UserPlus, QrCode, ArrowLeft, Printer, Edit, Trash2, Lock, Rss, Sparkles, Camera, Loader2 
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import dynamic from 'next/dynamic';
import PrintableBadge from '@/components/ecosystem/PrintableBadge';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

interface AcademicSectionProps {
  users: any[];
  filteredUsersForAdmin: any[];
  allTurmas: any[];
  allCursos: any[];
  allCargos: any[];
  allSetores: any[];
  filteredTurmas: any[];
  filteredSetores: any[];
  filteredCursos: any[];
  viewMode: 'list' | 'form';
  itemType: string | null;
  isNew: boolean;
  isSubmitting: boolean;
  userForm: any;
  onSubmit: (values: any) => void;
  handleEdit: (item: any, type: any) => void;
  handleDelete: (item: any, type: any) => void;
  handleNew: (type: any) => void;
  closeAllForms: () => void;
  isBadgeOpen: boolean;
  setIsBadgeOpen: (open: boolean) => void;
  badgeUser: any;
  setBadgeUser: (user: any) => void;
  handleBadgePrint: (user: any) => void;
  userSearch: string;
  setUserSearch: (search: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (role: any) => void;
  userTurmaFilter: string;
  setUserTurmaFilter: (turma: string) => void;
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  handleQRDetected: (ra: string) => void;
  uploadUserAvatar: (userId: string, file: File) => Promise<string | null>;
  uploadingUserId: string | null;
  setUploadingUserId: (id: string | null) => void;
  isRFIDCapturing: boolean;
  setIsRFIDCapturing: (capturing: boolean) => void;
  isSearchQRScannerOpen: boolean;
  setIsSearchQRScannerOpen: (open: boolean) => void;
  generateStrongPassword: () => void;
  isPasswordDialogOpen: boolean;
  setIsPasswordDialogOpen: (open: boolean) => void;
  targetSchoolId: string | undefined;
  isDeleteConfirmOpen: boolean;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  confirmDelete: () => void;
  setIsDeleteConfirmOpen: (open: boolean) => void;
}

export function AcademicSection({
  users,
  filteredUsersForAdmin,
  allTurmas,
  allCursos,
  allCargos,
  allSetores,
  filteredTurmas,
  filteredSetores,
  filteredCursos,
  viewMode,
  itemType,
  isNew,
  isSubmitting,
  userForm,
  onSubmit,
  handleEdit,
  handleDelete,
  handleNew,
  closeAllForms,
  isBadgeOpen,
  setIsBadgeOpen,
  badgeUser,
  setBadgeUser,
  handleBadgePrint,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  userTurmaFilter,
  setUserTurmaFilter,
  isQRScannerOpen,
  setIsQRScannerOpen,
  handleQRDetected,
  uploadUserAvatar,
  uploadingUserId,
  setUploadingUserId,
  isRFIDCapturing,
  setIsRFIDCapturing,
  isSearchQRScannerOpen,
  setIsSearchQRScannerOpen,
  generateStrongPassword,
  isPasswordDialogOpen,
  setIsPasswordDialogOpen,
  targetSchoolId,
  isDeleteConfirmOpen,
  selectedItem,
  setSelectedItem,
  confirmDelete,
  setIsDeleteConfirmOpen
}: AcademicSectionProps) {

  const filteredUsers = useMemo(() => {
    return filteredUsersForAdmin.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                           u.ra?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === 'admin' 
        ? (u.role === 'admin' || u.role === 'super_admin') 
        : u.role === userRoleFilter;
      const matchesTurma = userTurmaFilter === 'all' ? true : u.turma === userTurmaFilter;
      return matchesSearch && matchesRole && matchesTurma;
    });
  }, [filteredUsersForAdmin, userSearch, userRoleFilter, userTurmaFilter]);

  if (viewMode === 'form' && itemType === 'user') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
          <div>
            <CardTitle>{isNew ? 'Cadastrar Novo Agente' : 'Editar Dados do Agente'}</CardTitle>
            <CardDescription>
              {isNew ? (
                allTurmas.length === 0 || allCursos.length === 0 || allCargos.length === 0 || allSetores.length === 0 ? (
                  <span className="text-rose-500 font-bold uppercase text-[10px] animate-pulse">Atenção: Povoamento de dados incompleto para novos cadastros.</span>
                ) : 'Preencha as informações de identificação e escolaridade.'
              ) : 'Preencha as informações de identificação e escolaridade.'}
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={closeAllForms}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para a Lista</Button>
        </CardHeader>
        <CardContent className="pt-6 bg-white/30">
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userForm.watch('role') !== 'visitor' ? (
                  <FormField control={userForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} placeholder="Ex: João Silva" className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                ) : (
                  <div className="space-y-2">
                    <Label>Perfil de Visitante</Label>
                    <Input value="Visitante (Padrão)" disabled className="bg-slate-50 text-muted-foreground" />
                  </div>
                )}
                {userForm.watch('role') === 'admin' && (
                  <FormField control={userForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>E-mail de Acesso</FormLabel><FormControl><Input {...field} type="email" placeholder="gestor@escola.com" className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                      <div className="flex gap-4 items-end">
                          <FormField control={userForm.control} name="ra" render={({ field }) => (
                          <FormItem className="flex-1">
                              <FormLabel>RA (Identificação QR)</FormLabel>
                              <FormControl><Input {...field} className="bg-white font-mono" /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )} />
                          <Button type="button" variant="outline" size="icon" className={`mb-[2px] ${isQRScannerOpen ? 'bg-primary text-white' : 'bg-white'}`} onClick={() => setIsQRScannerOpen(!isQRScannerOpen)}>
                              <QrCode className="h-4 w-4" />
                          </Button>
                      </div>

                      {isQRScannerOpen && (
                          <div className="border-2 border-primary rounded-lg p-2 bg-black space-y-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <div className="flex justify-between items-center px-2">
                                  <span className="text-[10px] text-white font-bold uppercase tracking-widest">Câmera Ativa: Aponte o QR Code</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:text-red-400" onClick={() => setIsQRScannerOpen(false)}>×</Button>
                              </div>
                              <QRScanner onScan={(text: string) => {
                                  userForm.setValue('ra', text);
                                  setIsQRScannerOpen(false);
                              }} />
                          </div>
                      )}

                      {userForm.watch('role') !== 'visitor' && (
                          <div className="flex gap-4 items-end">
                              <FormField control={userForm.control} name="rfid" render={({ field }) => (
                              <FormItem className="flex-1">
                                  <FormLabel>ID do Cartão (RFID)</FormLabel>
                                  <FormControl><Input {...field} placeholder="Aguardando aproximação..." className="bg-white font-mono" /></FormControl>
                                  <FormMessage />
                              </FormItem>
                              )} />
                              <Button type="button" variant={isRFIDCapturing ? 'destructive' : 'outline'} size="icon" className={`mb-[2px] ${isRFIDCapturing ? 'animate-pulse' : 'bg-white'}`} onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}>
                                  <Rss className="h-4 w-4" />
                              </Button>
                          </div>
                      )}
                  </div>

                  <div className="space-y-4">
                      {userForm.watch('role') === 'admin' && (
                        <FormField control={userForm.control} name="position" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo Administrativo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                              <SelectContent>
                                {allCargos.filter(c => c.status === 'active').map(c => (
                                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                ))}
                                {allCargos.length === 0 && <SelectItem value="none" disabled>Nenhum cargo cadastrado</SelectItem>}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {userForm.watch('role') !== 'visitor' && (
                        <FormField control={userForm.control} name="turma" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{userForm.watch('role') === 'student' ? 'Turma' : 'Setor / Departamento'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {userForm.watch('role') === 'student' ? (
                                            filteredTurmas.filter(t => t.status === 'active').map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)
                                        ) : (
                                            filteredSetores.filter(s => s.status === 'active').map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                      )}
                      {userForm.watch('role') === 'student' && (
                        <FormField control={userForm.control} name="curso" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Curso</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredCursos.filter(c => c.status === 'active' && c.name !== 'Gestão Escolar').map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                      )}
                      {userForm.watch('role') === 'admin' && isNew && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha Inicial</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={generateStrongPassword} className="h-7 text-[10px] font-bold uppercase tracking-tighter text-primary">
                              <Sparkles className="h-3 w-3 mr-1" /> Gerar Forte
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={userForm.control} name="password" render={({ field }) => (
                              <FormItem><FormLabel>Definir Senha</FormLabel><FormControl><Input {...field} type="password" placeholder="Mínimo 6 caracteres" className="bg-white" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                              <FormItem><FormLabel>Confirmar</FormLabel><FormControl><Input {...field} type="password" placeholder="Repita a senha" className="bg-white" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        </div>
                      )}
                  </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t mt-6">
                  <Button type="button" variant="ghost" onClick={closeAllForms} disabled={isSubmitting}>Cancelar</Button>
                  <Button type="submit" size="lg" disabled={isSubmitting} className="px-8">{isSubmitting ? 'Salvando...' : 'Confirmar e Salvar'}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        {/* MODAL DE CARTEIRA */}
        <Dialog open={isBadgeOpen} onOpenChange={setIsBadgeOpen}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Gerar Identificador</DialogTitle>
              <DialogDescription>Visualize e imprima a Carteira do sistema.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {badgeUser && <PrintableBadge user={badgeUser} />}
            </div>
            <DialogFooter className="flex gap-2 sm:justify-center">
              <Button variant="outline" onClick={() => setIsBadgeOpen(false)}>Fechar</Button>
              <Button onClick={() => handleBadgePrint(badgeUser)} className="gap-2">
                <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Gestão de alunos e equipe escolar.</CardDescription>
          </div>
          {targetSchoolId && (
            <Button onClick={() => handleNew('user')} className="bg-primary hover:bg-primary/90 shadow-md transition-all">
              <UserPlus className="mr-2 h-4 w-4" />Novo {userRoleFilter === 'admin' ? 'Gestor' : userRoleFilter === 'visitor' ? 'Visitante' : 'Aluno'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* BARRA DE FERRAMENTAS DE BUSCA E FILTRO */}
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
            <div className="flex-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Pesquisar</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      placeholder="Buscar por nome ou RA..." 
                      value={userSearch} 
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="bg-white pr-10"
                    />
                    {userSearch && (
                      <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold">×</button>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`bg-white shrink-0 ${isSearchQRScannerOpen ? 'border-primary text-primary' : ''}`}
                    onClick={() => setIsSearchQRScannerOpen(!isSearchQRScannerOpen)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
            </div>
            
            <div className="w-full md:w-64">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Filtrar por Turma</Label>
                <Select value={userTurmaFilter} onValueChange={setUserTurmaFilter}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todas as Turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Turmas</SelectItem>
                    {filteredTurmas.map((t, idx) => (
                      <SelectItem key={t.id || `filter-t-${idx}`} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>

          {/* SUB-ABAS PARA SEPARAR ALUNOS E GESTORES */}
          <Tabs value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="student" className="gap-2 uppercase font-black text-[10px] tracking-widest">Alunos ({filteredUsersForAdmin.filter(u => u.role === 'student').length})</TabsTrigger>
              <TabsTrigger value="admin" className="gap-2 uppercase font-black text-[10px] tracking-widest">Gestores ({filteredUsersForAdmin.filter(u => u.role === 'admin' || u.role === 'super_admin').length})</TabsTrigger>
              <TabsTrigger value="visitor" className="gap-2 uppercase font-black text-[10px] tracking-widest">Visitantes ({filteredUsersForAdmin.filter(u => u.role === 'visitor').length})</TabsTrigger>
            </TabsList>
            
            <div className="rounded-md border bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-wider">Nome</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-wider">RA / ID</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-wider">Turma / Setor</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-wider">Status</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-wider">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <TableRow key={`${user.id}-${user.ra}`} className={isDeleteConfirmOpen && selectedItem?.id === user.id ? 'bg-red-50' : 'hover:bg-slate-50 transition-colors'}>
                      <TableCell>
                      <div className="relative group/avatar">
                        <Avatar className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200">
                          <AvatarImage src={user.avatar || undefined} className="object-cover" />
                          <AvatarFallback className="text-[10px] font-black">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-lg cursor-pointer transition-opacity">
                          {uploadingUserId === user.id ? <Loader2 className="h-3 w-3 text-white animate-spin" /> : <Camera className="h-3 w-3 text-white" />}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setUploadingUserId(user.id);
                                await uploadUserAvatar(user.id, file);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setUploadingUserId(null);
                              }
                            }} 
                          />
                        </label>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                      <TableCell className="font-mono text-xs">{user.ra}</TableCell>
                      <TableCell className="text-slate-600">
                        {user.position ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-primary text-[10px] uppercase">{user.position}</span>
                            <span className="text-[11px]">{user.turma}</span>
                          </div>
                        ) : user.turma}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest">
                          {user.role === 'super_admin' ? 'Rede' : user.role === 'admin' ? 'Gestor' : user.role === 'visitor' ? 'Visitante' : 'Aluno'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setBadgeUser(user as any); setIsBadgeOpen(true); }} className="h-8 px-2 gap-1 text-[10px] uppercase font-black tracking-tighter">
                            <QrCode className="h-3 w-3" /> Carteira
                          </Button>
                          <div className="flex justify-end gap-2">
                             {user.role === 'admin' && (
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 title="Trocar Senha"
                                 className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                 onClick={() => {
                                   setSelectedItem(user);
                                   setIsPasswordDialogOpen(true);
                                 }}
                               >
                                  <Lock className="h-4 w-4" />
                               </Button>
                             )}
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               title="Editar"
                               className="h-8 w-8 text-slate-400 hover:text-slate-900"
                               onClick={() => handleEdit(user, 'user')}
                             >
                                <Edit className="h-4 w-4" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               title="Excluir"
                               className="h-8 w-8 text-slate-400 hover:text-red-600"
                               onClick={() => handleDelete(user, 'user')}
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic uppercase text-xs tracking-widest">
                        Nenhum {userRoleFilter === 'admin' ? 'gestor' : 'aluno'} encontrado para os filtros atuais.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>

         </CardContent>
      </Card>
    </div>
  );
}

// Helper to keep Tabs component happy in the parent
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
