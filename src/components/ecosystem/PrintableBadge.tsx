'use client';

import { QRCodeSVG } from 'qrcode.react';
import { User } from '@/lib/types';
import { Shield, Leaf } from 'lucide-react';

interface PrintableBadgeProps {
  user: User;
}

export default function PrintableBadge({ user }: PrintableBadgeProps) {
  return (
    <div id={`badge-${user.id}`} className="print-area bg-white w-[85mm] h-[55mm] border-2 border-slate-200 rounded-[12px] p-4 flex flex-col justify-between relative overflow-hidden shadow-sm mx-auto my-4 print:m-0 print:shadow-none print:border-slate-300">
      
      {/* Decoração de Fundo */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-1.5 shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[12px] tracking-tighter text-slate-800 uppercase leading-none">SchoolGain</span>
            <span className="text-[8px] font-bold text-primary uppercase tracking-widest leading-none">Ecosystem</span>
          </div>
        </div>
        <div className="bg-slate-100 px-2 py-1 rounded-full border border-slate-200 flex items-center gap-1">
          <Leaf className="h-2.5 w-2.5 text-primary" />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Sustentabilidade</span>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 py-3 gap-4 items-center z-10">
        {/* Lado Esquerdo: Dados */}
        <div className="flex-1 flex flex-col justify-center space-y-1.5">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Identificação</p>
            <p className="text-[14px] font-black text-slate-900 leading-tight truncate w-36 uppercase italic tracking-tighter">
              {user.name}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Registro</p>
              <p className="text-[10px] font-bold text-slate-700 font-mono tracking-tighter">{user.ra || '---'}</p>
            </div>
            <div>
              <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{user.role === 'student' ? 'Turma' : 'Setor'}</p>
              <p className="text-[9px] font-bold text-slate-700 leading-tight truncate tracking-tighter">
                {user.turma || user.curso || 'Escola'}
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: QR Code */}
        <div className="bg-white p-1.5 rounded-xl border-2 border-primary/20 shadow-inner flex items-center justify-center">
          <QRCodeSVG 
            value={user.ra || user.id} 
            size={70} 
            level="H"
            includeMargin={false}
            fgColor="#0ea5e9"
          />
        </div>
      </div>

      {/* Rodapé e Créditos */}
      <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center z-10">
        <div className="flex flex-col">
          <span className="text-[6px] font-black uppercase tracking-widest text-slate-400 leading-none">Desenvolvido por</span>
          <span className="text-[7px] font-bold text-slate-600 leading-tight uppercase tracking-tighter">
            TDS 2B 2026 - CETI Frei José Apicella
          </span>
        </div>
        <div className="text-[6px] font-black text-slate-300 uppercase tracking-widest">
          v2.0.26
        </div>
      </div>


    </div>
  );
}
