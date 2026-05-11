'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, UserPlus, Send, Loader2, QrCode, Cpu, Eye, X, Wand2, Wifi, BookOpen, GraduationCap, School as SchoolIcon } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useCallback } from 'react';

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

  useEffect(() => {
    if (!isRFIDCapturing) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKey = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) buffer = '';

      if (e.key === 'Enter') {
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
      await requestRegistration({
        name: formData.name,
        ra: formData.ra.toUpperCase(),
        rfid: formData.rfid.toUpperCase(),
        turma: formData.turma,
        curso: formData.curso,
        schoolId: formData.schoolId
      });

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-xl text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">Tudo pronto!</CardTitle>
            <CardDescription className="text-base text-slate-600">
              Sua solicitação de cadastro foi enviada com sucesso.<br />
              Agora é só aguardar a aprovação do seu gestor para começar sua jornada.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full h-12 font-bold" asChild>
              <Link href="/login/student">Voltar ao Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-2 mb-8">
           <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/login/student"><ArrowLeft className="h-5 w-5" /></Link>
           </Button>
           <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                 <UserPlus className="h-6 w-6 text-primary" /> Solicitar Cadastro
              </h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Entre para o ecossistema sustentável</p>
           </div>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle>Dados do Aluno</CardTitle>
            <CardDescription>Preencha seus dados corretamente para validação da sua unidade escolar.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: João Silva" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              {/* RA Field */}
              <div className="space-y-2">
                <Label htmlFor="ra" className="font-bold">RA (Identificação QR)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Input 
                      id="ra" 
                      placeholder="AGUARDANDO..." 
                      className="uppercase h-12 pr-12 font-medium"
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
                          className="h-8 w-8 p-0"
                          onClick={() => setShowQRPreview(!showQRPreview)}
                          title="Ver QR Code"
                         >
                           <Eye className="h-4 w-4 text-slate-400" />
                         </Button>
                      </div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-12 w-12 p-0 border-slate-200" 
                    onClick={generateRA}
                    title="Gerar RA"
                  >
                    <Wand2 className="h-5 w-5 text-emerald-500" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-12 w-12 p-0 border-slate-200 ${isScanning ? 'bg-primary text-white' : ''}`}
                    onClick={() => setIsScanning(!isScanning)}
                    title="Escanear QR"
                  >
                    <QrCode className="h-5 w-5" />
                  </Button>
                </div>

                {isScanning && (
                  <div className="mt-4 p-4 bg-slate-900 rounded-2xl relative overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
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
                  <div className="mt-4 p-6 bg-white border-2 border-primary/20 rounded-2xl flex flex-col items-center gap-4">
                    <QRCodeSVG value={formData.ra} size={150} />
                    <p className="text-[10px] font-black uppercase tracking-widest">{formData.ra}</p>
                  </div>
                )}
              </div>

              {/* RFID Field */}
              <div className="space-y-2">
                <Label htmlFor="rfid" className="font-bold">ID do Cartão (RFID)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="rfid" 
                    placeholder={isRFIDCapturing ? "AGUARDANDO..." : "ID DO CARTÃO"} 
                    className={`uppercase h-12 flex-1 font-medium ${isRFIDCapturing ? 'animate-pulse border-emerald-500 bg-emerald-50' : ''}`}
                    value={formData.rfid}
                    onChange={(e) => setFormData(prev => ({ ...prev, rfid: e.target.value.toUpperCase() }))}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-12 w-12 p-0 border-slate-200 ${isRFIDCapturing ? 'bg-emerald-500 text-white border-emerald-500' : ''}`}
                    onClick={() => setIsRFIDCapturing(!isRFIDCapturing)}
                    title="Capturar RFID"
                  >
                    <Wifi className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <SchoolIcon className="h-3 w-3 text-primary" /> Sua Escola / Unidade
                  </Label>
                  <Select onValueChange={(val) => {
                    setFormData(prev => ({ ...prev, schoolId: val }));
                    setTargetSchoolId(val);
                  }} required>
                    <SelectTrigger className="h-14 bg-white border-slate-200 rounded-xl focus:ring-primary/20">
                      <SelectValue placeholder="Selecione sua escola" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.filter(s => s.status === 'active').map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                      {schools.length === 0 && <SelectItem value="school-default">Unidade Padrão SchoolGain</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <BookOpen className="h-3 w-3 text-primary" /> Série / Turma
                  </Label>
                  <Select onValueChange={(val) => setFormData(prev => ({ ...prev, turma: val }))} required>
                    <SelectTrigger className="h-14 bg-white border-slate-200 rounded-xl focus:ring-primary/20">
                      <SelectValue placeholder="Selecione sua turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTurmas
                        .filter(t => t.status === 'active' && (!formData.schoolId || t.schoolId === formData.schoolId))
                        .map(t => (
                          <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                        ))}
                      {allTurmas.length === 0 && <SelectItem value="none" disabled>Selecione a escola primeiro</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <GraduationCap className="h-3 w-3 text-primary" /> Curso Técnico
                  </Label>
                  <Select onValueChange={(val) => setFormData(prev => ({ ...prev, curso: val }))} required>
                    <SelectTrigger className="h-14 bg-white border-slate-200 rounded-xl focus:ring-primary/20">
                      <SelectValue placeholder="Selecione seu curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCursos
                        .filter(c => c.status === 'active' && (!formData.schoolId || c.schoolId === formData.schoolId))
                        .map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      {allCursos.length === 0 && <SelectItem value="none" disabled>Selecione a escola primeiro</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-12 font-bold gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Enviar Solicitação
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
