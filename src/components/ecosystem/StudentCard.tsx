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
import { User as UserIcon, QrCode, Download, CreditCard } from 'lucide-react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import PrintableBadge from './PrintableBadge';

/**
 * StudentCard: Exibe a Carteira virtual do aluno com seu QR Code.
 * Agora utiliza o mesmo design premium da Carteira administrativa.
 */
  const handlePrint = () => {
    const badgeElement = document.getElementById(`badge-${currentUser.id}`);
    if (!badgeElement) return;

    const printWindow = window.open('', '_blank', 'width=850,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir a carteira.');
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white/50 backdrop-blur-sm border-primary/20 hover:bg-white transition-all shadow-sm">
          <CreditCard className="h-4 w-4 text-primary" />
          Minha Carteira
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Carteira Digital SchoolGain
          </DialogTitle>
          <DialogDescription>
            Use esta Carteira virtual para identificação e registro de resíduos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex justify-center">
            <PrintableBadge user={currentUser} />
        </div>

        <div className="mt-2 text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-4">
            Aponte o QR Code acima nos terminais Kiosk da escola para login automático.
        </div>

        <div className="mt-6">
          <Button className="w-full gap-2 shadow-md" variant="default" onClick={handlePrint}>
            <Download className="h-4 w-4" />
            Baixar ou Imprimir PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
