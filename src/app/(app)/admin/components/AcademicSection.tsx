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
import { RegistrationRequest, User, Turma, Curso, Cargo, SetorEscolar } from '@/types/ecosystem';
import { Power, Shield, UserX, UserCheck, User as UserIcon } from 'lucide-react';
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
import { useEcosystem } from '@/contexts/EcosystemContext';
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
  userRoleFilter: 'student' | 'admin' | 'staff' | 'visitor';
  setUserRoleFilter: (val: 'student' | 'admin' | 'staff' | 'visitor') => void;
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
  userStates: Record<string, any>;
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
  updateUserStatus,
  userStates
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
    // Para visitantes, não exigimos filtro de turma para mostrar a lista
    if (userRoleFilter !== 'visitor' && !userTurmaFilter && !userSearch) return [];

    return filteredUsersForAdmin
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                             u.ra?.toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = userRoleFilter === 'admin' 
          ? (u.role === 'admin' || u.role === 'super_admin') 
          : u.role === userRoleFilter;
        
        // Se houver filtro de turma/setor, o usuário deve pertencer exatamente a ele
        // Para visitantes, matchesTurma é sempre true (ignora filtro)
        const matchesTurma = userRoleFilter === 'visitor' 
          ? true 
          : (userTurmaFilter ? (u.turma === userTurmaFilter || u.position === userTurmaFilter) : true);

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
        <Avatar className="h-10 w-10 rounded-xl bg-slate-950 border border-white/10 group-hover/avatar:border-indigo-500/50 transition-all overflow-hidden shadow-md">
          <AvatarImage src={user.avatar || undefined} className="object-cover" />
          <AvatarFallback className="text-xs font-black bg-slate-900 text-slate-300">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 rounded-xl transition-opacity gap-2">
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
        <span className="text-sm font-bold text-slate-200">{user.name}</span>
        {(user.role !== 'student' || user.email) && user.email && (
          <span className="text-[10px] text-slate-400 font-medium lowercase italic">{user.email}</span>
        )}
      </div>
    </div>
  );

  const UserTable = ({ data, role }: { data: User[], role: string }) => (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-slate-950 border-b border-white/10">
          <TableRow>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 px-6 h-12">Identificação</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">RA / ID</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Vínculo</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Pontos</TableHead>
            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Status</TableHead>
            <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? data.map((user) => (
            <TableRow key={`${user.id}-${user.ra}`} className={isDeleteConfirmOpen && selectedItem?.id === user.id ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-indigo-500/5 border-b border-white/5 transition-colors group'}>
              <TableCell className="px-6 py-4">
                <UserIdentificationCell user={user} />
              </TableCell>
              <TableCell className="font-mono text-[11px] font-bold text-indigo-400">{user.ra}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge 
                    className={`w-fit uppercase text-[7px] font-black tracking-tighter h-4 px-1.5 shadow-sm ${
                      user.role === 'super_admin' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 
                      user.role === 'admin' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 
                      user.role === 'staff' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 
                      user.role === 'visitor' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 
                      'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {user.role === 'super_admin' ? 'Mestre' : user.role === 'admin' ? 'Gestor' : user.role === 'staff' ? 'Funcionário' : user.role === 'visitor' ? 'Visita' : 'Aluno'}
                  </Badge>
                  {user.position && <span className="font-black text-slate-200 text-[9px] uppercase tracking-widest">{user.position}</span>}
                  <span className="text-[10px] text-slate-400 font-bold">{user.turma || (user.role === 'visitor' ? 'Visitante' : user.role === 'staff' || user.role === 'admin' ? 'Corporativo' : 'Sem Turma')}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-bold text-indigo-400">{userStates[user.id]?.points || 0}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={user.status !== 'inactive'} 
                    onCheckedChange={(checked) => updateUserStatus(user.id, checked ? 'active' : 'inactive')}
                    className="data-[state=checked]:bg-indigo-500"
                  />
                  <Badge className={`text-[9px] uppercase font-bold ${user.status === 'inactive' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                    {user.status === 'inactive' ? 'Inativo' : 'Ativo'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right px-6 py-4">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {user.role === 'student' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => router.push(`/student/dashboard?preview=${user.id}${targetSchoolId ? `&schoolId=${targetSchoolId}` : ''}`)} 
                      className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-full" 
                      title="Visualizar Perfil"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => { setBadgeUser(user as any); setIsBadgeOpen(true); }} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-full" title="Ver Carteira">
                    <QrCode className="h-4 w-4" />
                  </Button>

                  {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'staff') && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Trocar Senha"
                      className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-full"
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
                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
                    onClick={() => handleEdit(user, 'user')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Excluir"
                    className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-full"
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
    const roleLabel = currentRole === 'admin' || currentRole === 'super_admin' ? 'Gestor' : currentRole === 'staff' ? 'Funcionário' : currentRole === 'visitor' ? 'Visitante' : 'Aluno';

    return (
      <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl text-white animate-in fade-in duration-300">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-slate-950/20 px-6 py-5">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight text-indigo-400">{isNew ? `Cadastrar Novo ${roleLabel}` : `Editar Dados do ${roleLabel}`}</CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              {isNew ? (
                allTurmas.length === 0 || allCursos.length === 0 || allCargos.length === 0 || allSetores.length === 0 ? (
                  <span className="text-rose-400 font-bold uppercase text-[10px] animate-pulse">Atenção: Povoamento de dados incompleto para novos cadastros.</span>
                ) : `Preencha as informações de ${currentRole === 'visitor' ? 'acesso temporário' : 'identificação'}.`
              ) : `Atualize os dados de ${currentRole === 'visitor' ? 'acesso' : 'identificação'}.`}
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={closeAllForms} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl gap-2 font-bold text-xs uppercase"><ArrowLeft className="h-4 w-4" />Voltar para a Lista</Button>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={userForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{userForm.watch('role') === 'visitor' ? 'Identificação do Visitante' : 'Nome Completo'}</FormLabel>
                    <FormControl><Input {...field} placeholder={userForm.watch('role') === 'visitor' ? "Ex: Visitante - João da Silva" : "Ex: João Silva"} className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {(userForm.watch('role') === 'admin' || userForm.watch('role') === 'staff') && (
                  <FormField control={userForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de Acesso</FormLabel>
                      <FormControl><Input {...field} type="email" placeholder="email@escola.com" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

              {userForm.watch('role') !== 'visitor' && (
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group/form-avatar h-24 w-24 border-4 border-slate-950 shadow-xl rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                      <Avatar className="h-full w-full rounded-none">
                        <AvatarImage src={userForm.watch('avatar')} className="object-cover" />
                        <AvatarFallback className="bg-slate-900 text-slate-400 flex items-center justify-center">
                          <Camera className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      {userForm.watch('avatar') && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/form-avatar:opacity-100 transition-opacity">
                          <button 
                            type="button" 
                            onClick={() => setPreviewAvatar!(userForm.watch('avatar'))} 
                            className="cursor-pointer hover:scale-110 transition-transform" 
                            title="Visualizar Foto"
                          >
                            <Eye className="h-6 w-6 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Foto de Perfil</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          id="avatar-upload" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => userForm.setValue('avatar', reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()} className="bg-slate-950 border-white/10 text-slate-300 hover:text-white rounded-xl gap-2 font-bold text-[10px] uppercase tracking-wider h-10 px-4">
                          <Camera className="h-4 w-4" /> Enviar Foto
                        </Button>
                        {userForm.watch('avatar') && (
                          <>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setPreviewAvatar!(userForm.watch('avatar'))} 
                              className="bg-slate-950 border-white/10 text-slate-300 hover:text-white rounded-xl h-10 w-10 p-0 flex items-center justify-center"
                              title="Visualizar Foto"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => userForm.setValue('avatar', '')} className="text-rose-400 hover:text-rose-300 font-bold text-[10px] uppercase tracking-wider h-10 px-4">Remover</Button>
                          </>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium italic">Recomendado: Imagem quadrada 500x500px.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                      <div className="flex gap-2 items-end">
                          <FormField control={userForm.control} name="ra" render={({ field }) => (
                          <FormItem className="flex-1">
                              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{currentRole === 'student' ? 'RA (Identificação QR)' : currentRole === 'staff' ? 'Registro Funcional (QR)' : currentRole === 'visitor' ? 'ID Temporário (Acesso Kiosk)' : 'ID de Acesso (QR)'}</FormLabel>
                              <FormControl><Input {...field} className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold font-mono uppercase" /></FormControl>
                              <FormMessage />
                          </FormItem>
                          )} />
                          <div className="flex gap-1 mb-[2px]">
                            <Button type="button" variant="outline" size="icon" className="h-12 w-12 bg-slate-950 border-white/10 text-indigo-400 hover:text-indigo-300 rounded-xl" onClick={generateRandomRA} title="Gerar ID Aleatório">
                                <Wand2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" className={`h-12 w-12 rounded-xl border-white/10 ${isQRScannerOpen ? 'bg-indigo-500 text-slate-950' : 'bg-slate-950 text-indigo-400'}`} onClick={() => setIsQRScannerOpen(!isQRScannerOpen)} title="Escanear QR Code">
                                <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                      </div>

                      {isQRScannerOpen && (
                          <div className="border border-indigo-500/30 rounded-2xl p-4 bg-slate-950 space-y-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex justify-between items-center">
                                  <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Câmera Ativa: Aponte o QR Code</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-400 rounded-full" onClick={() => setIsQRScannerOpen(false)}><X className="h-4 w-4" /></Button>
                              </div>
                              <div className="rounded-xl overflow-hidden border border-white/5">
                                <QRScanner 
                                  onScan={(text: string) => {
                                    userForm.setValue('ra', text.toUpperCase());
                                    setIsQRScannerOpen(false);
                                  }} 
                                  deviceId={systemSettings.adminCaptureDevice}
                                />
                              </div>
                          </div>
                      )}

                      {userForm.watch('role') !== 'visitor' && (
                          <div className="flex gap-2 items-end">
                              <FormField control={userForm.control} name="rfid" render={({ field }) => (
                              <FormItem className="flex-1">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID do Cartão (RFID)</FormLabel>
                                  <FormControl><Input {...field} placeholder="Aguardando..." autoComplete="off" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold font-mono uppercase" /></FormControl>
                                  <FormMessage />
                              </FormItem>
                              )} />
                              <Button type="button" variant={isRFIDCapturing ? 'destructive' : 'outline'} size="icon" className={`h-12 w-12 rounded-xl mb-[2px] ${isRFIDCapturing ? 'bg-rose-600 hover:bg-rose-500 border-rose-400/20 text-white animate-pulse' : 'bg-slate-950 border-white/10 text-indigo-400'}`} onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}>
                                  <Rss className="h-4 w-4" />
                              </Button>
                          </div>
                      )}
                  </div>

                  <div className="space-y-4">
                      {(userForm.watch('role') === 'admin' || userForm.watch('role') === 'staff') && (
                        <FormField control={userForm.control} name="position" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{currentRole === 'staff' ? 'Cargo / Função' : 'Cargo Administrativo'}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                {allCargos.filter(c => c.status === 'active').map(c => (
                                  <SelectItem key={c.id} value={c.name} className="hover:bg-indigo-500/10">{c.name}</SelectItem>
                                ))}
                                {allCargos.length === 0 && <SelectItem value="none" disabled>Nenhum cargo cadastrado</SelectItem>}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {(userForm.watch('role') === 'student' || userForm.watch('role') === 'staff') && (
                        <FormField control={userForm.control} name="turma" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{currentRole === 'student' ? 'Turma' : 'Setor / Departamento'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                        {userForm.watch('role') === 'student' ? (
                                            sortedTurmas.filter(t => t.status === 'active').map(t => <SelectItem key={t.id} value={t.name} className="hover:bg-indigo-500/10">{t.name}</SelectItem>)
                                        ) : (
                                            sortedSetores.filter(s => s.status === 'active').map(s => <SelectItem key={s.id} value={s.name} className="hover:bg-indigo-500/10">{s.name}</SelectItem>)
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
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Curso</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold"><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                                    <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                        {sortedCursos.filter(c => c.status === 'active' && c.name !== 'Gestão Escolar').map(c => <SelectItem key={c.id} value={c.name} className="hover:bg-indigo-500/10">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                      )}
                      {(userForm.watch('role') === 'admin' || userForm.watch('role') === 'staff') && isNew && (
                        <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha Inicial</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={generateStrongPassword} className="h-7 text-[10px] font-bold uppercase tracking-tighter text-indigo-400 hover:text-indigo-300">
                              <Wand2 className="h-3 w-3 mr-1 animate-pulse" /> Gerar Forte
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={userForm.control} name="password" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[9px] font-bold uppercase text-slate-400">Senha</FormLabel>
                                <FormControl><Input {...field} type="password" autoComplete="new-password" placeholder="Min 6 char" className="h-10 bg-slate-900 border-white/5 text-white rounded-lg focus:border-indigo-500/50" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[9px] font-bold uppercase text-slate-400">Confirmar</FormLabel>
                                <FormControl><Input {...field} type="password" autoComplete="new-password" placeholder="Repita" className="h-10 bg-slate-900 border-white/5 text-white rounded-lg focus:border-indigo-500/50" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>
                      )}
                  </div>
              </div>


                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2 mt-4 animate-pulse">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Lock className="h-4 w-4 animate-spin-slow" />
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
                    id="security-password-field"
                    name="security-password"
                    autoComplete="current-password"
                    required 
                    value={securityPassword} 
                    onChange={(e) => setSecurityPassword(e.target.value)} 
                    placeholder="Digite sua senha de segurança ou Master" 
                    className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-amber-500/50 font-bold"
                  />
                  <p className="text-[9px] text-amber-500/60 font-medium italic">Esta ação necessita de validação criptográfica (Chave Mestra).</p>
               </div>

               <div className="flex justify-end gap-4 pt-6 border-t border-white/5 mt-6">
                   <Button type="button" variant="ghost" onClick={closeAllForms} disabled={isSubmitting} className="text-slate-400 hover:text-white">Cancelar</Button>
                   <Button type="submit" size="lg" disabled={isSubmitting} className="px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-xs tracking-widest rounded-xl shadow-xl transition-all">{isSubmitting ? 'Salvando...' : 'Confirmar e Salvar'}</Button>
               </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-white">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5 bg-slate-950/20 px-6 py-5">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md">
                <Users className="h-5 w-5" />
             </div>
             <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-200">Corpo Acadêmico</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Gestão de alunos, visitantes e equipe administrativa local.</CardDescription>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-white/10 p-2 rounded-xl shadow-md">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Inativos</Label>
              <Switch 
                checked={showInactive} 
                onCheckedChange={setShowInactive}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
            <Button onClick={() => handleNew('user')} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-11 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-indigo-500/10">
              <UserPlus className="h-4 w-4" /> Novo {userRoleFilter === 'student' ? 'Aluno' : userRoleFilter === 'admin' ? 'Gestor' : userRoleFilter === 'staff' ? 'Funcionário' : 'Visitante'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Pesquisar por nome ou RA..." 
                  className="pl-12 h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
            </div>
            
            {userRoleFilter !== 'visitor' && (
              <div className="w-full md:w-64 space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  {userRoleFilter === 'admin' || userRoleFilter === 'staff' ? 'Filtrar por Setor' : 'Filtrar por Turma'}
                </Label>
                <Select value={userTurmaFilter || ""} onValueChange={setUserTurmaFilter}>
                  <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                    <SelectValue placeholder={userRoleFilter === 'admin' || userRoleFilter === 'staff' ? "Todos os Setores" : "Todas as Turmas"} />
                  </SelectTrigger>
                    <SelectContent className="bg-slate-950 border border-white/10 text-white">
                      {userRoleFilter === 'admin' || userRoleFilter === 'staff' ? (
                        sortedSetores.filter(s => s.status === 'active').map((s, idx) => (
                          <SelectItem key={s.id || `filter-s-${idx}`} value={s.name} className="hover:bg-indigo-500/10">{s.name}</SelectItem>
                        ))
                      ) : (
                        sortedTurmas.filter(t => t.status === 'active').map((t, idx) => (
                          <SelectItem key={t.id || `filter-t-${idx}`} value={t.name} className="hover:bg-indigo-500/10">{t.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                </Select>
            </div>
            )}
          </div>

          <Tabs 
            value={userRoleFilter} 
            onValueChange={(v: any) => {
              setUserRoleFilter(v as any);
              setUserTurmaFilter(''); // Força a nova seleção ao trocar de papel
            }} 
            className="w-full space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5 h-14 bg-slate-950/80 p-1 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl">
              <TabsTrigger value="student" className="gap-2 uppercase font-black text-[10px] tracking-widest text-slate-400 hover:text-white rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-slate-950 transition-all duration-300">
                Alunos ({filteredUsersForAdmin.filter(u => u.role === 'student').length})
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-2 uppercase font-black text-[10px] tracking-widest text-slate-400 hover:text-white rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-slate-950 transition-all duration-300">
                Funcionários ({filteredUsersForAdmin.filter(u => u.role === 'staff').length})
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2 uppercase font-black text-[10px] tracking-widest text-slate-400 hover:text-white rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-slate-950 transition-all duration-300">Gestores ({filteredUsersForAdmin.filter(u => u.role === 'admin' || u.role === 'super_admin').length})</TabsTrigger>
              <TabsTrigger value="visitor" className="gap-2 uppercase font-black text-[10px] tracking-widest text-slate-400 hover:text-white rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-slate-950 transition-all duration-300">Visitantes ({filteredUsersForAdmin.filter(u => u.role === 'visitor').length})</TabsTrigger>
              <TabsTrigger value="requests" className="gap-2 uppercase font-black text-[10px] tracking-widest text-slate-400 hover:text-white rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-slate-950 transition-all duration-300">
                Solicitações 
                {registrationRequests.length > 0 && (
                  <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-rose-600 border border-rose-500/20 text-white animate-pulse ml-1 rounded-full">
                    {registrationRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              {!userTurmaFilter && !userSearch ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-950/20 border border-dashed rounded-3xl border-white/10 text-center italic">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-pulse shadow-lg">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Aguardando Seleção</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-black">Escolha uma turma específica acima para visualizar os alunos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userTurmaFilter && (
                    <div className="flex items-center gap-2 px-1">
                      <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest h-6 px-3">
                        {filteredUsers.filter(u => u.role === 'student').length} Alunos na Turma {userTurmaFilter}
                      </Badge>
                    </div>
                  )}
                  <UserTable data={filteredUsers.filter(u => u.role === 'student')} role="student" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="staff">
               {!userTurmaFilter && !userSearch ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-950/20 border border-dashed rounded-3xl border-white/10 text-center italic">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-pulse shadow-lg">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Aguardando Seleção</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-black">Escolha um setor específico acima para visualizar os funcionários.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userTurmaFilter && (
                    <div className="flex items-center gap-2 px-1">
                      <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest h-6 px-3">
                        {filteredUsers.filter(u => u.role === 'staff').length} Funcionários no Setor {userTurmaFilter}
                      </Badge>
                    </div>
                  )}
                  <UserTable data={filteredUsers.filter(u => u.role === 'staff')} role="staff" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="admin">
              <UserTable data={filteredUsers.filter(u => u.role === 'admin' || u.role === 'super_admin')} role="admin" />
            </TabsContent>

            <TabsContent value="visitor">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest h-6 px-3">
                    {filteredUsers.filter(u => u.role === 'visitor').length} Visitantes Cadastrados
                  </Badge>
                </div>
                <UserTable data={filteredUsers.filter(u => u.role === 'visitor')} role="visitor" />
              </div>
            </TabsContent>

            <TabsContent value="requests">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-slate-950 border-b border-white/10">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 px-6 h-12">Data</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Aluno</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">RA</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Escolaridade</TableHead>
                      <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-400 h-12">Decisão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-indigo-500/5 border-b border-white/5 transition-colors group">
                        <TableCell className="px-6 py-4 font-medium text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-slate-200">{req.name}</TableCell>
                        <TableCell className="font-mono text-[11px] font-bold text-indigo-400">{req.ra}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-200">{req.turma}</span>
                            <span className="text-[9px] font-bold text-slate-400">{req.curso}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest gap-2 h-9 px-4 rounded-xl shadow-lg shadow-emerald-600/10"
                              onClick={() => approveRegistration(req)}
                            >
                              <CheckCircle2 className="h-4 w-4" /> Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-9 rounded-xl bg-slate-950 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1 font-bold text-[10px] uppercase px-4"
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
                             <Clock className="h-10 w-10 text-slate-400" />
                             <p className="text-[10px] font-black uppercase tracking-widest italic text-slate-400">Nenhuma solicitação pendente</p>
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
            <DialogContent className="sm:max-w-[480px] bg-[#070913]/95 backdrop-blur-2xl border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
              {badgeUser && (
                <>
                  {(() => {
                    const roleConfig = {
                      student: { glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)] border-emerald-500/20 text-emerald-400', text: 'text-emerald-400' },
                      staff: { glow: 'shadow-[0_0_50px_rgba(124,58,237,0.35)] border-violet-500/20 text-violet-400', text: 'text-violet-400' },
                      admin: { glow: 'shadow-[0_0_50px_rgba(37,99,235,0.35)] border-blue-500/20 text-blue-400', text: 'text-blue-400' },
                      super_admin: { glow: 'shadow-[0_0_50px_rgba(79,70,229,0.35)] border-indigo-500/20 text-indigo-400', text: 'text-indigo-400' },
                      visitor: { glow: 'shadow-[0_0_50px_rgba(217,119,6,0.35)] border-amber-500/20 text-amber-400', text: 'text-amber-400' },
                    }[badgeUser.role as string] || { glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)] border-emerald-500/20 text-emerald-400', text: 'text-emerald-400' };

                    return (
                      <>
                        <DialogHeader className="pb-2">
                          <DialogTitle className="flex items-center gap-2 text-white text-lg font-black tracking-tight">
                            <UserIcon className={`h-5 w-5 animate-pulse shrink-0 ${roleConfig.text}`} />
                            Carteira Digital SchoolGain
                          </DialogTitle>
                          <DialogDescription className="text-slate-400 text-xs">
                            Visualização de crachá de identificação para {badgeUser.name}.
                          </DialogDescription>
                        </DialogHeader>

                        {/* Container Premium tridimensional com escala de visualização de 1.18 */}
                        <div className="py-8 my-2 flex justify-center items-center overflow-visible [perspective:1000px]">
                          <div id={`badge-${badgeUser.id}`} className={`transform scale-[1.18] hover:scale-[1.25] hover:rotate-y-[6deg] hover:rotate-x-[4deg] transition-all duration-500 ease-out origin-center cursor-pointer select-none rounded-[16px] border ${roleConfig.glow}`}>
                            <PrintableBadge user={badgeUser} />
                          </div>
                        </div>

                        <div className="mt-4 text-center text-[10px] text-slate-400 uppercase font-black tracking-widest px-6 leading-relaxed">
                          Use o arquivo digital ou imprima o crachá físico para identificação nos totens.
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Button onClick={() => handleDownloadBadgeImage(badgeUser)} className="gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl">
                              <ImageIcon className="h-4 w-4" />
                              Salvar Imagem
                            </Button>
                            <Button onClick={() => handleBadgePrint(badgeUser)} variant="outline" className="gap-2 shadow-lg border-white/10 hover:bg-white/5 hover:text-white text-slate-300 font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl">
                              <Printer className="h-4 w-4" />
                              PDF / Imprimir
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
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
                    className="max-h-[80vh] max-w-full rounded-3xl border-4 border-slate-950 shadow-2xl animate-in zoom-in-95 duration-200"
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
