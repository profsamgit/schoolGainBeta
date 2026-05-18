'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, School as SchoolIcon, Send, Loader2 } from 'lucide-react';
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
    initialManagerPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await requestSchoolRegistration(formData, formData.initialManagerPassword);
      if (res) {
        setIsSuccess(true);
        toast({ title: "Solicitação Enviada", description: "Entraremos em contato em breve!" });
      } else {
        toast({ title: "Erro", description: "Dados insuficientes para o cadastro.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível enviar a solicitação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden selection:bg-indigo-500/20">
        
        {/* 🌌 Cosmic Background & Ambient Glow Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-center animate-in fade-in duration-500">
          <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-200/50 dark:border-indigo-500/20">
            <CheckCircle2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3 tracking-tight">
            Solicitação Recebida!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Obrigado pelo interesse no SchoolGain. Nossa equipe analisará os dados da <strong>{formData.name}</strong> e entrará em contato pelo e-mail <strong>{formData.contactEmail}</strong>.
          </p>
          
          <Button className="w-full h-13 text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-bold transition-all duration-300" asChild>
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-indigo-500/20 selection:text-indigo-950 dark:selection:text-indigo-500">
      
      {/* 🌌 Cosmic Background & Ambient Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Indigo glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        {/* Blob 2: Emerald glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg">
        
        {/* Header Back Bar */}
        <div className="w-full flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/80">
            <Link href="/"><ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <SchoolIcon className="h-5 w-5 text-indigo-500 animate-pulse" /> Seja uma Escola Parceira
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
              Leve a sustentabilidade para seus alunos
            </p>
          </div>
        </div>

        {/* 📟 Glassmorphic Registration Console */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-slate-50">Cadastro de Interesse</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
              Preencha os dados básicos da sua instituição para iniciarmos a parceria
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Nome da Escola */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">Nome da Escola</Label>
              <Input 
                id="name" 
                placeholder="Ex: CETI Frei José Apicella" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="h-12 px-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
              />
            </div>

            {/* Cidade & Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">Cidade</Label>
                <Input 
                  id="city" 
                  placeholder="Guadalupe" 
                  required 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="h-12 px-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">Estado (UF)</Label>
                <Input 
                  id="state" 
                  placeholder="PI" 
                  maxLength={2} 
                  required 
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                  className="h-12 px-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 text-center font-bold"
                />
              </div>
            </div>

            {/* E-mail de Contato */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">E-mail de Contato</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="direcao@escola.com.br" 
                required 
                value={formData.contactEmail}
                onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                className="h-12 px-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
              />
            </div>

            {/* Gestor Credentials Header */}
            <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 ml-1">
                Credenciais do Gestor da Unidade
              </p>
              
              <div className="grid gap-4">
                {/* E-mail de Login do Gestor */}
                <div className="space-y-1.5">
                  <Label htmlFor="managerEmail" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">
                    E-mail de Login do Gestor
                  </Label>
                  <Input 
                    id="managerEmail" 
                    type="email" 
                    placeholder="gestor@escola.com" 
                    required 
                    value={formData.managerEmail}
                    onChange={e => setFormData({...formData, managerEmail: e.target.value})}
                    className="h-12 px-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                </div>
                
                {/* Senha Inicial */}
                <div className="space-y-1.5">
                  <Label htmlFor="initialManagerPassword" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">
                    Senha Inicial
                  </Label>
                  <Input 
                    id="initialManagerPassword" 
                    type="password" 
                    placeholder="Crie uma senha forte" 
                    required 
                    value={formData.initialManagerPassword}
                    onChange={e => setFormData({...formData, initialManagerPassword: e.target.value})}
                    className="h-12 px-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button type="submit" className="w-full h-13 text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-bold transition-all duration-300 gap-2 animate-in duration-300" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Enviar Solicitação
                  </>
                )}
              </Button>
            </div>

          </form>

        </div>

        {/* TDS CETI Link */}
        <div className="mt-8 text-center">
          <Link href="/about" className="text-xs text-slate-400 dark:text-slate-500 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
            TDS 2B 2026 - CETI Frei José Apicella
          </Link>
        </div>

      </main>

    </div>
  );
}
