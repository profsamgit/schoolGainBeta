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
  Trash2,
  CheckCircle
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
import { toPng } from 'html-to-image';
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
  cost: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().min(1, 'Custo inválido')),
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
type RewardFormValues = {
  id?: string;
  name: string;
  description: string;
  cost: number;
  image?: string;
  imageHint?: string;
};
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
    registerSchool,
    schools,
    uploadUserAvatar,
    registrationRequests,
    approveRegistration,
    rejectRegistration,
    updateUserStatus,
    deleteUser,
    deleteReward,
    deleteArticle,
    deleteQuizTopic,
    service
  } = useEcosystem();

  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [securityPassword, setSecurityPassword] = useState('');

  useEffect(() => {
    setHasMounted(true);
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Carregamento da Câmera: Apenas quando entrar na aba de INFRA
  useEffect(() => {
    if (activeTab === 'infra' && videoDevices.length === 0) {
      async function getDevices() {
        try {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            await navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
              stream.getTracks().forEach(track => track.stop());
            }).catch(() => { });
            const devices = await navigator.mediaDevices.enumerateDevices();
            setVideoDevices(devices.filter(device => device.kind === 'videoinput'));
          }
        } catch (error) { console.error(error); }
      }
      getDevices();
    }
  }, [activeTab, videoDevices.length]);


  // States for shared dialogs/modals
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [mustChangePass, setMustChangePass] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [pendingApprovalItem, setPendingApprovalItem] = useState<any>(null);
  const [pendingApprovalType, setPendingApprovalType] = useState<'student' | 'terminal' | 'school' | null>(null);
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
  const filteredQuizTopics = useMemo(() => quizTopics.filter((t: QuizTopic) => !targetSchoolId || t.schoolId === targetSchoolId), [quizTopics, targetSchoolId]);

  // Forms
  const userForm = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { name: '', email: '', ra: '', rfid: '', turma: '', curso: '', role: 'student', password: '', confirmPassword: '', avatar: '' } });
  const rewardForm = useForm<RewardFormValues>({ resolver: zodResolver(rewardSchema as any), defaultValues: { name: '', description: '', cost: 0, image: '', imageHint: '' } });
  const articleForm = useForm<ArticleFormValues>({ resolver: zodResolver(articleSchema), defaultValues: { title: '', summary: '', content: '', image: '', imageHint: '', videoUrl: '' } });

  // Shared Handlers
  const closeAllForms = () => {
    setViewMode('list');
    setSelectedItem(null);
    setItemType(null);
    setIsSubmitting(false);
    setIsNew(false);
    setIsDeleteConfirmOpen(false);
    setIsApproveConfirmOpen(false);
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

  const handleApproveRequest = (item: any, type: 'student' | 'terminal' | 'school') => {
    setPendingApprovalItem(item);
    setPendingApprovalType(type);
    setIsApproveConfirmOpen(true);
    setSecurityPassword('');
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
      let success = false;
      const sid = targetSchoolId || currentUser?.schoolId;
      if (itemType === 'user') success = await deleteUser(selectedItem.id);
      else if (itemType === 'reward') success = await deleteReward(selectedItem.id, sid);
      else if (itemType === 'article') success = await deleteArticle(selectedItem.id, sid);
      else if (itemType === 'turma') await updateTurmas(allTurmas.filter((i: Turma) => i.id !== selectedItem.id));
      else if (itemType === 'curso') await updateCursos(allCursos.filter((i: Curso) => i.id !== selectedItem.id));
      else if (itemType === 'cargo') await updateCargos(allCargos.filter((i: Cargo) => i.id !== selectedItem.id));
      else if (itemType === 'setor') await updateSetores(allSetores.filter((i: SetorEscolar) => i.id !== selectedItem.id));

      if (success || itemType !== 'user' && itemType !== 'reward' && itemType !== 'article') {
        toast({ title: 'Item Removido!', description: `${selectedItem.name || selectedItem.title} foi removido.` });
        closeAllForms();
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o item.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o item.' });
    } finally {
      setIsSubmitting(false);
      setSecurityPassword('');
      setIsDeleteConfirmOpen(false);
    }
  };

  const confirmApproval = async () => {
    const isAuthorized = await EcosystemService.verifyUniversalPassword(securityPassword, currentUser, users);
    if (!isAuthorized) {
      toast({ variant: 'destructive', title: 'Senha Incorreta', description: 'Ação não autorizada.' });
      return;
    }

    if (!pendingApprovalItem || !pendingApprovalType) return;

    let success = false;
    try {
      if (pendingApprovalType === 'student') {
        success = await approveRegistration(pendingApprovalItem.id);
      } else if (pendingApprovalType === 'terminal') {
        await updateTerminalStatus(pendingApprovalItem.id, 'active', targetSchoolId || currentUser?.schoolId || 'system-global');
        success = true;
      } else if (pendingApprovalType === 'school') {
        success = await registerSchool(pendingApprovalItem);
      }

      if (success) {
        toast({ title: 'Sucesso', description: 'Aprovação realizada com sucesso.' });
        setIsApproveConfirmOpen(false);
        setPendingApprovalItem(null);
        setPendingApprovalType(null);
        setSecurityPassword('');
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível concluir a aprovação.' });
      }
    } catch (error) {
      console.error("Erro na aprovação:", error);
      toast({ variant: 'destructive', title: 'Erro Crítico', description: 'Ocorreu um erro ao processar a aprovação.' });
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

      let payload = { 
        ...sanitizedValues, 
        ra: (values.ra || Math.random().toString(36).substring(2, 14).toUpperCase().padEnd(12, '0')).toUpperCase().trim(), 
        schoolId: targetSchoolId || values.schoolId || currentUser?.schoolId 
      };
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

        // Normalização Obrigatória (Caixa Alta)
        if (sanitizedPayload.name) sanitizedPayload.name = (sanitizedPayload.name as string).toUpperCase().trim();
        if (sanitizedPayload.ra) sanitizedPayload.ra = (sanitizedPayload.ra as string).toUpperCase().trim();
        if (sanitizedPayload.turma) sanitizedPayload.turma = (sanitizedPayload.turma as string).toUpperCase().trim();
        if (sanitizedPayload.curso) sanitizedPayload.curso = (sanitizedPayload.curso as string).toUpperCase().trim();
        if (sanitizedPayload.position) sanitizedPayload.position = (sanitizedPayload.position as string).toUpperCase().trim();
        if (sanitizedPayload.rfid) sanitizedPayload.rfid = (sanitizedPayload.rfid as string).toUpperCase().trim();

        // Prefixos padrão para novos IDs
        let prefix = 'user-student';
        if (sanitizedPayload.role === 'super_admin') prefix = 'super';
        else if (sanitizedPayload.role === 'admin') prefix = 'admin';
        else if (sanitizedPayload.role === 'visitor') prefix = 'user-visitante';

        let finalUsers: User[];
        const targetSid = targetSchoolId || currentUser?.schoolId;

        if (isNew) {
          const newId = EcosystemService.generateStandardId(prefix, targetSid);
          finalUsers = [...users, { ...sanitizedPayload, id: newId, points: 0, level: 'Semente', schoolId: targetSid } as unknown as User];
        } else {
          // Edição: Localiza e mescla dados
          if (!selectedItem?.id) {
            toast({ variant: 'destructive', title: 'Erro de Sessão', description: 'O item selecionado para edição não foi encontrado. Tente reabrir o formulário.' });
            setIsSubmitting(false);
            return;
          }

          finalUsers = users.map(u => {
            if (u.id === selectedItem.id) {
              // Preserva campos que não estão no formulário de edição (como pontos, level, ID e schoolId original se não alterado)
              return { 
                ...u, 
                ...sanitizedPayload,
                id: u.id, // Garante que o ID nunca mude
                schoolId: u.schoolId || targetSid // Preserva ou garante schoolId
              } as User;
            }
            return u;
          });
        }

        const result = await updateUsers(finalUsers, targetSid);

        if (!result.success) {
          toast({ variant: 'destructive', title: 'Erro ao Salvar', description: result.error || 'Verifique se há campos obrigatórios vazios ou duplicados.' });
          setIsSubmitting(false);
          return;
        }

        const roleLabel = sanitizedPayload.role === 'admin' ? 'Gestor' : sanitizedPayload.role === 'super_admin' ? 'Super Gestor' : sanitizedPayload.role === 'visitor' ? 'Visitante' : 'Aluno';
        toast({ title: isNew ? `${roleLabel} Cadastrado!` : 'Dados Atualizados!', description: `${sanitizedPayload.name} foi salvo com sucesso.` });
        closeAllForms();
      } else if (itemType === 'reward') {
        const sanitizedPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && _ !== 'confirmPassword')
        );

        const sid = targetSchoolId || currentUser?.schoolId;
        if (!sid) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Unidade não identificada.' });
          return;
        }
        const newId = EcosystemService.generateStandardId('rw', sid);

        const success = await updateRewards(isNew
          ? [...rewards, { ...sanitizedPayload, id: newId, schoolId: sid } as unknown as Reward]
          : rewards.map(r => r.id === selectedItem.id ? { ...r, ...sanitizedPayload } as Reward : r),
          sid
        );

        if (!success) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar recompensa.' });
          setIsSubmitting(false);
          return;
        }
        toast({ title: isNew ? 'Item Adicionado!' : 'Item Atualizado!', description: `${values.name} foi processado.` });
        closeAllForms();
      } else if (itemType === 'article') {
        const sanitizedPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && _ !== 'confirmPassword')
        );

        const sid = targetSchoolId || currentUser?.schoolId;
        if (!sid) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Unidade não identificada.' });
          return;
        }
        const newId = EcosystemService.generateStandardId('ctd', sid);

        const success = await updateArticles(isNew
          ? [...articles, { ...sanitizedPayload, id: newId, schoolId: sid, slug: values.title.toLowerCase().replace(/ /g, '-') } as unknown as EducationArticle]
          : articles.map(a => a.id === selectedItem.id ? { ...a, ...sanitizedPayload } as EducationArticle : a),
          sid
        );

        if (!success) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar artigo.' });
          setIsSubmitting(false);
          return;
        }
        toast({ title: isNew ? 'Item Adicionado!' : 'Item Atualizado!', description: `${values.title} foi processado.` });
        closeAllForms();
      }
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
    const badgeElement = document.getElementById(`badge-${user.id}`);
    if (!badgeElement) {
      toast({ title: 'Erro', description: 'Não foi possível encontrar o crachá.', variant: 'destructive' });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=850,height=600');
    if (!printWindow) {
      toast({ title: 'Pop-up Bloqueado', description: 'Por favor, permita pop-ups para imprimir.' });
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>Crachá - ${user.name}</title>
          ${styles}
          <style>
            @media print {
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; }
            }
            body { 
              display: flex; justify-content: center; align-items: center; 
              min-height: 100vh; background: white !important;
            }
            .print-wrapper {
              transform: scale(1.4);
              transform-origin: center center;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">${badgeElement.outerHTML}</div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadBadgeImage = async (user: User) => {
    if (!user) return;
    const badgeElement = document.getElementById(`badge-${user.id}`);
    if (!badgeElement) {
      toast({ title: 'Erro', description: 'Não foi possível encontrar o crachá.', variant: 'destructive' });
      return;
    }

    try {
      toast({ title: "Gerando imagem...", description: "Preparando crachá premium..." });

      // Delay para renderização
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await toPng(badgeElement, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: 321,
        height: 208,
        style: {
          margin: '0',
          transform: 'none',
        }
      });

      const link = document.createElement('a');
      link.download = `cracha-${user.ra || 'estudante'}.png`;
      link.href = dataUrl;
      link.click();

      toast({ title: "Sucesso!", description: "Crachá salvo como imagem." });
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Falha ao gerar imagem do crachá." });
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="!flex !w-full h-16 bg-slate-200/40 p-1.5 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
            <TabsTrigger value="povoamento" className="flex-1 !inline-flex rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300"><Database className="mr-2 h-4 w-4" /> Povoamento</TabsTrigger>
            <TabsTrigger value="academic" className="flex-1 !inline-flex rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300"><Users className="mr-2 h-4 w-4" /> Acadêmico</TabsTrigger>
            <TabsTrigger value="pedagogic" className="flex-1 !inline-flex rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300"><BookOpen className="mr-2 h-4 w-4" /> Pedagógico</TabsTrigger>
            <TabsTrigger value="economic" className="flex-1 !inline-flex rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300"><Gift className="mr-2 h-4 w-4" /> Econômico</TabsTrigger>
            <TabsTrigger value="infra" className="flex-1 !inline-flex rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest transition-all duration-300"><Cpu className="mr-2 h-4 w-4" /> Infra</TabsTrigger>
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
              handleDownloadBadgeImage={handleDownloadBadgeImage}
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
              registrationRequests={registrationRequests}
              approveRegistration={(item) => handleApproveRequest(item, 'student')}
              rejectRegistration={rejectRegistration}
              updateUserStatus={updateUserStatus}
            />
          </TabsContent>

          <TabsContent value="pedagogic">
            <PedagogicSection
              articles={articles} quizTopics={filteredQuizTopics} viewMode={viewMode} itemType={itemType} isNew={isNew} isSubmitting={isSubmitting}
              articleForm={articleForm} onSubmit={onSubmit} handleEdit={handleEdit} handleDelete={handleDelete} handleNew={handleNew}
              closeAllForms={closeAllForms} articleSearch={articleSearch} setArticleSearch={setArticleSearch} newTopic={newTopic} setNewTopic={setNewTopic}
              handleAddTopic={async () => {
                if (newTopic) {
                  const sid = targetSchoolId || currentUser?.schoolId;
                  if (!sid) {
                    toast({ variant: 'destructive', title: 'Erro', description: 'Unidade não identificada.' });
                    return;
                  }
                  const newId = EcosystemService.generateStandardId('qz', sid);
                  const success = await updateQuizTopics([...quizTopics, { id: newId, name: newTopic, schoolId: sid }], sid);
                  if (success) {
                    setNewTopic('');
                    toast({ title: "Tópico Adicionado", description: "O novo tópico foi salvo na unidade." });
                  } else {
                    toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar tópico.' });
                  }
                }
              }}
              handleDeleteTopic={async (topic) => {
                const sid = targetSchoolId || currentUser?.schoolId;
                const success = await deleteQuizTopic(topic.id, sid);
                if (success) {
                  toast({ title: "Tópico Removido", description: "O tópico foi excluído da unidade." });
                } else {
                  toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir tópico.' });
                }
              }}
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
              allTurmas={allTurmas}
              allCursos={allCursos}
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
              approveTerminal={(t) => handleApproveRequest(t, 'terminal')}
              approveSchool={(s) => handleApproveRequest(s, 'school')}
              currentUser={currentUser}
              targetSchoolId={targetSchoolId}
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
            <Input type="password" required value={passFormData.currentPass} onChange={e => setPassFormData({ ...passFormData, currentPass: e.target.value })} placeholder="Sua senha de Gestor" />
            <div className="grid grid-cols-2 gap-4">
              <Input type="password" required value={passFormData.newPass} onChange={e => setPassFormData({ ...passFormData, newPass: e.target.value })} placeholder="Nova Senha" />
              <Input type="password" required value={passFormData.confirmPass} onChange={e => setPassFormData({ ...passFormData, confirmPass: e.target.value })} placeholder="Confirmar" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">Confirmar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mustChangePass} onOpenChange={() => { }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Segurança: Primeiro Acesso</DialogTitle>
            <DialogDescription>
              Para sua segurança, você deve definir uma senha pessoal antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUserPassword} className="space-y-4 pt-2">
            <Input type="password" required value={passFormData.newPass} onChange={e => setPassFormData({ ...passFormData, newPass: e.target.value })} placeholder="Nova Senha Pessoal" />
            <Input type="password" required value={passFormData.confirmPass} onChange={e => setPassFormData({ ...passFormData, confirmPass: e.target.value })} placeholder="Confirmar Nova Senha" />
            <Button type="submit" disabled={isSubmitting} className="w-full h-12">Definir e Acessar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Confirm Dialog */}
      <Dialog open={isApproveConfirmOpen} onOpenChange={closeAllForms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Confirmar Aprovação</DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar uma requisição de {pendingApprovalType}. Digite sua senha de segurança para confirmar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); confirmApproval(); }} className="space-y-4">
            <Input type="password" placeholder="Senha de Segurança" value={securityPassword} onChange={e => setSecurityPassword(e.target.value)} />
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Confirmar Aprovação</Button>
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmDelete();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha de Segurança</Label>
              <Input
                type="password"
                value={securityPassword}
                onChange={e => setSecurityPassword(e.target.value)}
                placeholder="Sua senha ou Master"
                className="border-red-200"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsDeleteConfirmOpen(false); setSecurityPassword(''); }}>Cancelar</Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={!securityPassword || isSubmitting}>
                {isSubmitting ? '...' : 'Sim, Excluir'}
              </Button>
            </div>
          </form>
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
