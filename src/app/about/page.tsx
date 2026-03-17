import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

const participants = [
  {
    name: 'Samuel Coelho de Sá',
    role: 'Professor',
    description: 'Analista de Sistemas - Especialista em Segurança, Redes e Engenharia da Computação',
    avatar: 'https://picsum.photos/seed/prof-samuel/200/200',
    initials: 'SC',
  },
  // Add more participants here in the future
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <main className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6">
            <Card className="w-full max-w-4xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    Sobre o Projeto SchoolGain
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-center">Equipe de Desenvolvimento</h2>
                    <div className="flex justify-center pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {participants.map((person) => (
                                <div key={person.name} className="flex flex-col items-center text-center p-2">
                                <Avatar className="h-32 w-32 border-4 border-primary/50">
                                    <AvatarImage src={person.avatar} alt={`Foto de ${person.name}`} />
                                    <AvatarFallback className="text-4xl">{person.initials}</AvatarFallback>
                                </Avatar>
                                <h3 className="mt-4 text-xl font-bold">{person.name}</h3>
                                <p className="font-medium text-primary">{person.role}</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{person.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-8">
                <Button asChild>
                    <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o Início
                    </Link>
                </Button>
            </div>
        </main>
        <footer className="p-4 text-center text-xs text-muted-foreground">
            <p>TDS 2B 2026 - CETI Frei José Apicella</p>
        </footer>
    </div>
  );
}
