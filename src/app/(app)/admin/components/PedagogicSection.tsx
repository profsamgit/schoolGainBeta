'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Plus, Trash2, Edit, MoreHorizontal, ArrowLeft, Camera, Loader2, Lock, Eye
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
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
import { EducationArticle, QuizTopic } from '@/types/ecosystem';

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
  handleAddTopic: () => void;
  handleDeleteTopic: (topic: QuizTopic) => void;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (open: boolean) => void;
  selectedItem: any;
  confirmDelete: () => void;
  uploadUserAvatar: (id: string, file: File) => Promise<string | null>;
  uploadingUserId: string | null;
  setUploadingUserId: (id: string | null) => void;
  securityPassword: string;
  setSecurityPassword: (val: string) => void;
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
  handleAddTopic,
  handleDeleteTopic,
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  selectedItem,
  confirmDelete,
  uploadUserAvatar,
  uploadingUserId,
  setUploadingUserId,
  securityPassword,
  setSecurityPassword
}: PedagogicSectionProps) {

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

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
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Tópicos de Quiz</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Geração automática de desafios para os alunos no ecossistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Novo tópico (ex: Reciclagem, Consumo Consciente, Biodiversidade, Energias Renováveis, Desmatamento)" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} className="h-12 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold" />
            <Button onClick={handleAddTopic} className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black rounded-xl shadow-lg transition-transform hover:scale-105"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {[...filteredQuizTopics].sort((a, b) => a.name.localeCompare(b.name)).map((topic, idx) => (
              <Badge key={`${topic.id}-${idx}`} className="bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[9px] px-3 py-1.5 rounded-xl hover:border-indigo-500/30 transition-all flex items-center gap-1.5 shadow-sm">
                {topic.name}
                <Button size="icon" variant="ghost" className="h-4 w-4 p-0 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full" onClick={() => handleDeleteTopic(topic)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-slate-800 dark:text-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Biblioteca de Conteúdo</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Artigos pedagógicos e links de apoio em vídeo.</CardDescription>
          </div>
          <Button onClick={() => handleNew('article')} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest gap-2 h-11 px-6 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-indigo-500/10">
            <BookOpen className="h-4 w-4" /> Novo Artigo
          </Button>
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
    </div>
  );
}
