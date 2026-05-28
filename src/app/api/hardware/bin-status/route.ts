import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { terminalId, levels, distances } = await request.json();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    fetch(`http://localhost:9005/register-ip?ip=${clientIp}`).catch(() => null);

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
    let terminalRef = doc(db, 'terminals', terminalId);
    let terminalSnap = null;
    try {
      const snap = await getDoc(terminalRef);
      if (snap.exists()) {
        terminalSnap = snap;
      }
    } catch (e: any) {
      // Ignora e tenta por hardwareId
    }

    if (!terminalSnap) {
      try {
        const q = query(collection(db, 'terminals'), where('hardwareId', '==', terminalId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          terminalSnap = querySnapshot.docs[0];
          terminalRef = terminalSnap.ref;
        }
      } catch (err: any) {
        console.error('[HARDWARE API ERROR] Falha ao buscar terminal por hardwareId:', err.message || err);
      }
    }

    if (!terminalSnap) {
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
      binDistances: distances || null,
      lastBinUpdate: new Date().toISOString()
    });

    return NextResponse.json({ success: true, active: true, message: 'Status das lixeiras atualizado com sucesso!' });
  } catch (error: any) {
    console.error('[HARDWARE API ERROR] Falha ao atualizar status das lixeiras:', error);
    return NextResponse.json({ error: 'Falha ao processar atualização das lixeiras' }, { status: 500 });
  }
}
