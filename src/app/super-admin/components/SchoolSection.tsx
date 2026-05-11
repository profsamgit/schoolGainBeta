'use client';

import { School, Terminal } from '@/lib/types';
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
        <Card key={school.id} className="group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden flex flex-col">
          <div className="h-1.5 bg-primary/20 group-hover:bg-primary transition-colors"></div>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
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
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={school.status === 'active' ? 'secondary' : 'destructive'} className="text-[9px] font-black uppercase tracking-widest h-6">
                    {school.status === 'active' ? 'Ativa' : school.status === 'suspended' ? 'Suspensa' : 'Inativa'}
                  </Badge>
                  <div className="flex items-center gap-2 mt-1">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Acesso</Label>
                    <Switch 
                      checked={school.status === 'active'}
                      onCheckedChange={(checked) => updateSchoolStatus(school.id, checked ? 'active' : 'suspended')}
                    />
                  </div>
                </div>
              </div>
            </div>
            <CardTitle className="mt-4 text-xl font-bold tracking-tight">{school.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter">
              <Globe className="h-3 w-3" /> {school.city} • {school.state}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <div className="text-[10px]">
                  <p className="font-black uppercase tracking-widest text-slate-500 scale-[0.8] origin-left">Login do Gestor</p>
                  <p className="font-mono text-slate-900 font-bold">{school.managerEmail || school.contactEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <div className="text-[10px]">
                  <p className="font-black uppercase tracking-widest text-slate-500 scale-[0.8] origin-left">Parceiro desde</p>
                  <p className="text-slate-900 font-bold">{new Date(school.joinedDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center py-2">
              <div>
                <p className="text-xl font-black text-primary">0</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Alunos</p>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{terminals.filter(t => t.schoolId === school.id).length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Totens</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 font-black uppercase text-[10px] tracking-widest h-10 border-primary/20 text-primary hover:bg-primary hover:text-white"
              asChild
            >
              <Link href={`/admin?schoolId=${school.id}`}>
                <ExternalLink className="mr-2 h-3 w-3" /> Entrar na Unidade
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-red-600">
              <ShieldOff className="h-5 w-5" /> Encerrar Parceria
            </DialogTitle>
            <DialogDescription>
              Você está prestes a remover <strong>{schoolToDelete?.name}</strong>. 
              Esta ação revoga o acesso de todos os gestores e alunos desta unidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1 p-3 bg-red-50 rounded-lg border border-red-200">
              <Label className="text-[10px] font-black uppercase tracking-widest text-red-700">Confirmação de Segurança</Label>
              <Input 
                type="password" 
                required 
                value={deletePassword} 
                onChange={e => setDeletePassword(e.target.value)} 
                placeholder="Sua senha de Super Admin" 
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              variant="destructive"
              className="w-full h-12 font-black uppercase text-xs tracking-widest"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Ajustar Escola
            </DialogTitle>
            <DialogDescription>Corrija os dados institucionais da unidade.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSchool} className="space-y-4 pt-4">
            <div className="grid gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome da Instituição</Label>
                <Input required value={schoolEditData.name || ""} onChange={e => setSchoolEditData({...schoolEditData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Cidade</Label>
                  <Input required value={schoolEditData.city || ""} onChange={e => setSchoolEditData({...schoolEditData, city: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Estado (UF)</Label>
                  <Input required maxLength={2} value={schoolEditData.state || ""} onChange={e => setSchoolEditData({...schoolEditData, state: e.target.value.toUpperCase()})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">E-mail Administrativo</Label>
                <Input type="email" required value={schoolEditData.managerEmail || ""} onChange={e => setSchoolEditData({...schoolEditData, managerEmail: e.target.value})} />
              </div>
              
              <div className="space-y-1 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-700">Confirmação de Identidade</Label>
                <Input 
                  type="password" 
                  required 
                  value={adminPasswordForAction} 
                  onChange={e => setAdminPasswordForAction(e.target.value)} 
                  placeholder="Sua senha de Super Admin" 
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase text-xs tracking-widest">
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {schools.length === 0 && (
        <div className="col-span-full py-20 text-center space-y-4">
          <Building2 className="h-12 w-12 text-slate-200 mx-auto" />
          <p className="text-slate-500">Nenhuma escola cadastrada na rede ainda.</p>
          <Button variant="outline" onClick={() => setActiveTab('overview')}>Ver Solicitações</Button>
        </div>
      )}
    </div>
  );
}
