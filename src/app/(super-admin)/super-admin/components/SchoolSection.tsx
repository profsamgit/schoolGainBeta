'use client';

import { School, Terminal } from '@/types/ecosystem';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Edit, 
  ExternalLink, 
  Globe, 
  Mail, 
  Calendar, 
  Trash2,
  Power,
  ShieldOff
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

interface SchoolSectionProps {
  schools: School[];
  terminals: Terminal[];
  deleteSchool: (id: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  updateSchoolStatus: (id: string, status: 'active' | 'pending' | 'inactive' | 'suspended') => void | Promise<void>;
  isSchoolEditDialogOpen: boolean;
  setIsSchoolEditDialogOpen: (open: boolean) => void;
  editingSchoolObj: any;
  setEditingSchoolObj: (school: any) => void;
  schoolEditData: any;
  setSchoolEditData: (data: any) => void;
  adminPasswordForAction: string;
  setAdminPasswordForAction: (pass: string) => void;
  handleUpdateSchool: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  toast: any;
  setActiveTab: (tab: string) => void;
  deletePassword: string;
  setDeletePassword: (pass: string) => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  schoolToDelete: School | null;
  setSchoolToDelete: (school: School | null) => void;
}

export function SchoolSection({
  schools,
  terminals,
  deleteSchool,
  updateSchoolStatus,
  isSchoolEditDialogOpen,
  setIsSchoolEditDialogOpen,
  editingSchoolObj,
  setEditingSchoolObj,
  schoolEditData,
  setSchoolEditData,
  adminPasswordForAction,
  setAdminPasswordForAction,
  handleUpdateSchool,
  isSubmitting,
  toast,
  setActiveTab,
  deletePassword,
  setDeletePassword,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  schoolToDelete,
  setSchoolToDelete
}: SchoolSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in slide-in-from-bottom-4 duration-500">
      {schools.map((school) => (
        <Card key={school.id} className="group border border-slate-200/60 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl text-slate-800 dark:text-white shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden flex flex-col rounded-[2rem]">
          <div className="h-1.5 bg-indigo-500/20 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-600 transition-colors"></div>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:dark:bg-indigo-500/10 group-hover:text-indigo-600 group-hover:dark:text-indigo-400 transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex gap-1 items-start">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg"
                  onClick={() => {
                    setEditingSchoolObj(school);
                    setSchoolEditData({
                      name: school.name,
                      city: school.city,
                      state: school.state,
                      managerEmail: school.managerEmail || school.contactEmail || ''
                    });
                    setIsSchoolEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <div className="flex flex-col items-end gap-1.5 ml-1">
                  <Badge className={`text-[9px] font-black uppercase tracking-widest h-6 px-2.5 rounded-lg border ${
                    school.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                    {school.status === 'active' ? 'Ativa' : school.status === 'suspended' ? 'Suspensa' : 'Inativa'}
                  </Badge>
                  <div className="flex items-center gap-2 mt-1">
                    <Label className="text-[9px] font-bold uppercase text-slate-500 scale-[0.9] origin-right tracking-widest">Acesso</Label>
                    <Switch 
                      checked={school.status === 'active'}
                      onCheckedChange={(checked) => updateSchoolStatus(school.id, checked ? 'active' : 'suspended')}
                    />
                  </div>
                </div>
              </div>
            </div>
            <CardTitle className="mt-4 text-xl font-black tracking-tight text-slate-900 dark:text-white">{school.name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
              <Globe className="h-3 w-3 text-indigo-500 dark:text-indigo-400" /> {school.city} • {school.state}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <div className="text-[10px] flex-1 min-w-0">
                  <p className="font-black uppercase tracking-widest text-slate-500 scale-[0.8] origin-left">Login do Gestor</p>
                  <p className="font-mono text-slate-800 dark:text-white font-bold truncate">{school.managerEmail || school.contactEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <div className="text-[10px]">
                  <p className="font-black uppercase tracking-widest text-slate-500 scale-[0.8] origin-left">Parceiro desde</p>
                  <p className="text-slate-800 dark:text-white font-bold">{new Date(school.joinedDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center py-2 bg-slate-50/30 dark:bg-slate-950/20 rounded-2xl border border-slate-200/60 dark:border-white/5">
              <div>
                <p className="text-xl font-black text-indigo-650 dark:text-indigo-400">0</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Alunos</p>
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 dark:text-white">{terminals.filter(t => t.schoolId === school.id).length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Totens</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border-t border-slate-200/60 dark:border-white/5 gap-3 rounded-b-[2rem]">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 font-black uppercase text-[10px] tracking-widest h-10 border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white dark:hover:text-slate-950 rounded-xl transition-all"
              asChild
            >
              <Link href={`/admin?schoolId=${school.id}`}>
                <ExternalLink className="mr-2 h-3 w-3" /> Entrar na Unidade
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
              onClick={() => {
                setSchoolToDelete(school);
                setDeletePassword('');
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
      
      {/* MODAL DE EXCLUSÃO DE ESCOLA */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldOff className="h-5 w-5 animate-pulse" /> Encerrar Parceria
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Você está prestes a remover <strong>{schoolToDelete?.name}</strong>. 
              Esta ação revoga o acesso de todos os gestores e alunos desta unidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20">
              <Label className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-300 block mb-1">Confirmação de Segurança</Label>
              <Input 
                type="password" 
                required 
                value={deletePassword} 
                onChange={e => setDeletePassword(e.target.value)} 
                placeholder="Sua senha de Super Admin" 
                className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-rose-500/50 h-11"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              variant="destructive"
              className="w-full h-12 font-black uppercase text-xs tracking-widest rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-400/20"
              onClick={async () => {
                if (!schoolToDelete) return;
                const result = await deleteSchool(schoolToDelete.id, deletePassword);
                if (result.success) {
                  setIsDeleteDialogOpen(false);
                  toast({ title: "Escola Removida", description: "O acesso desta unidade foi revogado permanentemente." });
                } else {
                  toast({ 
                    title: "Falha na Autenticação", 
                    description: result.error, 
                    variant: "destructive" 
                  });
                }
              }}
            >
              Confirmar Exclusão Definitiva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO DE ESCOLA */}
      <Dialog open={isSchoolEditDialogOpen} onOpenChange={setIsSchoolEditDialogOpen}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Edit className="h-5 w-5" /> Ajustar Escola
            </DialogTitle>
            <DialogDescription className="text-slate-550 dark:text-slate-400 text-xs">Corrija os dados institucionais da unidade.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSchool} className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Nome da Instituição</Label>
                <Input required value={schoolEditData.name || ""} onChange={e => setSchoolEditData({...schoolEditData, name: e.target.value})} className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 h-11" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Cidade</Label>
                  <Input required value={schoolEditData.city || ""} onChange={e => setSchoolEditData({...schoolEditData, city: e.target.value})} className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Estado (UF)</Label>
                  <Input required maxLength={2} value={schoolEditData.state || ""} onChange={e => setSchoolEditData({...schoolEditData, state: e.target.value.toUpperCase()})} className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">E-mail Administrativo</Label>
                <Input type="email" required value={schoolEditData.managerEmail || ""} onChange={e => setSchoolEditData({...schoolEditData, managerEmail: e.target.value})} className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 h-11" />
              </div>
              
              <div className="space-y-1.5 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block mb-1">Confirmação de Identidade</Label>
                <Input 
                  type="password" 
                  required 
                  value={adminPasswordForAction} 
                  onChange={e => setAdminPasswordForAction(e.target.value)} 
                  placeholder="Sua senha de Super Admin" 
                  className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 h-11"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase text-xs tracking-widest rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20">
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {schools.length === 0 && (
        <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40 rounded-[2rem]">
          <Building2 className="h-12 w-12 text-slate-500 dark:text-slate-600 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma escola cadastrada na rede ainda.</p>
          <Button variant="outline" className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl" onClick={() => setActiveTab('overview')}>Ver Solicitações</Button>
        </div>
      )}
    </div>
  );
}
