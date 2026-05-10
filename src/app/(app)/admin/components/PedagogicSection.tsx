'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Plus, Trash2, Edit, MoreHorizontal, ArrowLeft, Camera, Loader2, Lock 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { EducationArticle, QuizTopic } from '@/lib/types';

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

  const filteredArticles = useMemo(() => {
    return articles.filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase()));
  }, [articles, articleSearch]);

  const filteredQuizTopics = quizTopics; // Já filtrado por schoolId no parent

  if (viewMode === 'form' && itemType === 'article') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
          <div><CardTitle>{isNew ? 'Novo Artigo' : 'Editar Artigo'}</CardTitle><CardDescription>Conteúdo educativo para os alunos.</CardDescription></div>
          <Button variant="ghost" onClick={closeAllForms}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...articleForm}><form onSubmit={articleForm.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={articleForm.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} className="bg-white text-lg font-bold" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={articleForm.control} name="summary" render={({ field }) => (
              <FormItem><FormLabel>Resumo (aparece no card)</FormLabel><FormControl><Textarea {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={articleForm.control} name="content" render={({ field }) => (
              <FormItem><FormLabel>Conteúdo do Artigo</FormLabel><FormControl><Textarea {...field} className="min-h-[200px] bg-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Imagem de Capa</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24 rounded-xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                    <AvatarImage src={articleForm.watch('image')} className="object-cover" />
                    <AvatarFallback className="text-2xl font-black bg-slate-900 text-white">
                      {articleForm.watch('title')?.charAt(0) || '📄'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-medium text-slate-500">Resolução ideal: 200x200px (Quadrada).</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="relative overflow-hidden group/upload"
                      disabled={uploadingUserId === 'new-article'}
                    >
                      {uploadingUserId === 'new-article' ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subindo...</>
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
                  </div>
                </div>
              </div>
              <FormField control={articleForm.control} name="imageHint" render={({ field }) => (
                <FormItem><FormLabel>Emoji ou Ícone de Destaque</FormLabel><FormControl><Input {...field} placeholder="Ex: 🌱" className="bg-white" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={articleForm.control} name="videoUrl" render={({ field }) => (
              <FormItem><FormLabel>URL do Vídeo (Opcional)</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2 mt-6">
              <div className="flex items-center gap-2 text-amber-900">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Confirmação de Segurança</span>
              </div>
              <Input 
                type="password" 
                required 
                value={securityPassword} 
                onChange={(e) => setSecurityPassword(e.target.value)} 
                placeholder="Sua senha ou senha Master" 
                className="bg-white border-amber-200"
              />
              <p className="text-[9px] text-amber-700 font-medium">Autorização necessária para publicar alterações.</p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
              <Button type="button" variant="ghost" onClick={closeAllForms}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Publicar Artigo'}</Button>
            </div>
          </form></Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-indigo-900 text-white overflow-hidden relative">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400 opacity-80">Conteúdo Educativo</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredArticles.length}</span>
                      <span className="text-xs font-bold text-indigo-400">ARTIGOS</span>
                  </div>
                  <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><BookOpen className="h-32 w-32" /></div>
              </CardContent>
          </Card>
          <Card className="bg-slate-900 text-white">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Banco de Desafios</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{quizTopics.length}</span>
                      <span className="text-xs font-bold text-slate-400">TÓPICOS</span>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-slate-900 text-white">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Base de Vídeos</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{filteredArticles.filter(a => a.videoUrl).length}</span>
                      <span className="text-xs font-bold text-slate-400">MULTIMÍDIA</span>
                  </div>
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Tópicos de Quiz</CardTitle><CardDescription>Geração automática de desafios para os alunos.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
              <div className="flex gap-2">
                  <Input placeholder="Novo tópico (ex: Reciclagem)" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} className="bg-white" />
                  <Button onClick={handleAddTopic}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                  {filteredQuizTopics.map((topic, idx) => (
                      <Badge key={`${topic.id}-${idx}`} variant="secondary" className="pr-1 bg-white border border-slate-200 text-slate-700 font-bold">
                        {topic.name}
                        <Button size="icon" variant="ghost" className="h-4 w-4 ml-1 hover:text-red-500" onClick={() => handleDeleteTopic(topic)}>
                          <Trash2 className="h-3 w-3"/>
                        </Button>
                      </Badge>
                  ))}
              </div>
          </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Conteúdo</CardTitle><CardDescription>Artigos pedagógicos e vídeos.</CardDescription></div>
          <Button onClick={() => handleNew('article')}><BookOpen className="mr-2 h-4 w-4" />Novo Artigo</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Pesquisar Artigo</Label>
              <Input placeholder="Buscar por título..." value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} className="bg-white" />
          </div>

          <div className="mb-4">
             {/* Redundância removida: O painel de exclusão global agora gerencia isso */}
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredArticles.length > 0 ? filteredArticles.map((article) => (
                <TableRow key={article.id} className={isDeleteConfirmOpen && selectedItem?.id === article.id ? 'bg-red-50' : ''}>
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
              )) : (
                <TableRow><TableCell colSpan={2} className="text-center py-12 text-muted-foreground italic">Nenhum artigo encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
