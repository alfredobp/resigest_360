import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';
import { legalQuestionSchema } from '@/lib/validations/legalAssistant';
import { askLegalAssistant } from '@/services/legalAssistantService';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    if (!rateLimit(`legal-rag:${user.id}`, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite temporal de consultas. Inténtalo de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = legalQuestionSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Consulta inválida.';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const result = await askLegalAssistant(supabase, user.id, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en asistente legal RAG:', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la consulta legal en este momento.' },
      { status: 500 }
    );
  }
}
