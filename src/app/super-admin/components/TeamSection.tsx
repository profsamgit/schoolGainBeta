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
  Loader2,
  X 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl text-white rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-8 border-b border-white/5 bg-slate-950/40">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-lg font-black uppercase tracking-tight text-white">
              <Users className="h-5 w-5 text-indigo-400" />
              Equipe de Desenvolvimento
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">Gerencie as pessoas que aparecem na tela Sobre do sistema.</CardDescription>
          </div>
          <Dialog open={isDevDialogOpen} onOpenChange={(open) => {
            setIsDevDialogOpen(open);
            if (!open) {
              setEditingDev(null);
              setDevFormData({ id: '', name: '', role: '', description: '', avatar: '', initials: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                className="font-black uppercase text-xs tracking-widest gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 h-11 px-6 rounded-xl hover:scale-105 transition-transform"
                onClick={() => {
                  setEditingDev(null);
                  setDevFormData({ id: '', name: '', role: '', description: '', avatar: '', initials: '' });
                }}
              >
                <Plus className="h-4 w-4 text-white" /> Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[#0a0f24]/95 backdrop-blur-3xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-indigo-400">
                  {editingDev ? 'Editar Membro' : 'Novo Membro na Equipe'}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">Estes dados serão exibidos publicamente na página Sobre.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveDev} className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
                    <Input required value={devFormData.name} onChange={e => setDevFormData({...devFormData, name: e.target.value})} placeholder="João Silva" className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 h-11 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sigla</Label>
                    <Input required maxLength={2} value={devFormData.initials} onChange={e => setDevFormData({...devFormData, initials: e.target.value.toUpperCase()})} placeholder="JS" className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 h-11 font-black text-center" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo/Função</Label>
                  <Input required value={devFormData.role} onChange={e => setDevFormData({...devFormData, role: e.target.value})} placeholder="Líder Desenvolvedor" className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 h-11 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição Curta</Label>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-xl border border-white/10 bg-slate-950 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required 
                    value={devFormData.description} 
                    onChange={e => setDevFormData({...devFormData, description: e.target.value})} 
                    placeholder="Especialista em React e UI Design..." 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Foto do Membro</Label>
                  <div className="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-dashed border-white/10">
                    <Avatar className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black border border-white/5">
                      <AvatarImage src={devFormData.avatar || undefined} />
                      <AvatarFallback className="bg-indigo-600 text-white">{devFormData.initials || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Ideal: 200x200px (Quadrada)</p>
                      <div className="relative mt-2">
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2 relative border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                          {uploadingUserId === 'new-dev' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                          {devFormData.avatar ? 'Trocar Foto' : 'Subir Foto'}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const uploadId = devFormData.id || editingDev?.id || `PART-NEW-${Date.now()}`;
                              try {
                                setUploadingUserId('new-dev');
                                const url = await uploadUserAvatar(uploadId, file);
                                if (url) setDevFormData({...devFormData, avatar: url});
                              } catch (err) {
                                toast({ title: "Erro de Upload", description: "Não foi possível subir a foto. Tente novamente.", variant: "destructive" });
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
                  <Button type="submit" className="w-full h-12 font-black uppercase text-xs tracking-widest rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20">
                    {editingDev ? 'Salvar Alterações' : 'Cadastrar Membro'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allParticipants?.map((dev) => (
              <div key={dev.id} className="flex flex-col p-5 rounded-2xl border border-white/5 bg-slate-950/60 group relative hover:border-indigo-500/30 hover:shadow-indigo-500/5 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3.5">
                  <div className="relative group/avatar">
                    <Avatar className="h-14 w-14 border-2 border-indigo-500/20 shadow-md shadow-indigo-500/5 rounded-xl">
                      <AvatarImage src={dev.avatar || undefined} alt={dev.name} className="object-cover" />
                      <AvatarFallback className="font-black text-xl bg-indigo-500/10 text-indigo-400">{dev.initials}</AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 rounded-xl cursor-pointer transition-opacity border border-indigo-500/30">
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
                              toast({ title: "Falha no Upload", description: "Verifique sua conexão ou o tamanho do arquivo.", variant: "destructive" });
                            }
                          } catch (err) {
                            console.error(err);
                            toast({ title: "Erro Crítico", description: "Ocorreu um erro inesperado durante o upload.", variant: "destructive" });
                          } finally {
                            setUploadingUserId(null);
                          }
                        }} 
                      />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-tight">{dev.name}</h4>
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-0.5">{dev.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400 line-clamp-3 leading-relaxed font-medium flex-1">{dev.description}</p>
                
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-slate-950 border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 rounded-lg"
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
                    className="h-8 w-8 bg-slate-950 border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 rounded-lg"
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
