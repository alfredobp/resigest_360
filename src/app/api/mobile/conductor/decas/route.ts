import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DRIVER_SESSION_COOKIE,
  verifyDriverSessionToken,
} from '@/lib/auth/driverSession';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Configuración de Supabase incompleta');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeText(value?: string | null): string {
  return (value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeDni(value?: string | null): string {
  return (value || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(DRIVER_SESSION_COOKIE)?.value;
    const session = verifyDriverSessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Sesión no iniciada' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Cargar empresa para mostrar logo_url y nombre en el portal PWA
    const companyQuery = supabase
      .from('companies')
      .select('id, razon_social, nombre_comercial, logo_url');

    const { data: company } = session.companyId
      ? await companyQuery.eq('id', session.companyId).maybeSingle()
      : await companyQuery.eq('user_id', session.userId).eq('is_my_company', true).maybeSingle();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    let decasQuery = supabase
      .from('deca_documents')
      .select(
        'id, company_id, numero_deca, version, is_vigente, token, estado, fecha_transporte, matricula_tractora, matricula_remolque, origen_municipio, origen_provincia, destino_municipio, destino_provincia, naturaleza_mercancia, peso_kg, conductor_dni, conductor_nombre, firma_conductor_url, fecha_finalizacion, created_at'
      )
      .eq('is_vigente', true)
      .gte('created_at', thirtyDaysAgo);

    if (session.companyId) {
      decasQuery = decasQuery.eq('company_id', session.companyId);
    } else {
      decasQuery = decasQuery.eq('user_id', session.userId);
    }

    const { data: allDecas, error } = await decasQuery
      .order('fecha_transporte', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const driverDni = normalizeDni(session.dni);
    const driverName = normalizeText(session.nombre);

    const assigned = (allDecas || []).filter((d) => {
      const decaDni = normalizeDni(d.conductor_dni);
      if (decaDni) {
        return decaDni === driverDni;
      }
      const decaName = normalizeText(d.conductor_nombre);
      return Boolean(decaName && driverName && decaName === driverName);
    });

    const vigentes = assigned.filter(
      (d) => d.estado === 'vigente' || d.estado === 'en_transito' || d.estado === 'borrador'
    );
    const historial = assigned.filter(
      (d) => d.estado === 'finalizado' || d.estado === 'anulado'
    );

    return NextResponse.json({
      driver: {
        id: session.driverId,
        nombre: session.nombre,
        dni: session.dni,
      },
      company: company
        ? {
            razon_social: company.nombre_comercial || company.razon_social,
            logo_url: company.logo_url || null,
          }
        : null,
      vigentes,
      historial,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
