import { NextRequest, NextResponse } from 'next/server';

const HOLDED_API_URL = 'https://api.holded.com/api/invoicing/v1';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    // Priorizamos la clave que viene del header, sino usamos la del env
    const apiKey = req.headers.get('x-holded-key') || process.env.HOLDED_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Holded API Key no configurada' }, { status: 500 });
    }

    try {
        let url = '';
        switch (action) {
            case 'listContacts':
                url = `${HOLDED_API_URL}/contacts`;
                break;
            case 'getContact':
                const id = searchParams.get('id');
                if (!id) return NextResponse.json({ error: 'ID de contacto requerido' }, { status: 400 });
                url = `${HOLDED_API_URL}/contacts/${id}`;
                break;
            default:
                return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                'key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('Error en Holded API Proxy (GET):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const apiKey = req.headers.get('x-holded-key') || process.env.HOLDED_API_KEY;
    const body = await req.json();

    if (!apiKey) {
        return NextResponse.json({ error: 'Holded API Key no configurada' }, { status: 500 });
    }

    try {
        let url = '';
        let method = 'POST';

        switch (action) {
            case 'createContact':
                url = `${HOLDED_API_URL}/contacts`;
                break;
            case 'updateContact':
                const contactId = searchParams.get('id');
                if (!contactId) return NextResponse.json({ error: 'ID de contacto requerido' }, { status: 400 });
                url = `${HOLDED_API_URL}/contacts/${contactId}`;
                // Holded usa POST para actualizar si los campos están presentes, 
                // pero a veces se requiere PUT. La documentación v1 suele usar POST para creación/actualización.
                break;
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
            method: method,
            headers: {
                'key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error: any) {
        console.error('Error en Holded API Proxy (POST):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
