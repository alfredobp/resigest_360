import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';
import { legalFeedbackSchema } from '@/lib/validations/legalAssistant';
import { submitLegalFeedback } from '@/services/legalAssistantService';

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

    if (!rateLimit(`legal-rag-fb:${user.id}`, 30, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiadas valoraciones seguidas. Inténtalo de nuevo en un momento.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = legalFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de valoración inválidos.' },
        { status: 400 }
      );
    }

    await submitLegalFeedback(supabase, user.id, parsed.data.logId, parsed.data.feedback);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al registrar feedback del asistente legal:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar tu valoración.' },
      { status: 500 }
    );
  }
}
