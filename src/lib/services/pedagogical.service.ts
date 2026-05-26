import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { User, EcosystemItem, Reward, EducationArticle, QuizTopic } from '@/types/ecosystem';

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
  isNessieAvailable(targetUserId?: string): boolean {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const targetUser = targetUserId 
      ? this.service.data.users.find((u: User) => u.id === targetUserId || u.ra === targetUserId)
      : this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
      
    if (!targetUser || !targetUser.schoolId) return false;

    const schoolId = targetUser.schoolId;
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

  buyUpgrade(item: EcosystemItem, targetUserId?: string): { success: boolean; error?: string } {
    const catalog: Record<EcosystemItem, { price: number; minVitality?: number; required?: string }> = {
      'limpar_rio': { price: 300, minVitality: 70 },
      'filtro_ar': { price: 200, minVitality: 70 },
      'reparar_grama': { price: 150, minVitality: 70 },
      'arvore_1': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'arvore_2': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'arvore_3': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'passaro_1': { price: 150, required: 'arvore_1' },
      'passaro_2': { price: 150, required: 'arvore_2' },
      'passaro_3': { price: 150, required: 'arvore_3' },
      'peixe_1': { price: 100, required: 'limpar_rio' },
      'peixe_2': { price: 100, required: 'limpar_rio' },
      'peixe_3': { price: 100, required: 'limpar_rio' },
      'cachorro': { price: 400, required: 'reparar_grama' },
      'gato': { price: 400, required: 'reparar_grama' },
      'borboletas': { price: 150, required: 'reparar_grama' },
      'borboletas_2': { price: 200, required: 'borboletas' },
      'borboletas_3': { price: 250, required: 'borboletas_2' },
      'borboletas_4': { price: 300, required: 'borboletas_3' },
      'casa': { price: 1500, minVitality: 100, required: 'arvore_1' },
      'barco_1': { price: 500, required: 'limpar_rio' },
      'barco_2': { price: 600, required: 'barco_1' },
      'monstro_lago': { price: 5000, required: 'casa' },
      'mae_human': { price: 600, required: 'casa' },
      'criancas': { price: 400, required: 'mae_human' },
      'placas_solares': { price: 400, required: 'casa' },
      'lixeiras': { price: 200, required: 'criancas' },
    };

    const upgrade = catalog[item];
    if (!upgrade) return { success: false, error: "Item não encontrado no catálogo." };

    const targetUser = targetUserId 
      ? this.service.data.users.find((u: User) => u.id === targetUserId || u.ra === targetUserId)
      : this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);

    if (!targetUser) return { success: false, error: "Usuário não identificado para compra." };

    const state = this.service.data.userStates[targetUser.id] || this.service.getDefaultState(targetUser);

    if (state.purchasedItems.includes(item)) {
      return { success: false, error: "Este item já foi adquirido!" };
    }

    if (upgrade.minVitality && state.vitality < upgrade.minVitality) {
      return { success: false, error: `Sua biosfera precisa de pelo menos ${upgrade.minVitality}% de vitalidade!` };
    }

    if (upgrade.required && !state.purchasedItems.includes(upgrade.required as EcosystemItem)) {
      const reqName = upgrade.required.replace(/_/g, ' ');
      return { success: false, error: `Requisito não atendido! Requer '${reqName}'.` };
    }

    if (item === 'monstro_lago') {
      const allOtherItems = Object.keys(catalog).filter(id => id !== 'monstro_lago') as EcosystemItem[];
      if (allOtherItems.some(id => !state.purchasedItems.includes(id))) {
        return { success: false, error: "A Lenda do Lago (Nessie) só pode ser adquirida quando todos os outros itens do ecossistema forem comprados!" };
      }
    }

    if (item === 'monstro_lago' && !this.isNessieAvailable(targetUser.id)) {
      return { success: false, error: "Sem vagas para o Nessie este mês! Limite de 3 por escola." };
    }

    if (state.balance < upgrade.price) {
      return { success: false, error: `Saldo insuficiente! Você precisa de ₵${upgrade.price} Bio-Coins.` };
    }

    // Registrar compra localmente
    const newItems = [...state.purchasedItems, item];
    state.purchasedItems = newItems;
    this.service.data.userStates[targetUser.id] = state;

    if (targetUser.id === this.service.data.currentUserId || targetUser.ra === this.service.currentUserRa) {
      this.service.purchasedItemsSubject.next(newItems);
    }

    let balanceAdjust = -upgrade.price;
    let pointsAdjust = 0;

    const allShopItems: EcosystemItem[] = [
      'filtro_ar', 'limpar_rio', 'reparar_grama', 
      'arvore_1', 'arvore_2', 'arvore_3', 
      'passaro_1', 'passaro_2', 'passaro_3',
      'peixe_1', 'peixe_2', 'peixe_3', 
      'cachorro', 'gato', 'borboletas', 'borboletas_2', 'borboletas_3', 'borboletas_4',
      'casa', 'barco_1', 'barco_2', 'monstro_lago', 'mae_human', 'criancas', 'placas_solares', 'lixeiras'
    ];
    const boughtAll = allShopItems.every(id => newItems.includes(id));

    if (boughtAll && !state.nessiePurchaseDate) {
      pointsAdjust = 5000;
      balanceAdjust += 5000;
      
      const today = new Date();
      state.nessiePurchaseDate = today.toISOString();
      
      const newLegend = {
        id: `${targetUser.id}-${today.getMonth() + 1}-${today.getFullYear()}`,
        studentId: targetUser.id,
        studentName: targetUser.name,
        schoolId: targetUser.schoolId || 'global',
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        purchaseDate: today.toISOString(),
        benefitActive: true
      };
      setDoc(doc(db, "ecosystemLegends", newLegend.id), newLegend);
    }

    this.service.syncUserPoints(targetUser.id, balanceAdjust, pointsAdjust, `Compra de Item: ${item}`);
    return { success: true };
  }

  refundUpgrade(item: EcosystemItem, targetUserId?: string): { success: boolean; error?: string } {
    const catalog: Record<EcosystemItem, { price: number; minVitality?: number; required?: string }> = {
      'limpar_rio': { price: 300, minVitality: 70 },
      'filtro_ar': { price: 200, minVitality: 70 },
      'reparar_grama': { price: 150, minVitality: 70 },
      'arvore_1': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'arvore_2': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'arvore_3': { price: 200, minVitality: 70, required: 'reparar_grama' },
      'passaro_1': { price: 150, required: 'arvore_1' },
      'passaro_2': { price: 150, required: 'arvore_2' },
      'passaro_3': { price: 150, required: 'arvore_3' },
      'peixe_1': { price: 100, required: 'limpar_rio' },
      'peixe_2': { price: 100, required: 'limpar_rio' },
      'peixe_3': { price: 100, required: 'limpar_rio' },
      'cachorro': { price: 400, required: 'reparar_grama' },
      'gato': { price: 400, required: 'reparar_grama' },
      'borboletas': { price: 150, required: 'reparar_grama' },
      'borboletas_2': { price: 200, required: 'borboletas' },
      'borboletas_3': { price: 250, required: 'borboletas_2' },
      'borboletas_4': { price: 300, required: 'borboletas_3' },
      'casa': { price: 1500, minVitality: 100, required: 'arvore_1' },
      'barco_1': { price: 500, required: 'limpar_rio' },
      'barco_2': { price: 600, required: 'barco_1' },
      'monstro_lago': { price: 5000, required: 'casa' },
      'mae_human': { price: 600, required: 'casa' },
      'criancas': { price: 400, required: 'mae_human' },
      'placas_solares': { price: 400, required: 'casa' },
      'lixeiras': { price: 200, required: 'criancas' },
    };

    const upgrade = catalog[item];
    if (!upgrade) return { success: false, error: "Item não encontrado no catálogo." };

    const targetUser = targetUserId 
      ? this.service.data.users.find((u: User) => u.id === targetUserId || u.ra === targetUserId)
      : this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);

    if (!targetUser) return { success: false, error: "Usuário não identificado para reembolso." };

    const state = this.service.data.userStates[targetUser.id] || this.service.getDefaultState(targetUser);

    if (!state.purchasedItems.includes(item)) {
      return { success: false, error: "Você ainda não possui este item!" };
    }

    // Se o usuário possui o Nessie (monstro_lago), ele não pode reembolsar nenhum outro item
    // pois o Nessie exige que todos os outros itens estejam adquiridos.
    if (item !== 'monstro_lago' && state.purchasedItems.includes('monstro_lago')) {
      return { success: false, error: "Não é possível remover! Reembolse a Lenda do Lago (Nessie) primeiro." };
    }

    // Verificar se outros itens dependem deste item
    const dependentItems = Object.keys(catalog).filter(
      id => catalog[id as EcosystemItem].required === item && state.purchasedItems.includes(id as EcosystemItem)
    );
    if (dependentItems.length > 0) {
      const depNames = dependentItems.map(d => d.replace(/_/g, ' ')).join(', ');
      return { success: false, error: `Não é possível remover! Outros itens dependem deste: ${depNames}.` };
    }

    // Remover item
    const newItems = state.purchasedItems.filter((i: EcosystemItem) => i !== item);
    state.purchasedItems = newItems;
    this.service.data.userStates[targetUser.id] = state;

    if (targetUser.id === this.service.data.currentUserId || targetUser.ra === this.service.currentUserRa) {
      this.service.purchasedItemsSubject.next(newItems);
    }

    let balanceAdjust = upgrade.price; // Devolve o valor gasto
    let pointsAdjust = 0;

    // Se ele tinha a conquista de Guardião da Lenda (comprou tudo) e removeu um item, perde o status
    if (state.nessiePurchaseDate) {
      pointsAdjust = -5000;
      balanceAdjust -= 5000; // Remove o bônus de moedas concedido
      state.nessiePurchaseDate = null;
      
      const today = new Date();
      const legendId = `${targetUser.id}-${today.getMonth() + 1}-${today.getFullYear()}`;
      deleteDoc(doc(db, "ecosystemLegends", legendId)).catch(console.error);
    }

    this.service.syncUserPoints(targetUser.id, balanceAdjust, pointsAdjust, `Reembolso de Item: ${item}`);
    return { success: true };
  }

  async deleteReward(id: string, sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;
    const reward = this.service.data.rewards.find((r: any) => r.id === id);
    if (reward) {
      const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
      if (currentUser?.role === 'admin' && reward.schoolId !== currentUser.schoolId) {
        return false;
      }
    }
    this.service.data.rewards = this.service.data.rewards.filter((r: any) => r.id !== id);
    this.service.rewardsSubject.next([...this.service.data.rewards]);
    try {
      await deleteDoc(doc(db, "rewards", id));
      this.service.saveToStorage();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async deleteArticle(id: string, sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;
    const article = this.service.data.articles.find((a: any) => a.id === id);
    if (article) {
      const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
      if (currentUser?.role === 'admin' && article.schoolId !== currentUser.schoolId) {
        return false;
      }
    }
    this.service.data.articles = this.service.data.articles.filter((a: any) => a.id !== id);
    this.service.articlesSubject.next([...this.service.data.articles]);
    try {
      await deleteDoc(doc(db, "articles", id));
      this.service.saveToStorage();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async deleteQuizTopic(id: string, sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;
    const topic = this.service.data.quizTopics.find((t: any) => t.id === id);
    if (topic) {
      const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
      if (currentUser?.role === 'admin' && topic.schoolId !== currentUser.schoolId) {
        return false;
      }
    }
    this.service.data.quizTopics = this.service.data.quizTopics.filter((t: any) => t.id !== id);
    this.service.quizTopicsSubject.next([...this.service.data.quizTopics]);
    try {
      await deleteDoc(doc(db, "quizTopics", id));
      this.service.saveToStorage();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async updateRewards(newRewards: Reward[], sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    let targetSid = sid || 'global';
    if (currentUser?.role === 'admin') {
      targetSid = currentUser.schoolId || 'global';
    }

    try {
      const oldRewardsOfSchool = (this.service.data.rewards || []).filter((r: Reward) => r.schoolId === targetSid);
      const oldIds = oldRewardsOfSchool.map((r: Reward) => r.id);
      
      const newRewardsOfSchool = newRewards.filter((r: Reward) => r.schoolId === targetSid);
      const newIds = newRewardsOfSchool.map((r: Reward) => r.id);
      
      const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));

      for (const r of newRewardsOfSchool) {
        await setDoc(doc(db, "rewards", r.id), r);
      }

      for (const id of deletedIds) {
        await deleteDoc(doc(db, "rewards", id));
      }

      const otherRewards = (this.service.data.rewards || []).filter((r: Reward) => r.schoolId !== targetSid);
      const updatedRewards = [...otherRewards, ...newRewardsOfSchool];

      this.service.data.rewards = updatedRewards;
      this.service.rewardsSubject.next(updatedRewards);
      this.service.saveToStorage();
      return true;
    } catch (error) {
      console.error("[PEDAGOGICAL SERVICE] Erro ao atualizar recompensas:", error);
      return false;
    }
  }

  async updateArticles(newArticles: EducationArticle[], sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    let targetSid = sid || 'global';
    if (currentUser?.role === 'admin') {
      targetSid = currentUser.schoolId || 'global';
    }

    try {
      const oldArticlesOfSchool = (this.service.data.articles || []).filter((a: EducationArticle) => a.schoolId === targetSid);
      const oldIds = oldArticlesOfSchool.map((a: EducationArticle) => a.id);
      
      const newArticlesOfSchool = newArticles.filter((a: EducationArticle) => a.schoolId === targetSid);
      const newIds = newArticlesOfSchool.map((a: EducationArticle) => a.id);
      
      const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));

      for (const a of newArticlesOfSchool) {
        await setDoc(doc(db, "articles", a.id), a);
      }

      for (const id of deletedIds) {
        await deleteDoc(doc(db, "articles", id));
      }

      const otherArticles = (this.service.data.articles || []).filter((a: EducationArticle) => a.schoolId !== targetSid);
      const updatedArticles = [...otherArticles, ...newArticlesOfSchool];

      this.service.data.articles = updatedArticles;
      this.service.articlesSubject.next(updatedArticles);
      this.service.saveToStorage();
      return true;
    } catch (error) {
      console.error("[PEDAGOGICAL SERVICE] Erro ao atualizar artigos:", error);
      return false;
    }
  }

  async updateQuizTopics(newTopics: QuizTopic[], sid?: string): Promise<boolean> {
    if (!this.service.checkAdminAuth()) return false;

    const currentUser = this.service.data.users.find((u: User) => u.id === this.service.data.currentUserId || u.ra === this.service.currentUserRa);
    let targetSid = sid || 'global';
    if (currentUser?.role === 'admin') {
      targetSid = currentUser.schoolId || 'global';
    }

    try {
      const oldTopicsOfSchool = (this.service.data.quizTopics || []).filter((t: QuizTopic) => t.schoolId === targetSid);
      const oldIds = oldTopicsOfSchool.map((t: QuizTopic) => t.id);
      
      const newTopicsOfSchool = newTopics.filter((t: QuizTopic) => t.schoolId === targetSid);
      const newIds = newTopicsOfSchool.map((t: QuizTopic) => t.id);
      
      const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));

      for (const t of newTopicsOfSchool) {
        await setDoc(doc(db, "quizTopics", t.id), t);
      }

      for (const id of deletedIds) {
        await deleteDoc(doc(db, "quizTopics", id));
      }

      const otherTopics = (this.service.data.quizTopics || []).filter((t: QuizTopic) => t.schoolId !== targetSid);
      const updatedTopics = [...otherTopics, ...newTopicsOfSchool];

      this.service.data.quizTopics = updatedTopics;
      this.service.quizTopicsSubject.next(updatedTopics);
      this.service.saveToStorage();
      return true;
    } catch (error) {
      console.error("[PEDAGOGICAL SERVICE] Erro ao atualizar tópicos de quiz:", error);
      return false;
    }
  }
}
