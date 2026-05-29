'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Plus, Trash2, Edit, MoreHorizontal, ArrowLeft, Camera, Loader2, Lock, Eye, Sparkles
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EducationArticle, QuizTopic, AuditLogEntry } from '@/types/ecosystem';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { generateNewAIArticle } from '@/app/(app)/student/education/actions';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

interface PedagogicSectionProps {
  articles: EducationArticle[];
  quizTopics: QuizTopic[];
  viewMode: 'list' | 'form';
  itemType: 'user' | 'reward' | 'article' | 'turma' | 'curso' | 'cargo' | 'setor' | null;
  isNew: boolean;
  isSubmitting: boolean;
  articleForm: any;
  onSubmit: (values: any) => void;
  handleEdit: (item: any, type: any) => void;
  handleDelete: (item: any, type: any) => void;
  handleNew: (type: any) => void;
  closeAllForms: () => void;
  articleSearch: string;
  setArticleSearch: (search: string) => void;
  newTopic: string;
  setNewTopic: (topic: string) => void;
  newTopicCoins: number;
  setNewTopicCoins: (val: number) => void;
  handleAddTopic: () => void;
  handleDeleteTopic: (topic: QuizTopic) => void;
  handleEditTopic: (topic: QuizTopic, newName: string, newCoins: number) => Promise<void>;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (open: boolean) => void;
  selectedItem: any;
  confirmDelete: () => void;
  uploadUserAvatar: (id: string, file: File) => Promise<string | null>;
  uploadingUserId: string | null;
  setUploadingUserId: (id: string | null) => void;
  securityPassword: string;
  setSecurityPassword: (val: string) => void;
  auditLogs: AuditLogEntry[];
}

export function PedagogicSection({
  articles,
  quizTopics,
  viewMode,
  itemType,
  isNew,
  isSubmitting,
  articleForm,
  onSubmit,
  handleEdit,
  handleDelete,
  handleNew,
  closeAllForms,
  articleSearch,
  setArticleSearch,
  newTopic,
  setNewTopic,
  newTopicCoins,
  setNewTopicCoins,
  handleAddTopic,
  handleDeleteTopic,
  handleEditTopic,
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  selectedItem,
  confirmDelete,
  uploadUserAvatar,
  uploadingUserId,
  setUploadingUserId,
  securityPassword,
  setSecurityPassword,
  auditLogs
}: PedagogicSectionProps) {

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const { currentUser } = useEcosystem();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingTopic, setEditingTopic] = useState<QuizTopic | null>(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicCoins, setEditTopicCoins] = useState(10);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizSearch, setQuizSearch] = useState('');

  const fetchQuizzes = async () => {
    try {
      const qSnap = await getDocs(collection(db, "quizzes"));
      const list: any[] = [];
      qSnap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQuizzes(list);
    } catch (err) {
      console.error("Error fetching quizzes for admin:", err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteDoc(doc(db, "quizzes", quizId));
      toast({ title: "Quiz Removido", description: "O quiz foi excluído com sucesso da biblioteca." });
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (err) {
      console.error("Error deleting quiz:", err);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao excluir quiz." });
    }
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => 
      (q.quizTitle || '').toLowerCase().includes(quizSearch.toLowerCase()) ||
      (q.topic || '').toLowerCase().includes(quizSearch.toLowerCase())
    );
  }, [quizzes, quizSearch]);

  const pedagogicHistory = useMemo(() => {
    return auditLogs.filter(log => log.action === 'ARTICLE_READ' || log.action === 'QUIZ_COMPLETED');
  }, [auditLogs]);

  const handleGenerateAI = async () => {
    const targetSchoolId = currentUser?.schoolId;
    if (!targetSchoolId) {
      toast({
        variant: 'destructive',
        title: 'Unidade não identificada',
        description: 'Não foi possível detectar a unidade escolar logada.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const article = await generateNewAIArticle(targetSchoolId);
      if (article) {
        // Salva o artigo no Firestore usando as credenciais do cliente autenticado
        await setDoc(doc(db, "articles", article.id), article);
        toast({
          title: 'Artigo Gerado!',
          description: `O artigo "${article.title}" foi criado pela IA do Gemini e salvo com sucesso.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro de Geração',
          description: 'A IA do Gemini não conseguiu responder no momento.',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Erro Inesperado',
        description: 'Falha ao processar ou salvar o artigo gerado pela IA.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredArticles = useMemo(() => {
    return articles
      .filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [articles, articleSearch]);

  const filteredQuizTopics = useMemo(() => {
    return [...quizTopics].sort((a, b) => a.name.localeCompare(b.name));
  }, [quizTopics]);

  if (viewMode === 'form' && itemType === 'article') {
    return (
      <Card className="border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl text-slate-800 dark:text-white animate-in fade-in duration-300">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400">{isNew ? 'Novo Artigo' : 'Editar Artigo'}</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Conteúdo educativo para os alunos.</CardDescription>
          </div>
          <Button variant="ghost" onClick={closeAllForms} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl gap-2 font-bold text-xs uppercase"><ArrowLeft className="h-4 w-4" />Voltar</Button>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...articleForm}><form onSubmit={articleForm.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={articleForm.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Título</FormLabel>
                <FormControl><Input {...field} className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={articleForm.control} name="summary" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Resumo (aparece no card)</FormLabel>
                <FormControl><Textarea {...field} className="h-20 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={articleForm.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Conteúdo do Artigo</FormLabel>
                <FormControl><Textarea {...field} className="min-h-[200px] bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Imagem de Capa</Label>
                <div className="flex items-center gap-4">
                  <div className="relative group/avatar h-24 w-24 rounded-xl border-4 border-slate-100 dark:border-slate-950 bg-slate-200 dark:bg-slate-900 overflow-hidden shadow-lg shrink-0">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={articleForm.watch('image')} className="object-cover" />
                      <AvatarFallback className="text-2xl font-black bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                        {articleForm.watch('title')?.charAt(0) || '📄'}
                      </AvatarFallback>
                    </Avatar>
                    {articleForm.watch('image') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          onClick={() => setPreviewAvatar(articleForm.watch('image'))} 
                          className="cursor-pointer hover:scale-110 transition-transform" 
                          title="Visualizar Foto"
                        >
                          <Eye className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Resolução ideal: 200x200px (Quadrada).</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="relative overflow-hidden bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-wider h-10 px-4 flex-1"
                        disabled={uploadingUserId === 'new-article'}
                      >
                        {uploadingUserId === 'new-article' ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-400" /> Subindo...</>
                        ) : (
                          <><Camera className="mr-2 h-4 w-4" /> Subir Capa</>
                        )}
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const articleId = articleForm.getValues('id');
                            try {
                              setUploadingUserId('new-article');
                              const url = await uploadUserAvatar(articleId, file);
                              if (url) articleForm.setValue('image', url);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setUploadingUserId(null);
                            }
                          }}
                        />
                      </Button>
                      {articleForm.watch('image') && (
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl h-10 w-10 p-0 flex items-center justify-center"
                          title="Visualizar Foto"
                          onClick={() => setPreviewAvatar(articleForm.watch('image'))}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <FormField control={articleForm.control} name="imageHint" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Emoji ou Ícone de Destaque</FormLabel>
                  <FormControl><Input {...field} placeholder="Ex: 🌱" className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <FormField control={articleForm.control} name="videoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">URL do Vídeo (Opcional)</FormLabel>
                <FormControl><Input {...field} placeholder="https://youtube.com/..." className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 space-y-2 mt-6 animate-pulse">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lock className="h-4 w-4" />
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
                required
                value={securityPassword}
                onChange={(e) => setSecurityPassword(e.target.value)}
                placeholder="Digite sua senha de segurança ou Master"
                className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-amber-500/50 font-bold"
              />
              <p className="text-[9px] text-amber-600/70 dark:text-amber-500/60 font-medium italic">Autorização necessária para publicar alterações pedagógicas.</p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200/60 dark:border-white/5 mt-6">
              <Button type="button" variant="ghost" onClick={closeAllForms} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl shadow-xl transition-all">{isSubmitting ? 'Salvando...' : 'Publicar Artigo'}</Button>
            </div>
          </form></Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Guia Informativo de Integração Pedagógica */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-6 text-slate-800 dark:text-white backdrop-blur-xl shadow-lg">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Guia de Integração Pedagógica (IA + Conteúdo)</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
              O ecossistema pedagógico da escola é 100% dinâmico e gira em torno dos seus <strong>Tópicos</strong> cadastrados abaixo:
            </p>
            <ul className="text-[11px] text-slate-650 dark:text-slate-350 space-y-1.5 list-disc pl-4 mt-2 font-semibold">
              <li><strong className="text-slate-800 dark:text-white">Tópicos</strong>: Representam os temas de sustentabilidade (ex: <i>"Reciclagem"</i>). Cadastre-os para guiar a IA.</li>
              <li><strong className="text-slate-800 dark:text-white">Quizzes</strong>: Gerados de forma autônoma pela IA do Gemini sob demanda para os alunos, baseando-se estritamente nos Tópicos ativos da sua escola.</li>
              <li><strong className="text-slate-800 dark:text-white">Artigos de IA</strong>: Ao clicar em <i>"Gerar com IA"</i>, o sistema gera instantaneamente um artigo estruturado no tema de um dos tópicos ativos cadastrados pela escola.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-hidden relative bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/20 text-indigo-900 dark:text-white rounded-[2rem] shadow-2xl p-6 backdrop-blur-xl">
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-600 dark:text-indigo-400 opacity-80">Conteúdo Educativo</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-3 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{filteredArticles.length}</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">ARTIGOS</span>
            </div>
            <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12 pointer-events-none"><BookOpen className="h-32 w-32" /></div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden relative bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-[2rem] shadow-2xl p-6 backdrop-blur-xl hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all">
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 dark:text-slate-400">Banco de Desafios</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{quizTopics.length}</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">TÓPICOS</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden relative bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-[2rem] shadow-2xl p-6 backdrop-blur-xl hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all">
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 dark:text-slate-400">Base de Vídeos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{filteredArticles.filter(a => a.videoUrl).length}</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">MULTIMÍDIA</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-slate-800 dark:text-white">
        <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Tópicos Ambientais</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Temas que a IA utilizará como base para criar Quizzes e Artigos automaticamente para os alunos.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2 items-center">
            <Input placeholder="Novo tópico (ex: Reciclagem, Consumo Consciente, Biodiversidade, Energias Renováveis, Desmatamento)" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} className="flex-grow h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" />
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 h-12 px-3 rounded-xl">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Coins:</span>
              <Input type="number" min={1} max={100} value={newTopicCoins} onChange={(e) => setNewTopicCoins(Number(e.target.value))} className="w-16 h-8 bg-white dark:bg-slate-955 border border-slate-250 dark:border-white/10 text-slate-800 dark:text-white rounded-lg focus:border-indigo-500/50 font-black text-center p-0" />
            </div>
            <Button onClick={handleAddTopic} className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black rounded-xl shadow-lg transition-transform hover:scale-105"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {[...filteredQuizTopics].sort((a, b) => a.name.localeCompare(b.name)).map((topic, idx) => {
              const baseCoins = topic.coinsValue !== undefined ? topic.coinsValue : 10;
              return (
                <Badge key={`${topic.id}-${idx}`} className="bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-650 dark:text-indigo-400 font-bold uppercase text-[9px] px-3 py-1.5 rounded-xl hover:border-indigo-500/30 transition-all flex items-center gap-2 shadow-sm">
                  {topic.name} <span className="bg-indigo-500/25 dark:bg-indigo-550/30 text-indigo-705 dark:text-indigo-300 px-1.5 py-0.5 rounded font-black">₵{baseCoins}</span>
                  <div className="flex items-center gap-1 ml-1 border-l border-indigo-250 dark:border-indigo-500/30 pl-1.5">
                    <Button size="icon" variant="ghost" className="h-4 w-4 p-0 text-slate-400 dark:text-slate-500 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full" onClick={() => { setEditingTopic(topic); setEditTopicName(topic.name); setEditTopicCoins(topic.coinsValue !== undefined ? topic.coinsValue : 10); }} title="Editar Tópico">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-4 w-4 p-0 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full" onClick={() => handleDeleteTopic(topic)} title="Excluir Tópico">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-slate-800 dark:text-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Biblioteca de Artigos</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Artigos criados manualmente ou gerados via IA com base nos Tópicos.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateAI} 
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white border border-emerald-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-11 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-emerald-500/10 shadow-emerald-500/5"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
              ) : (
                <><Sparkles className="h-4 w-4 text-amber-300" /> Gerar com IA</>
              )}
            </Button>
            <Button onClick={() => handleNew('article')} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-11 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-indigo-500/10">
              <BookOpen className="h-4 w-4" /> Novo Artigo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block ml-1">Pesquisar Artigo</Label>
            <Input placeholder="Buscar por título..." value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" />
          </div>

          <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-950/50 overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200/60 dark:border-white/10">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Título</TableHead>
                  <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.length > 0 ? filteredArticles.map((article) => (
                  <TableRow key={article.id} className={isDeleteConfirmOpen && selectedItem?.id === article.id ? 'bg-rose-100/50 dark:bg-rose-950/20 hover:bg-rose-200/50 dark:hover:bg-rose-950/30' : 'hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors group'}>
                    <TableCell className="font-bold text-sm text-slate-700 dark:text-slate-200 px-6 py-4 flex items-center gap-3">
                      <div className="relative group/avatar">
                        <Avatar className="h-10 w-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 group-hover/avatar:border-indigo-500/50 transition-all overflow-hidden shadow-md shrink-0">
                          <AvatarImage src={article.image || undefined} className="object-cover" />
                          <AvatarFallback className="text-xs font-black bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                            {article.imageHint || '📄'}
                          </AvatarFallback>
                        </Avatar>
                        {article.image && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 rounded-xl transition-opacity">
                            <button 
                              type="button" 
                              onClick={() => setPreviewAvatar(article.image!)} 
                              className="cursor-pointer hover:scale-110 transition-transform" 
                              title="Visualizar Capa"
                            >
                              <Eye className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span>{article.title}</span>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl shadow-2xl p-1 min-w-[120px]">
                          <DropdownMenuItem onClick={() => handleEdit(article, 'article')} className="hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-white cursor-pointer font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg"><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(article, 'article')} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-12 text-slate-400 uppercase text-[10px] font-black tracking-widest italic">Nenhum artigo encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* BIBLIOTECA DE QUIZZES GERADOS (Gestão de Quizzes) */}
      <Card className="border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-slate-800 dark:text-white">
        <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Biblioteca de Quizzes</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Quizzes gerados automaticamente via IA ou cadastrados pela comunidade.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block ml-1">Pesquisar Quiz</Label>
            <Input placeholder="Buscar por título ou tópico..." value={quizSearch} onChange={(e) => setQuizSearch(e.target.value)} className="h-12 bg-white dark:bg-slate-955 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" />
          </div>

          <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-950/50 overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200/60 dark:border-white/10">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Título / Tópico</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Dificuldade</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Questões</TableHead>
                  <TableHead className="text-right px-6 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingQuizzes ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                    </TableCell>
                  </TableRow>
                ) : filteredQuizzes.length > 0 ? filteredQuizzes.map((quiz) => (
                  <TableRow key={quiz.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors group">
                    <TableCell className="font-bold text-sm text-slate-700 dark:text-slate-200 px-6 py-4">
                      <div>{quiz.quizTitle || 'Quiz sem Título'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tópico: <span className="text-indigo-500">{quiz.topic}</span></div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "uppercase text-[8px] font-black tracking-widest px-2.5 py-1 rounded-xl border",
                        quiz.difficulty === 'easy' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                        quiz.difficulty === 'medium' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20"
                      )}>
                        {quiz.difficulty === 'easy' ? 'Fácil' : quiz.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-350">
                      {quiz.numberOfQuestions} Questões
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl shadow-2xl p-1 min-w-[120px]">
                          <DropdownMenuItem onClick={() => handleDeleteQuiz(quiz.id)} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-450 uppercase text-[10px] font-black tracking-widest italic">Nenhum quiz encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* HISTÓRICO PEDAGÓGICO DE LEITURAS E QUIZZES */}
      <Card className="border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-slate-800 dark:text-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Histórico de Atividades dos Alunos</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Registro em tempo real de leituras de artigos e conclusões de quizzes efetuados pelos alunos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-950/50 overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200/60 dark:border-white/10">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 px-6 h-12">Data / Hora</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Aluno</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12">Atividade</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 h-12 text-right px-6">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedagogicHistory.length > 0 ? (
                  pedagogicHistory.map((log) => (
                    <TableRow key={log.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 border-b border-slate-200/60 dark:border-white/5 transition-colors">
                      <TableCell className="text-[11px] text-slate-500 px-6 py-4">{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="font-bold text-slate-700 dark:text-slate-200">{log.studentName || 'Aluno'}</TableCell>
                      <TableCell className="text-xs text-slate-650 dark:text-slate-350 font-medium">{log.details}</TableCell>
                      <TableCell className="text-right px-6">
                        <Badge className={`uppercase text-[8px] font-black tracking-widest px-2.5 py-1 rounded-xl border ${
                          log.action === 'ARTICLE_READ'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        }`}>
                          {log.action === 'ARTICLE_READ' ? 'Leitura' : 'Quiz'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest italic">Nenhuma atividade pedagógica registrada recentemente.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIÁLOGO DE PREVISÃO DE CAPA DO ARTIGO */}
      <Dialog open={!!previewAvatar} onOpenChange={(open) => !open && setPreviewAvatar(null)}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-[#0a0f24]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[2rem] p-6 shadow-2xl flex flex-col items-center justify-center gap-4">
          <DialogHeader className="w-full text-center">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Visualizar Capa</DialogTitle>
          </DialogHeader>
          <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-indigo-500/20 dark:border-indigo-500/30 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-center">
            {previewAvatar ? (
              <img src={previewAvatar} alt="Preview Cover" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-slate-500">Nenhuma imagem cadastrada</span>
            )}
          </div>
          <DialogFooter className="w-full pt-2">
            <Button type="button" onClick={() => setPreviewAvatar(null)} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO PARA RENOMEAR TÓPICO AMBIENTAL */}
      <Dialog open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-indigo-605 dark:text-indigo-400 flex items-center gap-2">
              <Edit className="h-5 w-5" /> Editar Tópico Ambiental
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Altere o nome e o valor em moedas (Coins) do tópico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nome do Tópico</Label>
              <Input
                type="text"
                value={editTopicName}
                onChange={(e) => setEditTopicName(e.target.value)}
                className="h-11 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-white/5 rounded-xl font-bold text-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Valor de Moedas Base (Coins)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={editTopicCoins}
                onChange={(e) => setEditTopicCoins(Number(e.target.value))}
                className="h-11 bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-white/5 rounded-xl font-bold text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditingTopic(null)} className="rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (editingTopic && editTopicName.trim()) {
                  await handleEditTopic(editingTopic, editTopicName.trim(), editTopicCoins);
                  setEditingTopic(null);
                }
              }} 
              className="bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider px-6 h-11"
              disabled={!editTopicName.trim() || editTopicCoins <= 0}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
