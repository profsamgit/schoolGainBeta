'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ADMIN_MOCK } from '@/lib/data';
import {
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User as UserIcon,
  Leaf,
  Trophy,
  BookOpen,
  BrainCircuit,
  Gift,
  Sun,
  Moon,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { EcosystemService } from '@/lib/ecosystem.service';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import React, { useState, useEffect, useMemo } from 'react';

const pathToTitle: { [key: string]: string } = {
  dashboard: 'Dashboard',
  waste: 'Registro de Resíduo',
  leaderboard: 'Ranking',
  education: 'Educação',
  quiz: 'Quizzes',
  rewards: 'Recompensas',
  admin: 'Gerenciamento',
  'meu-ecossistema': 'Meu Ecossistema',
};

const getPageHelp = (pathname: string, tab: string | null) => {
  if (pathname.includes('/super-admin')) {
    return {
      title: "Central de Rede Global",
      description: "Gerenciamento corporativo e visão macro de todas as unidades escolares da rede.",
      tips: [
        { label: "Visão Geral", desc: "Acompanhe os totais acumulados de resíduos, moedas emitidas e engajamento global de todas as escolas cadastradas." },
        { label: "Cadastrar Escolas", desc: "Adicione novas escolas à rede gerando seus IDs únicos de rastreamento corporativo." },
        { label: "Modo Auditoria", desc: "Clique para auditar dados específicos de uma escola ou simular o acesso como gestor daquela unidade." }
      ]
    };
  }

  if (pathname.includes('/admin/dashboard')) {
    return {
      title: "Painel de Gestão (Dashboard)",
      description: "Centro de controle inteligente com métricas e dados consolidados da unidade.",
      tips: [
        { label: "Métricas Principais", desc: "Monitore o volume total de resíduos coletados (kg), número de alunos engajados, totens ativos e solicitações pendentes." },
        { label: "Metas de Coleta", desc: "Acompanhe o cumprimento dos objetivos mensais de reciclagem e engajamento estudantil." },
        { label: "Modo Monitor/TV", desc: "Clique no ícone de expandir (tela cheia) no topo para colocar o painel em exibição contínua na escola." },
        { label: "Sincronização", desc: "Ajuste o seletor para atualizar os dados automaticamente (ex: a cada 5s ou 15s) ou manualmente." }
      ]
    };
  }

  if (pathname.includes('/admin')) {
    const activeTab = tab || 'povoamento';
    if (activeTab === 'povoamento') {
      return {
        title: "Povoamento e Estrutura",
        description: "Defina os alicerces estruturais e organizacionais da sua escola.",
        tips: [
          { label: "Turmas e Cursos", desc: "Cadastre as turmas (ex: 1º Ano A) e os cursos técnicos antes de importar ou registrar os alunos." },
          { label: "Cargos e Setores", desc: "Cadastre as funções funcionais e setores (ex: Limpeza, Coordenação) para organizar a equipe e os voluntários." },
          { label: "Cadastro Seguro", desc: "Certifique-se de que a estrutura básica esteja pronta aqui antes de cadastrar pessoas para evitar erros de vínculo." }
        ]
      };
    }
    if (activeTab === 'academic') {
      return {
        title: "Corpo Acadêmico (Membros)",
        description: "Administre o cadastro de alunos, funcionários, gestores e visitantes.",
        tips: [
          { label: "Aprovar Cadastros", desc: "Veja a lista de solicitações pendentes de alunos que se registraram pelo Totem e aprove-os com segurança." },
          { label: "RFID e QR Code", desc: "Vincule cartões de aproximação RFID no cadastro dos alunos e visualize ou imprima seus crachás com QR Code." },
          { label: "Status de Acesso", desc: "Use a chave Liga/Desliga para bloquear ou ativar o acesso de qualquer usuário imediatamente." },
          { label: "Chave Mestra", desc: "Toda alteração de dados sensíveis ou exclusão exige a confirmação de sua senha de gestor por motivos de segurança." }
        ]
      };
    }
    if (activeTab === 'pedagogic') {
      return {
        title: "Integração Pedagógica (IA + Temas)",
        description: "Alimente a Inteligência Artificial e publique artigos educativos.",
        tips: [
          { label: "Tópicos Ambientais", desc: "Cadastre os temas ecológicos ativos na escola (ex: Reciclagem, Consumo Consciente). Eles guiam a IA." },
          { label: "Gerar Quizzes", desc: "Os quizzes para os alunos são gerados de forma autônoma pelo Gemini, baseando-se estritamente nos tópicos ativos." },
          { label: "Gerar com IA", desc: "Clique neste botão para que a inteligência artificial do Gemini crie e publique automaticamente um artigo completo sobre um de seus tópicos." },
          { label: "Biblioteca", desc: "Crie ou edite artigos manualmente e acompanhe o histórico de leitura e pontuação dos alunos." }
        ]
      };
    }
    if (activeTab === 'economic') {
      return {
        title: "Gestão Econômica e Bioshop",
        description: "Administre a pontuação dos alunos, o catálogo de prêmios e audite transações.",
        tips: [
          { label: "Reconhecimento de Mérito", desc: "Conceda Bio-Coins ou XP adicionais de forma manual para incentivar alunos engajados (ex: ajudou na horta)." },
          { label: "Cadastrar Prêmios", desc: "Cadastre recompensas na Bioshop, defina os preços em Bio-Coins e adicione imagens e ícones atrativos." },
          { label: "Histórico de Transações", desc: "Audite todas as emissões de moedas por descarte, quiz, bônus manual ou resgates efetuados pelos alunos." }
        ]
      };
    }
    if (activeTab === 'infra') {
      return {
        title: "Configurações de Hardware e IoT",
        description: "Controle as conexões físicas dos totens e placas ESP32-CAM.",
        tips: [
          { label: "Origem de Vídeo", desc: "Configure se o Totem usará a webcam do computador local, o IP direto da ESP32-CAM, ou o Proxy HTTPS Seguro (porta 9005)." },
          { label: "Proxy Local Seguro", desc: "Caso o sistema esteja rodando em HTTPS na nuvem, ative o Proxy local para permitir que o navegador assista à transmissão da ESP32 sem bloqueios de rede." },
          { label: "Monitor Serial de Rede", desc: "Conecte-se às placas e visualize os logs de console enviados via UDP porta 9006 para diagnóstico rápido de falhas." },
          { label: "Arduino e Tokens", desc: "Copie os tokens de segurança e IDs para colar no código-fonte das placas controladoras dos totens." }
        ]
      };
    }
  }

  if (pathname.includes('/student/dashboard')) {
    return {
      title: "Área do Aluno (Dashboard)",
      description: "Seu painel pessoal de sustentabilidade e acompanhamento ecológico.",
      tips: [
        { label: "Jornada de Nível", desc: "Cada descarte no Totem acumula pontos de XP. Suba de nível e evolua de 'Semente' até se tornar um 'Guardião da Lenda'!" },
        { label: "Missão Diária", desc: "Fique de olho na meta do dia! Completar a missão diária garante um bônus especial de Bio-Coins." },
        { label: "Score Global", desc: "Calculado a partir de seus Pontos de Coleta + Bônus de Vitalidade + (Itens Comprados na Bioshop × 250)." },
        { label: "Descartes e Transações", desc: "Consulte seu histórico de pesagens no totem e todos os créditos e débitos de moedas." }
      ]
    };
  }

  if (pathname.includes('/student/meu-ecossistema')) {
    return {
      title: "Meu Ecossistema (Biosfera)",
      description: "Uma floresta virtual interativa que representa o seu impacto no mundo real.",
      tips: [
        { label: "Saúde e Vitalidade", desc: "A floresta e o rio reagem às suas ações. Fazer descartes corretos na escola mantém a vitalidade do ecossistema alta (verde)." },
        { label: "Poluição e Inatividade", desc: "Se você passar muitos dias sem reciclar, a vitalidade cairá. Abaixo de 20%, o ecossistema fica inativo (cinza)." },
        { label: "Ativar com Quiz", desc: "Se seu ecossistema for desativado, faça um quiz de 10 perguntas no nível médio para restaurar a vitalidade para 100% imediatamente." }
      ]
    };
  }

  if (pathname.includes('/student/quiz')) {
    return {
      title: "Desafios de Conhecimento (Quizzes)",
      description: "Responda a perguntas sobre sustentabilidade geradas por Inteligência Artificial.",
      tips: [
        { label: "Gerador com IA", desc: "Os quizzes são construídos dinamicamente sobre tópicos cadastrados pela sua escola, garantindo novidades a cada teste." },
        { label: "Como Funciona", desc: "Escolha o tema, selecione a quantidade de perguntas e defina a dificuldade (Fácil, Médio ou Difícil)." },
        { label: "Mais Moedas", desc: "Quizzes com maior dificuldade e número de questões corretas premiam muito mais Bio-Coins ao final." }
      ]
    };
  }

  if (pathname.includes('/student/rewards')) {
    return {
      title: "Bioshop (Troca de Prêmios)",
      description: "Troque as Bio-Coins acumuladas por recompensas reais fornecidas pela escola.",
      tips: [
        { label: "Catálogo de Prêmios", desc: "Navegue pelas recompensas oferecidas pela sua unidade e veja os custos necessários para o resgate." },
        { label: "Como Resgatar", desc: "Ao clicar em 'Resgatar', suas moedas serão debitadas e uma notificação de entrega física será enviada aos gestores." }
      ]
    };
  }

  if (pathname.includes('/student/leaderboard')) {
    return {
      title: "Tabela de Classificação (Ranking)",
      description: "Acompanhe a disputa amigável de sustentabilidade entre os alunos.",
      tips: [
        { label: "Ranking Geral", desc: "Classificação geral acumulada baseada no Score Global (XP) de todos os tempos." },
        { label: "Hall das Lendas", desc: "Os três alunos que mais acumularem pontos durante o mês corrente entram para o mural de destaque das Lendas do Mês." }
      ]
    };
  }

  if (pathname.includes('/student/education')) {
    return {
      title: "Espaço de Aprendizado (Biblioteca)",
      description: "Leia artigos sobre sustentabilidade e ganhe Bio-Coins de incentivo.",
      tips: [
        { label: "Leitura Premiada", desc: "Leia artigos educativos completos recomendados pela sua escola. Cada leitura finalizada concede Bio-Coins em sua conta." },
        { label: "Vídeos Educativos", desc: "Alguns artigos contam com vídeos e documentários integrados para enriquecer seu aprendizado." }
      ]
    };
  }

  return {
    title: "SchoolGain Hub - Ajuda",
    description: "Plataforma integrada de sustentabilidade escolar, gamificação e Internet das Coisas.",
    tips: [
      { label: "Totens Físicos", desc: "Identifique-se no Totem usando seu QRCode ou cartão RFID, insira o material na abertura e acompanhe a pesagem na tela." },
      { label: "Bio-Coins e XP", desc: "Descarte recicláveis e realize quizzes para ganhar moedas de troca (Bio-Coins) e subir de nível na sua jornada (XP)." },
      { label: "Suporte", desc: "Em caso de dúvidas sobre pesagem ou cartões RFID não identificados, procure a coordenação da sua escola." }
    ]
  };
};

export function Header() {
  const { toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();
  const title =
    pathToTitle[pathname.split('/').pop() || ''] || 'SchoolGain Hub';
  
  const { balance, points, vitality, purchasedItems, currentUser, logout, currentUserRa, getGlobalLeader, schools } = useEcosystem();
  
  const globalScore = useMemo(() => {
    return EcosystemService.calculateTotalScore(points, vitality, purchasedItems?.length || 0);
  }, [points, vitality, purchasedItems]);

  const isLeader = useMemo(() => {
    if (!currentUserRa) return false;
    const leader = getGlobalLeader();
    return leader?.ra === currentUserRa;
  }, [getGlobalLeader, currentUserRa]);
  const isAdminView = pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
  const { theme, toggleTheme } = useTheme();

  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');
  const tab = searchParams.get('tab');
  const pageHelp = useMemo(() => getPageHelp(pathname, tab), [pathname, tab]);

  const currentSchoolLogo = useMemo(() => {
    if (!currentUser) return "/brand/logo_apicella_menor.png";
    const activeSid = currentUser.role === 'super_admin' ? (searchParams.get('schoolId') || currentUser.schoolId) : currentUser.schoolId;
    const school = schools.find(s => s.id === activeSid);
    return school?.logo || "/brand/logo_apicella_menor.png";
  }, [currentUser, schools, searchParams]);

  // Função auxiliar para injetar o parâmetro de preview nos links
  const getLink = (href: string) => {
    if (previewId) {
      return `${href}?preview=${previewId}`;
    }
    return href;
  };

  const studentMenuItems = [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/meu-ecossistema', label: 'Meu Ecossistema', icon: Leaf },
    { href: '/student/leaderboard', label: 'Ranking', icon: Trophy },
    { href: '/student/education', label: 'Educação', icon: BookOpen },
    { href: '/student/quiz', label: 'Quizzes', icon: BrainCircuit },
    { href: '/student/rewards', label: 'Recompensas', icon: Gift },
  ];

  const adminMenuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin', label: 'Gerenciamento', icon: Shield },
  ];

  const superAdminMenuItems = [
    { href: '/super-admin', label: 'Central de Rede', icon: Shield },
  ];
  
  // Prioriza o usuário logado do contexto. Fallback apenas se deslogado.
  const displayUser = currentUser || (isAdminView ? ADMIN_MOCK : {
    name: 'Visitante',
    role: 'visitor',
    avatar: undefined,
    ra: '',
    email: ''
  });

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const getLeafColor = (v: number) => {
    if (isLeader) return '#fbbf24'; // Ouro PURO (Tailwind yellow-400)
    if (v >= 70) return '#22c55e'; // Verde Vibrante (emerald-500)
    if (v >= 30) return '#f59e0b'; // Amber-500 (Difere do Ouro)
    return '#92400e'; // Marrom (amber-900)
  };

  const menuItems = useMemo(() => {
    if (pathname.startsWith('/super-admin')) {
      return superAdminMenuItems;
    }
    if (isAdminView) {
      return adminMenuItems;
    }
    return studentMenuItems;
  }, [pathname, isAdminView]);

  return (
    <header className="relative z-40 flex h-14 items-center gap-3 px-4 sm:h-14 sm:px-6 transition-all border-b bg-white/80 dark:bg-[#070913]/90 border-slate-200 dark:border-white/5 text-slate-800 dark:text-white backdrop-blur-xl shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* School Logo */}
      {currentUser && (
        <div className="flex items-center gap-2 mr-2 select-none shrink-0">
          <img
            src={currentSchoolLogo}
            alt="Logo da Escola"
            className="h-7 w-auto max-h-7 object-contain max-w-[80px] dark:brightness-110"
          />
          <Separator orientation="vertical" className="h-6 bg-slate-200 dark:bg-white/10 hidden md:block" />
        </div>
      )}
      
      {/* Links de Navegação Horizontal */}
      <nav className="hidden md:flex items-center gap-1 mx-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={getLink(item.href)}>
              <span className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer border",
                isActive
                  ? isAdminView
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "bg-primary/10 border-primary/20 text-primary"
                  : isAdminView
                    ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5"
              )}>
                <item.icon className={cn("h-3.5 w-3.5", isActive ? "animate-pulse" : "opacity-80")} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      <h1 className={cn(
        "text-sm font-black uppercase tracking-widest md:hidden",
        isAdminView ? "text-indigo-400" : "text-slate-800 dark:text-slate-200"
      )}>
        {title}
      </h1>

      {/* Nome do Projeto Centralizado no Meio da Barra */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none select-none">
        <Leaf className="h-4 w-4 text-indigo-400 fill-indigo-500/20 animate-pulse" />
        <span className="text-xs font-black tracking-[0.3em] uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text">
          SchoolGain
        </span>
        {currentUser && (
          <>
            <span className="text-white/20 font-extralight text-xs select-none">|</span>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg backdrop-blur-md border shadow-sm",
              isAdminView 
                ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.08)]" 
                : "text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/15"
            )}>
              {currentUser.role === 'super_admin'
                ? (schools.find(s => s.id === searchParams.get('schoolId'))?.name || 'Central Global')
                : (schools.find(s => s.id === currentUser.schoolId)?.name || 'Unidade')
              }
            </span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-4">
        {hasMounted && !isAdminView && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Pill 1: Pontos de Experiência (XP Acumulado) */}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 leading-none tracking-wider hidden sm:inline">Pontos (XP)</span>
                <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 leading-none tracking-wider sm:hidden">XP</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">{globalScore}</span>
              </div>
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 animate-pulse" />
            </div>

            {/* Pill 2: Bio-Coins (Saldo para compras na Bioshop) */}
            <Link 
              href="/student/meu-ecossistema" 
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shadow-inner group"
            >
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 leading-none tracking-wider hidden sm:inline">Bio-Coins</span>
                <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 leading-none tracking-wider sm:hidden">Coins</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">{balance}</span>
              </div>
              <Leaf 
                className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-500 group-hover:scale-110", isLeader && "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]")} 
                fill={getLeafColor(vitality)} 
                stroke={getLeafColor(vitality)} 
              />
            </Link>
          </div>
        )}

        {hasMounted ? (
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 transition-all hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 shrink-0"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 animate-in spin-in-90 duration-300" />
              ) : (
                <Sun className="h-4 w-4 animate-in spin-in-90 duration-300" />
              )}
            </Button>

            {/* Help Sheet Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 transition-all hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 shrink-0"
                  title="Dicas de Uso"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white/95 dark:bg-[#070913]/95 border-l border-slate-200 dark:border-white/5 backdrop-blur-2xl text-slate-800 dark:text-white p-6 shadow-2xl overflow-y-auto w-full sm:max-w-md">
                <SheetHeader className="pb-6 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-md">
                      <HelpCircle className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-650 dark:text-indigo-400">Guia Auxiliar</span>
                  </div>
                  <SheetTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    {pageHelp.title}
                  </SheetTitle>
                  <SheetDescription className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed pt-1">
                    {pageHelp.description}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 pt-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 block mb-2">Dicas e Instruções</span>
                  {pageHelp.tips.map((tip, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm hover:border-indigo-500/25 dark:hover:border-indigo-500/20 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-indigo-200">{tip.label}</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-650 dark:text-slate-400 font-medium">{tip.desc}</p>
                    </div>
                  ))}
                  <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl text-[10px] text-emerald-650 dark:text-emerald-450 font-bold uppercase tracking-wider leading-relaxed text-center">
                    SchoolGain Hub &bull; Tecnologia e Sustentabilidade
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "overflow-hidden rounded-full transition-all h-8 w-8",
                    isAdminView 
                      ? "border-slate-200 dark:border-white/10 hover:ring-2 hover:ring-indigo-500/35 bg-white dark:bg-slate-950" 
                      : "border-slate-200 dark:border-white/10 hover:ring-2 hover:ring-primary/20"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={displayUser.avatar || undefined}
                      alt={`Avatar de ${displayUser.name}`}
                    />
                    <AvatarFallback>{displayUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn(
                "w-56 rounded-2xl shadow-2xl p-2 backdrop-blur-xl",
                isAdminView 
                  ? "bg-white/95 dark:bg-slate-950/95 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200"
              )}>
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-slate-200">{displayUser.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-tight mt-0.5">
                    {displayUser.email || (displayUser.ra ? `RA: ${displayUser.ra}` : '')}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={cn(isAdminView ? "bg-slate-200/50 dark:bg-white/5" : "bg-slate-100 dark:bg-white/5")} />
                
                {isAdminView ? (
                  adminMenuItems.map((item) => (
                    <Link key={item.href} href={getLink(item.href)}>
                      <DropdownMenuItem className={cn(
                        "rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider mb-1 cursor-pointer transition-colors",
                        isAdminView 
                          ? "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white" 
                          : "hover:bg-slate-100 dark:hover:bg-white/5"
                      )}>
                        <item.icon className="mr-2 h-4 w-4 text-indigo-400" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))
                ) : (
                  studentMenuItems.map((item) => (
                    <Link key={item.href} href={getLink(item.href)}>
                      <DropdownMenuItem className={cn(
                        "rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider mb-1 cursor-pointer transition-colors",
                        item.label === 'Meu Ecossistema' && isLeader ? "text-yellow-500 hover:bg-yellow-500/10" : "hover:bg-slate-100 dark:hover:bg-white/5"
                      )}>
                        <item.icon className={cn(
                          "mr-2 h-4 w-4 transition-all",
                          item.label === 'Meu Ecossistema' && isLeader ? "text-yellow-500" : "text-indigo-400"
                        )} />
                        <span className={cn(
                          item.label === 'Meu Ecossistema' && isLeader && "text-yellow-400 font-black"
                        )}>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))
                )}

                {currentUser?.role === 'super_admin' && superAdminMenuItems.map((item) => (
                  <Link key={item.href} href={getLink(item.href)}>
                    <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 cursor-pointer">
                      <item.icon className="mr-2 h-4 w-4 text-rose-500" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}

                <DropdownMenuSeparator className={cn(isAdminView ? "bg-white/5" : "bg-slate-100 dark:bg-white/5")} />
                <Link href="/" onClick={() => logout()}>
                  <DropdownMenuItem className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer transition-colors">
                    <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </Link>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full h-8 w-8"
            disabled
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{displayUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>
    </header>
  );
}
