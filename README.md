# 🌱 SchoolGain Hub — Ecossistema Educacional de Sustentabilidade

> **Plataforma de gamificação ambiental para escolas parceiras.**  
> Transforma o descarte consciente de resíduos em pontos, recompensas e progresso educacional — tudo em tempo real.

Desenvolvido por: **TDS 2B 2026 — CETI Frei José Apicella, Guadalupe – PI**

---

## 🎯 Visão Geral

O **SchoolGain** é um sistema completo de engajamento escolar com foco em sustentabilidade. Alunos acumulam **Bio-Coins** e **Pontos de XP** ao participar de quizzes educativos, ler artigos, descartar resíduos corretamente e completar missões diárias. Gestores e administradores gerenciam tudo por um painel dedicado, enquanto o sistema mantém múltiplas escolas parceiras isoladas de forma segura.

### Principais Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 🎮 **Gamificação de Nível** | 7 títulos progressivos: Semente → Broto → Folha → Árvore → Floresta → Guardião da Biosfera → Guardião da Lenda |
| 🪙 **Bio-Coins** | Moeda virtual ganha por quizzes, artigos e descartes. Gasta em upgrades do ecossistema virtual |
| 🌍 **Ecossistema Virtual** | Mundo personalizado por aluno, com vitalidade, itens e personagens compráveis |
| 📊 **Ranking em Tempo Real** | Leaderboard da escola com atualização via Firestore (RxJS + Firebase) |
| 🧠 **Quiz Adaptativo** | Tópicos personalizados, dificuldade configurável e pontuação automática |
| ♻️ **Registro de Descartes** | Totens físicos integrados por RFID/QR registram resíduos por tipo e peso |
| 🏫 **Multi-Escola** | Cada unidade parceira tem dados, usuários, recompensas e configurações isoladas |
| 🔐 **Login Multi-Método** | Senha, QR Code ou RFID — configurável por papel (aluno / gestor) |

---

## 👥 Papéis do Sistema

### 🎓 Aluno (`student`)
Acessa a área pessoal com dashboard, ecossistema, ranking, quizzes, educação e recompensas.  
Login via: **RA + Senha**, **QR Code** ou **RFID**.

### 🛡️ Gestor (`admin`)
Gerencia usuários, recompensas, turmas, cursos, artigos, quizzes e configurações da sua unidade.  
Pode visualizar o perfil de qualquer aluno via **Modo de Auditoria** (`?preview={id}`).

### 👁️ Super Admin (`super_admin`)
Acesso irrestrito a toda a rede de escolas. Aprova novas unidades parceiras, gerencia configurações globais e possui mecanismo de **auto-recuperação de conta** via Firebase Auth.

### 🖥️ Visitante (`visitor`)
Usuário do totem público. Redirecionado automaticamente para o Kiosk sem acesso à área do aluno.

---

## 🗺️ Estrutura de Rotas

```
/                         → Landing page (seleção de perfil)
/about                    → Página sobre o projeto

/login/student            → Login do aluno (senha / QR / RFID)
/login/admin              → Login do gestor / super admin
/login/register-student   → Solicitação de cadastro de aluno
/login/register-school    → Solicitação de parceria de nova escola

/student/dashboard        → Painel inicial do aluno
/student/meu-ecossistema  → Ecossistema virtual + Bioshop
/student/leaderboard      → Ranking de XP da escola
/student/education        → Biblioteca de artigos educativos
/student/quiz             → Quizzes interativos
/student/rewards          → Catálogo de recompensas

/admin                    → Painel de gerenciamento da unidade
/admin/dashboard          → Métricas e resumo da escola
/admin/settings           → Configurações de hardware e sistema

/super-admin              → Central de controle da rede

/kiosk                    → Interface do totem público

/api/hardware/input       → Polling de entrada de hardware (RFID/QR)
/api/hardware/camera      → Proxy de câmera externa
/api/hardware/led         → Controle de LED do totem
/api/hardware/proxy       → Proxy genérico de hardware
```

---

## 🏗️ Arquitetura Técnica

### Stack Principal

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS + Variáveis CSS customizadas |
| **Banco de Dados** | Firebase Firestore (Tempo Real) |
| **Autenticação** | Firebase Auth |
| **Armazenamento** | Firebase Storage (avatares) |
| **Reatividade** | RxJS BehaviorSubjects |
| **UI Components** | shadcn/ui + Lucide Icons |
| **QR Code** | `qrcode.react` + leitor via câmera (browser) |

### Motor Central: `EcosystemService`

O `EcosystemService` (`src/lib/ecosystem.service.ts`) é o **cérebro do sistema**. Funciona como um Singleton que:

- Mantém o estado de toda a aplicação via **BehaviorSubjects RxJS**
- Sincroniza dados com o **Firestore em tempo real** (onSnapshot)
- Delega operações para **sub-serviços modulares**:
  - `AuthService` — Autenticação e bloqueio de força bruta
  - `UserService` — Gestão de usuários e papéis
  - `SchoolService` — Escolas parceiras
  - `TerminalService` — Terminais físicos (totens)
  - `PointsService` — Cálculo e expiração de pontos
  - `WasteService` — Registro de descartes
  - `PedagogicalService` — Turmas, cursos, quizzes, artigos
  - `RegistrationService` — Solicitações de cadastro pendentes

### Sincronização de Estado

```
Firebase Firestore
      │
      ▼ onSnapshot (tempo real)
EcosystemService (BehaviorSubjects)
      │
      ▼ .asObservable()
EcosystemContext (React Context)
      │
      ▼ useEcosystem()
Componentes da Interface
```

### Grupos de Rotas (Next.js Route Groups)

```
src/app/
├── (public)/           → Landing page e páginas públicas
├── (auth)/login/       → Páginas de autenticação (sem layout autenticado)
│   ├── student/
│   ├── admin/
│   ├── register-student/
│   └── register-school/
├── (app)/              → Área autenticada (layout com Sidebar + Header)
│   ├── student/        → Área exclusiva do aluno
│   ├── admin/          → Área do gestor
│   └── waste/          → Registro de descarte
├── (kiosk)/            → Totem público
└── (super-admin)/      → Painel da rede
```

---

## 🔒 Segurança

- **Bloqueio por força bruta**: após múltiplas tentativas falhas, o acesso é suspenso temporariamente
- **Autenticação multi-camada**: senha local (SHA-256) → chave mestra do Super Admin → Firebase Auth
- **Isolamento por escola**: dados de recompensas, usuários, turmas e configurações são filtrados pelo `schoolId`
- **Modo de Auditoria**: gestores podem visualizar contas de alunos sem alterar dados (`?preview={id}`)
- **Auto-recuperação de Super Admin**: se os dados do banco forem apagados acidentalmente, o sistema restaura o Super Admin via Firebase Auth automaticamente

---

## ⚙️ Configuração e Execução

### Pré-requisitos
- Node.js 18+
- Conta no [Firebase](https://console.firebase.google.com) com projeto configurado (Firestore + Auth + Storage)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o Firebase
Edite o arquivo `src/lib/firebase.ts` com as credenciais do seu projeto Firebase:
```ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto (se necessário):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### 4. Executar em desenvolvimento
```bash
npm run dev
# Acesse: http://localhost:9002
```

### 5. Build de produção
```bash
npm run build
npm run start
```

---

## 📂 Estrutura de Pastas

```
src/
├── app/                  → Rotas e páginas (Next.js App Router)
├── components/
│   ├── ui/               → Componentes base (shadcn/ui)
│   ├── layout/           → Sidebar, Header
│   └── ecosystem/        → Componentes específicos do sistema
├── contexts/
│   └── EcosystemContext  → Distribuição de estado global via React Context
├── hooks/                → Hooks reutilizáveis (useToast, etc.)
├── lib/
│   ├── ecosystem.service.ts   → Motor central do sistema
│   ├── services/              → Sub-serviços modulares
│   ├── firebase.ts            → Configuração do Firebase
│   ├── constants.ts           → Constantes globais (pontuação, níveis)
│   ├── data.ts                → Dados iniciais e mock de administrador
│   └── utils.ts               → Funções utilitárias (cn, playBeep, etc.)
└── types/
    └── ecosystem.ts      → Tipos TypeScript globais do sistema
```

---

## 🌐 Integrações de Hardware

O sistema suporta integração com hardware físico via APIs REST internas:

| API | Método | Descrição |
|---|---|---|
| `/api/hardware/input` | `GET` | Polling de leitura RFID/QR do terminal |
| `/api/hardware/camera` | `GET` | Streaming de câmera externa (proxy) |
| `/api/hardware/led` | `POST` | Controle de LED de feedback do totem |
| `/api/hardware/proxy` | `GET/POST` | Proxy genérico para hardware customizado |

Leitores RFID USB são detectados como teclados — o sistema captura o ID via **buffer de teclado global** com timeout de 100ms para diferenciar leitura humana de leitura por hardware.

---

## 📈 Fluxo do Aluno (Jornada Típica)

```
1. Solicitação de Cadastro  →  Gestor Aprova
2. Login (RA + Senha / QR / RFID)
3. Dashboard: missão diária, ranking, saldo
4. Quiz  →  ganha Bio-Coins + XP
5. Artigo Educativo  →  ganha Bio-Coins
6. Descarte no Totem  →  registra coleta
7. Bioshop: compra itens para o ecossistema virtual
8. Evolui de Semente → ... → Guardião da Lenda 🏆
```

---

*SchoolGain Hub © 2026 — Tecnologia e Sustentabilidade*
