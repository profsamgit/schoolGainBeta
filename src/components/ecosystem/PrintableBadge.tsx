'use client';

import { QRCodeSVG } from 'qrcode.react';
import { User } from '@/types/ecosystem';
import { Shield, Leaf, User as UserIcon, Sparkles } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface PrintableBadgeProps {
  user: User;
}

export default function PrintableBadge({ user }: PrintableBadgeProps) {
  const roleConfig = {
    student: { color: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', hex: '#10b981' },
    staff: { color: 'text-violet-600', bg: 'bg-violet-600', badge: 'bg-violet-100 text-violet-700', hex: '#7c3aed' },
    admin: { color: 'text-blue-600', bg: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700', hex: '#2563eb' },
    super_admin: { color: 'text-indigo-600', bg: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-700', hex: '#4f46e5' },
    visitor: { color: 'text-amber-600', bg: 'bg-amber-600', badge: 'bg-amber-100 text-amber-700', hex: '#d97706' },
  }[user.role as string] || { color: 'text-primary', bg: 'bg-primary', badge: 'bg-slate-100 text-slate-700', hex: '#10b981' };

  const avatarSrc = user.role === 'visitor'
    ? '/visitor-avatar.png'
    : user.avatar;

  return (
    <div id={`badge-${user.id}`} className="print-area bg-white w-[85mm] h-[55mm] rounded-[16px] p-[2px] flex flex-col justify-between relative overflow-hidden shadow-xl mx-auto my-4 print:m-0 print:shadow-none transition-all duration-500"
      style={{ 
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
        background: `linear-gradient(135deg, ${roleConfig.hex} 0%, #ffffff 40%, #ffffff 60%, ${roleConfig.hex} 100%)`
      }}>
      
      {/* Container Interno (Efeito Glass) */}
      <div className="bg-white/95 backdrop-blur-sm w-full h-full rounded-[14px] p-3 flex flex-col justify-between relative overflow-hidden">

        
        {/* Padrão de Fundo Tecnológico */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}></div>
        
        {/* Decoração de Fundo (Mesh) */}
        <div className={`absolute -top-12 -right-12 w-48 h-48 ${roleConfig.bg} opacity-[0.08] rounded-full blur-3xl`}></div>
        <div className={`absolute -bottom-12 -left-12 w-32 h-32 ${roleConfig.bg} opacity-[0.05] rounded-full blur-2xl`}></div>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100/50 pb-2 z-10">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <Leaf className="h-4.5 w-4.5 text-indigo-400 fill-indigo-500/20 animate-pulse print:animate-none" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[12px] tracking-[0.15em] uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text leading-none pb-0.5">
                SchoolGain
              </span>
              <span className={`text-[6px] font-black ${roleConfig.color} uppercase tracking-[0.2em] leading-none`}>
                Ecosystem
              </span>
            </div>
          </div>
          <div className={`${roleConfig.badge} px-2.5 py-1 rounded-full border border-current/10 flex items-center gap-1 shadow-sm`}>
            <Leaf className="h-2.5 w-2.5" />
            <span className="text-[8px] font-black uppercase tracking-widest">Sustentabilidade</span>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex flex-1 py-1 gap-4 items-center z-10">

          {/* FOTO COM GLOW */}
          <div className={`h-24 w-20 rounded-xl border-2 ${roleConfig.color.replace('text-', 'border-')}/30 overflow-hidden bg-slate-50 flex items-center justify-center shadow-md relative`}>
              <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={avatarSrc} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 text-slate-300">
                      <UserIcon className="h-8 w-8" />
                  </AvatarFallback>
              </Avatar>
          </div>

          {/* CENTRO: DADOS (GLASS CARD) */}
          <div className="flex-1 flex flex-col justify-center space-y-1">

            <div className="min-h-[34px] flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-1 h-1 rounded-full ${roleConfig.bg} animate-pulse print:animate-none`}></span>
                <p className={`text-[7px] font-black uppercase ${roleConfig.color} print:opacity-100 opacity-70 tracking-[0.2em]`}>Identificação</p>
              </div>
              <p className={`font-black text-slate-900 leading-[1.1] uppercase italic tracking-tighter ${user.name.length > 20 ? 'text-[10px]' : 'text-[14px]'} print:text-black`}>
                {user.name}
              </p>
            </div>
            
            <div className="flex flex-col space-y-0.5 pt-1 border-t border-slate-100">

              {/* Registro em linha única para salvar espaço vertical */}
              <div className="flex items-center justify-between">
                <p className="text-[7px] font-black uppercase text-slate-400 print:text-slate-600 tracking-widest">Registro</p>
                <p className={`font-bold text-slate-700 print:text-black font-mono tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded-md ${user.ra && user.ra.length > 12 ? 'text-[7px]' : 'text-[9px]'}`}>
                  {user.ra || '---'}
                </p>
              </div>

              {/* Turma com largura total para nomes longos */}
              <div className="flex flex-col">
                <p className="text-[7px] font-black uppercase text-slate-400 print:text-slate-600 tracking-widest mb-0.5">
                  {user.role === 'student' ? 'Turma' : user.role === 'visitor' ? 'Tipo de Acesso' : 'Setor'}
                </p>
                <p className={`font-black text-slate-800 print:text-black leading-[1.1] uppercase tracking-tighter 
                  ${(user.turma || user.curso || '').length > 25 ? 'text-[6px]' : 
                    (user.turma || user.curso || '').length > 15 ? 'text-[7px]' : 'text-[9px]'}`}>
                  {user.role === 'visitor' ? 'Externo / Kiosk' : (user.turma || user.curso || 'Escola')}
                </p>
              </div>
            </div>
          </div>

          {/* QR CODE PREMIUM COM LOGO CENTRAL */}
          <div className={`bg-white p-2 rounded-2xl border-2 ${roleConfig.color.replace('text-', 'border-')}/10 shadow-lg flex items-center justify-center relative group`}>
            <QRCodeSVG 
              value={user.ra || user.id} 
              size={65} 
              level="H"
              includeMargin={false}
              fgColor={roleConfig.hex}
              imageSettings={{
                src: "/logo-shield.svg", // Usando um placeholder conceitual ou o ícone do sistema
                height: 15,
                width: 15,
                excavate: true,
              }}
            />
            {/* Selo Holográfico de Segurança */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-full border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
               <Sparkles className="h-2.5 w-2.5 text-slate-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Rodapé e Créditos */}
        <div className="border-t border-slate-100/50 pt-2 flex justify-between items-center z-10">
          <div className="flex flex-col">
            <span className="text-[6px] font-black uppercase tracking-widest text-slate-400 leading-none">Desenvolvido por</span>
            <span className="text-[7px] font-bold text-slate-500 leading-tight uppercase tracking-tighter">
              TDS 2B 2026 - CETI Frei José Apicella
            </span>
          </div>
          <div className="flex items-center gap-1">
             <div className={`w-1.5 h-1.5 rounded-full ${roleConfig.bg} opacity-20`}></div>
             <div className={`text-[6px] font-black ${roleConfig.color} opacity-40 uppercase tracking-widest`}>
               SECURE-ID v2.0
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
