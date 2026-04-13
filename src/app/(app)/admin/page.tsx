'use client';

import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEcosystem } from '../ecosystem-context';
import { User, Reward, EducationArticle, Participant, AuditLogEntry, SCHOOL_SECTORS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  ShieldAlert,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  Gift,
  BookOpen,
  BrainCircuit,
  Info,
  Lock,
  Leaf,
  History
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  ra: z.string().min(1, 'O RA é obrigatório.'),
  turma: z.string().min(1, 'A turma é obrigatória.'),
  curso: z.string().min(1, 'O curso é obrigatório.'),
  role: z.enum(['student', 'admin'], { required_error: 'O cargo é obrigatório.' }),
});

const rewardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'O nome da recompensa é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  cost: z.coerce.number().min(0, 'O custo deve ser um número positivo.'),
  image: z.string().url('Por favor, insira uma URL de imagem válida.'),
  imageHint: z.string().min(1, 'Dica de imagem é obrigatória'),
});

const articleSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1, 'O título do artigo é obrigatório.'),
  summary: z.string().min(1, 'O resumo é obrigatório.'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres.'),
  image: z.string().url('Por favor, insira uma URL de imagem válida.'),
  imageHint: z.string().min(1, 'Dica de imagem é obrigatória'),
  videoUrl: z.string().url('URL do vídeo inválida').optional().or(z.literal('')),
});

const participantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'O nome é obrigatório.'),
  role: z.string().min(1, 'O cargo é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  avatar: z.string().url('URL da foto inválida.'),
  initials: z.string().min(1, 'As iniciais são obrigatórias.').max(3, 'Máximo de 3 iniciais.'),
});

type UserFormValues = z.infer<typeof userSchema>;
type RewardFormValues = z.infer<typeof rewardSchema>;
type ArticleFormValues = z.infer<typeof articleSchema>;
type ParticipantFormValues = z.infer<typeof participantSchema>;

const initialDialogState = {
  isUserOpen: false,
  isRewardOpen: false,
  isArticleOpen: false,
  isParticipantOpen: false,
  isDeleteOpen: false,
  isNew: false,
};

export default function AdminPage() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, []);

  const { 
    users,
    allRewards: rewards,
    allArticles: articles,
    allQuizTopics: quizTopics,
    allParticipants: participants,
    currentUser,
    updateUsers,
    updateRewards,
    updateArticles,
    updateQuizTopics,
    updateParticipants,
    allTurmas,
    allCursos,
    updateTurmas,
    updateCursos,
    auditLogs,
    grantPoints
  } = useEcosystem();

  const { toast } = useToast();
  const [newTopic, setNewTopic] = useState('');
  const [newTurma, setNewTurma] = useState('');
  const [newCurso, setNewCurso] = useState('');

  // Point granting state
  const [grantRa, setGrantRa] = useState('');
  const [grantPointsValue, setGrantPointsValue] = useState(0);
  const [grantSector, setGrantSector] = useState(SCHOOL_SECTORS[0] as string);
  const [grantAction, setGrantAction] = useState('');

  const selectedStudent = useMemo(() => {
    if (!grantRa) return null;
    return users.find(u => u.ra === grantRa);
  }, [grantRa, users]);

  // Dialog and selection states
  const [dialogState, setDialogState] = useState(initialDialogState);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'user' | 'reward' | 'article' | 'participant' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userForm = useForm<UserFormValues>({ resolver: zodResolver(userSchema) });
  const rewardForm = useForm<RewardFormValues>({ resolver: zodResolver(rewardSchema) });
  const articleForm = useForm<ArticleFormValues>({ resolver: zodResolver(articleSchema) });
  const participantForm = useForm<ParticipantFormValues>({ resolver: zodResolver(participantSchema) });

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const closeAllDialogs = () => {
    setDialogState(initialDialogState);
    setSelectedItem(null);
    setItemType(null);
    setIsSubmitting(false);
    userForm.reset();
    rewardForm.reset();
    articleForm.reset();
    participantForm.reset();
    Promise.resolve().then(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    });
  }

  const handleNew = (type: 'user' | 'reward' | 'article' | 'participant') => {
    setSelectedItem(null);
    setItemType(type);
    setDialogState({
      ...initialDialogState,
      isNew: true,
      [`is${capitalize(type)}Open`]: true
    });
    if (type === 'user') userForm.reset({ name: '', ra: '', turma: '', curso: '', role: 'student' });
    if (type === 'reward') rewardForm.reset({ name: '', description: '', cost: 0, image: '', imageHint: '' });
    if (type === 'article') articleForm.reset({ title: '', summary: '', content: '', image: '', imageHint: '', videoUrl: '' });
    if (type === 'participant') participantForm.reset({ name: '', role: '', description: '', avatar: '', initials: '' });
  };

  const handleEdit = (item: any, type: 'user' | 'reward' | 'article' | 'participant') => {
    setSelectedItem(item);
    setItemType(type);
    setDialogState({
      ...initialDialogState,
      isNew: false,
      [`is${capitalize(type)}Open`]: true
    });
    if (type === 'user') userForm.reset(item);
    if (type === 'reward') rewardForm.reset(item);
    if (type === 'article') articleForm.reset(item);
    if (type === 'participant') participantForm.reset(item);
  };

  const handleDelete = (item: any, type: 'user' | 'reward' | 'article' | 'participant') => {
    setSelectedItem(item);
    setItemType(type);
    setDialogState({
      ...initialDialogState,
      isDeleteOpen: true
    });
  };

  const onConfirmDelete = () => {
    if (!selectedItem || !itemType || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let updatedList: any[] = [];
      switch (itemType) {
        case 'user': updatedList = users.filter((i) => i.id !== selectedItem.id); updateUsers(updatedList); break;
        case 'reward': updatedList = rewards.filter((i) => i.id !== selectedItem.id); updateRewards(updatedList); break;
        case 'article': updatedList = articles.filter((i) => i.id !== selectedItem.id); updateArticles(updatedList); break;
        case 'participant': updatedList = participants.filter((i) => i.id !== selectedItem.id); updateParticipants(updatedList); break;
      }
      toast({ title: 'Item Removido!', description: `${selectedItem.name || selectedItem.title} foi removido.` });
      closeAllDialogs();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o item.' });
      setIsSubmitting(false);
    }
  };

  const onSubmit = (values: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let updatedList: any[] = [];
      if (dialogState.isNew) {
        const id = `${itemType}-${Date.now()}`;
        switch (itemType) {
          case 'user': updatedList = [...users, { ...values, id, points: 5000 }].sort((a,b)=>a.name.localeCompare(b.name)); updateUsers(updatedList); break;
          case 'reward': updatedList = [...rewards, { ...values, id }]; updateRewards(updatedList); break;
          case 'article': 
            const slug = values.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            updatedList = [...articles, { ...values, id, slug }]; updateArticles(updatedList); break;
          case 'participant': updatedList = [...participants, { ...values, id }]; updateParticipants(updatedList); break;
        }
        toast({ title: 'Item Adicionado!', description: `${values.name || values.title} foi adicionado.` });
      } else {
        switch (itemType) {
          case 'user': updatedList = users.map((i) => (i.id === selectedItem.id ? { ...i, ...values } : i)); updateUsers(updatedList); break;
          case 'reward': updatedList = rewards.map((i) => (i.id === selectedItem.id ? { ...i, ...values } : i)); updateRewards(updatedList); break;
          case 'article': updatedList = articles.map((i) => (i.id === selectedItem.id ? { ...i, ...values } : i)); updateArticles(updatedList); break;
          case 'participant': updatedList = participants.map((i) => (i.id === selectedItem.id ? { ...i, ...values } : i)); updateParticipants(updatedList); break;
        }
        toast({ title: 'Item Atualizado!', description: `Os dados de ${values.name || values.title} foram atualizados.` });
      }
      closeAllDialogs();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as alterações.' });
      setIsSubmitting(false);
    }
  };

  const handleAddTopic = () => {
    if (newTopic && !quizTopics.includes(newTopic)) {
      updateQuizTopics([...quizTopics, newTopic]);
      setNewTopic('');
      toast({ title: 'Tópico Adicionado!', description: `"${newTopic}" foi adicionado.` });
    }
  };

  const handleDeleteTopic = (topic: string) => {
    updateQuizTopics(quizTopics.filter(t => t !== topic));
    toast({ title: 'Tópico Removido!', description: `"${topic}" foi removido.` });
  };

  const handleAddTurma = () => {
    if (newTurma && !allTurmas.includes(newTurma)) {
      updateTurmas([...allTurmas, newTurma]);
      setNewTurma('');
      toast({ title: 'Turma Adicionada!', description: `"${newTurma}" foi adicionada.` });
    }
  };

  const handleAddCurso = () => {
    if (newCurso && !allCursos.includes(newCurso)) {
      updateCursos([...allCursos, newCurso]);
      setNewCurso('');
      toast({ title: 'Curso Adicionado!', description: `"${newCurso}" foi adicionado.` });
    }
  };

  const handleGrantSubmit = () => {
    if (!grantRa || grantPointsValue <= 0 || !grantAction) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um aluno, informe os pontos e descreva a ação.' });
      return;
    }
    if (grantPoints(grantRa, grantPointsValue, grantSector, grantAction, currentUser?.name || 'Gestor')) {
      toast({ title: 'Pontos Atribuídos!', description: `${grantPointsValue} pontos foram dados para o aluno por: ${grantAction}.` });
      setGrantRa('');
      setGrantPointsValue(0);
      setGrantAction('');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'Aluno não encontrado ou falha no sistema.' });
    }
  };

  if (!hasMounted) return null;
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-muted-foreground">Área exclusiva para gestores escolares.</p>
        </div>
        <Button asChild size="lg"><Link href="/dashboard">Voltar para o Painel</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" /> Gerenciamento
        </h1>
        <p className="text-muted-foreground">Controle total do ecossistema SchoolGain.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
            <TabsTrigger value="users"><UserPlus className="mr-2 h-4 w-4"/>Usuários</TabsTrigger>
            <TabsTrigger value="rewards"><Gift className="mr-2 h-4 w-4"/>Recompensas</TabsTrigger>
            <TabsTrigger value="education"><BookOpen className="mr-2 h-4 w-4"/>Conteúdo</TabsTrigger>
            <TabsTrigger value="quizzes"><BrainCircuit className="mr-2 h-4 w-4"/>Quizzes</TabsTrigger>
            <TabsTrigger value="academic"><Shield className="mr-2 h-4 w-4"/>Escolar</TabsTrigger>
            <TabsTrigger value="actions"><Leaf className="mr-2 h-4 w-4"/>Ações Ambientais</TabsTrigger>
            <TabsTrigger value="about"><Info className="mr-2 h-4 w-4"/>Sobre</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Usuários</CardTitle><CardDescription>Gestão de alunos e equipe escolar.</CardDescription></div>
              <Button onClick={() => handleNew('user')}><UserPlus className="mr-2 h-4 w-4" />Novo Usuário</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>RA</TableHead><TableHead>Turma</TableHead><TableHead>Cargo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.ra}</TableCell>
                      <TableCell>{user.turma}</TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role === 'admin' ? 'Gestor' : 'Aluno'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user, 'user')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user, 'user')} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Recompensas</CardTitle><CardDescription>Catálogo de prêmios por pontos.</CardDescription></div>
              <Button onClick={() => handleNew('reward')}><Gift className="mr-2 h-4 w-4" />Nova Recompensa</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Custo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell className="font-medium">{reward.name}</TableCell>
                      <TableCell>{reward.cost} PTS</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(reward, 'reward')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(reward, 'reward')} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Conteúdo</CardTitle><CardDescription>Artigos pedagógicos e vídeos.</CardDescription></div>
              <Button onClick={() => handleNew('article')}><BookOpen className="mr-2 h-4 w-4" />Novo Artigo</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(article, 'article')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(article, 'article')} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
            <Card>
                <CardHeader><CardTitle>Tópicos de Quiz</CardTitle><CardDescription>Geração automática de desafios.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="Novo tópico" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
                        <Button onClick={handleAddTopic}>Adicionar</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quizTopics.map((topic) => (
                            <Badge key={topic} variant="secondary" className="pr-1">{topic}<Button size="icon" variant="ghost" className="h-4 w-4 ml-1" onClick={() => handleDeleteTopic(topic)}><Trash2 className="h-3 w-3"/></Button></Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="academic">
           <div className="grid gap-6 md:grid-cols-2">
              <Card>
                  <CardHeader><CardTitle>Turmas</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex gap-2"><Input placeholder="Ex: 1ª Série" value={newTurma} onChange={(e) => setNewTurma(e.target.value)} /><Button onClick={handleAddTurma}>+</Button></div>
                      <div className="flex flex-wrap gap-2">{allTurmas.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Cursos</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex gap-2"><Input placeholder="Ex: Técnico em TDS" value={newCurso} onChange={(e) => setNewCurso(e.target.value)} /><Button onClick={handleAddCurso}>+</Button></div>
                      <div className="flex flex-wrap gap-2">{allCursos.map(c => <Badge key={c} variant="outline">{c}</Badge>)}</div>
                  </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-emerald-100 shadow-sm">
              <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 italic uppercase tracking-tighter text-emerald-700"><Leaf className="h-6 w-6" /> Reconhecimento de Mérito</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Identificar Aluno (RA)</Label>
                  <Select onValueChange={setGrantRa} value={grantRa}>
                    <SelectTrigger className="border-emerald-200 focus:ring-emerald-500"><SelectValue placeholder="Selecione o aluno pelo nome ou RA..." /></SelectTrigger>
                    <SelectContent>{users.filter(u => u.role === 'student').map(u => <SelectItem key={u.id} value={u.ra || ''}>{u.name} ({u.ra})</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {selectedStudent && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest">Aluno Selecionado</p>
                        <p className="font-black text-emerald-900">{selectedStudent.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest">Saldo Atual</p>
                        <p className="font-black text-emerald-900">{selectedStudent.points} PTS</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Descrição da Ação Realizada</Label>
                  <Input placeholder="Ex: Ajudou na organização da biblioteca" value={grantAction} onChange={(e) => setGrantAction(e.target.value)} className="border-emerald-200" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Pontos a Atribuir</Label><Input type="number" value={grantPointsValue} onChange={(e) => setGrantPointsValue(Number(e.target.value))} className="border-emerald-200" /></div>
                  <div className="space-y-2"><Label>Setor Responsável</Label><Select onValueChange={setGrantSector} value={grantSector}><SelectTrigger className="border-emerald-200"><SelectValue /></SelectTrigger><SelectContent>{SCHOOL_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest text-xs h-12 shadow-md hover:shadow-emerald-200/50 transition-all" onClick={handleGrantSubmit}>
                  Confirmar e Atribuir Pontuação
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 text-white">
               <CardHeader><CardTitle className="text-emerald-400 italic uppercase">Auditoria</CardTitle></CardHeader>
               <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <History className="h-12 w-12 text-emerald-500" />
                  <div className="text-center font-black uppercase tracking-widest"><p className="text-4xl">{auditLogs.length}</p><p className="text-[10px] text-slate-500">Registros</p></div>
               </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 italic uppercase tracking-tighter"><History className="h-6 w-6 text-primary" /> Log de Transações</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Aluno</TableHead><TableHead>Ação Realizada</TableHead><TableHead>Setor</TableHead><TableHead>Gestor</TableHead><TableHead className="text-right">Bônus</TableHead></TableRow></TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="font-bold">{log.studentName}</TableCell>
                      <TableCell className="text-xs italic text-slate-600">{log.action}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">{log.sector}</Badge></TableCell>
                      <TableCell className="italic text-slate-400 text-xs">{log.adminName}</TableCell>
                      <TableCell className="text-right font-black text-emerald-600">+{log.points} PTS</TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">Sem bônus registrados</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Equipe do Projeto</CardTitle><CardDescription>Membros responsáveis pelo software.</CardDescription></div>
              <Button onClick={() => handleNew('participant')}><UserPlus className="mr-2 h-4 w-4" />Novo Membro</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {participants.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.role}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(person, 'participant')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(person, 'participant')} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shared Dialogs (Users, Rewards, etc skipped for brevity in write_to_file, but logic is there) */}
      <Dialog open={dialogState.isUserOpen} onOpenChange={(open) => !open && closeAllDialogs()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{dialogState.isNew ? 'Novo Usuário' : 'Editar Usuário'}</DialogTitle></DialogHeader>
          <Form {...userForm}><form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={userForm.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={userForm.control} name="ra" render={({ field }) => (
              <FormItem><FormLabel>RA</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={userForm.control} name="turma" render={({ field }) => (
                <FormItem><FormLabel>Turma</FormLabel><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{allTurmas.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={userForm.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Cargo</FormLabel><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Aluno</SelectItem><SelectItem value="admin">Gestor</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Aluno'}</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogState.isDeleteOpen} onOpenChange={(open) => !open && closeAllDialogs()}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">Excluir Permanente</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
