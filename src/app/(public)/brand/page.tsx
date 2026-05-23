'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Download, 
  Palette, 
  Type, 
  Copy, 
  Check, 
  Eye, 
  Layout, 
  Sparkles,
  Grid
} from 'lucide-react';
import Link from 'next/link';

interface LogoAsset {
  id: string;
  name: string;
  description: string;
  path: string;
  type: 'icon' | 'logo-horizontal' | 'logo-vertical';
  theme: 'light' | 'dark' | 'any';
}

export default function BrandAssetsPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedFont, setCopiedFont] = useState<boolean>(false);
  const [bgPreviews, setBgPreviews] = useState<Record<string, 'light' | 'dark' | 'grid'>>({
    'icon-primary': 'light',
    'icon-emerald': 'light',
    'logo-horiz-light': 'light',
    'logo-horiz-dark': 'dark',
    'logo-vert-light': 'light',
    'logo-vert-dark': 'dark',
  });

  const assets: LogoAsset[] = [
    {
      id: 'icon-primary',
      name: 'Ícone Principal (Indigo)',
      description: 'Símbolo oficial do SchoolGain, unindo o formato de escudo e folha. Ideal para avatares, favicon e espaços reduzidos.',
      path: '/brand/schoolgain-icon-primary.svg',
      type: 'icon',
      theme: 'any'
    },
    {
      id: 'icon-emerald',
      name: 'Ícone Sustentabilidade (Emerald)',
      description: 'Versão verde esmeralda com foco ambiental. Perfeita para sinalizações de descarte, sustentabilidade e coletas de resíduos.',
      path: '/brand/schoolgain-icon-emerald.svg',
      type: 'icon',
      theme: 'any'
    },
    {
      id: 'logo-horiz-light',
      name: 'Logo Horizontal (Fundo Claro)',
      description: 'Assinatura visual padrão recomendada. Combina o ícone com a tipografia Outfit em tons escuros.',
      path: '/brand/schoolgain-logo-horizontal-light.svg',
      type: 'logo-horizontal',
      theme: 'light'
    },
    {
      id: 'logo-horiz-dark',
      name: 'Logo Horizontal (Fundo Escuro)',
      description: 'Versão adaptada para alto contraste em fundos escuros, utilizando tipografia branca e detalhes em lilás.',
      path: '/brand/schoolgain-logo-horizontal-dark.svg',
      type: 'logo-horizontal',
      theme: 'dark'
    },
    {
      id: 'logo-vert-light',
      name: 'Logo Vertical (Fundo Claro)',
      description: 'Layout vertical para composições centralizadas. Recomendada para cartazes, banners e cabeçalhos de relatórios.',
      path: '/brand/schoolgain-logo-vertical-light.svg',
      type: 'logo-vertical',
      theme: 'light'
    },
    {
      id: 'logo-vert-dark',
      name: 'Logo Vertical (Fundo Escuro)',
      description: 'Layout vertical otimizado para telas escuras ou materiais impressos de fundo preto ou azul escuro.',
      path: '/brand/schoolgain-logo-vertical-dark.svg',
      type: 'logo-vertical',
      theme: 'dark'
    }
  ];

  const colors = [
    { name: 'Indigo Primary', hex: '#4F46E5', rgb: 'rgb(79, 70, 229)', desc: 'Cor principal da marca e liderança tecnológica' },
    { name: 'Violet Accent', hex: '#7C3AED', rgb: 'rgb(124, 58, 237)', desc: 'Destaque e identidade da administração geral' },
    { name: 'Emerald Sustain', hex: '#10B981', rgb: 'rgb(16, 185, 129)', desc: 'Representa sustentabilidade e conquistas ecológicas' },
    { name: 'Dark Slate', hex: '#1E293B', rgb: 'rgb(30, 41, 59)', desc: 'Tipografia primária e fundos contrastantes leves' },
    { name: 'Midnight Black', hex: '#0B0F19', rgb: 'rgb(11, 15, 25)', desc: 'Fundo escuro oficial para console digital e OLED' },
  ];

  const copyToClipboard = (text: string, type: 'color' | 'font') => {
    navigator.clipboard.writeText(text);
    if (type === 'color') {
      setCopiedColor(text);
      setTimeout(() => setCopiedColor(null), 2000);
    } else {
      setCopiedFont(true);
      setTimeout(() => setCopiedFont(false), 2000);
    }
  };

  const togglePreviewBg = (id: string, mode: 'light' | 'dark' | 'grid') => {
    setBgPreviews(prev => ({
      ...prev,
      [id]: mode
    }));
  };

  const handleDownloadSVG = (path: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dinamicamente baixa o SVG como um arquivo PNG renderizado no canvas
  const handleDownloadPNG = async (path: string, fileName: string) => {
    try {
      const response = await fetch(path);
      const svgText = await response.text();
      
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Define dimensões bem altas para o PNG ficar em ultra-definição (ex: 2048px de largura)
        let width = 1000;
        let height = 1000;
        
        if (fileName.includes('horizontal')) {
          width = 2600;
          height = 600;
        } else if (fileName.includes('vertical')) {
          width = 1600;
          height = 1300;
        } else {
          width = 1024;
          height = 1024;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const pngUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = pngUrl;
              link.download = fileName.replace('.svg', '.png');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(pngUrl);
            }
          }, 'image/png');
        }
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Erro ao converter SVG para PNG:', error);
      // Fallback: faz o download do SVG
      handleDownloadSVG(path, fileName);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-slate-50 dark:bg-slate-950 overflow-y-auto py-12 px-4 md:py-20 font-sans selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-500">
      
      {/* 🌌 Cosmic Background & Ambient Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start w-full max-w-5xl">
        
        {/* 📟 Glassmorphic Brand Container */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-6 md:p-12 transition-all duration-300">
          
          {/* Header Section */}
          <div className="mb-12 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-100/60 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-500/20 mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
              SCHOOLGAIN BRAND SYSTEM v2.0
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              Identidade Visual &{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Downloads
              </span>
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed mt-2 text-center">
              Acesse e faça o download dos logotipos, ícones e esquemas de cores oficiais da plataforma. 
              Nossas logos foram vetorizadas de forma inteligente e responsiva para garantir fidelidade máxima em qualquer dispositivo ou material impresso.
            </p>
          </div>

          {/* 🎛️ grid de Logos */}
          <div className="space-y-6 mb-16">
            <div className="flex items-center gap-3 border-b border-slate-200/30 dark:border-slate-800/30 pb-4 mb-6">
              <Layout className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Logotipos Vetoriais Oficiais
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assets.map((asset) => {
                const previewBg = bgPreviews[asset.id];
                const bgStyle = 
                  previewBg === 'dark' 
                    ? 'bg-slate-950 border-slate-900' 
                    : previewBg === 'grid'
                      ? 'bg-slate-100 dark:bg-slate-900 bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] dark:bg-[linear-gradient(45deg,#27272a_25%,transparent_25%),linear-gradient(-45deg,#27272a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#27272a_75%),linear-gradient(-45deg,transparent_75%,#27272a_75%)]'
                      : 'bg-white border-slate-100';

                return (
                  <div 
                    key={asset.id} 
                    className="flex flex-col rounded-[2rem] bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-500/25 dark:hover:border-indigo-500/20 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Visual Preview Box */}
                    <div className={`relative h-48 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/60 p-8 transition-colors duration-300 ${bgStyle}`}>
                      
                      {/* Interactive Background Toggles */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/40 dark:border-slate-800/60 shadow-sm z-20">
                        <button 
                          onClick={() => togglePreviewBg(asset.id, 'light')} 
                          className={`w-5 h-5 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center hover:scale-110 transition-transform ${previewBg === 'light' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                          title="Fundo Claro"
                        />
                        <button 
                          onClick={() => togglePreviewBg(asset.id, 'grid')} 
                          className={`w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center hover:scale-110 transition-transform ${previewBg === 'grid' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                          title="Fundo Transparente (Grid)"
                        >
                          <Grid className="w-3 h-3 text-slate-500" />
                        </button>
                        <button 
                          onClick={() => togglePreviewBg(asset.id, 'dark')} 
                          className={`w-5 h-5 rounded-full bg-slate-950 border border-slate-800 shadow-sm flex items-center justify-center hover:scale-110 transition-transform ${previewBg === 'dark' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                          title="Fundo Escuro"
                        />
                      </div>

                      {/* Actual SVG Image Element */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={asset.path} 
                        alt={asset.name} 
                        className={`max-h-36 max-w-full object-contain pointer-events-none drop-shadow-sm select-none transition-transform duration-300`}
                        style={{ height: asset.type === 'icon' ? '80px' : asset.type === 'logo-vertical' ? '120px' : '52px' }}
                      />
                    </div>

                    {/* Logo Information & Download Actions */}
                    <div className="p-6 flex flex-col flex-1 justify-between bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border ${
                            asset.theme === 'light' 
                              ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' 
                              : asset.theme === 'dark'
                                ? 'bg-indigo-950 text-indigo-400 border-indigo-900'
                                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/30'
                          }`}>
                            {asset.theme === 'light' ? 'Fundo Claro' : asset.theme === 'dark' ? 'Fundo Escuro' : 'Tema Livre'}
                          </span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/30">
                            {asset.type === 'icon' ? 'ÍCONE' : 'LOGOTIPO'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          {asset.description}
                        </p>
                      </div>

                      {/* Download Buttons Row */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button 
                          onClick={() => handleDownloadSVG(asset.path, `${asset.id}-schoolgain.svg`)}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 hover:border-indigo-300 font-extrabold text-xs py-5 rounded-2xl transition-all duration-200 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 dark:text-indigo-400 dark:border-indigo-900/50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Vetor SVG</span>
                        </Button>
                        <Button 
                          onClick={() => handleDownloadPNG(asset.path, `${asset.id}-schoolgain.svg`)}
                          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 font-extrabold text-xs py-5 rounded-2xl transition-all duration-200"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Imagem PNG</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🎨 Seção da Paleta de Cores */}
          <div className="space-y-6 mb-16 border-t border-slate-200/30 dark:border-slate-800/30 pt-12">
            <div className="flex items-center gap-3 pb-2">
              <Palette className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Paleta de Cores Institucionais
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Consistência visual é fundamental. Clique sobre qualquer um dos blocos abaixo para copiar o código hexadecimal da cor para sua área de transferência.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
              {colors.map((color) => {
                const isCopied = copiedColor === color.hex;
                return (
                  <button 
                    key={color.hex}
                    onClick={() => copyToClipboard(color.hex, 'color')}
                    className="group flex flex-col text-left p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/80 border border-slate-200/50 dark:border-slate-800/80 hover:border-emerald-500/30 hover:scale-[1.03] transition-all duration-300 shadow-sm outline-none"
                  >
                    <div 
                      className="h-16 w-full rounded-xl shadow-inner border border-slate-200/10 mb-3 flex items-center justify-center text-white"
                      style={{ backgroundColor: color.hex }}
                    >
                      <Copy className="w-5 h-5 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {color.name}
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                      {color.hex}
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-tight">
                      {color.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🔠 Seção de Tipografia */}
          <div className="space-y-6 border-t border-slate-200/30 dark:border-slate-800/30 pt-12 mb-6">
            <div className="flex items-center gap-3 pb-2">
              <Type className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Tipografia Oficial da Marca
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start bg-slate-50/50 dark:bg-slate-950/30 p-6 md:p-8 rounded-[2rem] border border-slate-200/40 dark:border-slate-800/40">
              <div className="space-y-4">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/20">
                  FAMÍLIA PRINCIPAL
                </span>
                <h3 className="text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Outfit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Uma fonte geométrica de alta tecnologia com cantos ligeiramente arredondados. 
                  Transmite modernidade, clareza científica e inovação sustentável. Utilizada em 
                  todos os títulos principais e logotipos.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard('Outfit', 'font')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  >
                    {copiedFont ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Nome</span>
                      </>
                    )}
                  </button>
                  <a 
                    href="https://fonts.google.com/specimen/Outfit" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Google Fonts</span>
                  </a>
                </div>
              </div>

              {/* Typography Weights Preview Card */}
              <div className="space-y-3.5 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 font-sans shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Exemplo de Aplicação (Outfit)</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[8px] font-mono text-slate-400 block mb-0.5">Heavy / Black 900</span>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.25em]">SCHOOLGAIN</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-400 block mb-0.5">Extra Bold 800</span>
                    <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">ECOSYSTEM</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-400 block mb-0.5">Bold 700</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Sustentabilidade e Engajamento</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-400 block mb-0.5">Regular 400</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      A tecnologia transformando a gestão de resíduos nas escolas em tempo real.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🔙 Interactive Return Action Bar */}
          <div className="mt-12 flex justify-center border-t border-slate-200/30 dark:border-slate-800/30 pt-8">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 hover:scale-105 active:scale-95 shadow-md font-bold text-xs tracking-wider uppercase transition-all duration-300 backdrop-blur-md"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200 text-indigo-500" />
              <span>Voltar para o Início</span>
            </Link>
          </div>

        </div>

      </main>

      {/* 🏁 High-Tech Minimalist Footer */}
      <footer className="relative z-10 w-full max-w-4xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200/20 dark:border-slate-800/20">
        <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors">
          TDS 2B 2026 — CETI Frei José Apicella
        </Link>
      </footer>

    </div>
  );
}
