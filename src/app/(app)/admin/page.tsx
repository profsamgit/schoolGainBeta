'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Database, 
  Users, 
  BookOpen, 
  Gift, 
  Cpu, 
  Shield, 
  ShieldAlert, 
  Globe,
  Lock,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { EcosystemService } from '@/lib/ecosystem.service';
import { 
  User, 
  Reward, 
  EducationArticle, 
  QuizTopic, 
  Terminal, 
  Turma, 
  Curso, 
  Cargo, 
  SetorEscolar,
  SCHOOL_SECTORS 
} from '@/lib/types';

// Import refactored sections
import { PovoamentoSection } from './components/PovoamentoSection';
import { AcademicSection } from './components/AcademicSection';
import { PedagogicSection } from './components/PedagogicSection';
import { EconomicSection } from './components/EconomicSection';
import { InfraSection } from './components/InfraSection';

// Schemas
const userSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  ra: z.string().min(4, 'RA inválido'),
  rfid: z.string().optional(),
  turma: z.string().optional(),
  curso: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(['student', 'admin', 'super_admin', 'visitor']),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  avatar: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) return false;
  return true;
}, { message: "As senhas não coincidem", path: ["confirmPassword"] });

const rewardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Nome muito curto'),
  description: z.string().min(5, 'Descrição muito curta'),
  cost: z.coerce.number().min(1, 'Custo inválido'),
  image: z.string().url('URL inválida').optional().or(z.literal('')),
  imageHint: z.string().optional(),
});

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'Título muito curto'),
  summary: z.string().min(10, 'Resumo muito curto'),
  content: z.string().min(20, 'Conteúdo muito curto'),
  image: z.string().url('URL inválida').optional().or(z.literal('')),
  imageHint: z.string().optional(),
  videoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});


type UserFormValues = z.infer<typeof userSchema>;
type RewardFormValues = z.infer<typeof rewardSchema>;
type ArticleFormValues = z.infer<typeof articleSchema>;

function AdminContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'povoamento';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();

  const { 
    users,
    allRewards: rewards,
    allArticles: articles,
    allQuizTopics: quizTopics,
    currentUser,
    updateUsers,
    updateRewards,
    updateArticles,
    updateQuizTopics,
    allTurmas,
    allCursos,
    allCargos,
    allSetores,
    updateTurmas,
    updateCursos,
    updateCargos,
    updateSetores,
    auditLogs,
    grantPoints,
    systemSettings,
    updateSystemSettings,
    terminals,
    updateTerminalSettings,
    updateTerminalStatus,
    deleteTerminal,
    schools,
    uploadUserAvatar
  } = useEcosystem();

  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [securityPassword, setSecurityPassword] = useState('');

  useEffect(() => {
    setHasMounted(true);
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);

    async function getDevices() {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            stream.getTracks().forEach(track => track.stop());
          }).catch(() => {});
          const devices = await navigator.mediaDevices.enumerateDevices();
          setVideoDevices(devices.filter(device => device.kind === 'videoinput'));
        }
      } catch (error) { console.error(error); }
    }
    getDevices();
  }, [searchParams]);

  // States for shared dialogs/modals
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [mustChangePass, setMustChangePass] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);

  // States for form handling
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [isNew, setIsNew] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'user' | 'reward' | 'article' | 'turma' | 'curso' | 'cargo' | 'setor' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [grantRa, setGrantRa] = useState('');
  const [grantAction, setGrantAction] = useState('');
  const [grantPointsValue, setGrantPointsValue] = useState(0);
  const [grantPassword, setGrantPassword] = useState('');

  const [passFormData, setPassFormData] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [badgeUser, setBadgeUser] = useState<User | null>(null);
  const [newTopic, setNewTopic] = useState('');

  // Search and Filters (Moved from page state but passed as props to maintain orchestration)
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'student' | 'admin' | 'visitor'>('student');
  const [userTurmaFilter, setUserTurmaFilter] = useState('all');
  const [rewardSearch, setRewardSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');

  // Scanner States
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isSearchQRScannerOpen, setIsSearchQRScannerOpen] = useState(false);
  const [isRFIDCapturing, setIsRFIDCapturing] = useState(false);

  useEffect(() => {
    if (currentUser?.mustChangePassword) setMustChangePass(true);
  }, [currentUser]);

  const targetSchoolId = useMemo(() => {
    const qSchoolId = searchParams.get('schoolId');
    if (currentUser?.role === 'super_admin' && qSchoolId) return qSchoolId;
    return currentUser?.schoolId;
  }, [searchParams, currentUser]);

  const filteredUsersForAdmin = useMemo(() => {
    if (!targetSchoolId) return users;
    return users.filter((u: User) => u.schoolId === targetSchoolId);
  }, [users, targetSchoolId]);

  const filteredTerminalsForAdmin = useMemo(() => {
    if (!targetSchoolId) return terminals;
    return terminals.filter((t: Terminal) => t.schoolId === targetSchoolId);
  }, [terminals, targetSchoolId]);

  const filteredTurmas = useMemo(() => allTurmas.filter((t: Turma) => !targetSchoolId || t.schoolId === targetSchoolId), [allTurmas, targetSchoolId]);
  const filteredCursos = useMemo(() => allCursos.filter((c: Curso) => !targetSchoolId || c.schoolId === targetSchoolId), [allCursos, targetSchoolId]);
  const filteredCargos = useMemo(() => allCargos.filter((c: Cargo) => !targetSchoolId || c.schoolId === targetSchoolId), [allCargos, targetSchoolId]);
  const filteredSetores = useMemo(() => allSetores.filter((s: SetorEscolar) => !targetSchoolId || s.schoolId === targetSchoolId), [allSetores, targetSchoolId]);

  // Forms
  const userForm = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { name: '', email: '', ra: '', rfid: '', turma: '', curso: '', role: 'student', password: '', confirmPassword: '', avatar: '' } });
  const rewardForm = useForm<RewardFormValues>({ resolver: zodResolver(rewardSchema), defaultValues: { name: '', description: '', cost: 0, image: '', imageHint: '' } });
  const articleForm = useForm<ArticleFormValues>({ resolver: zodResolver(articleSchema), defaultValues: { title: '', summary: '', content: '', image: '', imageHint: '', videoUrl: '' } });

  // Shared Handlers
  const closeAllForms = () => {
    setViewMode('list');
    setSelectedItem(null);
    setItemType(null);
    setIsSubmitting(false);
    setIsNew(false);
    setIsDeleteConfirmOpen(false);
    userForm.reset();
    rewardForm.reset();
    articleForm.reset();
    setIsQRScannerOpen(false);
    setIsRFIDCapturing(false);
    document.body.style.pointerEvents = 'auto';
    document.body.style.overflow = 'auto';
  };

  const handleQRDetected = (ra: string) => {
    setUserSearch(ra);
    setIsQRScannerOpen(false);
    toast({ title: "Aluno Identificado", description: `RA: ${ra}` });
  };

  const handleNew = (type: 'user' | 'reward' | 'article') => {
    setSelectedItem(null);
    setItemType(type);
    setIsNew(true);
    setViewMode('form');
    if (type === 'user') {
      const defaultRole = userRoleFilter === 'admin' ? 'admin' : userRoleFilter === 'visitor' ? 'visitor' : 'student';
      userForm.reset({ name: defaultRole === 'visitor' ? 'Visitante' : '', role: defaultRole as any, avatar: '' });
    } else if (type === 'reward') {
      rewardForm.reset({ id: `reward-${Date.now()}-${Math.random().toString(36).slice(-4)}`, name: '', description: '', cost: 0, image: '', imageHint: '' });
    } else if (type === 'article') {
      articleForm.reset({ id: `article-${Date.now()}-${Math.random().toString(36).slice(-4)}`, title: '', summary: '', content: '', image: '', imageHint: '', videoUrl: '' });
    }
  };

  const handleEdit = (item: any, type: 'user' | 'reward' | 'article') => {
    setSelectedItem(item);
    setItemType(type);
    setIsNew(false);
    setViewMode('form');
    if (type === 'user') userForm.reset({ 
      ...item, 
      ra: (item.ra || '').toUpperCase(), 
      email: item.email || '',
      position: item.position || '',
      rfid: item.rfid || '',
      password: '', 
      confirmPassword: '' 
    });
    if (type === 'reward') rewardForm.reset(item);
    if (type === 'article') articleForm.reset(item);
  };

  const handleDelete = (item: any, type: any) => {
    setSelectedItem(item);
    setItemType(type);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem || !itemType) return;
    
    // Verificação de Segurança (Chave Mestra)
    const isAuthorized = await EcosystemService.verifyUniversalPassword(securityPassword, currentUser, users);
    if (!isAuthorized) {
      toast({ variant: 'destructive', title: 'Não Autorizado', description: 'Senha de segurança incorreta.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (itemType === 'user') await updateUsers(users.filter((i: User) => i.id !== selectedItem.id));
      else if (itemType === 'reward') updateRewards(rewards.filter((i: Reward) => i.id !== selectedItem.id));
      else if (itemType === 'article') updateArticles(articles.filter((i: EducationArticle) => i.id !== selectedItem.id));
      else if (itemType === 'turma') updateTurmas(allTurmas.filter((i: Turma) => i.id !== selectedItem.id));
      else if (itemType === 'curso') updateCursos(allCursos.filter((i: Curso) => i.id !== selectedItem.id));
      else if (itemType === 'cargo') updateCargos(allCargos.filter((i: Cargo) => i.id !== selectedItem.id));
      else if (itemType === 'setor') updateSetores(allSetores.filter((i: SetorEscolar) => i.id !== selectedItem.id));
      
      toast({ title: 'Item Removido!', description: `${selectedItem.name || selectedItem.title} foi removido.` });
      closeAllForms();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o item.' });
    } finally {
      setIsSubmitting(false);
      setSecurityPassword('');
      setIsDeleteConfirmOpen(false);
    }
  };

  const onSubmit = async (values: any) => {
    if (isSubmitting) return;

    // Verificação de Segurança (Chave Mestra)
    const isAuthorized = await EcosystemService.verifyUniversalPassword(securityPassword, currentUser, users);
    if (!isAuthorized) {
      toast({ variant: 'destructive', title: 'Não Autorizado', description: 'Senha de segurança incorreta.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Higienização Global: Converte campos de texto para MAIÚSCULO (exceto técnicos)
      const sanitizedValues = { ...values };
      Object.keys(sanitizedValues).forEach(key => {
        if (
          typeof sanitizedValues[key] === 'string' && 
          !['email', 'password', 'confirmPassword', 'role', 'avatar', 'image', 'slug'].includes(key)
        ) {
          sanitizedValues[key] = sanitizedValues[key].toUpperCase().trim();
        }
      });

      let payload = { ...sanitizedValues, ra: (values.ra || Math.random().toString(36).substring(2, 14).toUpperCase().padEnd(12, '0')).toUpperCase().trim(), schoolId: targetSchoolId };
      if (!isNew && itemType === 'user' && !values.password) {
        delete payload.password;
        delete payload.confirmPassword;
      }
      if (itemType === 'user' && (values.role === 'admin' || values.role === 'super_admin') && payload.password && payload.password.length !== 64) {
        payload.password = await EcosystemService.hashPassword(payload.password);
        payload.confirmPassword = payload.password;
      }

      if (itemType === 'user') {
        // Limpeza profunda do objeto para evitar 'undefined' no Firestore
        const sanitizedPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && _ !== 'confirmPassword')
        );
        let prefix = 'user';
        if (sanitizedPayload.role === 'super_admin') prefix = 'super';
        else if (sanitizedPayload.role === 'admin') prefix = 'admin';

        const newId = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(-4)}`;
        await updateUsers(isNew ? [...users, { ...sanitizedPayload, id: newId, points: 0, level: 'Semente' } as unknown as User] : users.map(u => u.id === selectedItem.id ? { ...u, ...sanitizedPayload } as User : u));
      } else if (itemType === 'reward') {
        const sanitizedPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && _ !== 'confirmPassword')
        );
        await updateRewards(isNew ? [...rewards, { ...sanitizedPayload, id: `reward-${Date.now()}` } as unknown as Reward] : rewards.map(r => r.id === selectedItem.id ? { ...r, ...sanitizedPayload } as Reward : r));
      } else if (itemType === 'article') {
        const sanitizedPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && _ !== 'confirmPassword')
        );
        await updateArticles(isNew ? [...articles, { ...sanitizedPayload, id: `article-${Date.now()}`, slug: values.title.toLowerCase().replace(/ /g, '-') } as unknown as EducationArticle] : articles.map(a => a.id === selectedItem.id ? { ...a, ...sanitizedPayload } as EducationArticle : a));
      }

      toast({ title: isNew ? 'Item Adicionado!' : 'Item Atualizado!', description: `${values.name || values.title} foi processado.` });
      closeAllForms();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar.' });
    } finally {
      setIsSubmitting(false);
      setSecurityPassword('');
    }
  };

  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPass, newPass, confirmPass } = passFormData;
    if (newPass !== confirmPass) return toast({ title: 'Erro', description: 'Senhas não coincidem.', variant: 'destructive' });
    setIsSubmitting(true);
    try {
      const hashedNew = await EcosystemService.hashPassword(newPass);
      const success = await updateUsers(users.map(u => u.id === (selectedItem?.id || currentUser?.id) ? { ...u, password: hashedNew, mustChangePassword: false } : u));
      if (!success) {
        toast({ title: 'Erro', description: 'Falha ao atualizar senha. E-mail pode estar duplicado.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sucesso', description: 'Senha atualizada!' });
      setIsPasswordDialogOpen(false);
      setMustChangePass(false);
      setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar senha.', variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const generateStrongPassword = () => {
    const pass = Math.random().toString(36).slice(-10) + "!";
    userForm.setValue('password', pass, { shouldValidate: true });
    userForm.setValue('confirmPassword', pass, { shouldValidate: true });
    toast({ title: 'Senha Gerada!', description: `Senha: ${pass}. ANOTE AGORA!` });
  };

  const handleBadgePrint = (user: User) => {
    if (!user) return;
    const printWindow = window.open('', '_blank', 'width=850,height=600');
    if (!printWindow) return;

    // Get all styles from current document
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>Crach - ${user.name}</title>
          ${styles}
          <style>
            @media print {
              @page { size: 85mm 55mm; margin: 0; }
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              background: white;
            }
          </style>
        </head>
        <body>
          <div id="print-content">
            <!-- A estrutura do PrintableBadge ser injetada aqui -->
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 100);
            }, 1000);
          </script>
        </body>
      </html>
    `);
    
    // Inject current badge content
    const badgeElement = document.querySelector('#badge-container') || document.querySelector('.printable-badge');
    if (badgeElement && printWindow.document.getElementById('print-content')) {
      printWindow.document.getElementById('print-content')!.innerHTML = badgeElement.innerHTML;
    }
  };





  if (!hasMounted) return null;
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        <ShieldAlert className="h-24 w-24 text-red-100" />
        <h2 className="text-3xl font-bold">Acesso Restrito</h2>
        <Button asChild><Link href="/dashboard">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {currentUser?.role === 'super_admin' && searchParams.has('schoolId') && (
        <div className="bg-slate-900 text-white px-6 py-2 flex justify-between items-center sticky top-0 z-50">
          <p className="text-[10px] font-black uppercase tracking-widest">Modo Super Admin: <span className="text-red-500">{schools.find(s => s.id === targetSchoolId)?.name}</span></p>
        </div>
      )}

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2"><Shield className="h-8 w-8 text-primary" /> Painel do Gestor</h1>
            <p className="text-muted-foreground font-medium">{schools.find(s => s.id === currentUser.schoolId)?.name || 'Unidade SchoolGain'}</p>
          </div>
          {currentUser.role === 'super_admin' && (
            <Button asChild variant="outline" size="sm" className="bg-slate-900 text-white"><Link href="/super-admin" className="flex gap-2 items-center"><Globe className="h-4 w-4" /> Rede</Link></Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-1 bg-slate-100 p-1">
            <TabsTrigger value="povoamento" className="uppercase font-black text-[10px] py-3"><Database className="mr-2 h-4 w-4"/> Povoamento</TabsTrigger>
            <TabsTrigger value="academic" className="uppercase font-black text-[10px] py-3"><Users className="mr-2 h-4 w-4"/> Acadêmico</TabsTrigger>
            <TabsTrigger value="pedagogic" className="uppercase font-black text-[10px] py-3"><BookOpen className="mr-2 h-4 w-4"/> Pedagógico</TabsTrigger>
            <TabsTrigger value="economic" className="uppercase font-black text-[10px] py-3"><Gift className="mr-2 h-4 w-4"/> Econômico</TabsTrigger>
            <TabsTrigger value="infra" className="uppercase font-black text-[10px] py-3"><Cpu className="mr-2 h-4 w-4"/> Infra</TabsTrigger>
          </TabsList>

          <TabsContent value="povoamento">
            <PovoamentoSection 
              allTurmas={allTurmas} 
              allCursos={allCursos} 
              allCargos={allCargos} 
              allSetores={allSetores}
              targetSchoolId={targetSchoolId}
              updateTurmas={updateTurmas}
              updateCursos={updateCursos}
              updateCargos={updateCargos}
              updateSetores={updateSetores}
              handleDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="academic">
            <AcademicSection 
              users={users} filteredUsersForAdmin={filteredUsersForAdmin} allTurmas={allTurmas} allCursos={allCursos} allCargos={allCargos} allSetores={allSetores}
              filteredTurmas={filteredTurmas} filteredSetores={filteredSetores} filteredCursos={filteredCursos}
              viewMode={viewMode} itemType={itemType} isNew={isNew} isSubmitting={isSubmitting} userForm={userForm}
              onSubmit={onSubmit} handleEdit={handleEdit} handleDelete={handleDelete} handleNew={handleNew} closeAllForms={closeAllForms}
              isBadgeOpen={isBadgeOpen} setIsBadgeOpen={setIsBadgeOpen} badgeUser={badgeUser} setBadgeUser={setBadgeUser}
              handleBadgePrint={handleBadgePrint}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              userRoleFilter={userRoleFilter}
              setUserRoleFilter={setUserRoleFilter}
              userTurmaFilter={userTurmaFilter}
              setUserTurmaFilter={setUserTurmaFilter}
              isQRScannerOpen={isQRScannerOpen}
              setIsQRScannerOpen={setIsQRScannerOpen}
              isRFIDCapturing={isRFIDCapturing} setIsRFIDCapturing={setIsRFIDCapturing} isSearchQRScannerOpen={isSearchQRScannerOpen} setIsSearchQRScannerOpen={setIsSearchQRScannerOpen}
              generateStrongPassword={generateStrongPassword} isPasswordDialogOpen={isPasswordDialogOpen} setIsPasswordDialogOpen={setIsPasswordDialogOpen}
              targetSchoolId={targetSchoolId} isDeleteConfirmOpen={isDeleteConfirmOpen} selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              uploadUserAvatar={uploadUserAvatar}
              uploadingUserId={uploadingUserId}
              setUploadingUserId={setUploadingUserId}
              handleQRDetected={handleQRDetected}
              confirmDelete={confirmDelete}
              setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
              securityPassword={securityPassword}
              setSecurityPassword={setSecurityPassword}
            />
          </TabsContent>

          <TabsContent value="pedagogic">
            <PedagogicSection 
              articles={articles} quizTopics={quizTopics} viewMode={viewMode} itemType={itemType} isNew={isNew} isSubmitting={isSubmitting}
              articleForm={articleForm} onSubmit={onSubmit} handleEdit={handleEdit} handleDelete={handleDelete} handleNew={handleNew}
              closeAllForms={closeAllForms} articleSearch={articleSearch} setArticleSearch={setArticleSearch} newTopic={newTopic} setNewTopic={setNewTopic}
              handleAddTopic={() => {
                if (newTopic) {
                  updateQuizTopics([...quizTopics, { id: `topic-${Date.now()}`, name: newTopic, schoolId: targetSchoolId }]);
                  setNewTopic('');
                }
              }}
              handleDeleteTopic={(topic) => updateQuizTopics(quizTopics.filter(t => t.id !== topic.id))}
              isDeleteConfirmOpen={isDeleteConfirmOpen} setIsDeleteConfirmOpen={setIsDeleteConfirmOpen} selectedItem={selectedItem} confirmDelete={confirmDelete}
              securityPassword={securityPassword} setSecurityPassword={setSecurityPassword}
              uploadUserAvatar={uploadUserAvatar}
              uploadingUserId={uploadingUserId}
              setUploadingUserId={setUploadingUserId}
            />
          </TabsContent>

          <TabsContent value="economic">
            <EconomicSection 
              rewards={rewards} auditLogs={auditLogs} filteredUsersForAdmin={filteredUsersForAdmin}
              viewMode={viewMode} itemType={itemType} isNew={isNew} isSubmitting={isSubmitting} rewardForm={rewardForm}
              onSubmit={onSubmit} handleEdit={handleEdit} handleDelete={handleDelete} handleNew={handleNew} closeAllForms={closeAllForms}
              rewardSearch={rewardSearch} setRewardSearch={setRewardSearch}
              grantRa={grantRa} setGrantRa={setGrantRa}
              grantAction={grantAction} setGrantAction={setGrantAction}
              grantPointsValue={grantPointsValue} setGrantPointsValue={setGrantPointsValue}
              grantPassword={grantPassword} setGrantPassword={setGrantPassword}
              handleGrantSubmit={() => {
                grantPoints(grantRa, grantPointsValue, 'Geral', grantAction, currentUser?.name || 'Gestor', grantPassword, targetSchoolId).then(success => {
                  if (success) {
                    toast({ title: 'Pontos Atribuídos!' });
                    setGrantRa(''); setGrantAction(''); setGrantPointsValue(0); setGrantPassword('');
                  } else toast({ variant: 'destructive', title: 'Erro' });
                });
              }}
              isDeleteConfirmOpen={isDeleteConfirmOpen} setIsDeleteConfirmOpen={setIsDeleteConfirmOpen} selectedItem={selectedItem} confirmDelete={confirmDelete}
              securityPassword={securityPassword} setSecurityPassword={setSecurityPassword}
              uploadUserAvatar={uploadUserAvatar}
              uploadingUserId={uploadingUserId}
              setUploadingUserId={setUploadingUserId}
            />
          </TabsContent>

          <TabsContent value="infra">
            <InfraSection 
              systemSettings={systemSettings} 
              updateSystemSettings={updateSystemSettings} 
              videoDevices={videoDevices}
              filteredTerminalsForAdmin={filteredTerminalsForAdmin}
              deleteTerminal={deleteTerminal}
              updateTerminalStatus={updateTerminalStatus}
              updateTerminalSettings={updateTerminalSettings}
              currentUser={currentUser}
              toast={toast}
            />
          </TabsContent>

        </Tabs>
      </div>

      {/* Shared Dialogs */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha: {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para este usuário. Ele será notificado na próxima tentativa de acesso.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUserPassword} className="space-y-4 pt-4">
            <Input type="password" required value={passFormData.currentPass} onChange={e => setPassFormData({...passFormData, currentPass: e.target.value})} placeholder="Sua senha de Gestor" />
            <div className="grid grid-cols-2 gap-4">
              <Input type="password" required value={passFormData.newPass} onChange={e => setPassFormData({...passFormData, newPass: e.target.value})} placeholder="Nova Senha" />
              <Input type="password" required value={passFormData.confirmPass} onChange={e => setPassFormData({...passFormData, confirmPass: e.target.value})} placeholder="Confirmar" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">Confirmar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mustChangePass} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Segurança: Primeiro Acesso</DialogTitle>
            <DialogDescription>
              Para sua segurança, você deve definir uma senha pessoal antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUserPassword} className="space-y-4 pt-2">
            <Input type="password" required value={passFormData.newPass} onChange={e => setPassFormData({...passFormData, newPass: e.target.value})} placeholder="Nova Senha Pessoal" />
            <Input type="password" required value={passFormData.confirmPass} onChange={e => setPassFormData({...passFormData, confirmPass: e.target.value})} placeholder="Confirmar Nova Senha" />
            <Button type="submit" disabled={isSubmitting} className="w-full h-12">Definir e Acessar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {isDeleteConfirmOpen && selectedItem && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm p-6 border-2 border-red-500 bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-black uppercase text-red-600">Confirmar Exclusão?</p>
              <p className="text-[11px] font-bold">"{selectedItem.name || selectedItem.title}"</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha de Segurança</Label>
            <Input 
              type="password" 
              value={securityPassword} 
              onChange={e => setSecurityPassword(e.target.value)} 
              placeholder="Sua senha ou Master" 
              className="border-red-200"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setIsDeleteConfirmOpen(false); setSecurityPassword(''); }}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete} disabled={!securityPassword || isSubmitting}>
              {isSubmitting ? '...' : 'Sim, Excluir'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <AdminContent />
    </Suspense>
  );
}
