# SchoolGain Hub — Ecossistema Educacional de Sustentabilidade

Plataforma de gamificação voltada para a conscientização ambiental nas escolas. Transforma o descarte de resíduos recicláveis em pontos, recompensas e aprendizado interativo.

Desenvolvido por: **TDS 2B 2026 — CETI Frei José Apicella, Guadalupe – PI**

---

## Visão Geral

O **SchoolGain** é um sistema de engajamento escolar voltado para a sustentabilidade. Os alunos acumulam **Bio-Coins** e **Pontos de XP** ao participarem de quizzes educativos, lerem artigos e realizarem o descarte correto de resíduos recicláveis. Os gestores e administradores gerenciam as atividades por meio de um painel administrativo exclusivo, garantindo o isolamento de dados de cada escola parceira.

### Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Gamificação** | Títulos progressivos (de Semente a Guardião da Lenda) conforme o progresso do aluno |
| **Bio-Coins** | Moedas virtuais ganhas ao realizar atividades, usadas para adquirir itens no ecossistema virtual |
| **Ecossistema Virtual** | Espaço virtual personalizado do aluno com itens e personagens |
| **Ranking** | Leaderboard escolar atualizado em tempo real |
| **Quizzes Educativos** | Questionários sobre meio ambiente com pontuação automática |
| **Registro de Descartes** | Integração com totens coletores (via RFID ou QR Code) para registrar os resíduos |
| **Sistema Multi-Escola** | Isolamento de dados, usuários e recompensas para cada escola parceira |
| **Autenticação** | Login por senha, QR Code ou RFID |

---

## Últimas Atualizações (Maio 2026)

- **Modo de Economia Inteligente (Standby Ativo):** O Totem Kiosk monitora 60 segundos de inatividade e entra em repouso automaticamente. O estado interrompe a webcam local e fecha síncronamente os sockets das câmeras de vídeo externas (ESP32-CAM) via limpeza de `src` na desmontagem e em eventos globais de histórico/popstate, apagando os LEDs Flash físicos automaticamente. Acorda instantaneamente ao toque.
- **Permissão de Câmera Proativa:** O Kiosk e o portal solicitam permissão de mídia ao carregar a página. Isso faz com que os navegadores desbloqueiem e exponham os `deviceIds` persistentes antes que o código busque um ID específico, resolvendo falhas de conexão de primeira inicialização.
- **Resolução Nativa e Desempenho (OV2640 & OV3660):** Mapeamos a câmera de login (OV2640) para utilizar resoluções nativas otimizadas em hardware (VGA de 30 FPS no modo fluido em vez de CIF processado via software), equiparando a velocidade da OV2640 com a OV3660 do scanner.
- **Acessibilidade do Ecossistema Virtual em Smartphones:** Implementamos tela cheia virtual via CSS no "Meu Ecossistema" para contornar limitações da Fullscreen API do iOS Safari. Adicionamos suporte ao `env(safe-area-inset-bottom)` com folga de `4rem` para flutuar acima dos gestos do sistema e incluímos um botão de emergência superior (`Minimize`) contra bloqueios de interface.
- **Compatibilidade Next.js 16 / React 19:** Atualizamos as páginas dinâmicas para suportar `params` como Promises assíncronas, utilizando o hook `use` do React 19 para desembrulhá-los com segurança e corrigir erros na abertura de artigos educativos.

---

## Papéis do Sistema

### Aluno (`student`)
Acessa o painel do aluno, ecossistema, ranking, quizzes, biblioteca de artigos e recompensas.  
Login via RA e senha, QR Code ou chave RFID.

### Gestor (`admin`)
Gerencia usuários, recompensas, turmas, cursos, artigos e quizzes da sua unidade escolar.

### Super Admin (`super_admin`)
Acesso geral ao sistema. Gerencia as escolas parceiras e as configurações globais da plataforma.

### Visitante (`visitor`)
Acessa apenas a interface de pesagem/descarte no totem coletor público (Kiosk).

---

## Estrutura de Rotas

```
/                         → Landing page
/about                    → Página sobre o projeto

/login/student            → Login do aluno
/login/admin              → Login do gestor / super admin
/login/register-student   → Solicitação de cadastro de aluno
/login/register-school    → Solicitação de nova escola parceira

/student/dashboard        → Painel do aluno
/student/meu-ecossistema  → Ecossistema virtual
/student/leaderboard      → Ranking da escola
/student/education        → Biblioteca de artigos
/student/quiz             → Quizzes
/student/rewards          → Recompensas

/admin                    → Painel do gestor
/kiosk                    → Interface do totem coletor

/api/hardware/input       → Entrada do hardware (RFID/QR)
/api/hardware/camera      → Câmera do totem
/api/hardware/led         → Controle de LED
```

---

## Arquitetura Técnica

### Stack Principal

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Banco de Dados & Autenticação:** Firebase (Firestore, Auth, Storage)
- **Gerenciamento de Estado:** RxJS (BehaviorSubjects)
- **Componentes de UI:** shadcn/ui + Lucide Icons

### Gerenciamento de Estado (`EcosystemService`)

O `EcosystemService` centraliza a lógica do sistema e gerencia a sincronização em tempo real com o Firestore. Ele é composto por sub-serviços modulares:
- `AuthService` — Autenticação de usuários
- `UserService` — Gestão de perfis e papéis
- `SchoolService` — Dados das escolas parceiras
- `PointsService` — Controle de pontos e XP
- `WasteService` — Registro de descartes de resíduos
- `PedagogicalService` — Quizzes, turmas e artigos educativos

---

## Segurança

- **Isolamento de dados:** Cada escola parceira possui seus próprios dados e configurações isolados pelo `schoolId`.
- **Prevenção de acessos indevidos:** Bloqueio temporário após tentativas sucessivas de login malsucedidas.
- **Controle de privilégios:** Verificação rigorosa do papel de cada usuário para proteção de rotas e dados.

---

## Configuração e Execução

### Pré-requisitos
- Node.js 18+
- Conta configurada no Firebase (Firestore, Auth, Storage)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o Firebase
Configure as credenciais em `src/lib/firebase.ts` ou utilize um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### 3. Executar em desenvolvimento
```bash
npm run dev
```

### 4. Build de produção
```bash
npm run build
npm run start
```

---

## Estrutura do Projeto

- `src/app/` — Rotas e páginas (Next.js App Router)
- `src/components/` — Componentes reutilizáveis de interface
- `src/contexts/` — Contexto React para compartilhamento de estado
- `src/lib/` — Serviços de integração com Firebase e lógica de negócio
- `src/types/` — Tipos TypeScript globais

---

## Integração com Hardware

O sistema se conecta com totens coletores físicos por meio de APIs:
- `/api/hardware/input` (GET): Leitura de RFID ou QR Code do terminal.
- `/api/hardware/camera` (GET): Imagem da câmera externa do totem.
- `/api/hardware/led` (POST): Controle de indicação visual em LEDs.

---

## Fluxo do Aluno

1. O aluno realiza o cadastro e aguarda a aprovação do gestor escolar.
2. Efetua o login via RA, senha, QR Code ou chave RFID.
3. Responde a quizzes e lê artigos na plataforma para ganhar XP e Bio-Coins.
4. Realiza o descarte de materiais recicláveis no totem coletor para registrar a coleta.
5. Utiliza as Bio-Coins na loja para obter itens virtuais e evoluir seu ecossistema.

---

*SchoolGain Hub © 2026 — Tecnologia e Sustentabilidade*
