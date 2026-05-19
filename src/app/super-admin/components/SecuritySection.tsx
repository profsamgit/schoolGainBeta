'use client';

import { useState } from 'react';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Lock, 
  Building2, 
  Key, 
  History, 
  Edit, 
  CheckCircle2, 
  AlertTriangle,
  Camera,
  Loader2,
  Sparkles,
  QrCode,
  Rss,
  Eye,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, School, Cargo, SetorEscolar } from '@/lib/types';
import dynamic from 'next/dynamic';
import { useEcosystem } from '@/app/(app)/ecosystem-context';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

interface SecuritySectionProps {
  superAdminUsers: User[];
  unitAdminUsers: User[];
  schools: School[];
  currentUser: User;
  isUserFormOpen: boolean;
  setIsUserFormOpen: (open: boolean) => void;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  userFormData: any;
  setUserFormData: (data: any) => void;
  isPasswordDialogOpen: boolean;
  setIsPasswordDialogOpen: (open: boolean) => void;
  passFormData: any;
  setPassFormData: (data: any) => void;
  handleSaveSuperAdmin: (e: React.FormEvent) => void;
  handleUpdatePassword: (e: React.FormEvent) => void;
  handleDeleteSuperAdmin: (user: User) => void;
  handleMasterReset: (user: User) => void;
  handleAvatarUpload: (userId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingUserId: string | null;
  tempGeneratedPass: string | null;
  setTempGeneratedPass: (pass: string | null) => void;
  isSubmitting: boolean;
  handleCycleReset: () => void;
  isResetting: boolean;
  resetConfirm: string;
  setResetConfirm: (val: string) => void;
  toast: any;
  allCargos: Cargo[];
  allSetores: SetorEscolar[];
  adminPasswordForAction: string;
  setAdminPasswordForAction: (pass: string) => void;
  isRFIDCapturing: boolean;
  setIsRFIDCapturing: (val: boolean) => void;
}

export function SecuritySection({
  superAdminUsers,
  unitAdminUsers,
  schools,
  currentUser,
  isUserFormOpen,
  setIsUserFormOpen,
  editingUser,
  setEditingUser,
  userFormData,
  setUserFormData,
  isPasswordDialogOpen,
  setIsPasswordDialogOpen,
  passFormData,
  setPassFormData,
  handleSaveSuperAdmin,
  handleUpdatePassword,
  handleDeleteSuperAdmin,
  handleMasterReset,
  handleAvatarUpload,
  uploadingUserId,
  tempGeneratedPass,
  setTempGeneratedPass,
  isSubmitting,
  isResetting,
  handleCycleReset,
  resetConfirm,
  setResetConfirm,
  toast,
  allCargos,
  allSetores,
  adminPasswordForAction,
  setAdminPasswordForAction,
  isRFIDCapturing,
  setIsRFIDCapturing
}: SecuritySectionProps) {
  const { systemSettings } = useEcosystem();

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const generateRandomRA = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserFormData({ ...userFormData, ra: result });
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserFormData({ ...userFormData, password: pass, confirmPassword: pass });
    setTempGeneratedPass(pass);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      handleDeleteSuperAdmin(userToDelete);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER DA SEÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg animate-pulse">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Controle de Identidade</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Gestão Global de Acessos, Mestres e Identificadores Digitais.</p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingUser(null);
          setUserFormData({ name: '', email: '', password: '', role: 'super_admin', schoolId: 'global', ra: '', rfid: '' });
          setIsUserFormOpen(true);
        }} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-12 px-6 rounded-xl hover:scale-[1.03] transition-transform shadow-lg shadow-indigo-500/10">
          <UserPlus className="h-4 w-4" /> Novo Mestre ou Gestor
        </Button>
      </div>

      <div className="space-y-6">
        {/* LISTA DE MESTRES (SUPER ADMINS) */}
        <Card className="border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-slate-950/40 px-8 py-5">
            <div className="flex items-center gap-2 text-indigo-400">
              <Key className="h-4 w-4" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Conselho de Mestres (Super Admins)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950/60">
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="w-16 pl-8"></TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome / Cargo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">RA / Identidade</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-8 text-slate-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superAdminUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 text-slate-300">
                    <TableCell className="pl-8">
                      <div className="relative group/avatar">
                        <Avatar className="h-10 w-10 rounded-xl border-2 border-indigo-500/20 group-hover/avatar:border-indigo-400 transition-all shadow-md">
                          <AvatarImage src={user.avatar || undefined} className="object-cover" />
                          <AvatarFallback className="bg-indigo-600 text-white text-[11px] font-black">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 rounded-xl transition-opacity gap-2 border border-indigo-500/20">
                          {uploadingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <>
                              <label className="cursor-pointer hover:scale-110 transition-transform" title="Trocar Foto">
                                <Camera className="h-4 w-4 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(user.id, e)} />
                              </label>
                              {user.avatar && (
                                <button type="button" onClick={() => setPreviewAvatar(user.avatar!)} className="cursor-pointer hover:scale-110 transition-transform" title="Visualizar Foto">
                                  <Eye className="h-4 w-4 text-white" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{user.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Super Administrador</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[10.5px] font-bold text-indigo-400">{user.ra || 'SEM RA'}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest py-0.5 px-2 rounded-lg">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg" title="Reset de Senha" onClick={() => handleMasterReset(user)}>
                            <Lock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg" onClick={() => {
                          setEditingUser(user);
                          setUserFormData({ ...user, password: '', confirmPassword: '' });
                          setIsUserFormOpen(true);
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg" onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                        }} disabled={user.id === currentUser.id}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* LISTA DE GESTORES DE UNIDADE */}
        <Card className="border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-slate-950/40 px-8 py-5">
            <div className="flex items-center gap-2 text-indigo-400">
              <Building2 className="h-4 w-4" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Gestores de Unidade (Admin Local)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950/60">
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="w-16 pl-8"></TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome / Unidade</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">RA / RFID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-8 text-slate-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitAdminUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-white/5 transition-colors border-b border-white/5 text-slate-300">
                    <TableCell className="pl-8">
                      <div className="relative group/avatar">
                        <Avatar className="h-10 w-10 rounded-xl border-2 border-indigo-500/20 group-hover/avatar:border-indigo-400 transition-all shadow-md">
                          <AvatarImage src={user.avatar || undefined} className="object-cover" />
                          <AvatarFallback className="bg-indigo-600 text-white text-[11px] font-black">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 rounded-xl transition-opacity gap-2 border border-indigo-500/20">
                          {uploadingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <>
                              <label className="cursor-pointer hover:scale-110 transition-transform" title="Trocar Foto">
                                <Camera className="h-4 w-4 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(user.id, e)} />
                              </label>
                              {user.avatar && (
                                <button type="button" onClick={() => setPreviewAvatar(user.avatar!)} className="cursor-pointer hover:scale-110 transition-transform" title="Visualizar Foto">
                                  <Eye className="h-4 w-4 text-white" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{user.name}</span>
                        <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">
                          {schools.find(s => s.id === user.schoolId)?.name || 'Unidade não encontrada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-bold text-indigo-400">{user.ra || 'SEM RA'}</span>
                        <span className="text-[8.5px] text-slate-400 font-bold mt-0.5 tracking-wider">{user.rfid || 'SEM RFID'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest py-0.5 px-2 rounded-lg">Local</Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg" title="Reset de Senha" onClick={() => handleMasterReset(user)}>
                            <Lock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg" onClick={() => {
                          setEditingUser(user);
                          setUserFormData({ ...user, password: '', confirmPassword: '' });
                          setIsUserFormOpen(true);
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg" onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {unitAdminUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nenhum gestor de unidade cadastrado</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-950 text-white p-8 border-b border-white/5 relative">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserPlus className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">{editingUser ? 'Atualizar Identidade' : 'Nova Identidade Admin'}</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Defina o nível de acesso e os identificadores de hardware.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveSuperAdmin} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
                  <Input value={userFormData.name} onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })} placeholder="Ex: Mestre Carlos" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail Corporativo</Label>
                  <Input value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} placeholder="mestre@escola.com" type="email" className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Perfil de Acesso</Label>
                  <Select 
                    disabled={!!editingUser}
                    value={userFormData.role} 
                    onValueChange={(v) => setUserFormData({ ...userFormData, role: v, schoolId: v === 'super_admin' ? 'global' : '' })}
                  >
                    <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 text-white">
                      <SelectItem value="super_admin">Mestre Global (Super Admin)</SelectItem>
                      <SelectItem value="admin">Gestor de Unidade (Admin Local)</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingUser && <p className="text-[9px] text-slate-500 mt-1.5 italic font-bold">* O perfil de acesso não pode ser alterado após o cadastro.</p>}
                </div>
                {userFormData.role === 'admin' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unidade Responsável</Label>
                    <Select 
                      disabled={!!editingUser}
                      value={userFormData.schoolId} 
                      onValueChange={(v) => setUserFormData({ ...userFormData, schoolId: v })}
                    >
                      <SelectTrigger className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                        <SelectValue placeholder="Selecione a Escola" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        {schools.map(school => (
                          <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 space-y-4 shadow-inner">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Identificadores de Hardware</Label>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="flex flex-col gap-1.5">
                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">RA / QR Code (12 Chars)</Label>
                        <div className="flex gap-1.5">
                          <Input value={userFormData.ra} onChange={(e) => setUserFormData({ ...userFormData, ra: e.target.value.toUpperCase() })} className="h-10 bg-slate-950 border-white/10 text-white font-mono font-bold text-xs rounded-lg" placeholder="GERAR OU ESCANEAR" />
                          <Button type="button" variant="outline" size="icon" className="h-10 w-10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-lg shrink-0" onClick={generateRandomRA} title="Gerar ID Aleatório"><Sparkles className="h-4 w-4" /></Button>
                          <Button type="button" variant="outline" size="icon" className={`h-10 w-10 rounded-lg shrink-0 ${isQRScannerOpen ? 'bg-indigo-500 text-slate-950 border-indigo-400' : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'}`} onClick={() => setIsQRScannerOpen(!isQRScannerOpen)}><QrCode className="h-4 w-4" /></Button>
                        </div>
                     </div>

                     {isQRScannerOpen && (
                          <div className="border-2 border-indigo-500 rounded-xl overflow-hidden bg-black aspect-video relative animate-in zoom-in duration-200">
                             <QRScanner 
                               onScan={(text) => {
                                 setUserFormData({ ...userFormData, ra: text.toUpperCase() });
                                 setIsQRScannerOpen(false);
                               }} 
                               deviceId={systemSettings.adminCaptureDevice}
                             />
                             <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-white h-6 w-6 p-0 bg-slate-950/60 rounded-full hover:bg-slate-950" onClick={() => setIsQRScannerOpen(false)}>×</Button>
                          </div>
                     )}

                     <div className="flex flex-col gap-1.5">
                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cartão de Acesso (RFID)</Label>
                        <div className="flex gap-1.5">
                          <Input value={userFormData.rfid} onChange={(e) => setUserFormData({ ...userFormData, rfid: e.target.value.toUpperCase() })} className="h-10 bg-slate-950 border-white/10 text-white font-mono font-bold text-xs rounded-lg" placeholder="APROXIME O CARTÃO" />
                          <Button type="button" variant={isRFIDCapturing ? 'destructive' : 'outline'} size="icon" className={`h-10 w-10 rounded-lg shrink-0 ${isRFIDCapturing ? 'animate-pulse bg-rose-600 hover:bg-rose-500 border-rose-400' : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'}`} onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}><Rss className="h-4 w-4" /></Button>
                        </div>
                     </div>
                  </div>
                </div>

                {!editingUser && (
                   <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Segurança de Acesso</Label>
                        <Button type="button" variant="ghost" onClick={generateStrongPassword} className="h-6 text-[9px] font-black uppercase text-indigo-400 hover:bg-indigo-500/10 rounded-lg px-2">Gerar Senha</Button>
                      </div>
                      <Input value={userFormData.password} onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })} type="password" placeholder="Definir Senha" className="h-10 bg-slate-950 border-white/10 text-white rounded-lg font-bold" required />
                      <Input value={userFormData.confirmPassword} onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })} type="password" placeholder="Confirmar Senha" className="h-10 bg-slate-950 border-white/10 text-white rounded-lg font-bold" required />
                      {tempGeneratedPass && <p className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 font-mono mt-2">Senha Gerada: <span className="text-white select-all">{tempGeneratedPass}</span></p>}
                   </div>
                )}
              </div>
            </div>

            {/* CONFIRMAÇÃO COM SENHA MASTER */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3">
               <div className="flex items-center gap-2 text-amber-400">
                  <Lock className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Autorização do Mestre</span>
               </div>
               <Input 
                 type="password" 
                 value={adminPasswordForAction} 
                 onChange={(e) => setAdminPasswordForAction(e.target.value)}
                 placeholder="Sua senha de Super Admin para confirmar" 
                 className="h-12 bg-slate-950 border-white/10 text-white rounded-xl font-bold focus:border-amber-500/50"
                 required
               />
               <p className="text-[9px] text-amber-400/50 font-bold italic ml-1">Esta ação exige confirmação de identidade global para ser persistida no banco.</p>
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsUserFormOpen(false)} className="h-12 px-8 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="h-12 px-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingUser ? 'Salvar Alterações' : 'Finalizar Cadastro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-rose-950/40 text-white p-8 border-b border-rose-500/20 relative">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Trash2 className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Confirmar Exclusão</DialogTitle>
                <DialogDescription className="text-rose-300/80 font-bold uppercase text-[9px] tracking-widest mt-1">Ação irreversível.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <p className="text-sm font-bold text-slate-300">
                Você está removendo o {userToDelete?.role === 'super_admin' ? 'Mestre' : 'Gestor'} <span className="text-rose-400">{(userToDelete as any)?.name}</span>. Todos os acessos serão revogados.
            </p>
            
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-amber-400 block ml-1">Senha Master (Sua Senha)</Label>
               <Input 
                 type="password" 
                 value={adminPasswordForAction} 
                 onChange={(e) => setAdminPasswordForAction(e.target.value)}
                 className="h-11 bg-slate-950 border-white/10 text-white rounded-xl focus:border-amber-500/50" 
                 placeholder="Confirme para deletar" 
                 required 
               />
            </div>

            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="h-11 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">Voltar</Button>
              <Button onClick={handleConfirmDelete} disabled={isSubmitting} className="h-11 bg-rose-600 hover:bg-rose-500 border border-rose-400/20 text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE TROCA DE SENHA */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-950 text-white p-8 border-b border-white/5 relative">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Lock className="h-6 w-6 animate-pulse" />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Redefinir Acesso</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nova Senha</Label>
                <Input type="password" value={passFormData.newPassword} onChange={(e) => setPassFormData({ ...passFormData, newPassword: e.target.value })} className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Nova Senha</Label>
                <Input type="password" value={passFormData.confirmPassword} onChange={(e) => setPassFormData({ ...passFormData, confirmPassword: e.target.value })} className="h-12 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold" required />
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-amber-400 block ml-1">Senha Master (Sua Senha)</Label>
               <Input 
                 type="password" 
                 value={adminPasswordForAction} 
                 onChange={(e) => setAdminPasswordForAction(e.target.value)}
                 className="h-11 bg-slate-950 border-white/10 text-white rounded-xl focus:border-amber-500/50" 
                 placeholder="Confirme sua identidade" 
                 required 
               />
            </div>

            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsPasswordDialogOpen(false)} className="h-11 font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">Voltar</Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-slate-950 border border-indigo-400/20 text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE PREVISÃO DE AVATAR */}
      <Dialog open={!!previewAvatar} onOpenChange={() => setPreviewAvatar(null)}>
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
                className="absolute -top-4 -right-4 bg-slate-950 text-white rounded-full shadow-lg hover:bg-slate-900 border border-white/10"
                onClick={() => setPreviewAvatar(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
