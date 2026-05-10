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
  Rss
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

  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Controle de Identidade</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Gestão Global de Acessos, Mestres e Identificadores Digitais.</p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingUser(null);
          setUserFormData({ name: '', email: '', password: '', role: 'super_admin', schoolId: 'global', ra: '', rfid: '' });
          setIsUserFormOpen(true);
        }} className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest gap-2 h-12 px-6 rounded-xl hover:scale-105 transition-transform">
          <UserPlus className="h-4 w-4" /> Novo Mestre ou Gestor
        </Button>
      </div>

      <div className="space-y-6">
        {/* LISTA DE MESTRES (SUPER ADMINS) */}
        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-white/80">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Conselho de Mestres (Super Admins)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Nome / Cargo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">RA / Identidade</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superAdminUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                    <TableCell className="pl-6">
                      <div className="relative group/avatar">
                        <Avatar className="h-9 w-9 rounded-xl border-2 border-transparent group-hover/avatar:border-primary transition-all">
                          <AvatarImage src={user.avatar || undefined} className="object-cover" />
                          <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-xl cursor-pointer transition-opacity">
                          {uploadingUserId === user.id ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(user.id, e)} />
                        </label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] font-bold text-primary">{user.ra || 'SEM RA'}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-tighter">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50" title="Reset de Senha" onClick={() => handleMasterReset(user)}>
                            <Lock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => {
                          setEditingUser(user);
                          setUserFormData({ ...user, password: '', confirmPassword: '' });
                          setIsUserFormOpen(true);
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => {
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
        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-white/80">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Gestores de Unidade (Admin Local)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Nome / Unidade</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">RA / RFID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitAdminUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                    <TableCell className="pl-6">
                      <Avatar className="h-9 w-9 rounded-xl border-2 border-transparent">
                        <AvatarImage src={user.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{user.name}</span>
                        <span className="text-[9px] text-primary font-black uppercase tracking-widest">
                          {schools.find(s => s.id === user.schoolId)?.name || 'Unidade não encontrada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-bold text-primary">{user.ra || 'SEM RA'}</span>
                        <span className="text-[8px] text-slate-400 font-bold">{user.rfid || 'SEM RFID'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-primary text-primary">Local</Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50" title="Reset de Senha" onClick={() => handleMasterReset(user)}>
                            <Lock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => {
                          setEditingUser(user);
                          setUserFormData({ ...user, password: '', confirmPassword: '' });
                          setIsUserFormOpen(true);
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => {
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
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nenhum gestor de unidade cadastrado</p>
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
        <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="bg-slate-900 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{editingUser ? 'Atualizar Identidade' : 'Nova Identidade Admin'}</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Defina o nível de acesso e os identificadores de hardware.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveSuperAdmin} className="p-8 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
                  <Input value={userFormData.name} onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })} placeholder="Ex: Mestre Carlos" className="h-12 bg-slate-50 border-slate-100 font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail Corporativo</Label>
                  <Input value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} placeholder="mestre@escola.com" type="email" className="h-12 bg-slate-50 border-slate-100 font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Perfil de Acesso</Label>
                  <Select 
                    disabled={!!editingUser}
                    value={userFormData.role} 
                    onValueChange={(v) => setUserFormData({ ...userFormData, role: v, schoolId: v === 'super_admin' ? 'global' : '' })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 font-bold">
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Mestre Global (Super Admin)</SelectItem>
                      <SelectItem value="admin">Gestor de Unidade (Admin Local)</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingUser && <p className="text-[9px] text-slate-400 mt-1 italic">* O perfil de acesso não pode ser alterado após o cadastro.</p>}
                </div>
                {userFormData.role === 'admin' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unidade Responsável</Label>
                    <Select 
                      disabled={!!editingUser}
                      value={userFormData.schoolId} 
                      onValueChange={(v) => setUserFormData({ ...userFormData, schoolId: v })}
                    >
                      <SelectTrigger className="h-12 bg-slate-50 border-slate-100 font-bold">
                        <SelectValue placeholder="Selecione a Escola" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map(school => (
                          <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Identificadores de Hardware</Label>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="flex flex-col gap-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400">RA / QR Code (12 Chars)</Label>
                        <div className="flex gap-1">
                          <Input value={userFormData.ra} onChange={(e) => setUserFormData({ ...userFormData, ra: e.target.value.toUpperCase() })} className="h-10 bg-white font-mono font-bold text-xs" placeholder="GERAR OU ESCANEAR" />
                          <Button type="button" variant="outline" size="icon" className="h-10 w-10 bg-white hover:bg-primary/10 text-primary" onClick={generateRandomRA} title="Gerar ID Aleatório"><Sparkles className="h-4 w-4" /></Button>
                          <Button type="button" variant="outline" size="icon" className={`h-10 w-10 ${isQRScannerOpen ? 'bg-primary text-white' : 'bg-white text-primary'}`} onClick={() => setIsQRScannerOpen(!isQRScannerOpen)}><QrCode className="h-4 w-4" /></Button>
                        </div>
                     </div>

                     {isQRScannerOpen && (
                        <div className="border-2 border-primary rounded-xl overflow-hidden bg-black aspect-video relative animate-in zoom-in duration-200">
                           <QRScanner onScan={(text) => {
                             setUserFormData({ ...userFormData, ra: text.toUpperCase() });
                             setIsQRScannerOpen(false);
                           }} />
                           <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-white h-6 w-6 p-0" onClick={() => setIsQRScannerOpen(false)}>×</Button>
                        </div>
                     )}

                     <div className="flex flex-col gap-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Cartão de Acesso (RFID)</Label>
                        <div className="flex gap-1">
                          <Input value={userFormData.rfid} onChange={(e) => setUserFormData({ ...userFormData, rfid: e.target.value.toUpperCase() })} className="h-10 bg-white font-mono font-bold text-xs" placeholder="APROXIME O CARTÃO" />
                          <Button type="button" variant={isRFIDCapturing ? 'destructive' : 'outline'} size="icon" className={`h-10 w-10 ${isRFIDCapturing ? 'animate-pulse' : 'bg-white text-primary'}`} onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}><Rss className="h-4 w-4" /></Button>
                        </div>
                     </div>
                  </div>
                </div>

                {!editingUser && (
                   <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Segurança de Acesso</Label>
                        <Button type="button" variant="ghost" onClick={generateStrongPassword} className="h-6 text-[9px] font-black uppercase text-primary hover:bg-primary/5">Gerar Senha</Button>
                      </div>
                      <Input value={userFormData.password} onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })} type="password" placeholder="Definir Senha" className="h-10 bg-white font-bold" required />
                      <Input value={userFormData.confirmPassword} onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })} type="password" placeholder="Confirmar Senha" className="h-10 bg-white font-bold" required />
                      {tempGeneratedPass && <p className="text-[9px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">Senha Gerada: <span className="font-mono">{tempGeneratedPass}</span></p>}
                   </div>
                )}
              </div>
            </div>

            {/* CONFIRMAÇÃO COM SENHA MASTER */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-3">
               <div className="flex items-center gap-2 text-amber-900">
                  <Lock className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Autorização do Mestre</span>
               </div>
               <Input 
                 type="password" 
                 value={adminPasswordForAction} 
                 onChange={(e) => setAdminPasswordForAction(e.target.value)}
                 placeholder="Sua senha de Super Admin para confirmar" 
                 className="h-12 bg-white border-amber-200 font-bold"
                 required
               />
               <p className="text-[9px] text-amber-700 font-medium italic">Esta ação exige confirmação de identidade global para ser persistida no banco.</p>
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsUserFormOpen(false)} className="h-12 px-8 font-bold uppercase text-[10px] tracking-widest">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="h-12 px-12 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingUser ? 'Salvar Alterações' : 'Finalizar Cadastro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="bg-red-600 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Confirmar Exclusão</DialogTitle>
                <DialogDescription className="text-red-100 font-bold uppercase text-[10px] tracking-widest">Ação irreversível.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 bg-white space-y-6">
            <p className="text-sm font-bold text-slate-600">
                Você está removendo o {userToDelete?.role === 'super_admin' ? 'Mestre' : 'Gestor'} <span className="text-red-600">{(userToDelete as any)?.name}</span>. Todos os acessos serão revogados.
            </p>
            
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-amber-900">Senha Master (Sua Senha)</Label>
               <Input 
                 type="password" 
                 value={adminPasswordForAction} 
                 onChange={(e) => setAdminPasswordForAction(e.target.value)}
                 className="h-11 bg-white border-amber-200" 
                 placeholder="Confirme para deletar" 
                 required 
               />
            </div>

            <DialogFooter className="gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="h-11 font-bold uppercase text-[10px] tracking-widest">Voltar</Button>
              <Button onClick={handleConfirmDelete} disabled={isSubmitting} className="h-11 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE TROCA DE SENHA */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="bg-slate-900 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">Redefinir Acesso</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nova Senha</Label>
                <Input type="password" value={passFormData.newPassword} onChange={(e) => setPassFormData({ ...passFormData, newPassword: e.target.value })} className="h-12 bg-slate-50 border-slate-100 font-bold" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmar Nova Senha</Label>
                <Input type="password" value={passFormData.confirmPassword} onChange={(e) => setPassFormData({ ...passFormData, confirmPassword: e.target.value })} className="h-12 bg-slate-50 border-slate-100 font-bold" required />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-widest text-amber-900">Senha Master (Sua Senha)</Label>
               <Input 
                 type="password" 
                 value={adminPasswordForAction} 
                 onChange={(e) => setAdminPasswordForAction(e.target.value)}
                 className="h-11 bg-white border-amber-200" 
                 placeholder="Confirme sua identidade" 
                 required 
               />
            </div>

            <DialogFooter className="gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsPasswordDialogOpen(false)} className="h-11 font-bold uppercase text-[10px] tracking-widest">Voltar</Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-xl">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
