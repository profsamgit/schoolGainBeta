'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Keyboard, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { leaderboardData } from '@/lib/data';
import Link from 'next/link';

export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ra, setRa] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    const student = leaderboardData.find((user) => user.ra === ra.trim());
    if (student) {
      // In a real app, we'd set an auth token/session here.
      // For now, we'll just navigate.
      toast({
        title: `Bem-vindo, ${student.name}!`,
        description: 'Redirecionando para o seu painel.',
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Aluno não encontrado',
        description: 'O RA digitado não corresponde a nenhum aluno cadastrado. Tente novamente.',
      });
      setRa('');
    }
  };
  
  const handleKeyboardInput = (key: string) => {
    setRa((prev) => prev + key);
    inputRef.current?.focus();
  };

  const handleKeyboardBackspace = () => {
    setRa((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };


  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <main className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <UserCheck className="h-7 w-7 text-primary" />
                    Área do Aluno
                </CardTitle>
                <CardDescription>
                    Digite seu RA (Registro Acadêmico) para acessar.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <Input
                    ref={inputRef}
                    value={ra}
                    onChange={(e) => setRa(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Seu RA"
                    className="text-center text-xl h-14"
                    autoFocus
                    inputMode={showKeyboard ? 'none' : 'numeric'}
                />
                {showKeyboard && (
                    <VirtualKeyboard
                    layout="numeric"
                    onInput={handleKeyboardInput}
                    onBackspace={handleKeyboardBackspace}
                    onEnter={handleLogin}
                    />
                )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" size="lg" onClick={handleLogin} disabled={!ra.trim()}>
                        Entrar <ArrowRight className="ml-2" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => setShowKeyboard((prev) => !prev)}
                    >
                        <Keyboard className="mr-2" />
                        {showKeyboard ? 'Esconder' : 'Mostrar'} Teclado Virtual
                    </Button>
                </CardFooter>
            </Card>
        </main>
        <footer className="p-4 text-center text-xs text-muted-foreground space-y-2">
            <Link href="/" className="hover:text-primary underline">Voltar para a seleção de perfil</Link>
            <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
        </footer>
    </div>
  );
}
