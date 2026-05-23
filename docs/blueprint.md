# **SchoolGain Hub - Diretrizes de Desenvolvimento (Blueprint)**

Este documento descreve as funcionalidades principais e o guia de estilo do **SchoolGain Hub**, uma plataforma gamificada de educação ambiental e monitoramento de resíduos para escolas.

---

## Funcionalidades Principais (Core Features)

### 1. Autenticação de Usuários e Perfis
- **Descrição:** Login seguro para estudantes e gestores integrando o Firebase Authentication.
- **Detalhamento:** Exibição do perfil do aluno com informações de engajamento, estatísticas básicas (pontuação de XP acumulada de forma vitalícia), saldo de Bio-Coins e títulos de níveis evolutivos (como *Semente*, *Broto*, *Folha*, *Árvore*, *Floresta*, *Guardião da Biosfera* e *Guardião da Lenda*).

### 2. Registro de Descartes de Resíduos
- **Descrição:** Registro manual e automatizado de descartes de resíduos recicláveis por tipo (plástico, papel, metal, vidro, orgânico).
- **Detalhamento:** Simula o ecossistema das Lixeiras Inteligentes conectadas, concedendo pontos e Bio-Coins instantaneamente para recompensar a conduta sustentável do aluno.

### 3. O Mundo Virtual (Ecossistema Reativo)
- **Descrição:** Um ecossistema virtual dinâmico construído em gráficos vetoriais (SVG) e controlado diretamente pelo estado do aluno no banco de dados.
- **Detalhamento:**
  - O bioma reage visualmente de acordo com a saúde ecológica (vitalidade) e as compras efetuadas na Bio-Loja (ex: limpeza do rio, árvores, animais terrestres, barcos solares e a lendária Nessie).
  - Possui transições fluidas de ciclos diurnos/noturnos reais e filtros que mudam de cor conforme a vitalidade do ecossistema se degrada.
  - Oferece suporte a animações premium exclusivas (como a Aurora Boreal) no nível lendário *Guardião da Lenda*.

### 4. Quizzes Educativos e Gamificados
- **Descrição:** Avaliações interativas sobre temas ambientais estruturados de acordo com as diretrizes da BNCC.
- **Detalhamento:**
  - Permite ganhar pontos ao responder quizzes temáticos (ex: reciclagem, consumo de água).
  - **Limites Diários:** Limitação de ganho de pontos a um quiz de cada dificuldade (Fácil, Médio, Difícil) por dia.
  - **Penalidades:** Cada erro subtrai 2 pontos da recompensa acumulável para promover o estudo consciente.

### 5. Catálogo de Recompensas e Loja Virtual
- **Descrição:** Uma loja digital (Bio-Loja) onde os alunos trocam suas Bio-Coins acumuladas por itens de restauração para o seu bioma ou por recompensas reais fornecidas pela instituição de ensino.
- **Detalhamento:** Exige fluxo estratégico de aquisição (com pré-requisitos para compras de upgrades, ex: o rio precisa estar limpo antes de introduzir vida aquática ou barcos).

### 6. Painel de Controle Administrativo (Gestor Escolar)
- **Descrição:** Dashboard administrativo unificado para professores, diretores e super-administradores.
- **Detalhamento:** Permite visualizar métricas agregadas de reciclagem, auditoria detalhada de depósitos de pontos, gerenciamento de cadastros de turmas/alunos, autorização de hardware de quiosques e redefinição de ciclos.

### 7. Hall das Lendas
- **Descrição:** Mural de destaque mensal no painel de líderes que exibe os alunos de elite que conseguiram obter a criatura mitológica do lago (Nessie) durante o ciclo ativo.

---

## Diretrizes de Estilo e Design (Style Guidelines)

### Paleta de Cores (Estética da Sustentabilidade)
- **Cor Primária:** Verde vibrante e orgânico (`#15803d` / `#10b981`) para simbolizar a natureza, crescimento e compromisso ecológico. Utilizado em botões de ação e títulos principais.
- **Cor de Fundo (Modo Claro):** Um verde esbranquiçado ultraclaro (`#f0fdf4`) que promove leveza, excelente contraste e leitura confortável.
- **Esquema de Cores Escuro (Dark Mode):** Fundo em tons de ardósia escura e índigo profundo (`#020617` / `#0f172a`), garantindo legibilidade e uma sensação sofisticada nos painéis interativos.
- **Cor de Destaque:** Tons de ciano-esmeralda (`#4dcc8c`) e dourado (`#fbbf24`) para elementos raros, badges de conquistas, botões de ação críticos (CTA) e barras de progresso.

### Tipografia
- **Família Tipográfica:** Utilização da fonte **Poppins** ou **Inter** (sans-serif), oferecendo uma aparência geométrica, moderna, limpa e extremamente amigável para crianças, adolescentes e educadores.

### Componentes e Responsividade
- **Estrutura baseada em Cards:** Elementos agrupados em caixas com bordas arredondadas e efeito de desfoque de fundo (*glassmorphism*) para manter a interface com aspecto premium e de fácil escaneamento visual.
- **Design Responsivo:** Layout totalmente flexível (Mobile-First) projetado para funcionar de forma consistente tanto em dispositivos móveis quanto em computadores e telas de quiosques escolares.
- **Micro-animações:** Transições sutis de hover, pulsações de luzes à noite (vagalumes), folhas ao vento e feedbacks interativos para elevar o valor de produção e o engajamento com a interface gamificada.