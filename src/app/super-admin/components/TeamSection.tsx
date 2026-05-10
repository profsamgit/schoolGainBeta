'use client';

import { Participant } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Camera, 
  Loader2 
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

interface TeamSectionProps {
  allParticipants: Participant[];
  isDevDialogOpen: boolean;
  setIsDevDialogOpen: (open: boolean) => void;
  editingDev: any;
  setEditingDev: (dev: any) => void;
  devFormData: any;
  setDevFormData: (data: any) => void;
  handleDeleteDev: (id: string) => void;
  handleSaveDev: (e: React.FormEvent) => void;
  uploadUserAvatar: (id: string, file: File) => Promise<string | null>;
  uploadingUserId: string | null;
  setUploadingUserId: (id: string | null) => void;
}

export function TeamSection({
  allParticipants,
  isDevDialogOpen,
  setIsDevDialogOpen,
  editingDev,
  setEditingDev,
  devFormData,
  setDevFormData,
  handleDeleteDev,
  handleSaveDev,
  uploadUserAvatar,
  uploadingUserId,
  setUploadingUserId
}: TeamSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Equipe de Desenvolvimento
            </CardTitle>
            <CardDescription>Gerencie as pessoas que aparecem na tela Sobre do sistema.</CardDescription>
          </div>
          <Dialog open={isDevDialogOpen} onOpenChange={(open) => {
            setIsDevDialogOpen(open);
            if (!open) {
              setEditingDev(null);
              setDevFormData({ name: '', role: '', description: '', avatar: '', initials: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                className="font-black uppercase text-xs tracking-widest gap-2"
                onClick={() => {
                  setEditingDev(null);
                  setDevFormData({ id: `participant-${Date.now()}`, name: '', role: '', description: '', avatar: '', initials: '' });
                }}
              >
                <Plus className="h-4 w-4" /> Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                  {editingDev ? 'Editar Membro' : 'Novo Membro na Equipe'}
                </DialogTitle>
                <DialogDescription>Estes dados serão exibidos publicamente na página Sobre.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveDev} className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome Completo</Label>
                    <Input required value={devFormData.name} onChange={e => setDevFormData({...devFormData, name: e.target.value})} placeholder="João Silva" className="font-bold" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Sigla</Label>
                    <Input required maxLength={2} value={devFormData.initials} onChange={e => setDevFormData({...devFormData, initials: e.target.value.toUpperCase()})} placeholder="JS" className="font-black text-center" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Cargo/Função</Label>
                  <Input required value={devFormData.role} onChange={e => setDevFormData({...devFormData, role: e.target.value})} placeholder="Líder Desenvolvedor" className="font-medium" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Descrição Curta</Label>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required 
                    value={devFormData.description} 
                    onChange={e => setDevFormData({...devFormData, description: e.target.value})} 
                    placeholder="Especialista em React e UI Design..." 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Foto do Membro</Label>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Avatar className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center font-black">
                      <AvatarImage src={devFormData.avatar || undefined} />
                      <AvatarFallback>{devFormData.initials || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-2 font-bold uppercase">Ideal: 200x200px (Quadrada)</p>
                      <div className="relative">
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2 relative">
                          {uploadingUserId === 'new-dev' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                          {devFormData.avatar ? 'Trocar Foto' : 'Subir Foto'}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const uploadId = devFormData.id || editingDev?.id || `dev-${Date.now()}`;
                              try {
                                setUploadingUserId('new-dev');
                                const url = await uploadUserAvatar(uploadId, file);
                                if (url) setDevFormData({...devFormData, avatar: url});
                              } catch (err) {
                                alert("Erro ao subir foto no modal.");
                              } finally {
                                setUploadingUserId(null);
                              }
                            }} 
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-12 font-black uppercase text-xs tracking-widest">
                    {editingDev ? 'Salvar Alterações' : 'Cadastrar Membro'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allParticipants?.map((dev) => (
              <div key={dev.id} className="flex flex-col p-4 rounded-xl border border-slate-100 bg-white/50 group relative hover:border-primary/30 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative group/avatar">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={dev.avatar || undefined} alt={dev.name} />
                      <AvatarFallback className="font-black text-xl">{dev.initials}</AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-full cursor-pointer transition-opacity">
                      {uploadingUserId === dev.id ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploadingUserId(dev.id);
                            const url = await uploadUserAvatar(dev.id, file);
                            if (url) {
                              // Sucesso
                            } else {
                              alert("Falha no upload da imagem. Verifique sua conexão ou o tamanho do arquivo.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Erro crítico no upload.");
                          } finally {
                            setUploadingUserId(null);
                          }
                        }} 
                      />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{dev.name}</h4>
                    <p className="text-[10px] font-black uppercase text-primary tracking-tighter">{dev.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">{dev.description}</p>
                
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-white border-slate-100 text-slate-400 hover:text-primary hover:border-primary/30"
                    onClick={() => {
                      setEditingDev(dev);
                      setDevFormData({
                        name: dev.name,
                        role: dev.role,
                        description: dev.description,
                        avatar: dev.avatar,
                        initials: dev.initials
                      });
                      setIsDevDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-white border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200"
                    onClick={() => handleDeleteDev(dev.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
