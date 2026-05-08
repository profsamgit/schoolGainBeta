'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, School as SchoolIcon, Send } from 'lucide-react';
import Link from 'next/link';

export default function RegisterSchoolPage() {
  const { requestSchoolRegistration } = useEcosystem();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    contactEmail: '',
    managerEmail: '',
    managerPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = requestSchoolRegistration(formData);
      if (res) {
        setIsSuccess(true);
        toast({ title: "Solicitação Enviada", description: "Entraremos em contato em breve!" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar a solicitação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-xl text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Solicitação Recebida!</CardTitle>
            <CardDescription>
              Obrigado pelo interesse no SchoolGain. Nossa equipe analisará os dados da <strong>{formData.name}</strong> e entrará em contato pelo e-mail <strong>{formData.contactEmail}</strong>.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full h-12 font-bold" asChild>
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-2 mb-8">
           <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
           </Button>
           <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                 <SchoolIcon className="h-6 w-6 text-primary" /> Seja uma Escola Parceira
              </h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Leve a sustentabilidade para seus alunos</p>
           </div>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle>Cadastro de Interesse</CardTitle>
            <CardDescription>Preencha os dados básicos da sua instituição para iniciarmos a parceria.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Escola</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: CETI Frei José Apicella" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input 
                    id="city" 
                    placeholder="Guadalupe" 
                    required 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input 
                    id="state" 
                    placeholder="PI" 
                    maxLength={2} 
                    required 
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail de Contato</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="direcao@escola.com.br" 
                  required 
                  value={formData.contactEmail}
                  onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Credenciais do Gestor da Unidade</p>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerEmail">E-mail de Login do Gestor</Label>
                    <Input 
                      id="managerEmail" 
                      type="email" 
                      placeholder="gestor@escola.com" 
                      required 
                      value={formData.managerEmail}
                      onChange={e => setFormData({...formData, managerEmail: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerPassword">Senha Inicial</Label>
                    <Input 
                      id="managerPassword" 
                      type="password" 
                      placeholder="Crie uma senha forte" 
                      required 
                      value={formData.managerPassword}
                      onChange={e => setFormData({...formData, managerPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-12 font-bold gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : (
                  <>
                    <Send className="h-4 w-4" /> Enviar Solicitação
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
