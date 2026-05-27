import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { terminalId, levels } = await request.json();
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.HARDWARE_TOKEN || 'sg_hardware_secret_2026';

    // Validação básica do cabeçalho de autenticação do hardware
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error(`[HARDWARE] Chamada de status de lixeira não autorizada para o terminal ${terminalId}`);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!terminalId || !levels) {
      return NextResponse.json({ error: 'Dados incompletos (terminalId e levels são obrigatórios)' }, { status: 400 });
    }

    // Busca o terminal no banco para validar se ele está ativo
    const terminalRef = doc(db, 'terminals', terminalId);
    const terminalSnap = await getDoc(terminalRef);

    if (!terminalSnap.exists()) {
      return NextResponse.json({ success: false, active: false, error: 'Terminal não encontrado' }, { status: 404 });
    }

    const terminalData = terminalSnap.data();
    if (terminalData.status !== 'active') {
      return NextResponse.json({ 
        success: false, 
        active: false, 
        message: 'Terminal inativo ou pendente no sistema. Telemetria suspensa.' 
      });
    }

    // Atualiza o documento do terminal correspondente no Firestore
    await updateDoc(terminalRef, {
      binLevels: levels,
      lastBinUpdate: new Date().toISOString()
    });

    return NextResponse.json({ success: true, active: true, message: 'Status das lixeiras atualizado com sucesso!' });
  } catch (error: any) {
    console.error('[HARDWARE API ERROR] Falha ao atualizar status das lixeiras:', error);
    return NextResponse.json({ error: 'Falha ao processar atualização das lixeiras' }, { status: 500 });
  }
}
