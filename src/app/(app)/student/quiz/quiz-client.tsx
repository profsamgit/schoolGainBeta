'use client';
import { useState, useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BrainCircuit, Loader2, PartyPopper, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { type GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { generateQuizAction } from './actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const formSchema = z.object({
  topic: z.string().min(1, 'Por favor, selecione um tópico.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numberOfQuestions: z.number().int().min(3).max(10),
});

type QuizFormValues = z.infer<typeof formSchema>;
type Question = GenerateQuizOutput['questions'][0];

export function QuizClient() {
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const querySnapshot = await getDocs(collection(db, 'quizzes'));
        const list: any[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setAvailableQuizzes(list);
      } catch (err) {
        console.error('Error fetching quizzes library:', err);
      } finally {
        setLoadingQuizzes(false);
      }
    }
    fetchQuizzes();
  }, [quizData]);

  const handleStartExistingQuiz = (quiz: any) => {
    form.setValue('topic', quiz.topic);
    form.setValue('difficulty', quiz.difficulty);
    form.setValue('numberOfQuestions', quiz.numberOfQuestions);
    setQuizData({
      quizTitle: quiz.quizTitle,
      questions: quiz.questions
    });
    resetQuizState();
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const { completeDailyMission, allQuizTopics: rawTopics, currentUser, recordQuizCompletion, userStates = {} } = useEcosystem();
  
  const studentState = useMemo(() => {
    if (currentUser?.id && userStates[currentUser.id]) {
      return userStates[currentUser.id];
    }
    return null;
  }, [currentUser, userStates]);

  const today = useMemo(() => new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }), []);

  const completedToday = useMemo(() => {
    const dates = studentState?.lastQuizDates || {};
    return {
      easy: dates.easy === today,
      medium: dates.medium === today,
      hard: dates.hard === today,
    };
  }, [studentState, today]);
  const allQuizTopics = useMemo(() => {
    return rawTopics
      .filter(t => 
        !t.schoolId || 
        t.schoolId === 'global' || 
        t.schoolId === currentUser?.schoolId
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rawTopics, currentUser?.schoolId]);
  const searchParams = useSearchParams();

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: searchParams.get('topic') || allQuizTopics[0]?.name || 'Reciclagem',
      difficulty: (searchParams.get('difficulty') as any) || 'medium',
      numberOfQuestions: searchParams.get('questions') ? Number(searchParams.get('questions')) : 5,
    },
  });

  const selectedTopicName = form.watch('topic');
  const selectedTopic = useMemo(() => {
    return allQuizTopics.find(t => t.name === selectedTopicName);
  }, [allQuizTopics, selectedTopicName]);

  const hasAlreadyCompleted = useMemo(() => {
    if (!selectedTopic || !studentState) return false;
    return studentState.completedQuizzes?.includes(selectedTopic.id) || false;
  }, [selectedTopic, studentState]);

  // Auto-start quiz if requested via URL
  useEffect(() => {
    const autoStart = searchParams.get('autoStart') === 'true';
    if (autoStart && !quizData && !isLoading) {
      form.handleSubmit(onSubmit)();
    }
  }, [searchParams, quizData, isLoading, form]);

  async function onSubmit(values: QuizFormValues) {
    setIsLoading(true);
    setError(null);
    setQuizData(null);
    resetQuizState();

    try {
      const result = await generateQuizAction(values);
      setQuizData(result);
    } catch (e: any) {
      setError(e.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnswerSelect(answer: string) {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < quizData!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      
      // Lógica de Recompensas do Ecossistema
      const diff = form.getValues('difficulty');
      const topicName = form.getValues('topic');
      const topic = allQuizTopics.find(t => t.name === topicName);
      
      const score = calculateScore();
      const total = quizData!.questions.length;
      const errors = total - score;
      
      // Manual de Pontuação v2 — Valores fixos por dificuldade
      let basePoints = 30; // Fácil
      if (diff === 'medium') basePoints = 45;
      else if (diff === 'hard') basePoints = 60;
      
      // Penalidade: -2 pontos por erro
      const points = Math.max(0, basePoints - (errors * 2));
      
      if (hasAlreadyCompleted) {
        toast({
          title: 'Quiz Finalizado (Apenas Leitura)',
          description: 'Você já realizou este quiz anteriormente. Desempenho registrado apenas para treino (nenhuma moeda extra concedida).',
        });
      } else {
        const success = completeDailyMission(points, diff);
        if (success) {
          toast({
            variant: 'success',
            title: points > 0 ? 'Parabéns!' : 'Quiz Finalizado',
            description: points > 0 
              ? `Você ganhou ${points} pontos e manteve sua folha viva! 🌿`
              : `Você finalizou o quiz, mas teve muitos erros para ganhar pontos. Tente novamente!`,
          });
        } else {
          const diffLabel = diff === 'easy' ? 'Fácil' : diff === 'medium' ? 'Médio' : 'Difícil';
          toast({
            title: 'Quiz finalizado!',
            description: `Você já completou sua missão diária hoje na dificuldade ${diffLabel}, mas continue praticando!`,
          });
        }
      }

      // Registro de atividade pedagógica para o gestor
      const finalScore = calculateScore();
      const scorePct = Math.round((finalScore / quizData!.questions.length) * 100);
      if (topic) {
        recordQuizCompletion(topic.id, scorePct, form.getValues('difficulty'), form.getValues('numberOfQuestions'));
      }
    }
  }
  
  function calculateScore() {
    if (!quizData) return 0;
    return quizData.questions.reduce((score, question, index) => {
      return selectedAnswers[index] === question.correctAnswer ? score + 1 : score;
    }, 0);
  }

  function resetQuizState() {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto border border-slate-200 dark:border-white/5 shadow-2xl bg-white dark:bg-slate-900/40 text-slate-950 dark:text-white backdrop-blur-xl rounded-[2rem]">
        <CardContent className="p-12 flex flex-col items-center justify-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
          <p className="text-base text-slate-650 dark:text-slate-350 font-bold uppercase tracking-wider">Gerando seu quiz personalizado...</p>
        </CardContent>
      </Card>
    );
  }

  if (quizData && !showResults) {
    const question = quizData.questions[currentQuestionIndex];
    return (
      <Card className="w-full max-w-2xl mx-auto border border-slate-200 dark:border-white/5 shadow-2xl bg-white dark:bg-slate-900/40 text-slate-950 dark:text-white backdrop-blur-xl rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="border-b border-slate-100 dark:border-white/5 p-6 md:p-8">
          <CardTitle className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-snug">{quizData.quizTitle}</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-450 font-black text-[9px] mt-1.5 flex justify-between items-center uppercase tracking-wider">
            <span>Pergunta {currentQuestionIndex + 1} de {quizData.questions.length}</span>
            <span className="text-emerald-500">{Math.round(((currentQuestionIndex + 1) / quizData.questions.length) * 100)}% concluído</span>
          </CardDescription>
          <Progress value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} className="h-1.5 bg-slate-200 dark:bg-slate-955 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400 mt-4"/>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">{question.questionText}</p>
          <RadioGroup value={selectedAnswers[currentQuestionIndex]} onValueChange={handleAnswerSelect} className="space-y-3">
            {question.options.map((option, index) => {
              const optionId = `option-${currentQuestionIndex}-${index}`;
              const isSelected = selectedAnswers[currentQuestionIndex] === option;
              return (
                <div 
                  key={optionId} 
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none",
                    isSelected 
                      ? "bg-emerald-500/10 border-emerald-500 text-slate-950 dark:text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                      : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-350"
                  )}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <RadioGroupItem value={option} id={optionId} className="border-slate-300 dark:border-white/20 text-emerald-500 dark:text-emerald-450 focus:ring-emerald-500 focus:ring-offset-0 bg-transparent" />
                  <Label htmlFor={optionId} className="font-medium text-xs leading-relaxed cursor-pointer flex-grow text-slate-700 dark:text-slate-350">{option}</Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950/20 p-6 md:p-8 flex justify-between items-center">
          <div>
            {currentQuestionIndex > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)} 
                className="h-11 px-8 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300"
              >
                Voltar
              </Button>
            )}
          </div>
          <Button onClick={handleNextQuestion} disabled={!selectedAnswers[currentQuestionIndex]} className="h-11 px-8 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-all duration-300">
            {currentQuestionIndex < quizData.questions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultados'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (quizData && showResults) {
    const score = calculateScore();
    const totalQuestions = quizData.questions.length;
    return (
      <Card className="w-full max-w-2xl mx-auto border border-slate-200 dark:border-white/5 shadow-2xl bg-white dark:bg-slate-900/40 text-slate-950 dark:text-white backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="items-center p-8 border-b border-slate-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)] flex items-center justify-center mb-4">
              <PartyPopper className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-950 dark:text-white">Resultados do Quiz!</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs mt-1.5">
              Você acertou <span className="text-emerald-500 font-black">{score}</span> de <span className="text-slate-950 dark:text-white font-black">{totalQuestions}</span> perguntas.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {quizData.questions.map((q, i) => {
            const isCorrect = selectedAnswers[i] === q.correctAnswer;
            return (
              <div key={i} className={cn("p-5 rounded-2xl border transition-all duration-300", isCorrect ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-400' : 'border-rose-500/20 bg-rose-500/5 text-rose-950 dark:text-rose-450' )}>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{i+1}. {q.questionText}</p>
                <div className='flex items-center gap-2 mt-3 text-xs'>
                  {isCorrect ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> : <XCircle className="h-4.5 w-4.5 text-rose-500 animate-pulse" />}
                  <p className="font-semibold text-slate-600 dark:text-slate-350">Sua resposta: <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-450 font-bold'}>{selectedAnswers[i] || 'Não respondida'}</span></p>
                </div>
                {!isCorrect && (
                  <p className='mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium pl-6.5'>
                    Resposta correta: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{q.correctAnswer}</span>
                  </p>
                )}
                {q.explanation && (
                  <Alert className="mt-4 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-955 text-slate-600 dark:text-slate-400 text-xs rounded-xl py-3 pl-4">
                    <AlertDescription className="font-medium leading-relaxed">{q.explanation}</AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </CardContent>
        <CardFooter className='border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950/20 p-6 md:p-8 flex justify-center gap-4'>
           <Button onClick={() => setQuizData(null)} className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-300">
             Gerar Novo Quiz
           </Button>
           <Button onClick={() => router.push('/student/dashboard')} variant="outline" className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300">
             Fechar Quiz
           </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <Card className="w-full border border-slate-200 dark:border-white/5 shadow-2xl bg-white dark:bg-slate-900/40 text-slate-950 dark:text-white backdrop-blur-xl rounded-[2rem] overflow-hidden animate-in fade-in duration-500 transition-all">
        <CardHeader className="border-b border-slate-100 dark:border-white/5 p-6 md:p-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-slate-950 dark:text-white">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-emerald-500" />
            </div>
            Gerador de Quiz Sustentável
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 font-bold text-[9px] mt-1.5 leading-relaxed uppercase tracking-widest">
            Teste seus conhecimentos e ganhe pontos! Escolha um tópico e a dificuldade.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="p-5 md:p-6 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-500/10 bg-indigo-50/30 dark:bg-indigo-500/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <BrainCircuit size={14} className="animate-pulse" />
                    Metas de Aprendizado Diário
                  </span>
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-200/50 dark:bg-white/5 px-2.5 py-1 rounded-full">
                    1 prêmio por dificuldade / dia
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'easy', label: 'Fácil', offset: 0 },
                    { key: 'medium', label: 'Médio', offset: 10 },
                    { key: 'hard', label: 'Difícil', offset: 20 },
                  ].map((diffItem) => {
                    const isCompleted = completedToday[diffItem.key as 'easy' | 'medium' | 'hard'];
                    const currentBaseValue = selectedTopic?.coinsValue !== undefined ? selectedTopic.coinsValue : 10;
                    const calculatedPoints = currentBaseValue + diffItem.offset;
                    return (
                      <div 
                        key={diffItem.key}
                        className={cn(
                          "p-3 rounded-2xl border flex flex-col justify-between transition-all duration-300",
                          isCompleted 
                            ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-450 shadow-[0_4px_12px_rgba(16,185,129,0.05)]"
                            : "bg-white dark:bg-slate-950/40 border-slate-100 dark:border-white/5 hover:border-indigo-500/20 hover:shadow-lg dark:hover:shadow-none text-slate-700 dark:text-slate-350"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{diffItem.label}</span>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-500" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping" />
                          )}
                        </div>
                        
                        <div className="space-y-0.5">
                          <p className={cn("text-[9px] font-black tracking-wide", isCompleted ? "text-emerald-600 dark:text-emerald-500/80" : "text-indigo-600 dark:text-indigo-400")}>
                            {isCompleted ? "₵0 / Concluído" : `Até ₵${calculatedPoints}`}
                          </p>
                          {!isCompleted && (
                            <p className="text-[7.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                              Valor: ₵{calculatedPoints}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Tópico</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 h-12 rounded-2xl focus:ring-emerald-500/50">
                          <SelectValue placeholder="Selecione um tópico ambiental" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-2xl">
                        {allQuizTopics.map((topic, idx) => {
                          const isCompleted = studentState?.completedQuizzes?.includes(topic.id);
                          const baseVal = topic.coinsValue !== undefined ? topic.coinsValue : 10;
                          return (
                            <SelectItem key={topic.id || `topic-${idx}`} value={topic.name} className="focus:bg-emerald-500 focus:text-white rounded-xl text-slate-850 dark:text-slate-200">
                              {topic.name} (₵{baseVal} base) {isCompleted ? '✓ (Já Realizado)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {hasAlreadyCompleted && (
                      <Alert className="border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[10px] rounded-xl py-3 pl-4 mt-2">
                        <AlertDescription className="font-bold leading-relaxed uppercase tracking-wider">
                          Atenção: Você já realizou este quiz anteriormente. Ele está em modo "Apenas Leitura" e não concederá moedas extras ao ser concluído.
                        </AlertDescription>
                      </Alert>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[9px] font-black uppercase tracking-wider text-slate-550 dark:text-slate-400">Dificuldade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 h-12 rounded-2xl focus:ring-emerald-500/50">
                            <SelectValue placeholder="Selecione a dificuldade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-2xl">
                          <SelectItem value="easy" className="focus:bg-emerald-500 focus:text-white rounded-xl text-slate-800 dark:text-slate-200">Fácil</SelectItem>
                          <SelectItem value="medium" className="focus:bg-emerald-500 focus:text-white rounded-xl text-slate-800 dark:text-slate-200">Médio</SelectItem>
                          <SelectItem value="hard" className="focus:bg-emerald-500 focus:text-white rounded-xl text-slate-800 dark:text-slate-200">Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfQuestions"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[9px] font-black uppercase tracking-wider text-slate-550 dark:text-slate-400">Nº de Perguntas</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 h-12 rounded-2xl focus:ring-emerald-500/50">
                            <SelectValue placeholder="Número de perguntas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-2xl">
                          <SelectItem value="3" className="focus:bg-emerald-500 focus:text-white rounded-xl text-slate-800 dark:text-slate-200">3 Perguntas</SelectItem>
                          <SelectItem value="5" className="focus:bg-emerald-500 focus:text-white rounded-xl text-slate-800 dark:text-slate-200">5 Perguntas</SelectItem>
                          <SelectItem value="10" className="focus:bg-emerald-500 focus:text-white rounded-xl text-slate-800 dark:text-slate-200">10 Perguntas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {error && (
                <p className="text-xs font-black text-rose-500 dark:text-rose-450 uppercase tracking-widest mt-2">{error}</p>
              )}
            </CardContent>
            <CardFooter className="border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-955/20 p-6 md:p-8">
              <Button type="submit" className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-all duration-300 w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Gerar Quiz'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Biblioteca de Quizzes */}
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-emerald-500" />
            Biblioteca de Quizzes Ativos
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
            Escolha e refaça quizzes que já foram gerados pela comunidade escolar
          </p>
        </div>

        {loadingQuizzes ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : availableQuizzes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-white/40 dark:bg-slate-900/10">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Nenhum quiz na biblioteca ainda. Gere o primeiro acima!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuizzes.map((quiz) => {
              const topicObj = allQuizTopics.find(t => t.name.toLowerCase() === quiz.topic?.toLowerCase());
              const isCompleted = topicObj && studentState?.completedQuizzes?.includes(topicObj.id);
              const baseCoins = topicObj?.coinsValue !== undefined ? topicObj.coinsValue : 10;
              const rewardValue = baseCoins + (quiz.difficulty === 'easy' ? 0 : quiz.difficulty === 'medium' ? 10 : 20);

              return (
                <Card key={quiz.id} className="flex flex-col justify-between overflow-hidden border border-slate-200/60 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] bg-white/80 dark:bg-slate-900/40 text-slate-800 dark:text-white backdrop-blur-xl hover:border-emerald-500/25">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                        quiz.difficulty === 'easy' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                        quiz.difficulty === 'medium' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20"
                      )}>
                        {quiz.difficulty === 'easy' ? 'Fácil' : quiz.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                        {quiz.numberOfQuestions} Perguntas
                      </span>
                    </div>
                    <CardTitle className="text-xs font-black text-slate-900 dark:text-white mt-3 line-clamp-2 uppercase tracking-tight leading-snug">
                      {quiz.quizTitle || `Quiz de ${quiz.topic}`}
                    </CardTitle>
                    <CardDescription className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1">
                      Tópico: <span className="text-emerald-600 dark:text-emerald-400 font-black">{quiz.topic}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="flex justify-between items-center text-[9px] bg-slate-50 dark:bg-slate-950/40 border border-slate-100/60 dark:border-white/5 rounded-xl p-2.5">
                      <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recompensa:</span>
                      <span className={cn("font-black", isCompleted ? "text-slate-500" : "text-amber-500")}>
                        {isCompleted ? "₵0 (Apenas Leitura)" : `Até ₵${rewardValue}`}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 p-4">
                    <Button onClick={() => handleStartExistingQuiz(quiz)} variant="ghost" className="w-full justify-between font-black uppercase text-[9px] tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-650 dark:hover:bg-emerald-500 border border-slate-200 dark:border-white/5 rounded-xl h-10 px-4 transition-all duration-300 group">
                      {isCompleted ? 'Rever Quiz' : 'Iniciar Quiz'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
