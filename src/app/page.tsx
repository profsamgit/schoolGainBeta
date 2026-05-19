import { ArrowRight, Laptop, Shield, User, CircleDot, Leaf } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-500">
      
      {/* 🌌 Cosmic Cosmic Background & Ambient Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Emerald glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Blob 2: Teal glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-5xl">
        
        {/* 📟 Glassmorphic Unified Console Container */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 md:p-14 transition-all duration-300">
          
          {/* Header Section */}
          <div className="mb-12 text-center flex flex-col items-center">
            
            {/* Status Pulse Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/60 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/20 mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Tecnologia da Informação - CETI Frei José Apicella
            </div>

            {/* Main Premium Gradient Headline */}
            <div className="flex items-center gap-3.5 mb-4 select-none justify-center">
              <Leaf className="h-8 w-8 text-indigo-500 dark:text-indigo-400 fill-indigo-500/20 animate-pulse shrink-0" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.25em] uppercase bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text">
                SchoolGain
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg text-sm sm:text-base leading-relaxed">
              Plataforma inteligente de engajamento, sustentabilidade escolar e reconhecimento de mérito em tempo real.
            </p>
          </div>

          {/* 🎛️ Interactive Profiles Grid (Glass Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            
            {/* Card 1: Student Area */}
            <Link href="/login/student" className="group block relative h-full">
              <div className="h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:shadow-emerald-500/5 group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/30 hover:scale-[1.03] transition-all duration-300">
                <div>
                  {/* Icon Badge */}
                  <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 mb-6 shadow-inner group-hover:scale-110 transition-all duration-300">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 mb-2">
                    Área do Aluno
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    Faça login com seu RA para acessar seu ecossistema, ver sua pontuação e trocar prêmios.
                  </p>
                </div>
                
                {/* Visual Action Indicator */}
                <div className="flex items-center justify-end text-sm font-semibold text-emerald-600 dark:text-emerald-400 gap-1.5 mt-2">
                  <span>Acessar</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>

            {/* Card 2: Admin Area */}
            <Link href="/login/admin" className="group block relative h-full">
              <div className="h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:shadow-indigo-500/5 group-hover:border-indigo-500/40 dark:group-hover:border-indigo-500/30 hover:scale-[1.03] transition-all duration-300">
                <div>
                  {/* Icon Badge */}
                  <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-indigo-100/80 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 mb-6 shadow-inner group-hover:scale-110 transition-all duration-300">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 mb-2">
                    Área do Gestor
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    Painel administrativo para controle de pontos, coletas de resíduos e auditoria da unidade.
                  </p>
                </div>

                {/* Visual Action Indicator */}
                <div className="flex items-center justify-end text-sm font-semibold text-indigo-600 dark:text-indigo-400 gap-1.5 mt-2">
                  <span>Acessar</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>

            {/* Card 3: Kiosk Terminal */}
            <Link href="/kiosk" className="group block relative h-full">
              <div className="h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:shadow-amber-500/5 group-hover:border-amber-500/40 dark:group-hover:border-amber-500/30 hover:scale-[1.03] transition-all duration-300">
                <div>
                  {/* Icon Badge */}
                  <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-amber-100/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 mb-6 shadow-inner group-hover:scale-110 transition-all duration-300">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200 mb-2">
                    Terminal Kiosk
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    Acesso rápido de pesagem para descarte de resíduos recicláveis usando identificação por RA.
                  </p>
                </div>

                {/* Visual Action Indicator */}
                <div className="flex items-center justify-end text-sm font-semibold text-amber-600 dark:text-amber-400 gap-1.5 mt-2">
                  <span>Utilizar</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>

          </div>

        </div>

      </main>

      {/* 🏁 High-Tech Minimalist Footer */}
      <footer className="relative z-10 w-full max-w-4xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/20 dark:border-slate-800/20">
        
        <Link href="/register-school" className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          <CircleDot className="w-3.5 h-3.5 animate-pulse" />
          Quero ser uma Escola Parceira (Solicitar Acesso)
        </Link>
        
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-800" />
          <Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">
            TDS 2B 2026 - CETI Frei José Apicella
          </Link>
        </div>
        
      </footer>

    </div>
  );
}
