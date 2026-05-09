'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  DialogDescription,
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
  History,
  Cpu,
  Monitor,
  QrCode,
  Rss,
  Camera,
  ArrowLeft,
  School as SchoolIcon,
  Globe,
  Plus,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });
import PrintableBadge from '@/components/ecosystem/PrintableBadge';
import { Printer, Download as DownloadIcon } from 'lucide-react';

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
import { EcosystemService } from '@/lib/ecosystem.service';

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  ra: z.string().min(1, 'O RA é obrigatório.'),
  rfid: z.string().optional(),
  turma: z.string().optional().or(z.literal('')),
  curso: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  role: z.enum(['student', 'admin', 'visitor'], { required_error: 'O cargo é obrigatório.' }),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  // Validação simplificada: Senha apenas se for NOVO usuário e Admin
  const isNew = !data.id;
  
  if (data.role === 'admin') {
    if (!data.name || data.name.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O nome é obrigatório', path: ['name'] });
    if (!data.position) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O cargo é obrigatório', path: ['position'] });
    if (!data.email || !data.email.includes('@')) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'E-mail inválido', path: ['email'] });
    
    if (isNew && (!data.password || data.password.length < 6)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Senha inicial obrigatória (mín. 6 chars)', path: ['password'] });
    }
  }

  // Nome obrigatório para alunos
  if (data.role === 'student' && (!data.name || data.name.length < 3)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O nome é obrigatório para alunos', path: ['name'] });
  }

  // Turma obrigatória para alunos e gestores (exceto visitantes)
  if (data.role !== 'visitor' && !data.turma) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O setor/turma é obrigatório', path: ['turma'] });
  }
  // Curso obrigatório para alunos
  if (data.role === 'student' && !data.curso) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O curso é obrigatório para alunos', path: ['curso'] });
  }
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

  // Removido o estado de diálogos em favor da edição inline

function AdminContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'users';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

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
    grantPoints,
    systemSettings,
    updateSystemSettings,
    terminals,
    updateTerminalStatus,
    deleteTerminal,
    schools,
    requestSchoolRegistration,
    updateSchoolStatus,
    deleteSchool,
    changePassword,
    updateMyPassword
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
  const [grantPassword, setGrantPassword] = useState('');

  // Estados para Busca em Recompensas e Artigos
  const [rewardSearch, setRewardSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');

  const targetSchoolId = useMemo(() => {
    const qSchoolId = searchParams.get('schoolId');
    if (currentUser?.role === 'super_admin' && qSchoolId) return qSchoolId;
    return currentUser?.schoolId;
  }, [searchParams, currentUser]);

  const filteredUsersForAdmin = useMemo(() => {
    if (!targetSchoolId) return users;
    // Filtra apenas usuários que pertencem à unidade selecionada
    return users.filter(u => u.schoolId === targetSchoolId);
  }, [users, targetSchoolId]);

  const selectedStudent = useMemo(() => {
    if (!grantRa) return null;
    return filteredUsersForAdmin.find(u => u.ra === grantRa);
  }, [grantRa, filteredUsersForAdmin]);

  // Estados para Edição Inline (substitui os diálogos)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [isNew, setIsNew] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'user' | 'reward' | 'article' | 'participant' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mustChangePass, setMustChangePass] = useState(false);

  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setMustChangePass(true);
    }
  }, [currentUser]);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isRFIDCapturing, setIsRFIDCapturing] = useState(false);

  // Estados para Confirmação de Segurança (Ações sobre Gestores)
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [securityPass, setSecurityPass] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'save' | 'delete', data?: any }>({ type: 'save' });
  const filteredTerminalsForAdmin = useMemo(() => {
    if (!targetSchoolId) return terminals;
    return terminals.filter(t => t.schoolId === targetSchoolId);
  }, [terminals, targetSchoolId]);

  const filteredRewards = useMemo(() => {
    // Mostra recompensas da escola atual, globais da 'school-1' ou sem escola (legado)
    const list = rewards.filter(r => !targetSchoolId || r.schoolId === targetSchoolId || r.schoolId === 'school-1' || !r.schoolId);
    if (!rewardSearch) return list;
    return list.filter(r => r.name.toLowerCase().includes(rewardSearch.toLowerCase()));
  }, [rewards, targetSchoolId, rewardSearch]);

  const filteredArticles = useMemo(() => {
    // Artigos são mostrados se pertencerem à escola atual, se forem da 'school-1' ou se não tiverem escola (legado)
    const list = articles.filter(a => !targetSchoolId || a.schoolId === targetSchoolId || a.schoolId === 'school-1' || !a.schoolId);
    if (!articleSearch) return list;
    return list.filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase()));
  }, [articles, targetSchoolId, articleSearch]);

  const filteredAuditLogs = useMemo(() => {
    if (!targetSchoolId) return auditLogs;
    return auditLogs.filter(log => log.schoolId === targetSchoolId);
  }, [auditLogs, targetSchoolId]);

  // Estados para Busca e Filtros de Usuários
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'student' | 'admin' | 'visitor'>('student');
  const [userTurmaFilter, setUserTurmaFilter] = useState('all');

  // Estado para Geração de Crachá
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);
  const [badgeUser, setBadgeUser] = useState<User | null>(null);

  // Estados para Busca por Hardware no Admin
  const [isSearchQRScannerOpen, setIsSearchQRScannerOpen] = useState(false);

  // Garantir que apenas um scanner esteja aberto por vez
  useEffect(() => {
    if (isSearchQRScannerOpen) setIsQRScannerOpen(false);
  }, [isSearchQRScannerOpen]);

  useEffect(() => {
    if (isQRScannerOpen) setIsSearchQRScannerOpen(false);
  }, [isQRScannerOpen]);

  // Password Change State
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passFormData, setPassFormData] = useState({ currentPass: '', newPass: '', confirmPass: '' });

  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPass, newPass, confirmPass } = passFormData;

    if (newPass !== confirmPass) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    
    if (newPass.length < 6) {
      toast({ title: 'Erro', description: 'Senha muito curta.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Se for troca obrigatória, não precisa da senha atual (porque é o primeiro acesso/reset)
      if (!mustChangePass) {
        const hashedAuth = await EcosystemService.hashPassword(currentPass);
        if (currentUser?.password !== hashedAuth) {
          toast({ title: 'Erro', description: 'Sua senha atual está incorreta.', variant: 'destructive' });
          return;
        }
      }

      const hashedNew = await EcosystemService.hashPassword(newPass);
      const updatedUsers = users.map(u => u.id === (selectedItem?.id || currentUser?.id) ? { 
        ...u, 
        password: hashedNew,
        mustChangePassword: false 
      } : u);
      
      updateUsers(updatedUsers);
      
      toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso!' });
      setIsPasswordDialogOpen(false);
      setMustChangePass(false);
      setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar senha.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return filteredUsersForAdmin.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                           u.ra.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = u.role === userRoleFilter;
      const matchesTurma = userTurmaFilter === 'all' ? true : u.turma === userTurmaFilter;
      return matchesSearch && matchesRole && matchesTurma;
    });
  }, [filteredUsersForAdmin, userSearch, userRoleFilter, userTurmaFilter]);

  const userForm = useForm<UserFormValues>({ 
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', ra: '', rfid: '', turma: '', curso: '', role: 'student', password: '', confirmPassword: '' }
  });
  const rewardForm = useForm<RewardFormValues>({ 
    resolver: zodResolver(rewardSchema),
    defaultValues: { name: '', description: '', cost: 0, image: '', imageHint: '' }
  });
  const articleForm = useForm<ArticleFormValues>({ 
    resolver: zodResolver(articleSchema),
    defaultValues: { title: '', summary: '', content: '', image: '', imageHint: '', videoUrl: '' }
  });
  const participantForm = useForm<ParticipantFormValues>({ 
    resolver: zodResolver(participantSchema),
    defaultValues: { name: '', role: '', description: '', avatar: '', initials: '' }
  });

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    userForm.setValue('password', pass, { shouldValidate: true });
    userForm.setValue('confirmPassword', pass, { shouldValidate: true });
    toast({ 
      title: 'Senha Gerada!', 
      description: `Sua nova senha é: ${pass}. POR FAVOR, ANOTE ESTA SENHA EM UM LUGAR SEGURO! Ela não será mostrada novamente.` 
    });
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
    participantForm.reset();
    setIsQRScannerOpen(false);
    setIsRFIDCapturing(false);
    
    // Garantia absoluta de que o body está destravado
    document.body.style.pointerEvents = 'auto';
    document.body.style.overflow = 'auto';
  }

  // Limpeza de segurança periódica para garantir pointer-events auto
  useEffect(() => {
    if (viewMode === 'list') {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }
  }, [viewMode]);

  const handleNew = (type: 'user' | 'reward' | 'article' | 'participant') => {
    setSelectedItem(null);
    setItemType(type);
    setIsNew(true);
    setViewMode('form');
    
    if (type === 'user') {
      const defaultRole = userRoleFilter === 'admin' ? 'admin' : userRoleFilter === 'visitor' ? 'visitor' : 'student';
      userForm.reset({ 
        name: defaultRole === 'visitor' ? 'Visitante' : '', 
        email: '', 
        ra: '', 
        rfid: '', 
        turma: '', 
        curso: '', 
        position: '', 
        role: defaultRole as any, 
        password: '', 
        confirmPassword: '' 
      });
    }
    if (type === 'reward') rewardForm.reset({ name: '', description: '', cost: 0, image: '', imageHint: '' });
    if (type === 'article') articleForm.reset({ title: '', summary: '', content: '', image: '', imageHint: '', videoUrl: '' });
    if (type === 'participant') participantForm.reset({ name: '', role: '', description: '', avatar: '', initials: '' });
  };

  const handleEdit = (item: any, type: 'user' | 'reward' | 'article' | 'participant') => {
    setSelectedItem(item);
    setItemType(type);
    setIsNew(false);
    setViewMode('form');
    
    if (type === 'user') userForm.reset({ ...item, email: item.email || '', password: '', confirmPassword: '' });
    if (type === 'reward') rewardForm.reset(item);
    if (type === 'article') articleForm.reset(item);
    if (type === 'participant') participantForm.reset(item);
  };

  const handleDelete = (item: any, type: 'user' | 'reward' | 'article' | 'participant') => {
    setSelectedItem(item);
    setItemType(type);
    setIsDeleteConfirmOpen(true);
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
      closeAllForms();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o item.' });
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let payload = { ...values, schoolId: targetSchoolId };

      // Se a senha estiver vazia em uma edição, removemos do payload para manter a atual
      if (!isNew && itemType === 'user' && !values.password) {
        delete payload.password;
        delete payload.confirmPassword;
      }

      // Criptografa a senha se estiver sendo definida para um gestor
      if (itemType === 'user' && (values.role === 'admin' || values.role === 'super_admin') && payload.password) {
        // Apenas faz o hash se não for já um hash (64 chars)
        if (payload.password.length !== 64) {
          payload.password = await EcosystemService.hashPassword(payload.password);
          payload.confirmPassword = payload.password; 
        }
      }

      // Se for visitante, define o nome padrão se estiver vazio
      if (itemType === 'user' && values.role === 'visitor' && !values.name) {
        payload.name = 'Visitante';
      }

      if (itemType === 'user') {
        const newUsers = isNew 
          ? [...users, { ...payload, id: `user-${Date.now()}`, points: 0, level: 'Iniciante' } as User]
          : users.map(u => u.id === selectedItem.id ? { ...u, ...payload } : u);
        updateUsers(newUsers);
      } else if (itemType === 'reward') {
        const newRewards = isNew 
          ? [...rewards, { ...payload, id: `reward-${Date.now()}` } as Reward]
          : rewards.map(r => r.id === selectedItem.id ? { ...r, ...payload } : r);
        updateRewards(newRewards);
      } else if (itemType === 'article') {
        const newArticles = isNew 
          ? [...articles, { ...payload, id: `article-${Date.now()}`, slug: values.title.toLowerCase().replace(/ /g, '-') } as EducationArticle]
          : articles.map(a => a.id === selectedItem.id ? { ...a, ...payload } : a);
        updateArticles(newArticles);
      } else if (itemType === 'participant') {
        const newParticipants = isNew 
          ? [...participants, { ...payload, id: `participant-${Date.now()}` }]
          : participants.map(p => p.id === selectedItem.id ? { ...p, ...payload } : p);
        updateParticipants(newParticipants);
      }

      toast({ 
        title: isNew ? 'Item Adicionado!' : 'Item Atualizado!', 
        description: `${values.name || values.title} foi processado com sucesso.` 
      });
      closeAllForms();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as alterações.' });
    } finally {
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
    if (newTurma && !allTurmas.some(t => t.name === newTurma)) {
      updateTurmas([...allTurmas, { id: `turma-${Date.now()}`, name: newTurma, status: 'active' }]);
      setNewTurma('');
      toast({ title: 'Turma Adicionada!', description: `"${newTurma}" foi adicionada.` });
    }
  };

  const handleAddCurso = () => {
    if (newCurso && !allCursos.some(c => c.name === newCurso)) {
      updateCursos([...allCursos, { id: `curso-${Date.now()}`, name: newCurso, status: 'active' }]);
      setNewCurso('');
      toast({ title: 'Curso Adicionado!', description: `"${newCurso}" foi adicionado.` });
    }
  };

  // Polling para capturar RFID quando o modo de captura está ativo
  useEffect(() => {
    if (!isRFIDCapturing || viewMode !== 'form') return;

    const pollRFID = async () => {
      try {
        const res = await fetch(`/api/hardware/input?terminalId=${systemSettings.terminalId}`);
        const data = await res.json();
        if (data.ra) { // O hardware envia o código no campo 'ra'
          userForm.setValue('rfid', data.ra);
          setIsRFIDCapturing(false);
          toast({ title: 'RFID Capturado!', description: `Código ${data.ra} detectado.` });
        }
      } catch (e) {
        console.error("Erro no polling de RFID:", e);
      }
    };

    const interval = setInterval(pollRFID, 2000);
    return () => clearInterval(interval);
  }, [isRFIDCapturing, viewMode, itemType, systemSettings.terminalId, userForm, toast]);

  const handleGrantSubmit = () => {
    if (!grantRa || grantPointsValue <= 0 || !grantAction || !grantPassword) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preencha todos os campos, incluindo sua senha de gestor.' });
      return;
    }
    
    grantPoints(grantRa, grantPointsValue, grantSector, grantAction, currentUser?.name || 'Gestor', grantPassword).then(success => {
      if (success) {
        toast({ title: 'Pontos Atribuídos!', description: `${grantPointsValue} pontos foram dados para o aluno por: ${grantAction}.` });
        setGrantRa('');
        setGrantPointsValue(0);
        setGrantAction('');
        setGrantPassword('');
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Senha incorreta ou falha no sistema.' });
      }
    });
  };

  const handleBadgePrint = (userToPrint: any) => {
    const badgeElement = document.getElementById(`badge-${userToPrint.id}`);
    if (!badgeElement) return;

    const printWindow = window.open('', '_blank', 'width=850,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir a carteira.');
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Carteira</title>
          ${styles}
          <style>
            @media print {
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; }
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background-color: white !important;
            }
            .print-container {
              transform: scale(1.5);
              transform-origin: center center;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${badgeElement.outerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!hasMounted) return null;
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-muted-foreground">Área exclusiva para gestores e administradores.</p>
        </div>
        <Button asChild size="lg"><Link href="/dashboard">Voltar para o Painel</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* BANNER DE CONTEXTO DO SUPER ADMIN */}
      {currentUser?.role === 'super_admin' && searchParams.has('schoolId') && (
        <div className="bg-slate-900 text-white px-6 py-2 flex justify-between items-center sticky top-0 z-50 shadow-xl border-b border-white/10 animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
                 <Shield className="h-3 w-3 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                 Modo de Gestão: <span className="text-red-500">{schools.find(s => s.id === targetSchoolId)?.name}</span>
              </p>
           </div>
        </div>
      )}

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" /> Painel do Gestor
            </h1>
            <p className="text-muted-foreground font-medium">Gestão Operacional: {schools.find(s => s.id === currentUser.schoolId)?.name || 'Unidade SchoolGain'}</p>
          </div>
          {currentUser.role === 'super_admin' && (
            <Button asChild variant="outline" size="sm" className="bg-slate-900 text-white hover:bg-black hover:text-white gap-2">
              <Link href="/super-admin"><Globe className="h-4 w-4" /> Central de Rede</Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1 bg-slate-100 p-1">
            <TabsTrigger value="infra" className="uppercase font-black text-[10px] tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Cpu className="mr-2 h-4 w-4"/> Infraestrutura (IoT)
            </TabsTrigger>
            <TabsTrigger value="academic" className="uppercase font-black text-[10px] tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <UserPlus className="mr-2 h-4 w-4"/> Setor Acadêmico
            </TabsTrigger>
            <TabsTrigger value="pedagogic" className="uppercase font-black text-[10px] tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <BookOpen className="mr-2 h-4 w-4"/> Setor Pedagógico
            </TabsTrigger>
            <TabsTrigger value="economic" className="uppercase font-black text-[10px] tracking-widest py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Gift className="mr-2 h-4 w-4"/> Setor Econômico
            </TabsTrigger>
        </TabsList>
        
        <TabsContent value="academic" className="space-y-6">
          {viewMode === 'form' && itemType === 'user' ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
                <div>
                  <CardTitle>{isNew ? 'Cadastrar Novo Aluno' : 'Editar Dados do Aluno'}</CardTitle>
                  <CardDescription>Preencha as informações de identificação e escolaridade.</CardDescription>
                </div>
                <Button variant="ghost" onClick={closeAllForms}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para a Lista</Button>
              </CardHeader>
              <CardContent className="pt-6 bg-white/30">
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userForm.watch('role') !== 'visitor' ? (
                        <FormField control={userForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} placeholder="Ex: João Silva" className="bg-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                      ) : (
                        <div className="space-y-2">
                          <Label>Perfil de Visitante</Label>
                          <Input value="Visitante (Padrão)" disabled className="bg-slate-50 text-muted-foreground" />
                        </div>
                      )}
                      {userForm.watch('role') === 'admin' && (
                        <FormField control={userForm.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>E-mail de Acesso</FormLabel><FormControl><Input {...field} type="email" placeholder="gestor@escola.com" className="bg-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex gap-4 items-end">
                                <FormField control={userForm.control} name="ra" render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>RA (Identificação QR)</FormLabel>
                                    <FormControl><Input {...field} className="bg-white font-mono" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )} />
                                <Button type="button" variant="outline" size="icon" className={`mb-[2px] ${isQRScannerOpen ? 'bg-primary text-white' : 'bg-white'}`} onClick={() => setIsQRScannerOpen(!isQRScannerOpen)}>
                                    <QrCode className="h-4 w-4" />
                                </Button>
                            </div>

                            {isQRScannerOpen && (
                                <div className="border-2 border-primary rounded-lg p-2 bg-black space-y-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] text-white font-bold uppercase tracking-widest">Câmera Ativa: Aponte o QR Code</span>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:text-red-400" onClick={() => setIsQRScannerOpen(false)}>×</Button>
                                    </div>
                                    <QRScanner onScan={(text) => {
                                        userForm.setValue('ra', text);
                                        setIsQRScannerOpen(false);
                                        toast({ title: 'RA Capturado!', description: `Código: ${text}` });
                                    }} />
                                </div>
                            )}

                            {userForm.watch('role') !== 'visitor' && (
                                <div className="flex gap-4 items-end">
                                    <FormField control={userForm.control} name="rfid" render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>ID do Cartão (RFID)</FormLabel>
                                        <FormControl><Input {...field} placeholder="Aguardando aproximação..." className="bg-white font-mono" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )} />
                                    <Button type="button" variant={isRFIDCapturing ? 'destructive' : 'outline'} size="icon" className={`mb-[2px] ${isRFIDCapturing ? 'animate-pulse' : 'bg-white'}`} onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}>
                                        <Rss className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {userForm.watch('role') === 'admin' && (
                              <FormField control={userForm.control} name="position" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cargo Administrativo</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Diretoria">Diretoria</SelectItem>
                                      <SelectItem value="Coordenação">Coordenação</SelectItem>
                                      <SelectItem value="TI">Tecnologia da Informação (TI)</SelectItem>
                                      <SelectItem value="Financeiro">Financeiro / Administrativo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            )}

                            {userForm.watch('role') !== 'visitor' && (
                              <FormField control={userForm.control} name="turma" render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>{userForm.watch('role') === 'student' ? 'Turma' : 'Setor / Departamento'}</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                          <SelectContent>
                                              {userForm.watch('role') === 'student' ? (
                                                  allTurmas.filter(t => t.status === 'active').map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)
                                              ) : (
                                                  <>
                                                      <SelectItem value="Diretoria">Diretoria</SelectItem>
                                                      <SelectItem value="Coordenação">Coordenação</SelectItem>
                                                      <SelectItem value="Administrativo">Administrativo</SelectItem>
                                                      <SelectItem value="TI">TI / Suporte</SelectItem>
                                                      <SelectItem value="Operacional">Operacional</SelectItem>
                                                  </>
                                              )}
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                              )} />
                            )}
                            {userForm.watch('role') === 'student' && (
                              <FormField control={userForm.control} name="curso" render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Curso</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                                          <SelectContent>
                                              {allCursos.filter(c => c.status === 'active' && c.name !== 'Gestão Escolar').map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                              )} />
                            )}
                            {/* Cargo no Sistema unificado com Cargo Administrativo e oculto para visitantes */}
                            {userForm.watch('role') === 'admin' && isNew && (
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex justify-between items-center">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha Inicial</Label>
                                  <Button type="button" variant="ghost" size="sm" onClick={generateStrongPassword} className="h-7 text-[10px] font-bold uppercase tracking-tighter text-primary">
                                    <Sparkles className="h-3 w-3 mr-1" /> Gerar Forte
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={userForm.control} name="password" render={({ field }) => (
                                    <FormItem><FormLabel>Definir Senha</FormLabel><FormControl><Input {...field} type="password" placeholder="Mínimo 6 caracteres" className="bg-white" /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                                    <FormItem><FormLabel>Confirmar</FormLabel><FormControl><Input {...field} type="password" placeholder="Repita a senha" className="bg-white" /></FormControl><FormMessage /></FormItem>
                                  )} />
                                </div>
                              </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t mt-6">
                        <Button type="button" variant="ghost" onClick={closeAllForms} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" size="lg" disabled={isSubmitting} className="px-8">{isSubmitting ? 'Salvando...' : 'Confirmar e Salvar'}</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Turmas</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2"><Input placeholder="Ex: 1ª Série" value={newTurma} onChange={(e) => setNewTurma(e.target.value)} /><Button onClick={handleAddTurma}>+</Button></div>
                        <div className="flex flex-wrap gap-2">{allTurmas.map(t => <Badge key={t.id} variant="outline" className={`text-[10px] ${t.status === 'inactive' ? 'opacity-40' : ''}`}>{t.name}</Badge>)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Cursos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2"><Input placeholder="Ex: Técnico em TDS" value={newCurso} onChange={(e) => setNewCurso(e.target.value)} /><Button onClick={handleAddCurso}>+</Button></div>
                        <div className="flex flex-wrap gap-2">{allCursos.map(c => <Badge key={c.id} variant="outline" className={`text-[10px] ${c.status === 'inactive' ? 'opacity-40' : ''}`}>{c.name}</Badge>)}</div>
                    </CardContent>
                </Card>
              </div>

              <Card>
                {/* MODAL DE CARTEIRA */}
                <Dialog open={isBadgeOpen} onOpenChange={setIsBadgeOpen}>
                  <DialogContent className="max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Gerar Identificador</DialogTitle>
                      <CardDescription>Visualize e imprima a Carteira do sistema.</CardDescription>
                    </DialogHeader>
                    <div className="py-4">
                      {badgeUser && <PrintableBadge user={badgeUser} />}
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-center">
                      <Button variant="outline" onClick={() => setIsBadgeOpen(false)}>Fechar</Button>
                      <Button onClick={() => handleBadgePrint(badgeUser)} className="gap-2">
                        <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Usuários</CardTitle>
                    <CardDescription>Gestão de alunos e equipe escolar.</CardDescription>
                  </div>
                  {targetSchoolId && (
                    <Button onClick={() => handleNew('user')} className="bg-primary hover:bg-primary/90 shadow-md transition-all">
                      <UserPlus className="mr-2 h-4 w-4" />Novo {userRoleFilter === 'admin' ? 'Gestor' : userRoleFilter === 'visitor' ? 'Visitante' : 'Aluno'}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* BARRA DE FERRAMENTAS DE BUSCA E FILTRO */}
                  <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                    <div className="flex-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Pesquisar</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input 
                              placeholder="Buscar por nome ou RA..." 
                              value={userSearch} 
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="bg-white pr-10"
                            />
                            {userSearch && (
                              <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold">×</button>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={`bg-white shrink-0 ${isSearchQRScannerOpen ? 'border-primary text-primary' : ''}`}
                            onClick={() => setIsSearchQRScannerOpen(!isSearchQRScannerOpen)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-64">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Filtrar por Turma</Label>
                        <Select value={userTurmaFilter} onValueChange={setUserTurmaFilter}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Todas as Turmas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as Turmas</SelectItem>
                            {allTurmas.map(t => (
                              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                  </div>

                  {/* SUB-ABAS PARA SEPARAR ALUNOS E GESTORES */}
                  <Tabs value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="student" className="gap-2 uppercase font-black text-[10px] tracking-widest">Alunos ({users.filter(u => u.role === 'student').length})</TabsTrigger>
                      <TabsTrigger value="admin" className="gap-2 uppercase font-black text-[10px] tracking-widest">Gestores ({users.filter(u => u.role === 'admin').length})</TabsTrigger>
                      <TabsTrigger value="visitor" className="gap-2 uppercase font-black text-[10px] tracking-widest">Visitantes ({users.filter(u => u.role === 'visitor').length})</TabsTrigger>
                    </TabsList>
                    
                    <div className="rounded-md border bg-white overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-black uppercase text-[10px] tracking-wider">Nome</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-wider">RA / ID</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-wider">Turma / Setor</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-wider">Status</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-wider">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                            <TableRow key={user.id} className={isDeleteConfirmOpen && selectedItem?.id === user.id ? 'bg-red-50' : 'hover:bg-slate-50 transition-colors'}>
                              <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                              <TableCell className="font-mono text-xs">{user.ra}</TableCell>
                              <TableCell className="text-slate-600">
                                {user.position ? (
                                  <div className="flex flex-col">
                                    <span className="font-bold text-primary text-[10px] uppercase">{user.position}</span>
                                    <span className="text-[11px]">{user.turma}</span>
                                  </div>
                                ) : user.turma}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest">
                                  {user.role === 'super_admin' ? 'Rede' : user.role === 'admin' ? 'Gestor' : user.role === 'visitor' ? 'Visitante' : 'Aluno'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => { setBadgeUser(user as any); setIsBadgeOpen(true); }} className="h-8 px-2 gap-1 text-[10px] uppercase font-black tracking-tighter">
                                    <QrCode className="h-3 w-3" /> Carteira
                                  </Button>
                                  <div className="flex justify-end gap-2">
                                     {user.role === 'admin' && (
                                       <Button 
                                         variant="ghost" 
                                         size="icon" 
                                         title="Trocar Senha"
                                         className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                         onClick={() => {
                                           setSelectedItem(user);
                                           setIsPasswordDialogOpen(true);
                                         }}
                                       >
                                          <Lock className="h-4 w-4" />
                                       </Button>
                                     )}
                                     <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       title="Editar"
                                       className="h-8 w-8 text-slate-400 hover:text-slate-900"
                                       onClick={() => handleEdit(user, 'user')}
                                     >
                                        <Edit className="h-4 w-4" />
                                     </Button>
                                     <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       title="Excluir"
                                       className="h-8 w-8 text-slate-400 hover:text-red-600"
                                       onClick={() => handleDelete(user, 'user')}
                                     >
                                        <Trash2 className="h-4 w-4" />
                                     </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic uppercase text-xs tracking-widest">
                                Nenhum {userRoleFilter === 'admin' ? 'gestor' : 'aluno'} encontrado para os filtros atuais.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Tabs>

                  {isDeleteConfirmOpen && itemType === 'user' && selectedItem && (
                    <div className="mt-4 p-4 border-2 border-red-200 bg-red-50 rounded-xl animate-in slide-in-from-bottom duration-300">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm"><Trash2 className="h-5 w-5" /></div>
                              <div>
                                  <p className="font-bold text-red-900">Confirmar exclusão de "{selectedItem.name}"?</p>
                                  <p className="text-[10px] text-red-700 uppercase font-black tracking-widest">Ação irreversível no banco de dados.</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)} className="bg-white">Cancelar</Button>
                              <Button variant="destructive" size="sm" onClick={onConfirmDelete} className="font-bold uppercase tracking-widest text-[10px]">Excluir Definitivamente</Button>
                          </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="infra" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black text-sm">
                  <Cpu className="h-5 w-5 text-primary" /> Identificação e Sensores
                </CardTitle>
                <CardDescription>Configure como os terminais físicos interagem com o sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Método de Identificação Ativo</Label>
                  <Select 
                    value={systemSettings.loginMethod} 
                    onValueChange={(v: any) => updateSystemSettings({...systemSettings, loginMethod: v})}
                  >
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Múltiplos (QR, RFID, Manual)</SelectItem>
                      <SelectItem value="manual">Apenas Manual (RA)</SelectItem>
                      <SelectItem value="qr">Apenas QR Code</SelectItem>
                      <SelectItem value="rfid">Apenas RFID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fonte da Câmera (Login QR)</Label>
                  <Select 
                    value={systemSettings.loginCameraSource} 
                    onValueChange={(v: any) => updateSystemSettings({...systemSettings, loginCameraSource: v})}
                  >
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Webcam do Computador</SelectItem>
                      <SelectItem value="esp32">ESP32-CAM (Externo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black text-sm">
                  <Monitor className="h-5 w-5 text-primary" /> Visão Computacional
                </CardTitle>
                <CardDescription>Fonte de captura para identificação de resíduos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fonte da Câmera (Scanner de Lixo)</Label>
                  <Select 
                    value={systemSettings.scanningCameraSource} 
                    onValueChange={(v: any) => updateSystemSettings({...systemSettings, scanningCameraSource: v})}
                  >
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Webcam do Computador</SelectItem>
                      <SelectItem value="esp32">ESP32-CAM (Externo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-[10px] text-slate-400 font-mono">
                  Endpoint IoT: /api/hardware/input
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black text-sm"><Monitor className="h-5 w-5 text-primary" /> Gestão de Totens</CardTitle>
                  <CardDescription>Gerencie terminais físicos e solicitações de acesso da sua unidade.</CardDescription>
                </div>
                <Badge variant="outline" className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Rede Conectada
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SOLICITAÇÕES PENDENTES */}
                {filteredTerminalsForAdmin.filter(t => t.status === 'pending').length > 0 && (
                   <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                         <ShieldAlert className="h-4 w-4" /> Solicitações Pendentes
                      </h3>
                      <div className="grid gap-4">
                        {filteredTerminalsForAdmin.filter(t => t.status === 'pending').map(terminal => (
                           <div key={terminal.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <Monitor className="h-5 w-5" />
                                 </div>
                                 <div>
                                    <p className="font-bold text-amber-900 leading-none mb-1">{terminal.location}</p>
                                    <p className="text-[10px] font-mono text-amber-700">Hardware ID: {terminal.hardwareId}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <Button size="sm" variant="outline" onClick={() => deleteTerminal(terminal.id)} className="bg-white text-red-600 border-red-200">Recusar</Button>
                                 <Button size="sm" onClick={() => {
                                    updateTerminalStatus(terminal.id, 'active', currentUser.schoolId);
                                    toast({ title: "Terminal Autorizado", description: `O totem em ${terminal.location} está ativo.` });
                                 }} className="bg-amber-600 hover:bg-amber-700">Autorizar Acesso</Button>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* TABELA DE TERMINAIS ATIVOS */}
                <div className="space-y-4">
                  <div className="rounded-md border bg-white overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-black uppercase text-[10px] tracking-wider">Localização</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-wider text-right">Status</TableHead>
                          <TableHead className="text-right font-black uppercase text-[10px] tracking-wider">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTerminalsForAdmin.filter(t => t.status !== 'pending').length > 0 ? filteredTerminalsForAdmin.filter(t => t.status !== 'pending').map((terminal) => (
                          <TableRow key={terminal.id}>
                            <TableCell className="font-bold text-slate-900">{terminal.location}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={terminal.status === 'active' ? 'default' : 'secondary'} className={`uppercase text-[9px] font-black tracking-widest ${terminal.status === 'active' ? 'bg-emerald-500' : ''}`}>
                                {terminal.status === 'active' ? 'Online' : 'Offline'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <Button variant="ghost" size="sm" onClick={() => deleteTerminal(terminal.id)} className="text-red-600 h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic text-xs uppercase tracking-widest">
                               Nenhum terminal cadastrado nesta unidade.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
           </Card>
        </TabsContent>


        <TabsContent value="economic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-emerald-900 text-white overflow-hidden relative">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-400 opacity-80">Saldo da Unidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black">{users.reduce((acc, curr) => acc + (curr.points || 0), 0).toLocaleString('pt-BR')}</span>
                          <span className="text-xs font-bold text-emerald-400">BIO-COINS</span>
                      </div>
                      <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><Leaf className="h-32 w-32" /></div>
                  </CardContent>
              </Card>
              <Card className="bg-slate-900 text-white">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Total de Prêmios</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black">{rewards.length}</span>
                          <span className="text-xs font-bold text-slate-400">ATIVOS</span>
                      </div>
                  </CardContent>
              </Card>
              <Card className="bg-slate-900 text-white">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Transações</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black">{auditLogs.length}</span>
                          <span className="text-xs font-bold text-slate-400">REGISTROS</span>
                      </div>
                  </CardContent>
              </Card>
          </div>

          {viewMode === 'form' && itemType === 'reward' ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
                <div><CardTitle>{isNew ? 'Nova Recompensa' : 'Editar Recompensa'}</CardTitle><CardDescription>Defina o prêmio e o custo em Bio-Coins.</CardDescription></div>
                <Button variant="ghost" onClick={closeAllForms}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...rewardForm}><form onSubmit={rewardForm.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
                  <FormField control={rewardForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome do Prêmio</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={rewardForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Descrição Detalhada</FormLabel><FormControl><Textarea {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={rewardForm.control} name="cost" render={({ field }) => (
                      <FormItem><FormLabel>Custo (Bio-Coins)</FormLabel><FormControl><Input type="number" {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={rewardForm.control} name="imageHint" render={({ field }) => (
                      <FormItem><FormLabel>Dica Visual (Emoji/Icon)</FormLabel><FormControl><Input {...field} placeholder="Ex: 🎁" className="bg-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={rewardForm.control} name="image" render={({ field }) => (
                    <FormItem><FormLabel>URL da Imagem Ilustrativa</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <Button type="button" variant="ghost" onClick={closeAllForms}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Recompensa'}</Button>
                  </div>
                </form></Form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
                {/* RECONHECIMENTO DE MÉRITO (NOVO POSITION) */}
                <Card className="border-emerald-100 shadow-sm bg-emerald-50/20">
                  <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 uppercase tracking-tighter text-emerald-700 font-black text-sm"><Leaf className="h-5 w-5" /> Reconhecimento de Mérito</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identificar Aluno (RA)</Label>
                        <Select onValueChange={setGrantRa} value={grantRa}>
                          <SelectTrigger className="bg-white border-emerald-200"><SelectValue placeholder="Selecione o aluno..." /></SelectTrigger>
                          <SelectContent>{filteredUsersForAdmin.filter(u => u.role === 'student').map(u => <SelectItem key={u.id} value={u.ra || ''}>{u.name} ({u.ra})</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição da Ação</Label>
                        <Input placeholder="Ex: Ajudou na horta..." value={grantAction} onChange={(e) => setGrantAction(e.target.value)} className="bg-white border-emerald-200" />
                      </div>
                      <div className="md:col-span-1 flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">PTS</Label>
                          <Input type="number" value={grantPointsValue} onChange={(e) => setGrantPointsValue(Number(e.target.value))} className="bg-white border-emerald-200" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Sua Senha (Gestor)</Label>
                          <Input type="password" value={grantPassword} onChange={(e) => setGrantPassword(e.target.value)} placeholder="Confirme para autorizar" className="bg-white border-emerald-200" />
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleGrantSubmit}><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Recompensas</CardTitle><CardDescription>Catálogo de prêmios por pontos.</CardDescription></div>
                    <Button onClick={() => handleNew('reward')}><Gift className="mr-2 h-4 w-4" />Nova Recompensa</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Pesquisar Prêmio</Label>
                       <Input placeholder="Buscar por nome..." value={rewardSearch} onChange={(e) => setRewardSearch(e.target.value)} className="bg-white" />
                    </div>
                    
                    {isDeleteConfirmOpen && itemType === 'reward' && selectedItem && (
                      <div className="mb-6 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-red-900">Excluir "{selectedItem.name}"?</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>Não</Button>
                                <Button variant="destructive" size="sm" onClick={onConfirmDelete}>Sim, Excluir</Button>
                            </div>
                        </div>
                      </div>
                    )}
                    <Table>
                      <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Custo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredRewards.length > 0 ? filteredRewards.map((reward) => (
                          <TableRow key={reward.id} className={isDeleteConfirmOpen && selectedItem?.id === reward.id ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium">{reward.name}</TableCell>
                            <TableCell>{reward.cost} Bio-Coins</TableCell>
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
                        )) : (
                          <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">Nenhuma recompensa encontrada.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 uppercase tracking-tighter"><History className="h-6 w-6 text-primary" /> Histórico de Transações</CardTitle><CardDescription>Auditoria completa de atribuição de pontos na unidade.</CardDescription></CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Aluno</TableHead><TableHead>Ação Realizada</TableHead><TableHead>Setor</TableHead><TableHead>Gestor</TableHead><TableHead className="text-right">Bônus</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {filteredAuditLogs.map((log) => (
                            <TableRow key={log.id}>
                            <TableCell className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="font-bold">{log.studentName}</TableCell>
                            <TableCell className="text-xs italic text-slate-600">{log.action}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">{log.sector}</Badge></TableCell>
                            <TableCell className="italic text-slate-400 text-xs">{log.adminName}</TableCell>
                            <TableCell className="text-right font-black text-emerald-600">+{log.points} PTS</TableCell>
                            </TableRow>
                        ))}
                        {filteredAuditLogs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 uppercase text-[10px] font-black tracking-widest">Sem transações registradas nesta unidade.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pedagogic" className="space-y-6">
          <Card>
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Tópicos de Quiz</CardTitle><CardDescription>Geração automática de desafios para os alunos.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex gap-2">
                      <Input placeholder="Novo tópico (ex: Reciclagem)" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} className="bg-white" />
                      <Button onClick={handleAddTopic}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {quizTopics.map((topic) => (
                          <Badge key={topic} variant="secondary" className="pr-1 bg-white border border-slate-200 text-slate-700 font-bold">{topic}<Button size="icon" variant="ghost" className="h-4 w-4 ml-1 hover:text-red-500" onClick={() => handleDeleteTopic(topic)}><Trash2 className="h-3 w-3"/></Button></Badge>
                      ))}
                  </div>
              </CardContent>
          </Card>

          {viewMode === 'form' && itemType === 'article' ? (
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={articleForm.control} name="image" render={({ field }) => (
                      <FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={articleForm.control} name="imageHint" render={({ field }) => (
                      <FormItem><FormLabel>Emoji/Dica</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={articleForm.control} name="videoUrl" render={({ field }) => (
                    <FormItem><FormLabel>URL do Vídeo (Opcional)</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <Button type="button" variant="ghost" onClick={closeAllForms}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Publicar Artigo'}</Button>
                  </div>
                </form></Form>
              </CardContent>
            </Card>
          ) : (
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

                {isDeleteConfirmOpen && itemType === 'article' && selectedItem && (
                  <div className="mb-6 p-4 border-2 border-red-200 bg-red-50 rounded-lg flex items-center justify-between">
                    <p className="font-bold text-red-900">Remover artigo "{selectedItem.title}"?</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>Não</Button>
                      <Button variant="destructive" size="sm" onClick={onConfirmDelete}>Sim, Remover</Button>
                    </div>
                  </div>
                )}
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
          )}
        </TabsContent>





        <TabsContent value="about">
          {viewMode === 'form' && itemType === 'participant' ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
                <div><CardTitle>{isNew ? 'Novo Membro' : 'Editar Membro'}</CardTitle><CardDescription>Dados da equipe de desenvolvimento.</CardDescription></div>
                <Button variant="ghost" onClick={closeAllForms}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...participantForm}><form onSubmit={participantForm.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
                  <FormField control={participantForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={participantForm.control} name="role" render={({ field }) => (
                      <FormItem><FormLabel>Cargo/Função</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={participantForm.control} name="initials" render={({ field }) => (
                      <FormItem><FormLabel>Iniciais (2-3 letras)</FormLabel><FormControl><Input {...field} maxLength={3} className="bg-white uppercase" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={participantForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Bio/Descrição</FormLabel><FormControl><Textarea {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={participantForm.control} name="avatar" render={({ field }) => (
                    <FormItem><FormLabel>URL da Foto</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <Button type="button" variant="ghost" onClick={closeAllForms}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Membro'}</Button>
                  </div>
                </form></Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Equipe do Projeto</CardTitle><CardDescription>Membros responsáveis pelo software.</CardDescription></div>
                <Button onClick={() => handleNew('participant')}><UserPlus className="mr-2 h-4 w-4" />Novo Membro</Button>
              </CardHeader>
              <CardContent>
                {isDeleteConfirmOpen && itemType === 'participant' && selectedItem && (
                  <div className="mb-6 p-4 border-2 border-red-200 bg-red-50 rounded-lg flex items-center justify-between">
                    <p className="font-bold text-red-900">Remover "{selectedItem.name}" da equipe?</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>Não</Button>
                      <Button variant="destructive" size="sm" onClick={onConfirmDelete}>Sim, Remover</Button>
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {participants.map((person) => (
                      <TableRow key={person.id} className={isDeleteConfirmOpen && selectedItem?.id === person.id ? 'bg-red-50' : ''}>
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
          )}
        </TabsContent>
      </Tabs>
      </div>
      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
        setIsPasswordDialogOpen(open);
        if (!open) {
          setSelectedItem(null);
          setPassFormData({ currentPass: '', newPass: '', confirmPass: '' });
        }
      }}>
        <DialogContent>
           <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Alterar Senha: {selectedItem?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedItem?.id === currentUser?.id 
                  ? 'Confirme sua senha atual para definir uma nova.' 
                  : 'Digite SUA SENHA de Gestor para autorizar o reset.'}
              </DialogDescription>
           </DialogHeader>
           <form onSubmit={handleUpdateUserPassword} className="space-y-4 pt-4">
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sua Senha de Gestor (Autorização)</Label>
                 <Input 
                   type="password"
                   required 
                   value={passFormData.currentPass}
                   onChange={e => setPassFormData({...passFormData, currentPass: e.target.value})}
                   placeholder="Digite sua senha"
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Senha</Label>
                    <Input 
                      type="password"
                      required
                      value={passFormData.newPass}
                      onChange={e => setPassFormData({...passFormData, newPass: e.target.value})}
                      placeholder="Mínimo 6 chars"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmar</Label>
                    <Input 
                      type="password"
                      required
                      value={passFormData.confirmPass}
                      onChange={e => setPassFormData({...passFormData, confirmPass: e.target.value})}
                      placeholder="Repita a senha"
                    />
                 </div>
              </div>
              <DialogFooter className="pt-4">
                 <Button type="submit" disabled={isSubmitting} className="w-full bg-primary font-black uppercase text-xs tracking-widest">
                    {isSubmitting ? 'Atualizando...' : 'Confirmar Nova Senha'}
                 </Button>
              </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>

      {/* BLOQUEIO DE SEGURANÇA: TROCA OBRIGATÓRIA DE SENHA */}
      <Dialog open={mustChangePass} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-2 border-primary bg-slate-50">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2 text-primary">
                <ShieldCheck className="h-6 w-6" /> Segurança: Primeiro Acesso
              </DialogTitle>
              <DialogDescription className="text-slate-700 font-medium">
                Sua conta passou por um reset administrativo ou é um novo cadastro. 
                <strong> Defina sua senha pessoal agora para continuar.</strong>
              </DialogDescription>
           </DialogHeader>
           
           <form onSubmit={handleUpdateUserPassword} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nova Senha Pessoal</Label>
                    <Input 
                      type="password"
                      required
                      value={passFormData.newPass}
                      onChange={e => setPassFormData({...passFormData, newPass: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-white border-slate-300"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirmar Nova Senha</Label>
                    <Input 
                      type="password"
                      required
                      value={passFormData.confirmPass}
                      onChange={e => setPassFormData({...passFormData, confirmPass: e.target.value})}
                      placeholder="Repita a senha"
                      className="bg-white border-slate-300"
                    />
                 </div>
              </div>
              <DialogFooter className="pt-4">
                 <Button type="submit" disabled={isSubmitting} className="w-full bg-primary font-black uppercase text-xs tracking-widest h-12">
                    {isSubmitting ? 'Salvando...' : 'Definir Senha e Acessar Painel'}
                 </Button>
              </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando gerenciamento...</div>}>
      <AdminContent />
    </Suspense>
  );
}
