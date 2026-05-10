'use client';

import { User, School } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldAlert, 
  Plus, 
  Lock, 
  Building2, 
  School as SchoolIcon, 
  ShieldCheck, 
  Camera, 
  Loader2, 
  Trash2, 
  Edit, 
  Zap,
  Users 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SecuritySectionProps {
  superAdminUsers: User[];
  unitAdminUsers: User[];
  schools: School[];
  currentUser: User;
  isUserFormOpen: boolean;
  setIsUserFormOpen: (open: boolean) => void;
  editingUser: any;
  setEditingUser: (user: any) => void;
  userFormData: { name: string, email: string, password?: string };
  setUserFormData: (data: any) => void;
  isPasswordDialogOpen: boolean;
  setIsPasswordDialogOpen: (open: boolean) => void;
  passFormData: any;
  setPassFormData: (data: any) => void;
  handleSaveSuperAdmin: (e: React.FormEvent) => void;
  handleUpdatePassword: (e: React.FormEvent) => void;
  handleDeleteSuperAdmin: (id: string) => void;
  handleMasterReset: (user: any) => void;
  handleAvatarUpload: (userId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingUserId: string | null;
  tempGeneratedPass: string | null;
  setTempGeneratedPass: (val: string | null) => void;
  isSubmitting: boolean;
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
  isSubmitting
}: SecuritySectionProps) {
  return (
    <div className="animate-in fade-in duration-500 space-y-12">
      {/* EQUIPE DE GESTÃO GLOBAL */}
      <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="h-1.5 bg-slate-900"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                Equipe de Gestão Global
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">Administradores com acesso total a toda a rede SchoolGain.</CardDescription>
            </div>
          </div>
          
          <Dialog open={isUserFormOpen} onOpenChange={(open) => {
            setIsUserFormOpen(open);
            if (!open) {
              setEditingUser(null);
              setUserFormData({ name: '', email: '', password: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-6">
                <Plus className="h-4 w-4" /> Novo Mestre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                  {editingUser ? `Editar Mestre: ${editingUser.name}` : 'Cadastrar Novo Super Admin'}
                </DialogTitle>
                <DialogDescription>
                  Altere o nome e e-mail de acesso. A senha deve ser alterada separadamente.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveSuperAdmin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</Label>
                  <Input 
                    required 
                    value={userFormData.name}
                    onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                    placeholder="Ex: Carlos Andrade"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail (Login)</Label>
                  <Input 
                    type="email"
                    required 
                    value={userFormData.email}
                    onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                    placeholder="desenvolvimentoceepru@gmail.com"
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha de Acesso</Label>
                    <Input 
                      type="password"
                      required 
                      value={userFormData.password}
                      onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900">
                    {isSubmitting ? 'Processando...' : editingUser ? 'Atualizar Dados' : 'Salvar Novo Mestre'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="px-6 pb-8">
           <div className="grid gap-4 md:grid-cols-2">
              {superAdminUsers.map(user => (
                <div key={user.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-slate-300 transition-all shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="relative group/avatar">
                         <Avatar className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-xl cursor-pointer transition-opacity">
                            {uploadingUserId === user.id ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(user.id, e)} />
                         </label>
                      </div>
                      <div>
                         <div className="font-bold text-slate-900 flex items-center gap-2">
                            {user.name}
                            {user.id === currentUser.id && <Badge className="bg-emerald-500 text-[8px] uppercase tracking-tighter">Você</Badge>}
                         </div>
                         <p className="text-xs text-slate-500">{user.email}</p>
                         <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Ideal: 200x200px</p>
                      </div>
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditingUser(user); setPassFormData({ currentPass: '', newPass: '', confirmPass: '' }); setIsPasswordDialogOpen(true); }}>
                        <Lock className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditingUser(user); setUserFormData({ name: user.name, email: user.email || '' }); setIsUserFormOpen(true); }}>
                        <Edit className="h-4 w-4 text-slate-400" />
                      </Button>
                      {user.id !== currentUser.id && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => handleDeleteSuperAdmin(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>

      {/* GESTORES DE UNIDADE */}
      <Card className="border-none shadow-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-primary/80"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                Gestores das Unidades
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">Controle centralizado de todos os administradores locais da rede.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="h-8 px-4 border-slate-200 bg-white text-slate-600 font-black uppercase tracking-widest text-[10px]">
            {unitAdminUsers.length} Administradores
          </Badge>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Identificação do Gestor</th>
                  <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Unidade Escolar</th>
                  <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-400">Acesso</th>
                  <th className="px-6 py-4 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Ações de Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {unitAdminUsers.length > 0 ? unitAdminUsers.map((user, idx) => (
                  <tr key={`${user.id}-${user.email}-${idx}`} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-6 py-5 font-bold text-slate-900">
                      <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                          <Avatar className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black uppercase group-hover:scale-110 transition-transform overflow-hidden border-2 border-transparent group-hover/avatar:border-primary">
                            <AvatarImage src={user.avatar || undefined} className="object-cover" />
                            <AvatarFallback className="bg-slate-900 text-white">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-xl cursor-pointer transition-opacity">
                            {uploadingUserId === user.id ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(user.id, e)} />
                          </label>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold tracking-tight">{user.name}</span>
                          {user.mustChangePassword && <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Troca Obrigatória Pendente</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <SchoolIcon className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-tighter">
                          {schools.find(s => s.id === user.schoolId)?.name || 'Sem Escola'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-mono text-[10px] group-hover:text-slate-900 transition-colors">
                      {user.email || user.ra}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button variant="ghost" size="icon" title="Master Reset" className="h-9 w-9 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" onClick={() => handleMasterReset(user)}>
                        <ShieldCheck className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                         <Users className="h-12 w-12" />
                         <p className="text-xs font-black uppercase tracking-widest italic">Nenhum gestor cadastrado na rede</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE TROCA DE SENHA */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
        setIsPasswordDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Alterar Senha: {editingUser?.name}
            </DialogTitle>
            <DialogDescription>
              {editingUser?.id === currentUser?.id ? 'Confirme sua senha atual para definir uma nova.' : 'Digite SUA SENHA de Super Admin para autorizar o reset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sua Senha Atual</Label>
              <Input type="password" required value={passFormData.currentPass} onChange={e => setPassFormData({...passFormData, currentPass: e.target.value})} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Senha</Label>
                <Input type="password" required value={passFormData.newPass} onChange={e => setPassFormData({...passFormData, newPass: e.target.value})} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmar</Label>
                <Input type="password" required value={passFormData.confirmPass} onChange={e => setPassFormData({...passFormData, confirmPass: e.target.value})} placeholder="••••••••" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary h-12 font-black uppercase text-xs tracking-widest">
                {isSubmitting ? 'Processando...' : 'Atualizar Credencial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE SENHA GERADA */}
      <Dialog open={!!tempGeneratedPass} onOpenChange={(open) => { if(!open) setTempGeneratedPass(null); }}>
        <DialogContent className="sm:max-w-md bg-amber-50 border-amber-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-amber-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" /> Senha Gerada!
            </DialogTitle>
            <DialogDescription className="text-amber-800">
              Envie esta senha para <strong>{editingUser?.name}</strong>. Ele será obrigado a trocá-la no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 bg-white p-4 rounded-xl border-2 border-amber-200 justify-center">
             <span className="text-3xl font-black font-mono tracking-[0.3em] text-slate-900">
                {tempGeneratedPass}
             </span>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="outline" className="w-full border-amber-300 text-amber-900 font-bold uppercase tracking-widest text-[10px]" onClick={() => setTempGeneratedPass(null)}>
              Copiei, fechar aviso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
