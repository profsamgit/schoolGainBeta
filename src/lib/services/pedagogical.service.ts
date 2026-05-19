import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User, EcosystemItem } from '../types';

export class PedagogicalService {
  constructor(private service: any) {}

  /**
   * Registra que um aluno leu um artigo e concede pontos.
   */
  async recordArticleRead(articleId: string): Promise<boolean> {
    const userId = this.service.data.currentUserId;
    if (!userId) return false;

    const student = this.service.data.users.find((u: User) => u.id === userId);
    const article = this.service.data.articles.find((a: any) => a.id === articleId);
    if (!student || !article) return false;

    const state = this.service.data.userStates[userId] || this.service.getDefaultState(student);
    if (!state.readArticles) state.readArticles = [];
    
    // Verifica se já leu para não ganhar pontos repetidos
    if (state.readArticles.includes(articleId)) return true;

    // Concede 20 pontos por leitura
    const points = 20;
    state.readArticles.push(articleId);
    this.service.data.userStates[userId] = state;
    
    this.service.syncUserPoints(userId, points, points, `Leitura de Artigo: ${article.title}`);

    await this.service.logTelemetry({
      action: 'ARTICLE_READ',
      category: 'ECOSYSTEM',
      details: `Artigo lido: ${article.title}. Conquistou ${points} Bio-Coins.`,
      studentName: student.name,
      targetEntity: 'articles',
      targetId: articleId,
      points: points,
      unitId: student.schoolId
    });

    return true;
  }

  /**
   * Registra a finalização de um quiz.
   */
  async recordQuizCompletion(topicId: string, score: number, difficulty?: string, numQuestions?: number): Promise<boolean> {
    const userId = this.service.data.currentUserId;
    if (!userId) return false;

    const student = this.service.data.users.find((u: User) => u.id === userId);
    const topic = this.service.data.quizTopics.find((t: any) => t.id === topicId);
    if (!student || !topic) return false;

    const userState = this.service.data.userStates[userId] || this.service.getDefaultState(student);
    
    // REGRA: Ativação de Vitalidade
    // 1 quizz de 10 perguntas no médio para ativar a vitalidade 100
    if (!userState.vitalityActivated && difficulty === 'medium' && (numQuestions || 0) >= 10 && score >= 60) {
        userState.vitalityActivated = true;
        userState.vitality = 100;
        this.service.data.userStates[userId] = userState;
        this.service.syncStateWithUser(userId);
        // Persiste no Firestore
        await setDoc(doc(db, "userStates", userId), userState, { merge: true });
    }

    await this.service.logTelemetry({
      action: 'QUIZ_COMPLETED',
      category: 'ECOSYSTEM',
      details: `Quiz finalizado: ${topic.name}. Dificuldade: ${difficulty}. Questões: ${numQuestions}. Pontuação: ${score}%`,
      studentName: student.name,
      targetEntity: 'quizTopics',
      targetId: topicId,
      unitId: student.schoolId,
      metadata: { score, difficulty, numQuestions }
    });

    return true;
  }

  /**
   * Registra o resgate de uma recompensa física.
   */
  async recordRewardRedemption(rewardId: string): Promise<boolean> {
    const userId = this.service.data.currentUserId;
    if (!userId) return false;

    const student = this.service.data.users.find((u: User) => u.id === userId);
    const reward = this.service.data.rewards.find((r: any) => r.id === rewardId);
    if (!student || !reward) return false;

    await this.service.logTelemetry({
      action: 'REWARD_REDEEMED',
      category: 'ECOSYSTEM',
      details: `Recompensa resgatada: ${reward.name}. Custo: ${reward.cost} Bio-Coins.`,
      studentName: student.name,
      targetEntity: 'rewards',
      targetId: rewardId,
      unitId: student.schoolId,
      metadata: { cost: reward.cost }
    });

    return true;
  }

  /**
   * Verifica se o item especial "Nessie" ainda está disponível para compra este mês.
   * (Limitado a 3 pessoas por mês POR UNIDADE ESCOLAR).
   */
  isNessieAvailable(): boolean {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentRa = this.service.currentUserRa;
    const user = this.service.data.users.find((u: User) => u.ra === currentRa);
    if (!user || !user.schoolId) return false;

    const schoolId = user.schoolId;
    const legends = this.service.legendsSubject.value;

    const nessieOwnersInMonth = legends.filter((l: any) => 
      l.schoolId === schoolId && 
      l.month === currentMonth && 
      l.year === currentYear
    );

    return nessieOwnersInMonth.length < 3;
  }

  /**
   * Retorna os usuários que atingiram o item lendário no mês vigente.
   */
  getMonthlyLegends(targetSchoolId?: string): any[] {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    // sid será a escola para filtrar.
    let sid = (targetSchoolId === 'all' || !targetSchoolId) ? undefined : targetSchoolId;
    
    // Se for aluno, restringimos à escola dele, a menos que targetSchoolId tenha sido explícito
    if (!targetSchoolId && this.service.currentUserRa) {
      const user = this.service.data.users.find((u: User) => u.ra === this.service.currentUserRa || u.id === this.service.data.currentUserId);
      if (user?.role === 'student') {
        sid = user?.schoolId;
      }
    }

    // 1. Coleta TODOS os IDs de lendas do mês de todas as fontes
    const legendDataMap = new Map<string, { id: string, name?: string, date: string, schoolId?: string }>();

    // Fonte A: Coleção ecosystemLegends
    this.service.legendsSubject.value.forEach((l: any) => {
      const lMonth = Number(l.month);
      const lYear = Number(l.year);
      if (lMonth === currentMonth && lYear === currentYear) {
        legendDataMap.set(l.studentId, {
          id: l.studentId,
          name: l.studentName,
          date: l.purchaseDate,
          schoolId: l.schoolId
        });
      }
    });

    // Fonte B: Fallback via userStates
    Object.entries(this.service.data.userStates).forEach(([userId, state]: [string, any]) => {
      if (state.nessiePurchaseDate) {
        const parts = state.nessiePurchaseDate.split('-');
        if (parts.length >= 2) {
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          if (y === currentYear && m === currentMonth) {
            if (!legendDataMap.has(userId)) {
              legendDataMap.set(userId, {
                id: userId,
                date: state.nessiePurchaseDate.includes('T') ? state.nessiePurchaseDate : new Date(`${state.nessiePurchaseDate}T12:00:00Z`).toISOString()
              });
            }
          }
        }
      }
    });

    // 2. Converte o mapa em lista, enriquece com dados do usuário e filtra por escola
    return Array.from(legendDataMap.values())
      .map(item => {
        const u = this.service.data.users.find((user: User) => 
          user.id === item.id || 
          user.ra === item.id || 
          (user.ra && item.id.includes(user.ra))
        );

        return {
          ...item,
          name: u?.name || item.name || 'Agente Anônimo',
          avatar: u?.avatar,
          // Se o usuário existe, usamos a escola ATUAL dele como prioridade para o filtro
          schoolId: u?.schoolId || item.schoolId || 'MASTER',
          ra: u?.ra || (item.id.startsWith('USER-') ? '' : item.id)
        };
      })
      .filter(l => {
        // Se sid for MASTER ou não definido (visão global), mostra tudo
        if (!sid || sid === 'MASTER') return true;
        
        // Caso contrário, o aluno só aparece se a escola dele (atual ou no registro) bater com a filtrada
        return l.schoolId === sid;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }
}
