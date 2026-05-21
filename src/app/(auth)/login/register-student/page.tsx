'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, UserPlus, Send, Loader2, QrCode, Wifi, Eye, X, Wand2, BookOpen, GraduationCap, School as SchoolIcon } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

export default function RegisterStudentPage() {
  const { requestRegistration, allTurmas, allCursos, schools, setTargetSchoolId, systemSettings } = useEcosystem();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ra: '',
    rfid: '',
    turma: '',
    curso: '',
    schoolId: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isRFIDCapturing, setIsRFIDCapturing] = useState(false);
  const [showQRPreview, setShowQRPreview] = useState(false);

  const handleRADetected = (val: string) => {
    setFormData(prev => ({ ...prev, ra: val.toUpperCase() }));
    setIsScanning(false);
    toast({ title: "RA Identificado", description: `Código: ${val}` });
  };

  const handleRFIDDetected = (val: string) => {
    setFormData(prev => ({ ...prev, rfid: val.toUpperCase() }));
    setIsRFIDCapturing(false);
    toast({ title: "Cartão Identificado", description: `ID: ${val}` });
  };

  const generateRA = () => {
    const randomRA = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData(prev => ({ ...prev, ra: randomRA }));
    toast({ title: "RA Gerado", description: `Código: ${randomRA}` });
  };

  /**
   * CAPTURA DE RFID VIA TECLADO GLOBAL
   *
   * Leitores RFID USB funcionam como teclados: quando um cartão é aproximado,
   * o leitor "digita" o ID do cartão seguido de um "Enter" muito rápido.
   * Esta lógica intercepta esse comportamento:
   *   - Acumula os caracteres recebidos num 'buffer'
   *   - Se o intervalo entre teclas for > 100ms, considera que era uma digitação
   *     humana e limpa o buffer (humanos são mais lentos que o leitor)
   *   - Ao receber 'Enter', valida se o buffer tem o mínimo de 4 caracteres
   *     (um ID válido) e chama o handler de RFID detectado
   */
  useEffect(() => {
    if (!isRFIDCapturing) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKey = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      // Reseta o buffer se o intervalo for longo demais (digitação humana)
      if (currentTime - lastKeyTime > 100) buffer = '';

      if (e.key === 'Enter') {
        // Confirma a leitura apenas se o ID tiver comprimento mínimo
        if (buffer.length >= 4) {
          handleRFIDDetected(buffer);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isRFIDCapturing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação manual dos campos obrigatórios antes de chamar a API
    // (o Select não dispara validação nativa do HTML, por isso é feita aqui)
    if (!formData.name || !formData.ra || !formData.turma || !formData.curso || !formData.schoolId) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Por favor, preencha todos os campos para solicitar o cadastro.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Envia a solicitação ao serviço: ela ficara com status 'pendente'
      // até que um gestor a aprove no painel administrativo
      const result = await requestRegistration({
        name: formData.name,
        ra: formData.ra.toUpperCase(),
        rfid: formData.rfid.toUpperCase(),
        turma: formData.turma,
        curso: formData.curso,
        schoolId: formData.schoolId
      });

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Não foi possível enviar',
          description: result.error || 'Verifique seus dados e tente novamente.'
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: 'Solicitação enviada!',
        description: 'Seu pedido de cadastro foi encaminhado para aprovação do gestor.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua solicitação. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden selection:bg-emerald-500/20">
        
        {/* 🌌 Fundo Cósmico & Brilhos de Luz Ambiente */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-center animate-in fade-in duration-500">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-200/50 dark:border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3 tracking-tight">
            Solicitação Enviada!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Seu pedido de cadastro foi encaminhado para aprovação do gestor. Aguarde a validação para iniciar a sua jornada sustentável.
          </p>
          
          <Button className="w-full h-13 text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-bold transition-all duration-300" asChild>
            <Link href="/login/student">Voltar ao Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-500">
      
      {/* 🌌 Fundo Cósmico & Brilhos de Luz Ambiente */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Brilho 1: Brilho Esmeralda */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Brilho 2: Brilho Índigo */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        {/* Sobreposição sutil de padrão de grade */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg">
        
        {/* Barra de Navegação Superior (Voltar) */}
        <div className="w-full flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/80">
            <Link href="/login/student"><ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" /> Solicitar Cadastro
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
              Entre para o ecossistema sustentável
            </p>
          </div>
        </div>

        {/* 📟 Console de Cadastro com Efeito Vidro (Glassmorphic) */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl font-extrabold text-slate-950 dark:text-slate-50">Dados do Aluno</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
              Preencha seus dados corretamente para validação da sua unidade escolar parceira
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">Nome Completo</Label>
              <Input 
                id="name" 
                placeholder="Ex: João Silva" 
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 px-4 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400"
              />
            </div>

            {/* Campo RA - Identificação QR do Aluno */}
            <div className="space-y-1.5">
              <Label htmlFor="ra" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">RA (Identificação QR)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Input 
                    id="ra" 
                    placeholder="AGUARDANDO ID..." 
                    className="uppercase h-12 pr-12 font-semibold tracking-wide bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl"
                    required
                    value={formData.ra}
                    onChange={(e) => setFormData(prev => ({ ...prev, ra: e.target.value.toUpperCase() }))}
                  />
                  {formData.ra && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                       <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        onClick={() => setShowQRPreview(!showQRPreview)}
                        title="Ver QR Code"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                    </div>
                  )}
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 w-12 p-0 border-slate-200/60 dark:border-slate-800/80 bg-slate-900/90 dark:bg-slate-950/60 text-white hover:bg-slate-800 dark:hover:bg-slate-900 rounded-xl" 
                  onClick={generateRA}
                  title="Gerar RA"
                >
                  <Wand2 className="h-5 w-5 text-emerald-500" />
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className={cn(
                    "h-12 w-12 p-0 border-slate-200/60 dark:border-slate-800/80 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white transition-all",
                    isScanning ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white dark:text-slate-950' : 'hover:bg-slate-800 dark:hover:bg-slate-900'
                  )}
                  onClick={() => setIsScanning(!isScanning)}
                  title="Escanear QR"
                >
                  <QrCode className="h-5 w-5" />
                </Button>
              </div>

              {isScanning && (
                <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden animate-in fade-in duration-300">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 z-10 text-white hover:bg-white/20 rounded-full"
                    onClick={() => setIsScanning(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <QRScanner 
                    onScan={handleRADetected} 
                    deviceId={systemSettings.studentCaptureDevice}
                  />
                </div>
              )}

              {showQRPreview && formData.ra && (
                <div className="mt-4 p-6 bg-white border border-slate-200/50 dark:border-slate-800/50 rounded-2xl flex flex-col items-center gap-3 animate-in fade-in duration-300 shadow-sm">
                  <QRCodeSVG value={formData.ra} size={130} />
                  <p className="text-[10px] text-slate-555 font-black uppercase tracking-widest">{formData.ra}</p>
                </div>
              )}
            </div>

            {/* Campo RFID - Cartão do Aluno (Opcional) */}
            <div className="space-y-1.5">
              <Label htmlFor="rfid" className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">ID do Cartão (RFID)</Label>
              <div className="flex gap-2">
                <Input 
                  id="rfid" 
                  placeholder={isRFIDCapturing ? "AGUARDANDO APROXIMAÇÃO..." : "ID DO CARTÃO (OPCIONAL)"} 
                  className={cn(
                    "uppercase h-12 flex-1 font-semibold tracking-wide bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl",
                    isRFIDCapturing ? 'animate-pulse border-emerald-500/55 dark:border-emerald-500/55 bg-emerald-500/5' : ''
                  )}
                  value={formData.rfid}
                  onChange={(e) => setFormData(prev => ({ ...prev, rfid: e.target.value.toUpperCase() }))}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className={cn(
                    "h-12 w-12 p-0 border-slate-200/60 dark:border-slate-800/80 rounded-xl bg-slate-900/90 dark:bg-slate-950/60 text-white transition-all",
                    isRFIDCapturing ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white dark:text-slate-950' : 'hover:bg-slate-800 dark:hover:bg-slate-900'
                  )}
                  onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}
                  title="Capturar RFID"
                >
                  <Wifi className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Seção de Campos de Seleção (Escola, Turma, Curso) */}
            <div className="space-y-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/40">
              
              {/* Escola */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 ml-1">
                  <SchoolIcon className="h-3 w-3 text-emerald-500" /> Sua Escola / Unidade
                </Label>
                <Select onValueChange={(val) => {
                  setFormData(prev => ({ ...prev, schoolId: val }));
                  setTargetSchoolId(val);
                }} required>
                  <SelectTrigger className="h-13 bg-slate-900/90 dark:bg-slate-950/60 text-white border-slate-200/60 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400">
                    <SelectValue placeholder="Selecione sua escola" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white text-slate-900 dark:bg-white dark:text-slate-900 shadow-xl z-50">
                    {schools.filter(s => s.status === 'active').map(s => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg text-slate-800 dark:text-slate-800 focus:bg-slate-100 dark:focus:bg-slate-100 focus:text-slate-900 dark:focus:text-slate-900 cursor-pointer">{s.name}</SelectItem>
                    ))}
                    {schools.length === 0 && <SelectItem value="school-default" className="rounded-lg text-slate-800 dark:text-slate-800 focus:bg-slate-100 dark:focus:bg-slate-100 focus:text-slate-900 dark:focus:text-slate-900 cursor-pointer">Unidade Padrão SchoolGain</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {/* Turma */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 ml-1">
                  <BookOpen className="h-3 w-3 text-emerald-500" /> Série / Turma
                </Label>
                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, turma: val }))} required>
                  <SelectTrigger className="h-13 bg-slate-900/90 dark:bg-slate-950/60 text-white border-slate-200/60 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400">
                    <SelectValue placeholder="Selecione sua turma" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white text-slate-900 dark:bg-white dark:text-slate-900 shadow-xl z-50">
                    {allTurmas
                      .filter(t => t.status === 'active' && (!formData.schoolId || t.schoolId === formData.schoolId))
                      .map(t => (
                        <SelectItem key={t.id} value={t.name} className="rounded-lg text-slate-800 dark:text-slate-800 focus:bg-slate-100 dark:focus:bg-slate-100 focus:text-slate-900 dark:focus:text-slate-900 cursor-pointer">{t.name}</SelectItem>
                      ))}
                    {allTurmas.length === 0 && <SelectItem value="none" disabled className="rounded-lg">Selecione a escola primeiro</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {/* Curso */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 ml-1">
                  <GraduationCap className="h-3 w-3 text-emerald-500" /> Curso Técnico
                </Label>
                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, curso: val }))} required>
                  <SelectTrigger className="h-13 bg-slate-900/90 dark:bg-slate-950/60 text-white border-slate-200/60 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400">
                    <SelectValue placeholder="Selecione seu curso" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white text-slate-900 dark:bg-white dark:text-slate-900 shadow-xl z-50">
                    {allCursos
                      .filter(c => c.status === 'active' && (!formData.schoolId || c.schoolId === formData.schoolId))
                      .map(c => (
                        <SelectItem key={c.id} value={c.name} className="rounded-lg text-slate-800 dark:text-slate-800 focus:bg-slate-100 dark:focus:bg-slate-100 focus:text-slate-900 dark:focus:text-slate-900 cursor-pointer">{c.name}</SelectItem>
                      ))}
                    {allCursos.length === 0 && <SelectItem value="none" disabled className="rounded-lg">Selecione a escola primeiro</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Botão de Envio do Formulário */}
            <div className="pt-3">
              <Button type="submit" className="w-full h-13 text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-bold transition-all duration-300 gap-2" disabled={isSubmitting}>
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

        {/* Link Institucional */}
        <div className="mt-8 text-center">
          <Link href="/about" className="text-xs text-slate-400 dark:text-slate-500 font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline">
            TDS 2B 2026 - CETI Frei José Apicella
          </Link>
        </div>

      </main>

    </div>
  );
}
