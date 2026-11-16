import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyCookie } from '@/services/tenantContextService';

const HOLDED_API_URL = 'https://api.holded.com/api/invoicing/v1';
const SAFE_ID = /^[\w-]{1,64}$/;

/**
 * Resuelve la API Key de Holded en el servidor a partir de las empresas del usuario autenticado
 * (aislamiento multi-tenant). La clave nunca se acepta desde el cliente ni desde variables de entorno.
 */
async function resolveHoldedKey(req?: NextRequest): Promise<{ apiKey: string } | { response: NextResponse }> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { response: NextResponse.json({ error: 'No autorizado. Se requiere inicio de sesión.' }, { status: 401 }) };
    }

    const activeCompanyId = getActiveCompanyCookie(req?.headers?.get?.('cookie') || '');

    let companyQuery: any = supabase
        .from('companies')
        .select('holded_api_key');

    if (activeCompanyId && typeof companyQuery.or === 'function') {
        companyQuery = companyQuery.or(`user_id.eq.${user.id},id.eq.${activeCompanyId}`);
    } else {
        companyQuery = companyQuery.eq('user_id', user.id);
    }

    const { data: companies, error } = await companyQuery
        .not('holded_api_key', 'is', null)
        .order('is_my_company', { ascending: false })
        .limit(1);

    const apiKey = companies?.[0]?.holded_api_key;
    if (error || !apiKey) {
        return { response: NextResponse.json({ error: 'Holded API Key no configurada' }, { status: 400 }) };
    }
    return { apiKey };
}

function upstreamError(label: string, error: unknown) {
    console.error(`Error en Holded API Proxy (${label}):`, error);
    return NextResponse.json({ error: 'Error al comunicar con Holded' }, { status: 502 });
}

export async function GET(req: NextRequest) {
    const resolved = await resolveHoldedKey(req);
    if ('response' in resolved) return resolved.response;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    try {
        let url = '';
        switch (action) {
            case 'listContacts':
                url = `${HOLDED_API_URL}/contacts`;
                break;
            case 'getContact': {
                const id = searchParams.get('id');
                if (!id || !SAFE_ID.test(id)) return NextResponse.json({ error: 'ID de contacto inválido' }, { status: 400 });
                url = `${HOLDED_API_URL}/contacts/${id}`;
                break;
            }
            default:
                return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                'key': resolved.apiKey,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        return upstreamError('GET', error);
    }
}

export async function POST(req: NextRequest) {
    const resolved = await resolveHoldedKey(req);
    if ('response' in resolved) return resolved.response;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Cuerpo de petición inválido' }, { status: 400 });
    }

    try {
        let url = '';

        switch (action) {
            case 'createContact':
                url = `${HOLDED_API_URL}/contacts`;
                break;
            case 'updateContact': {
                const contactId = searchParams.get('id');
                if (!contactId || !SAFE_ID.test(contactId)) return NextResponse.json({ error: 'ID de contacto inválido' }, { status: 400 });
                url = `${HOLDED_API_URL}/contacts/${contactId}`;
                // Holded usa POST para actualizar si los campos están presentes,
                // pero a veces se requiere PUT. La documentación v1 suele usar POST para creación/actualización.
                break;
            }
            case 'createInvoice':
                url = `${HOLDED_API_URL}/documents/invoice`;
                break;
            case 'createRecurringInvoice':
                url = `${HOLDED_API_URL}/recurringinvoices`;
                break;
            default:
                return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'key': resolved.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        return upstreamError('POST', error);
    }
}
