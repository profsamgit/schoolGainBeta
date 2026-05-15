'use client';

import { User as UserData, School } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Recycle, 
  User, 
  QrCode, 
  Cpu, 
  Lock, 
  Keyboard, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Importação dinâmica do Scanner para evitar erros de SSR
import dynamic from 'next/dynamic';
const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });
import { useEcosystem } from '@/app/(app)/ecosystem-context';

interface IdentificationSectionProps {
  currentSchool: School | undefined;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeLoginMethod: string;
  lockoutSecs: number;
  studentRa: string;
  setStudentRa: (ra: string) => void;
  raInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogin: (ra: string) => void;
  showKeyboard: boolean;
  setShowKeyboard: (show: boolean | ((prev: boolean) => boolean)) => void;
  handleKeyboardInput: (key: string) => void;
  handleKeyboardBackspace: () => void;
  activeLoginCameraSource: string;
  scannerKey: number;
  loginCameraDeviceId: string | undefined;
  onIdentify: (data: string) => void;
  isProcessing: boolean;
}

export function IdentificationSection({
  currentSchool,
  activeTab,
  setActiveTab,
  activeLoginMethod,
  lockoutSecs,
  studentRa,
  setStudentRa,
  raInputRef,
  handleLogin,
  showKeyboard,
  setShowKeyboard,
  handleKeyboardInput,
  handleKeyboardBackspace,
  activeLoginCameraSource,
  scannerKey,
  loginCameraDeviceId,
  onIdentify,
  isProcessing
}: IdentificationSectionProps) {
  const { systemSettings } = useEcosystem();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Recycle className="h-8 w-8 text-primary" />
              Terminal SchoolGain
            </CardTitle>
            <CardDescription className="text-center">
              Identifique-se para registrar um resíduo.
              {currentSchool && (
                <span className="block mt-1 text-[10px] text-primary font-black uppercase tracking-widest animate-pulse">
                  {currentSchool.name} • {currentSchool.city}/{currentSchool.state}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className={cn(
                "grid w-full mb-4",
                activeLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
              )}>
                {(activeLoginMethod === 'all' || activeLoginMethod === 'manual') && (
                  <TabsTrigger value="manual" className="gap-2">
                    <User className="h-4 w-4" /> RA
                  </TabsTrigger>
                )}
                {(activeLoginMethod === 'all' || activeLoginMethod === 'qr') && (
                  <TabsTrigger value="qr" className="gap-2">
                    <QrCode className="h-4 w-4" /> QR
                  </TabsTrigger>
                )}
                {(activeLoginMethod === 'all' || activeLoginMethod === 'rfid') && (
                  <TabsTrigger value="rfid" className="gap-2">
                    <Cpu className="h-4 w-4" /> RFID
                  </TabsTrigger>
                )}
              </TabsList>

              {/* RA LOGIN */}
              <TabsContent value="manual" className="space-y-4">
                {lockoutSecs > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-destructive text-sm text-center font-medium animate-pulse">
                    <Lock className="h-4 w-4 inline mr-2" /> 
                    Acesso suspenso por {lockoutSecs}s
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="ra-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identificação Digital (RA ou ID Temporário)</label>
                  <Input 
                    id="ra-input"
                    ref={raInputRef}
                    placeholder="Digite seu RA ou ID Temporário" 
                    value={studentRa}
                    onChange={(e) => setStudentRa(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(studentRa)}}
                    className="text-2xl p-4 h-16 text-center font-black tracking-tighter uppercase"
                    autoFocus
                    disabled={lockoutSecs > 0}
                    inputMode={showKeyboard ? 'none' : 'text'}
                  />
                </div>
                {showKeyboard && (
                  <VirtualKeyboard
                    layout="alphanumeric"
                    onInput={handleKeyboardInput}
                    onBackspace={handleKeyboardBackspace}
                    onEnter={() => handleLogin(studentRa)}
                  />
                )}
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  size="lg"
                  onClick={() => handleLogin(studentRa)}
                  disabled={!studentRa.trim() || lockoutSecs > 0}
                >
                  {lockoutSecs > 0 ? `Bloqueado (${lockoutSecs}s)` : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowKeyboard((prev) => !prev)}
                >
                  <Keyboard className="mr-2" />
                  {showKeyboard ? 'Esconder' : 'Mostrar'} Teclado Virtual
                </Button>
              </TabsContent>

              {/* QR LOGIN */}
              <TabsContent value="qr" className="space-y-4">
                {activeLoginCameraSource === 'browser' ? (
                  <div className="space-y-4">
                    <QRScanner 
                      key={scannerKey} 
                      onScan={onIdentify} 
                      deviceId={systemSettings.studentCaptureDevice}
                    />
                    <p className="text-xs text-center text-muted-foreground uppercase font-black tracking-widest bg-slate-100 py-2 rounded-full">
                      Aproxime sua Carteira da câmera
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4 bg-primary/5">
                    <QrCode className="h-16 w-16 text-primary animate-pulse" />
                    <div className="text-center">
                      <p className="font-bold uppercase tracking-tight">Câmera Externa Ativa</p>
                      <p className="text-sm text-muted-foreground">O terminal fará a leitura automática via hardware externo.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* RFID LOGIN */}
              <TabsContent value="rfid" className="space-y-4">
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl space-y-6 bg-primary/5 border-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    <Cpu className="h-20 w-20 text-primary relative z-10 transition-transform group-hover:scale-110 duration-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-black uppercase tracking-tighter">Aproxime seu Cartão</p>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto font-medium leading-tight">
                      O sensor RFID está aguardando sua leitura para login instantâneo.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </CardContent>
        </Card>
      </main>
      <footer className="p-4 text-center text-xs text-muted-foreground space-y-2">
        <p>Não é um terminal? <Link href="/" className="underline hover:text-primary">Voltar para o app</Link></p>
        <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
      </footer>
    </div>
  );
}
