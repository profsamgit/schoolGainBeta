'use client';

import { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  QrCode, 
  ArrowLeft, 
  Printer, 
  Edit, 
  Trash2, 
  Lock, 
  Rss, 
  Camera, 
  Loader2,
  Search,
  Eye,
  Check,
  CheckCircle2,
  X,
  Clock,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';
import { RegistrationRequest, User, Turma, Curso, Cargo, SetorEscolar } from '@/lib/types';
import { Power, Shield, UserX, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UseFormReturn } from 'react-hook-form';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import PrintableBadge from '@/components/ecosystem/PrintableBadge';

export interface AcademicSectionProps {
  users: User[];
  filteredUsersForAdmin: User[];
  allTurmas: Turma[];
  allCursos: Curso[];
  allCargos: Cargo[];
  allSetores: SetorEscolar[];
  filteredTurmas: Turma[];
  filteredSetores: SetorEscolar[];
  filteredCursos: Curso[];
  viewMode: 'list' | 'form';
  itemType: 'user' | 'reward' | 'article' | 'turma' | 'curso' | 'cargo' | 'setor' | null;
  isNew: boolean;
  isSubmitting: boolean;
  userForm: UseFormReturn<any>;
  onSubmit: (values: any) => void;
  handleEdit: (item: any, type: any) => void;
  handleDelete: (item: any, type: any) => void;
  handleNew: (type: any) => void;
  closeAllForms: () => void;
  isBadgeOpen: boolean;
  setIsBadgeOpen: (open: boolean) => void;
  badgeUser: User | null;
  setBadgeUser: (user: User | null) => void;
  handleBadgePrint: (user: User) => void;
  handleDownloadBadgeImage: (user: User) => Promise<void>;
  userSearch: string;
  setUserSearch: (val: string) => void;
  userRoleFilter: 'student' | 'admin' | 'visitor';
  setUserRoleFilter: (val: 'student' | 'admin' | 'visitor') => void;
  userTurmaFilter: string;
  setUserTurmaFilter: (val: string) => void;
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  handleQRDetected: (ra: string) => void;
  previewAvatar?: string | null;
  setPreviewAvatar?: (url: string | null) => void;
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
  targetSchoolId: string | null | undefined;
  isDeleteConfirmOpen: boolean;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  confirmDelete: () => void;
  setIsDeleteConfirmOpen: (open: boolean) => void;
  securityPassword: string;
  setSecurityPassword: (val: string) => void;
  registrationRequests: RegistrationRequest[];
  approveRegistration: (item: RegistrationRequest) => void;
  rejectRegistration: (id: string) => Promise<boolean>;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => Promise<boolean>;
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
  handleDownloadBadgeImage,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  userTurmaFilter,
  setUserTurmaFilter,
  isQRScannerOpen,
  setIsQRScannerOpen,
  previewAvatar,
  setPreviewAvatar,
  uploadUserAvatar,
  uploadingUserId,
  setUploadingUserId,
  isRFIDCapturing,
  setIsRFIDCapturing,
  generateStrongPassword,
  isPasswordDialogOpen,
  setIsPasswordDialogOpen,
  targetSchoolId,
  isDeleteConfirmOpen,
  selectedItem,
  setSelectedItem,
  setIsDeleteConfirmOpen,
  securityPassword,
  setSecurityPassword,
  registrationRequests,
  approveRegistration,
  rejectRegistration,
  updateUserStatus
}: AcademicSectionProps) {
  const [showInactive, setShowInactive] = useState(false);
  const router = useRouter();
  const { systemSettings } = useEcosystem();

  const sortedTurmas = useMemo(() => [...allTurmas].sort((a, b) => a.name.localeCompare(b.name)), [allTurmas]);
  const sortedCursos = useMemo(() => [...allCursos].sort((a, b) => a.name.localeCompare(b.name)), [allCursos]);
  const sortedCargos = useMemo(() => [...allCargos].sort((a, b) => a.name.localeCompare(b.name)), [allCargos]);
  const sortedSetores = useMemo(() => [...allSetores].sort((a, b) => a.name.localeCompare(b.name)), [allSetores]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsersForAdmin].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredUsersForAdmin]);

  const generateRandomRA = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    userForm.setValue('ra', result, { shouldValidate: true });
  };

  const handleAvatarUpload = async (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingUserId(userId);
      await uploadUserAvatar(userId, file);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return filteredUsersForAdmin
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                             u.ra?.toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = userRoleFilter === 'admin' 
          ? (u.role === 'admin' || u.role === 'super_admin') 
          : u.role === userRoleFilter;
        const matchesTurma = userTurmaFilter === 'all' || u.turma === userTurmaFilter;
        const matchesStatus = showInactive ? true : u.status !== 'inactive';
        
        return matchesSearch && matchesRole && matchesTurma && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredUsersForAdmin, userSearch, userRoleFilter, userTurmaFilter, showInactive]);

  const filteredRequests = useMemo(() => {
    return registrationRequests.filter(req => 
      targetSchoolId ? req.schoolId === targetSchoolId : true
    );
  }, [registrationRequests, targetSchoolId]);

  // Componente interno para renderizar células de identificação de forma unificada
  const UserIdentificationCell = ({ user }: { user: User }) => (
    <div className="flex items-center gap-3">
      <div className="relative group/avatar">
        <Avatar className="h-10 w-10 rounded-xl bg-slate-100 border-2 border-transparent group-hover/avatar:border-primary transition-all overflow-hidden">
          <AvatarImage src={user.avatar || undefined} className="object-cover" />
          <AvatarFallback className="text-xs font-black bg-slate-900 text-white">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-xl transition-opacity gap-2">
          {uploadingUserId === user.id ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : (
            <>
              <label className="cursor-pointer hover:scale-110 transition-transform" title="Trocar Foto">
                <Camera className="h-4 w-4 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(user.id, e)} />
              </label>
              {user.avatar && (
                <button type="button" onClick={() => setPreviewAvatar!(user.avatar!)} className="cursor-pointer hover:scale-110 transition-transform" title="Visualizar Foto">
                  <Eye className="h-4 w-4 text-white" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-slate-900">{user.name}</span>
        {(user.role !== 'student' || user.email) && user.email && (
          <span className="text-[10px] text-slate-400 font-medium lowercase italic">{user.email}</span>
        )}
      </div>

    </div>
  );

  const UserTable = ({ data, role }: { data: User[], role: string }) => (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 px-6">Identificação</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">RA / ID</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Vínculo</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Pontos</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
            <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? data.map((user) => (
            <TableRow key={`${user.id}-${user.ra}`} className={isDeleteConfirmOpen && selectedItem?.id === user.id ? 'bg-red-50' : 'hover:bg-slate-50 transition-colors group'}>
              <TableCell className="px-6">
                <UserIdentificationCell user={user} />
              </TableCell>
              <TableCell className="font-mono text-[11px] font-bold text-primary">{user.ra}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge 
                    variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : user.role === 'visitor' ? 'outline' : 'secondary'} 
                    className={`w-fit uppercase text-[7px] font-black tracking-tighter h-4 px-1 ${user.role === 'visitor' ? 'text-blue-600 border-blue-200 bg-blue-50/50' : ''}`}
                  >
                    {user.role === 'super_admin' ? 'Mestre' : user.role === 'admin' ? 'Gestor' : user.role === 'visitor' ? 'Visita' : 'Aluno'}
                  </Badge>
                  {user.position && <span className="font-black text-slate-900 text-[9px] uppercase tracking-widest">{user.position}</span>}
                  <span className="text-[10px] text-slate-500 font-bold">{user.turma || (role === 'visitor' ? 'Visitante' : 'Sem Turma')}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-bold text-primary">{(user as any).points || 0}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={user.status !== 'inactive'} 
                    onCheckedChange={(checked) => updateUserStatus(user.id, checked ? 'active' : 'inactive')}
                  />
                  <Badge variant={user.status === 'inactive' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-bold">
                    {user.status === 'inactive' ? 'Inativo' : 'Ativo'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right px-6">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {user.role === 'student' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => router.push(`/dashboard?preview=${user.id}${targetSchoolId ? `&schoolId=${targetSchoolId}` : ''}`)} 
                      className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5" 
                      title="Visualizar Perfil"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => { setBadgeUser(user as any); setIsBadgeOpen(true); }} className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5" title="Ver Carteira">
                    <QrCode className="h-4 w-4" />
                  </Button>

                  {(user.role === 'admin' || user.role === 'super_admin') && (
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
                    className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    onClick={() => handleEdit(user, 'user')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Excluir"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(user, 'user')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-slate-400 uppercase text-[10px] font-black tracking-widest">Nenhum registro encontrado</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (viewMode === 'form' && itemType === 'user') {
    const currentRole = userForm.watch('role');
    const roleLabel = currentRole === 'admin' || currentRole === 'super_admin' ? 'Gestor' : currentRole === 'visitor' ? 'Visitante' : 'Aluno';

    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
          <div>
            <CardTitle>{isNew ? `Cadastrar Novo ${roleLabel}` : `Editar Dados do ${roleLabel}`}</CardTitle>
            <CardDescription>
              {isNew ? (
                allTurmas.length === 0 || allCursos.length === 0 || allCargos.length === 0 || allSetores.length === 0 ? (
                  <span className="text-rose-500 font-bold uppercase text-[10px] animate-pulse">Atenção: Povoamento de dados incompleto para novos cadastros.</span>
                ) : `Preencha as informações de identificação e ${userRoleFilter === 'student' ? 'escolaridade' : 'profissionais'}.`
              ) : `Preencha as informações de identificação e ${userRoleFilter === 'student' ? 'escolaridade' : 'profissionais'}.`}
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
                      <div className="flex gap-2 items-end">
                          <FormField control={userForm.control} name="ra" render={({ field }) => (
                          <FormItem className="flex-1">
                              <FormLabel>{currentRole === 'student' ? 'RA (Identificação QR)' : 'ID de Acesso (QR)'}</FormLabel>
                              <FormControl><Input {...field} className="bg-white font-mono uppercase" /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )} />
                          <div className="flex gap-1 mb-[2px]">
                            <Button type="button" variant="outline" size="icon" className="bg-white text-primary hover:bg-primary/10" onClick={generateRandomRA} title="Gerar ID Aleatório">
                                <Wand2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" className={` ${isQRScannerOpen ? 'bg-primary text-white' : 'bg-white'}`} onClick={() => setIsQRScannerOpen(!isQRScannerOpen)} title="Escanear QR Code">
                                <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                      </div>

                      {isQRScannerOpen && (
                          <div className="border-2 border-primary rounded-lg p-2 bg-black space-y-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <div className="flex justify-between items-center px-2">
                                  <span className="text-[10px] text-white font-bold uppercase tracking-widest">Câmera Ativa: Aponte o QR Code</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:text-red-400" onClick={() => setIsQRScannerOpen(false)}>×</Button>
                              </div>
                              <QRScanner 
                                onScan={(text: string) => {
                                  userForm.setValue('ra', text.toUpperCase());
                                  setIsQRScannerOpen(false);
                                }} 
                                deviceId={systemSettings.adminCaptureDevice}
                              />
                          </div>
                      )}

                      {userForm.watch('role') !== 'visitor' && (
                          <div className="flex gap-2 items-end">
                              <FormField control={userForm.control} name="rfid" render={({ field }) => (
                              <FormItem className="flex-1">
                                  <FormLabel>ID do Cartão (RFID)</FormLabel>
                                  <FormControl><Input {...field} placeholder="Aguardando..." autoComplete="off" className="bg-white font-mono uppercase" /></FormControl>
                                  <FormMessage />
                              </FormItem>
                              )} />
                              <Button type="button" variant={isRFIDCapturing ? 'destructive' : 'outline'} size="icon" className={`mb-[2px] ${isRFIDCapturing ? 'animate-pulse' : 'bg-white text-primary'}`} onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}>
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
                                {sortedCargos.filter(c => c.status === 'active').map(c => (
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
                                <FormLabel>{currentRole === 'student' ? 'Turma' : 'Setor / Departamento'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {userForm.watch('role') === 'student' ? (
                                            sortedTurmas.filter(t => t.status === 'active').map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)
                                        ) : (
                                            sortedSetores.filter(s => s.status === 'active').map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)
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
                                        {sortedCursos.filter(c => c.status === 'active' && c.name !== 'Gestão Escolar').map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
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
                              <Wand2 className="h-3 w-3 mr-1" /> Gerar Forte
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={userForm.control} name="password" render={({ field }) => (
                              <FormItem><FormLabel>Definir Senha</FormLabel><FormControl><Input {...field} type="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" className="bg-white" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                              <FormItem><FormLabel>Confirmar</FormLabel><FormControl><Input {...field} type="password" autoComplete="new-password" placeholder="Repita a senha" className="bg-white" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        </div>
                      )}
                  </div>
              </div>


               <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Confirmação de Segurança</span>
                  </div>
                  <Input 
                    type="password" 
                    id="security-password-field"
                    name="security-password"
                    autoComplete="current-password"
                    required 
                    value={securityPassword} 
                    onChange={(e) => setSecurityPassword(e.target.value)} 
                    placeholder="Sua senha ou senha Master" 
                    className="bg-white border-amber-200"
                  />
                  <p className="text-[9px] text-amber-700 font-medium">Digite sua senha atual ou uma Chave Mestra para autorizar.</p>
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
      <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
             </div>
             <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Corpo Acadêmico</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Gestão de alunos, visitantes e equipe administrativa local.</CardDescription>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Inativos</Label>
              <Switch 
                checked={showInactive} 
                onCheckedChange={setShowInactive}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
            <Button onClick={() => handleNew('user')} className="bg-primary text-white font-black uppercase text-[10px] tracking-widest gap-2">
              <UserPlus className="h-4 w-4" /> Novo {userRoleFilter === 'student' ? 'Aluno' : userRoleFilter === 'admin' ? 'Gestor' : 'Visitante'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Pesquisar por nome ou RA..." 
                  className="pl-10 h-12 bg-white"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
            </div>
            
            <div className="w-full md:w-64 space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  {userRoleFilter === 'admin' ? 'Filtrar por Setor' : 'Filtrar por Turma'}
                </Label>
                <Select value={userTurmaFilter} onValueChange={setUserTurmaFilter}>
                  <SelectTrigger className="h-12 bg-white">
                    <SelectValue placeholder={userRoleFilter === 'admin' ? "Todos os Setores" : "Todas as Turmas"} />
                  </SelectTrigger>
                   <SelectContent>
                    <SelectItem value="all">{userRoleFilter === 'admin' ? "Todos os Setores" : "Todas as Turmas"}</SelectItem>
                    {userRoleFilter === 'admin' ? (
                      sortedSetores.map((s, idx) => (
                        <SelectItem key={s.id || `filter-s-${idx}`} value={s.name}>{s.name}</SelectItem>
                      ))
                    ) : (
                      sortedTurmas.map((t, idx) => (
                        <SelectItem key={t.id || `filter-t-${idx}`} value={t.name}>{t.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
            </div>
          </div>

          <Tabs 
            value={userRoleFilter} 
            onValueChange={(v: any) => {
              setUserRoleFilter(v as any);
              setUserTurmaFilter('all'); // Reseta o filtro ao trocar de aba para evitar listas vazias
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-4 h-12 bg-slate-100 p-1">
              <TabsTrigger value="student" className="gap-2 uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">
                Alunos 
                <span className="opacity-60 ml-1">
                  ({userTurmaFilter === 'all' ? filteredUsersForAdmin.filter(u => u.role === 'student').length : `${filteredUsers.filter(u => u.role === 'student').length} de ${filteredUsersForAdmin.filter(u => u.role === 'student').length}`})
                </span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2 uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Gestores ({filteredUsersForAdmin.filter(u => u.role === 'admin' || u.role === 'super_admin').length})</TabsTrigger>
              <TabsTrigger value="visitor" className="gap-2 uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Visitantes ({filteredUsersForAdmin.filter(u => u.role === 'visitor').length})</TabsTrigger>
              <TabsTrigger value="requests" className="gap-2 uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">
                Solicitações 
                {registrationRequests.length > 0 && (
                  <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[8px] animate-pulse">
                    {registrationRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              {userTurmaFilter === 'all' && !userSearch ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-dashed rounded-2xl border-slate-200">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Selecione uma turma</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Escolha uma turma no filtro acima para visualizar os alunos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userTurmaFilter !== 'all' && (
                    <div className="flex items-center gap-2 px-1">
                      <Badge variant="outline" className="bg-white text-[9px] font-black uppercase tracking-widest text-primary border-primary/20 h-6 px-3">
                        {filteredUsers.filter(u => u.role === 'student').length} Alunos na Turma {userTurmaFilter}
                      </Badge>
                    </div>
                  )}
                  <UserTable data={filteredUsers.filter(u => u.role === 'student')} role="student" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="admin">
              <UserTable data={filteredUsers.filter(u => u.role === 'admin' || u.role === 'super_admin')} role="admin" />
            </TabsContent>

            <TabsContent value="visitor">
              <UserTable data={filteredUsers.filter(u => u.role === 'visitor')} role="visitor" />
            </TabsContent>

            <TabsContent value="requests">
              <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 px-6">Data</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Aluno</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">RA</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Escolaridade</TableHead>
                      <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Decisão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-slate-50 transition-colors group">
                        <TableCell className="px-6 font-medium text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-slate-900">{req.name}</TableCell>
                        <TableCell className="font-mono text-[11px] font-bold text-primary">{req.ra}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-700">{req.turma}</span>
                            <span className="text-[9px] font-bold text-slate-400">{req.curso}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-2">
                            <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest gap-2"
                                onClick={() => approveRegistration(req)}
                              >
                                <CheckCircle2 className="h-4 w-4" /> Aprovar
                              </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 gap-1 font-bold text-[10px] uppercase"
                              onClick={() => rejectRegistration(req.id)}
                            >
                              <X className="h-3 w-3" /> Recusar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                             <Clock className="h-10 w-10" />
                             <p className="text-[10px] font-black uppercase tracking-widest italic">Nenhuma solicitação pendente</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={isBadgeOpen} onOpenChange={setIsBadgeOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
              <div className="sr-only">
                <DialogHeader>
                  <DialogTitle>Visualização de Crachá Premium</DialogTitle>
                  <DialogDescription>Carteira de identificação estudantil de {badgeUser?.name}</DialogDescription>
                </DialogHeader>
              </div>

              {badgeUser && (
                <div className="space-y-6 flex flex-col items-center">
                  <div id="badge-container" className="printable-badge">
                    <PrintableBadge user={badgeUser} />
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/20 w-full max-w-[320px] mx-auto space-y-4">
                    <div className="text-center">
                      <h3 className="font-black uppercase tracking-tighter text-lg text-slate-800">Visualização de Crachá</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Design Premium Ativo</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleDownloadBadgeImage(badgeUser)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-emerald-200 transition-all">
                        <ImageIcon className="h-4 w-4" /> Salvar Imagem
                      </Button>
                      <Button onClick={() => handleBadgePrint(badgeUser)} variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg transition-all">
                        <Printer className="h-4 w-4" /> Imprimir / PDF
                      </Button>
                    </div>
                    <p className="text-[9px] text-center text-slate-400 font-medium px-4">
                      O crachá será impresso com as dimensões oficiais (85mm x 55mm).
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* DIÁLOGO DE PREVISÃO DE AVATAR */}
          <Dialog open={!!previewAvatar} onOpenChange={() => setPreviewAvatar!(null)}>
            <DialogContent className="max-w-xl border-none bg-transparent shadow-none p-0 overflow-hidden flex items-center justify-center">
              <div className="sr-only">
                <DialogHeader>
                  <DialogTitle>Previsão de Avatar</DialogTitle>
                  <DialogDescription>Visualização ampliada da foto de perfil</DialogDescription>
                </DialogHeader>
              </div>
              {previewAvatar && (
                <div className="relative group">
                  <img 
                    src={previewAvatar} 
                    alt="Avatar Preview" 
                    className="max-h-[80vh] max-w-full rounded-3xl border-4 border-white shadow-2xl animate-in zoom-in-95 duration-200"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-4 -right-4 bg-white text-slate-900 rounded-full shadow-lg hover:bg-slate-100"
                    onClick={() => setPreviewAvatar!(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

         </CardContent>
      </Card>
    </div>
  );
}
