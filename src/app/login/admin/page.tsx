'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Keyboard, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { mockAdmin } from '@/lib/data';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<'username' | 'password'>('username');
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    // In a real app, this would be a secure API call.
    if (username.trim().toLowerCase() === mockAdmin.email.toLowerCase() && password === 'admin123') {
       toast({
        title: `Bem-vindo, ${mockAdmin.name}!`,
        description: 'Redirecionando para o painel do gestor.',
      });
      router.push('/admin/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Credenciais inválidas',
        description: 'Login ou senha incorretos. Tente novamente.',
      });
      setPassword('');
    }
  };
  
  const handleKeyboardInput = (key: string) => {
    if (activeInput === 'username') {
      setUsername((prev) => prev + key);
      usernameRef.current?.focus();
    } else {
      setPassword((prev) => prev + key);
      passwordRef.current?.focus();
    }
  };

  const handleKeyboardBackspace = () => {
    if (activeInput === 'username') {
      setUsername((prev) => prev.slice(0, -1));
      usernameRef.current?.focus();
    } else {
      setPassword((prev) => prev.slice(0, -1));
      passwordRef.current?.focus();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <main className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <ShieldCheck className="h-7 w-7 text-primary" />
                    Área do Gestor
                </CardTitle>
                <CardDescription>
                    Entre com seu login e senha. (login: gestor@schoolgain.com, senha: admin123)
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className='space-y-1'>
                        <Label htmlFor="username">Login (E-mail)</Label>
                        <Input
                            id="username"
                            ref={usernameRef}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setActiveInput('username')}
                            placeholder="gestor@schoolgain.com"
                            autoFocus
                            inputMode={showKeyboard ? 'none' : 'email'}
                        />
                    </div>
                    <div className='space-y-1'>
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            ref={passwordRef}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setActiveInput('password')}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="••••••••"
                            inputMode={showKeyboard ? 'none' : 'text'}
                        />
                    </div>
                {showKeyboard && (
                    <VirtualKeyboard
                    layout="alphanumeric"
                    onInput={handleKeyboardInput}
                    onBackspace={handleKeyboardBackspace}
                    onEnter={handleLogin}
                    />
                )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" size="lg" onClick={handleLogin} disabled={!username.trim() || !password.trim()}>
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
