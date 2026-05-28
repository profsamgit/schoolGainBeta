'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { ArrowLeft, Users, Sparkles, ZoomIn, FlaskConical } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const { allParticipants } = useEcosystem();
  const devTeam = allParticipants.filter(p => !p.isBetaTester);
  const betaTesters = allParticipants.filter(p => p.isBetaTester);
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; name: string } | null>(null);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-slate-50 dark:bg-slate-950 overflow-y-auto py-12 px-4 md:py-20 font-sans selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-500">
      
      {/* 🌌 Cosmic Background & Ambient Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Indigo/Violet glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        {/* Blob 2: Emerald/Teal glow */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start w-full max-w-4xl">
        
        {/* 📟 Glassmorphic Unified Console Container */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 md:p-12 transition-all duration-300">
          
          {/* Header Section */}
          <div className="mb-12 text-center flex flex-col items-center">
            
            {/* Status Pulse Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/60 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/20 mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
              CETI Frei José Apicella — TDS 2B 2026
            </div>

            {/* Main Premium Gradient Headline */}
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-3 flex items-center justify-center gap-3">
              <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              Sobre o Projeto{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                SchoolGain
              </span>
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 max-w-lg text-sm leading-relaxed mt-2">
              Conheça a equipe de engenharia e desenvolvimento responsável por dar vida ao ecossistema tecnológico do SchoolGain.
            </p>
          </div>

          {/* 🎛️ Interactive Team Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8 border-b border-slate-200/30 dark:border-slate-800/30 pb-4">
              Equipe de Engenharia de Software
            </h2>
            
            <div className="flex justify-center pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {devTeam.map((person) => (
                  <div 
                    key={person.id} 
                    className="group relative flex flex-col items-center text-center p-6 rounded-[2rem] bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 hover:scale-[1.04] hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
                  >
                    {/* Orbital Glowing Ring around Avatar */}
                    <div className="relative inline-block border-2 border-slate-200 dark:border-slate-800 p-1.5 rounded-full group-hover:border-emerald-500/60 dark:group-hover:border-emerald-500/40 transition-all duration-300 shadow-inner">
                      <Avatar className="h-28 w-28 border-4 border-transparent">
                        <AvatarImage src={person.avatar || undefined} alt={`Foto de ${person.name}`} className="object-cover" />
                        <AvatarFallback className="text-3xl font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Botão ZoomIn ao hover */}
                      {person.avatar && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto({ src: person.avatar, name: person.name })}
                          className="absolute inset-1.5 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ampliar foto"
                        >
                          <ZoomIn className="h-6 w-6 text-white" />
                        </button>
                      )}
                    </div>

                    {/* Member Details */}
                    <h3 className="mt-4 text-lg font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                      {person.name}
                    </h3>
                    
                    {/* Custom Translucent Role Pill */}
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-500/20 mt-2 shadow-sm">
                      {person.role}
                    </span>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-3.5 max-w-[240px]">
                      {person.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 🏫 Instituição Parceira */}
          <div className="mt-12 pt-8 border-t border-slate-200/30 dark:border-slate-800/30">
            <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200 mb-6">
              Instituição de Ensino Parceira
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850/60 backdrop-blur-md">
              <div className="flex-shrink-0 select-none p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 shadow-sm">
                <img 
                  src="/brand/logo_apicella_menor.png" 
                  alt="Logomarca CETI Frei José Apicella" 
                  className="h-20 w-auto object-contain dark:brightness-110" 
                />
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left">
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                  CETI Frei José Apicella
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  O Centro de Educação em Tempo Integral (CETI) Frei José Apicella é a unidade escolar sede e parceira piloto do ecossistema SchoolGain. O projeto foi ativamente concebido, testado e refinado em colaboração direta com a comunidade escolar, promovendo a integração entre tecnologia da informação e responsabilidade ecológica no cotidiano dos estudantes.
                </p>
              </div>
            </div>
          </div>

          {/* 🧪 Beta Testers — Agradecimento */}
          {betaTesters.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200/30 dark:border-slate-800/30">
              {/* Header da Seção */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/60 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/40 dark:border-amber-500/20 shadow-sm">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Programa Beta — Fase Experimental 2026
                </div>
                <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200">
                  Agradecimento aos Beta Testers
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
                  Alunos que dedicaram seu tempo para testar, reportar problemas e ajudar a construir um sistema mais robusto. Obrigado por cada feedback!
                </p>
              </div>

              {/* Grid de Beta Testers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {betaTesters.map((person) => (
                  <div
                    key={person.id}
                    className="group relative flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/50 dark:border-amber-500/15 hover:scale-[1.04] hover:border-amber-400/60 dark:hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
                  >
                    {/* Avatar com botão de ampliar no hover */}
                    <div className="relative inline-block">
                      <div className="border-2 border-amber-200 dark:border-amber-800 p-1 rounded-full group-hover:border-amber-400/70 dark:group-hover:border-amber-500/50 transition-all duration-300">
                        <Avatar className="h-16 w-16 border-2 border-transparent">
                          <AvatarImage src={person.avatar || undefined} alt={`Foto de ${person.name}`} className="object-cover" />
                          <AvatarFallback className="text-lg font-black bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            {person.initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* Botão ZoomIn ao hover */}
                      {person.avatar && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto({ src: person.avatar, name: person.name })}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ampliar foto"
                        >
                          <ZoomIn className="h-5 w-5 text-white" />
                        </button>
                      )}
                    </div>

                    {/* Nome e descrição */}
                    <h3 className="mt-3 text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200 leading-tight">
                      {person.name}
                    </h3>
                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100/60 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/30 dark:border-amber-500/20 mt-1.5 shadow-sm">
                      {person.role}
                    </span>
                    {person.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                        {person.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🔙 Interactive Return Action Bar */}
          <div className="mt-12 flex justify-center border-t border-slate-200/30 dark:border-slate-800/30 pt-8">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 hover:scale-105 active:scale-95 shadow-md font-bold text-xs tracking-wider uppercase transition-all duration-300 backdrop-blur-md"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200 text-emerald-500" />
              <span>Voltar para o Início</span>
            </Link>
          </div>

        </div>

      </main>

      {/* Modal de visualização da foto */}
      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200/60 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4">
          <DialogHeader className="w-full">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 text-center">
              {previewPhoto?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/50 shadow-lg flex items-center justify-center bg-slate-50 dark:bg-slate-950" style={{ minHeight: 240, minWidth: 240 }}>
            {previewPhoto && (
              <img src={previewPhoto.src} alt={previewPhoto.name} className="max-h-60 max-w-xs object-cover rounded-2xl" />
            )}
          </div>
          <Button variant="outline" className="w-full rounded-xl border-slate-200/60 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setPreviewPhoto(null)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* 🏁 High-Tech Minimalist Footer */}
      <footer className="relative z-10 w-full max-w-4xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200/20 dark:border-slate-800/20">
        <Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">
          TDS 2B 2026 — CETI Frei José Apicella
        </Link>
      </footer>

    </div>
  );
}
