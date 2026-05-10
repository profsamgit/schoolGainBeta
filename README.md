# SchoolGain v2.2 — Ecossistema de Sustentabilidade Digital

O **SchoolGain** é uma plataforma robusta de gamificação e gestão ambiental, projetada para transformar o descarte de resíduos em uma experiência interativa, educativa e recompensadora.

## 🚀 Visão Geral
O sistema integra hardware (Totens de Coleta), Inteligência Artificial para identificação de resíduos e uma economia digital baseada em Bio-Coins, incentivando a sustentabilidade através de uma interface gamificada premium.

## 🛠️ Arquitetura Técnica
O projeto utiliza o **Sistema de Motor Singleton**, onde o `EcosystemService` atua como o cérebro central, gerenciando:
- **Telemetria Operacional**: Registro imutável de todas as ações administrativas.
- **Segurança Hardened**: Bloqueio progressivo de força bruta e isolamento de privilégios.
- **Sincronização em Tempo Real**: Distribuição de estado via RxJS e Firebase Firestore.
- **IA de Visão**: Classificação automatizada de materiais recicláveis.

## 📂 Estrutura do Projeto
- `src/lib`: Lógica de negócios, tipos globais e motor de serviços.
- `src/app`: Rotas da aplicação (Kiosk, Portal do Usuário, Admins).
- `src/components`: Biblioteca de componentes UI modulares.
- `src/ai`: Fluxos de inteligência computacional.

## ⚙️ Configuração
1. Instale as dependências: `npm install`
2. Configure o Firebase em `src/lib/firebase.ts`.
3. Inicie o ambiente de desenvolvimento: `npm run dev`
4. Gere o build de produção: `npm run build`

## 🔒 Segurança e Privacidade
Este projeto foi desenvolvido seguindo padrões de neutralidade de dados e auditoria forense. Nenhuma informação sensível está hardcoded nos arquivos de configuração.

---
**Desenvolvido para uma experiência de impacto social e tecnológico.**
