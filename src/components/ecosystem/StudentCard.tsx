'use client';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User as UserIcon, QrCode, Download, CreditCard, Image as ImageIcon, Share2 } from 'lucide-react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import PrintableBadge from './PrintableBadge';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

/**
 * StudentCard: Exibe a Carteira virtual do aluno com seu QR Code.
 * Agora utiliza o mesmo design premium da Carteira administrativa.
 */
export default function StudentCard() {
  const { currentUser } = useEcosystem();
  const { toast } = useToast();

  if (!currentUser) return null;
  const handlePrint = () => {
    const badgeElement = document.getElementById(`badge-${currentUser.id}`);
    if (!badgeElement) return;

    const printWindow = window.open('', '_blank', 'width=850,height=600');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Bloqueador de Pop-ups Ativo",
        description: "Por favor, permita pop-ups para que possamos abrir a tela de impressão da carteirinha.",
      });
      return;
    }

    // Pega todos os estilos da página atual
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão - Carteira SchoolGain</title>
          ${styles}
          <style>
            @media print {
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; }
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background-color: white !important;
            }
            .print-container {
              transform: scale(1.5);
              transform-origin: center center;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${badgeElement.outerHTML}
          </div>
          <script>
            // Aguarda o carregamento dos estilos e fontes
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 800);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadImage = async () => {
    const badgeElement = document.getElementById(`badge-${currentUser.id}`);
    if (!badgeElement) return;

    try {
      toast({
        title: "Gerando imagem...",
        description: "Aguarde enquanto preparamos sua carteirinha.",
      });

      // Pequeno delay para garantir renderização de fontes/imagens
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await toPng(badgeElement, {
        quality: 1.0,
        pixelRatio: 3, // Aumentado para 3 para máxima nitidez
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: 321,  // 85mm aproximado
        height: 208, // 55mm aproximado
        style: {
          margin: '0',
          transform: 'none',
        }
      });

      const link = document.createElement('a');
      link.download = `carteirinha-schoolgain-${currentUser.ra || 'estudante'}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Sucesso!",
        description: "Sua carteirinha foi salva como imagem.",
      });
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível gerar a imagem da carteirinha.",
      });
    }
  };

  const handleShare = async () => {
    const badgeElement = document.getElementById(`badge-${currentUser.id}`);
    if (!badgeElement) return;

    if (!navigator.share) {
      handleDownloadImage();
      return;
    }

    try {
      const dataUrl = await toPng(badgeElement, { 
        quality: 1.0, 
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: 321,
        height: 208,
        style: {
          margin: '0',
          transform: 'none',
        }
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'carteirinha.png', { type: 'image/png' });

      await navigator.share({
        title: 'Minha Carteirinha SchoolGain',
        text: 'Confira minha identificação no ecossistema SchoolGain!',
        files: [file],
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      handleDownloadImage(); // Fallback para download se o share falhar
    }
  };

  const roleConfig = {
    student: { glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)] border-emerald-500/20 text-emerald-400', text: 'text-emerald-400' },
    staff: { glow: 'shadow-[0_0_50px_rgba(124,58,237,0.35)] border-violet-500/20 text-violet-400', text: 'text-violet-400' },
    admin: { glow: 'shadow-[0_0_50px_rgba(37,99,235,0.35)] border-blue-500/20 text-blue-400', text: 'text-blue-400' },
    super_admin: { glow: 'shadow-[0_0_50px_rgba(79,70,229,0.35)] border-indigo-500/20 text-indigo-400', text: 'text-indigo-400' },
    visitor: { glow: 'shadow-[0_0_50px_rgba(217,119,6,0.35)] border-amber-500/20 text-amber-400', text: 'text-amber-400' },
  }[currentUser.role as string] || { glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)] border-emerald-500/20 text-emerald-400', text: 'text-emerald-400' };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-slate-900/40 backdrop-blur-md border-white/10 text-white hover:bg-white/10 transition-all shadow-lg">
          <CreditCard className="h-4 w-4 text-emerald-400" />
          Minha Carteira
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-[#070913]/95 backdrop-blur-2xl border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-white text-lg font-black tracking-tight">
            <UserIcon className={`h-5 w-5 animate-pulse shrink-0 ${roleConfig.text || 'text-emerald-400'}`} />
            Carteira Digital SchoolGain
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Use esta Carteira virtual para identificação e registro de resíduos.
          </DialogDescription>
        </DialogHeader>
        
        {/* Container Premium tridimensional com escala de visualização de 1.15 */}
        <div className="py-8 my-2 flex justify-center items-center overflow-visible [perspective:1000px]">
          <div className={`transform scale-[1.18] hover:scale-[1.25] hover:rotate-y-[6deg] hover:rotate-x-[4deg] transition-all duration-500 ease-out origin-center cursor-pointer select-none rounded-[16px] border ${roleConfig.glow}`}>
            <PrintableBadge user={currentUser} />
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-slate-400 uppercase font-black tracking-widest px-6 leading-relaxed">
          Aponte o QR Code acima nos terminais Kiosk da escola para login automático.
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Button className="gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl" onClick={handleDownloadImage}>
              <ImageIcon className="h-4 w-4" />
              Salvar Imagem
            </Button>
            <Button className="gap-2 shadow-lg border-white/10 hover:bg-white/5 hover:text-white text-slate-300 font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl" variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4" />
              PDF / Imprimir
            </Button>
          </div>

          {typeof navigator !== 'undefined' && !!navigator.share && (
            <Button className="w-full gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Compartilhar Carteirinha
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
