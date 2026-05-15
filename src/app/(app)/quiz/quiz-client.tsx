'use client';
import { useState, useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
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
import { BrainCircuit, Loader2, PartyPopper, CheckCircle, XCircle } from 'lucide-react';
import { type GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { generateQuizAction } from './actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useEcosystem } from '../ecosystem-context';

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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();
  const { completeDailyMission, allQuizTopics: rawTopics, currentUser, recordQuizCompletion } = useEcosystem();
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
      difficulty: 'medium',
      numberOfQuestions: 5,
    },
  });

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
      const isRecovery = form.getValues('topic') === 'Reciclagem';
      const points = isRecovery ? 20 : 10;
      
      const success = completeDailyMission(points);
      
      if (success) {
        toast({
          variant: 'success',
          title: 'Parabéns!',
          description: 'Você ganhou pontos e manteve sua folha viva! 🌿',
        });
      } else {
        toast({
          title: 'Quiz finalizado!',
          description: 'Você já completou sua missão diária hoje, mas continue praticando!',
        });
      }

      // Registro de atividade pedagógica para o gestor
      const finalScore = calculateScore();
      const scorePct = Math.round((finalScore / quizData!.questions.length) * 100);
      const topicName = form.getValues('topic');
      const topic = allQuizTopics.find(t => t.name === topicName);
      if (topic) {
        recordQuizCompletion(topic.id, scorePct);
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-10 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Gerando seu quiz personalizado...</p>
        </CardContent>
      </Card>
    );
  }

  if (quizData && !showResults) {
    const question = quizData.questions[currentQuestionIndex];
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">{quizData.quizTitle}</CardTitle>
          <CardDescription>
            Pergunta {currentQuestionIndex + 1} de {quizData.questions.length}
          </CardDescription>
          <Progress value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} className="mt-2"/>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold mb-4">{question.questionText}</p>
          <RadioGroup value={selectedAnswers[currentQuestionIndex]} onValueChange={handleAnswerSelect} className="space-y-2">
            {question.options.map((option, index) => {
              const optionId = `option-${currentQuestionIndex}-${index}`;
              return (
                <div key={optionId} className="flex items-center space-x-3">
                  <RadioGroupItem value={option} id={optionId} />
                  <Label htmlFor={optionId} className="font-normal text-base">{option}</Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNextQuestion} disabled={!selectedAnswers[currentQuestionIndex]}>
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="items-center">
            <PartyPopper className="h-12 w-12 text-yellow-500" />
            <CardTitle className="text-2xl">Resultados do Quiz!</CardTitle>
            <CardDescription>Você acertou {score} de {totalQuestions} perguntas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizData.questions.map((q, i) => {
            const isCorrect = selectedAnswers[i] === q.correctAnswer;
            return (
              <div key={i} className={cn("p-4 rounded-lg border", isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10' )}>
                <p className="font-semibold">{i+1}. {q.questionText}</p>
                <div className='flex items-center gap-2 mt-2'>
                  {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                  <p>Sua resposta: {selectedAnswers[i] || 'Não respondida'}</p>
                </div>
                {!isCorrect && <p className='mt-1 text-sm'>Resposta correta: {q.correctAnswer}</p>}
                {q.explanation && <Alert className="mt-2 text-sm"><AlertDescription>{q.explanation}</AlertDescription></Alert>}
              </div>
            );
          })}
        </CardContent>
        <CardFooter className='flex-col gap-4'>
           <Button onClick={() => setQuizData(null)}>Gerar Novo Quiz</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          Gerador de Quiz Sustentável
        </CardTitle>
        <CardDescription>
          Teste seus conhecimentos e ganhe pontos! Escolha um tópico e a
          dificuldade.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tópico</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tópico ambiental" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allQuizTopics.map((topic, idx) => (
                        <SelectItem key={topic.id || `topic-${idx}`} value={topic.name}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dificuldade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a dificuldade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
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
                  <FormItem>
                    <FormLabel>Nº de Perguntas</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Número de perguntas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3">3 Perguntas</SelectItem>
                        <SelectItem value="5">5 Perguntas</SelectItem>
                        <SelectItem value="10">10 Perguntas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Quiz
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
