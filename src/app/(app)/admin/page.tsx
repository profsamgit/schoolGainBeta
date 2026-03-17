'use client';

import { useState, useEffect } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  leaderboardData,
  mockAdmin,
  rewards as initialRewards,
  educationArticles as initialArticles,
  quizTopics as initialQuizTopics,
  participantsData as initialParticipants,
} from '@/lib/data';
import type { User, Reward, EducationArticle, Participant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  Gift,
  BookOpen,
  BrainCircuit,
  Info,
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

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  ra: z.string().min(1, 'O RA é obrigatório.'),
  turma: z.string().min(1, 'A turma é obrigatória.'),
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
  }, []);

  const { toast } = useToast();
  // State for all managed items
  const [users, setUsers] = useState<Omit<User, 'email' | 'avatar'>[]>([...leaderboardData, mockAdmin]);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [articles, setArticles] = useState<EducationArticle[]>(initialArticles);
  const [quizTopics, setQuizTopics] = useState<string[]>(initialQuizTopics);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [newTopic, setNewTopic] = useState('');

  // Dialog and selection states
  const [dialogState, setDialogState] = useState(initialDialogState);
  const [selectedItem, setSelectedItem] = useState<User | Reward | EducationArticle | Participant | null>(null);
  const [itemType, setItemType] = useState<'user' | 'reward' | 'article' | 'participant' | null>(null);

  const userForm = useForm<UserFormValues>({ resolver: zodResolver(userSchema) });
  const rewardForm = useForm<RewardFormValues>({ resolver: zodResolver(rewardSchema) });
  const articleForm = useForm<ArticleFormValues>({ resolver: zodResolver(articleSchema) });
  const participantForm = useForm<ParticipantFormValues>({ resolver: zodResolver(participantSchema) });


  // Generic handlers
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const closeAllDialogs = () => {
    setDialogState(initialDialogState);
    setSelectedItem(null);
    setItemType(null);
  }

  const handleNew = (type: 'user' | 'reward' | 'article' | 'participant') => {
    setSelectedItem(null);
    setItemType(type);
    setDialogState({
      ...initialDialogState,
      isNew: true,
      [`is${capitalize(type)}Open`]: true
    });
    if (type === 'user') userForm.reset({ name: '', ra: '', turma: '', role: 'student' });
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
    if (!selectedItem || !itemType) return;
    switch (itemType) {
      case 'user':
        setUsers(users.filter((i) => i.id !== selectedItem.id));
        break;
      case 'reward':
        setRewards(rewards.filter((i) => i.id !== selectedItem.id));
        break;
      case 'article':
        setArticles(articles.filter((i) => i.id !== selectedItem.id));
        break;
      case 'participant':
        setParticipants(participants.filter((i) => i.id !== selectedItem.id));
        break;
    }
    toast({ title: 'Item Removido!', description: `${(selectedItem as any).name || (selectedItem as any).title} foi removido.` });
    closeAllDialogs();
  };

  function onSubmit(values: any) {
    if (dialogState.isNew) {
      // Create new item
      const id = `${itemType}-${Date.now()}`;
      switch (itemType) {
        case 'user':
          setUsers([...users, { ...values, id, points: 0, level: 'Bronze' }].sort((a,b)=>a.name.localeCompare(b.name)));
          break;
        case 'reward':
          setRewards([...rewards, { ...values, id }]);
          break;
        case 'article':
          const slug = values.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          setArticles([...articles, { ...values, id, slug }]);
          break;
        case 'participant':
            setParticipants([...participants, { ...values, id }]);
            break;
      }
      toast({ title: 'Item Adicionado!', description: `${values.name || values.title} foi adicionado.` });
    } else {
      // Update existing item
      switch (itemType) {
        case 'user':
          setUsers(users.map((i) => (i.id === values.id ? { ...i, ...values } : i)));
          break;
        case 'reward':
          setRewards(rewards.map((i) => (i.id === values.id ? { ...i, ...values } : i)));
          break;
        case 'article':
          setArticles(articles.map((i) => (i.id === values.id ? { ...i, ...values } : i)));
          break;
        case 'participant':
            setParticipants(participants.map((i) => (i.id === values.id ? { ...i, ...values } : i)));
            break;
      }
      toast({ title: 'Item Atualizado!', description: `Os dados de ${values.name || values.title} foram atualizados.` });
    }
    closeAllDialogs();
  }

  const handleAddTopic = () => {
    if (newTopic && !quizTopics.includes(newTopic)) {
      setQuizTopics([...quizTopics, newTopic]);
      setNewTopic('');
      toast({ title: 'Tópico Adicionado!', description: `"${newTopic}" foi adicionado à lista.` });
    }
  };

  const handleDeleteTopic = (topicToDelete: string) => {
    setQuizTopics(quizTopics.filter(topic => topic !== topicToDelete));
    toast({ title: 'Tópico Removido!', description: `"${topicToDelete}" foi removido da lista.` });
  };
  
  if (!hasMounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Gerenciamento
        </h1>
        <p className="text-muted-foreground">
          Gerencie todos os aspectos do SchoolGain aqui.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
            <TabsTrigger value="users"><UserPlus className="mr-2 h-4 w-4"/>Usuários</TabsTrigger>
            <TabsTrigger value="rewards"><Gift className="mr-2 h-4 w-4"/>Recompensas</TabsTrigger>
            <TabsTrigger value="education"><BookOpen className="mr-2 h-4 w-4"/>Conteúdo</TabsTrigger>
            <TabsTrigger value="quizzes"><BrainCircuit className="mr-2 h-4 w-4"/>Quizzes</TabsTrigger>
            <TabsTrigger value="about"><Info className="mr-2 h-4 w-4"/>Sobre</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>Adicione, edite ou remova usuários do sistema.</CardDescription>
              </div>
              <Button onClick={() => handleNew('user')}><UserPlus className="mr-2 h-4 w-4" />Cadastrar Usuário</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>RA</TableHead><TableHead>Turma</TableHead><TableHead>Cargo</TableHead><TableHead className="text-right">Pontos</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.ra}</TableCell>
                      <TableCell>{user.turma}</TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role === 'admin' ? 'Gestor' : 'Aluno'}</Badge></TableCell>
                      <TableCell className="text-right">{user.points}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
              <div>
                <CardTitle>Gerenciamento de Recompensas</CardTitle>
                <CardDescription>Adicione, edite ou remova prêmios do catálogo.</CardDescription>
              </div>
              <Button onClick={() => handleNew('reward')}><Gift className="mr-2 h-4 w-4" />Adicionar Recompensa</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell className="font-medium">{reward.name}</TableCell>
                      <TableCell>{reward.description}</TableCell>
                      <TableCell className="text-right">{reward.cost} pontos</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
              <div>
                <CardTitle>Gerenciamento de Conteúdo</CardTitle>
                <CardDescription>Adicione, edite ou remova artigos educacionais.</CardDescription>
              </div>
              <Button onClick={() => handleNew('article')}><BookOpen className="mr-2 h-4 w-4" />Adicionar Artigo</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Resumo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell className="max-w-sm truncate">{article.summary}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
                <CardHeader>
                    <CardTitle>Gerenciamento de Tópicos de Quiz</CardTitle>
                    <CardDescription>Adicione ou remova tópicos para a geração de quizzes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Adicionar novo tópico" 
                            value={newTopic} 
                            onChange={(e) => setNewTopic(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                        />
                        <Button onClick={handleAddTopic}>Adicionar</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quizTopics.map((topic) => (
                            <Badge key={topic} variant="secondary" className="text-base py-1 pl-3 pr-1">
                                {topic}
                                <Button size="icon" variant="ghost" className="h-5 w-5 ml-1" onClick={() => handleDeleteTopic(topic)}>
                                    <Trash2 className="h-3 w-3"/>
                                </Button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento da Página "Sobre"</CardTitle>
                <CardDescription>Adicione ou remova membros da equipe do projeto.</CardDescription>
              </div>
              <Button onClick={() => handleNew('participant')}><UserPlus className="mr-2 h-4 w-4" />Adicionar Membro</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {participants.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.role}</TableCell>
                      <TableCell className="max-w-sm truncate">{person.description}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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

      {/* User Dialog */}
      <Dialog open={dialogState.isUserOpen} onOpenChange={(isOpen) => !isOpen && closeAllDialogs()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogState.isNew ? 'Cadastrar Novo Usuário' : 'Editar Usuário'}</DialogTitle>
          </DialogHeader>
          <Form {...userForm}><form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={userForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem> )}/>
              <div className="grid grid-cols-2 gap-4">
                  <FormField control={userForm.control} name="ra" render={({ field }) => ( <FormItem><FormLabel>RA</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={userForm.control} name="turma" render={({ field }) => ( <FormItem><FormLabel>Turma</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem> )}/>
              </div>
              <FormField control={userForm.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Cargo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="student">Aluno</SelectItem><SelectItem value="admin">Gestor</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>

      {/* Reward Dialog */}
      <Dialog open={dialogState.isRewardOpen} onOpenChange={(isOpen) => !isOpen && closeAllDialogs()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogState.isNew ? 'Adicionar Nova Recompensa' : 'Editar Recompensa'}</DialogTitle>
          </DialogHeader>
          <Form {...rewardForm}><form onSubmit={rewardForm.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={rewardForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome da Recompensa</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={rewardForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={rewardForm.control} name="cost" render={({ field }) => ( <FormItem><FormLabel>Custo (em pontos)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={rewardForm.control} name="image" render={({ field }) => ( <FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input placeholder="https://picsum.photos/seed/example/600/400" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={rewardForm.control} name="imageHint" render={({ field }) => ( <FormItem><FormLabel>Dica de Imagem (para IA)</FormLabel><FormControl><Input placeholder="ex: livro natureza" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
      
      {/* Article Dialog */}
      <Dialog open={dialogState.isArticleOpen} onOpenChange={(isOpen) => !isOpen && closeAllDialogs()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogState.isNew ? 'Adicionar Novo Artigo' : 'Editar Artigo'}</DialogTitle>
          </DialogHeader>
          <Form {...articleForm}><form onSubmit={articleForm.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <FormField control={articleForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={articleForm.control} name="summary" render={({ field }) => ( <FormItem><FormLabel>Resumo</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={articleForm.control} name="content" render={({ field }) => ( <FormItem><FormLabel>Conteúdo</FormLabel><FormControl><Textarea className="min-h-48" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={articleForm.control} name="image" render={({ field }) => ( <FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input placeholder="https://picsum.photos/seed/example/800/450" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={articleForm.control} name="imageHint" render={({ field }) => ( <FormItem><FormLabel>Dica de Imagem (para IA)</FormLabel><FormControl><Input placeholder="ex: lixeiras coloridas" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={articleForm.control} name="videoUrl" render={({ field }) => ( <FormItem><FormLabel>URL do Vídeo (Opcional)</FormLabel><FormControl><Input placeholder="https://www.youtube.com/embed/..." {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <DialogFooter className="sticky bottom-0 bg-background pt-4"><Button type="submit">Salvar</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
      
      {/* Participant Dialog */}
      <Dialog open={dialogState.isParticipantOpen} onOpenChange={(isOpen) => !isOpen && closeAllDialogs()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogState.isNew ? 'Adicionar Novo Membro' : 'Editar Membro'}</DialogTitle>
          </DialogHeader>
          <Form {...participantForm}><form onSubmit={participantForm.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={participantForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={participantForm.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={participantForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={participantForm.control} name="avatar" render={({ field }) => ( <FormItem><FormLabel>URL da Foto</FormLabel><FormControl><Input placeholder="https://picsum.photos/seed/example/200/200" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={participantForm.control} name="initials" render={({ field }) => ( <FormItem><FormLabel>Iniciais</FormLabel><FormControl><Input placeholder="ex: SC" {...field}/></FormControl><FormMessage /></FormItem> )}/>
            <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Alert */}
      <AlertDialog open={dialogState.isDeleteOpen} onOpenChange={(isOpen) => !isOpen && closeAllDialogs()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá remover permanentemente o item
              <span className="font-bold"> "{(selectedItem as any)?.name || (selectedItem as any)?.title}" </span>
              do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAllDialogs}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
