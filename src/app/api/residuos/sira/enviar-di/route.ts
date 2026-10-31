import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { siraService } from '@/services/siraService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Endpoint para enviar un Documento de Identificación a SIRA (Junta de Andalucía)
 * Realiza la comunicación SOAP de forma segura desde el servidor, registrando
 * el resultado en sira_submissions y en la pista de auditoría audit_logs.
 */
export async function POST(req: NextRequest) {
    let submissionId: number | null = null;
    let documentId: number | null = null;

    try {
        const body = await req.json();
        documentId = body.documentId;

        if (!documentId) {
            return NextResponse.json({ error: 'ID de documento no proporcionado' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado. Se requiere inicio de sesión.' }, { status: 401 });
        }

        // 1. Obtener los datos del documento con sus relaciones
        const { data: doc, error: docError } = await supabase
            .from('identification_documents')
            .select(`
                *,
                company:companies(*),
                production_center:production_centers(*)
            `)
            .eq('id', documentId)
            .eq('user_id', user.id)
            .single();

        if (docError || !doc) {
            console.error('DI Not Found or access denied:', docError);
            return NextResponse.json({ error: 'Documento no encontrado o no tiene permisos para acceder a él' }, { status: 404 });
        }

        // 2. Obtener credenciales de SIRA de la empresa
        const companyData = Array.isArray(doc.company) ? doc.company[0] : doc.company;
        const { sira_usuario, sira_password } = companyData || {};

        console.info(`🔐 Intentando envío SIRA para DI ${doc.numero_documento}`);
        console.info(`📍 Empresa: ${doc.productor_razon_social} (ID: ${doc.company_id})`);

        if (!sira_usuario || !sira_password) {
            console.warn('❌ SIRA: Credenciales incompletas en la base de datos:', {
                hasUser: !!sira_usuario,
                hasPass: !!sira_password,
                companyId: doc.company_id
            });

            // Registrar fallo en auditoría
            try {
                await supabase.from('audit_logs').insert({
                    user_id: user?.id || null,
                    company_id: doc.company_id,
                    entidad: 'integracion_sira',
                    entidad_id: String(documentId),
                    accion: 'sincronizar_sira',
                    detalles: { error: 'Credenciales de SIRA no configuradas para esta empresa' }
                });
            } catch { /* best-effort: no bloquear el flujo principal */ }

            return NextResponse.json({
                error: 'Credenciales de SIRA no configuradas para esta empresa. Por favor, configúralas en Mi Empresa.'
            }, { status: 400 });
        }

        // 3. Generar el contenido XML (E3L 3.3)
        const e3lXml = siraService.generateDIXml(doc);

        // 4. Construir el Envelope SOAP
        const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:e3l="e3l://esir2014">
   <soapenv:Header/>
   <soapenv:Body>
      <e3l:sendWasteDCS>
         ${e3lXml}
      </e3l:sendWasteDCS>
   </soapenv:Body>
</soapenv:Envelope>`.trim();

        // 5. Registrar intento inicial en sira_submissions
        try {
            const { data: subData } = await supabase
                .from('sira_submissions')
                .insert({
                    user_id: user?.id || null,
                    company_id: doc.company_id,
                    identification_document_id: documentId,
                    tipo_envio: 'di',
                    estado: 'enviado',
                    xml_enviado: soapEnvelope,
                    intentos: 1,
                    ultimo_intento: new Date().toISOString()
                })
                .select('id')
                .single();

            if (subData?.id) {
                submissionId = subData.id;
            }
        } catch (dbErr) {
            console.warn('sira_submissions insert warning (table might be initializing):', dbErr);
        }

        // --- DEBUG: GUARDAR XML EN ARCHIVO LOCAL (SOLO DESARROLLO) ---
        if (process.env.NODE_ENV === 'development') {
            try {
                const logDir = path.join(process.cwd(), 'sira_xml_logs');
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filePathReq = path.join(logDir, `req_${documentId}_${timestamp}.xml`);
                fs.writeFileSync(filePathReq, soapEnvelope);
            } catch (logErr) {
                console.error('Error guardando log XML:', logErr);
            }
        }
        // ------------------------------------------------

        // 6. Realizar la petición al Web Service de la Junta
        const siraUrl = 'https://www.juntadeandalucia.es/medioambiente/sira_servicios/SIRA_Empresas_Obligaciones';
        const authHeader = `Basic ${Buffer.from(`${sira_usuario}:${sira_password}`).toString('base64')}`;

        const siraResponse = await fetch(siraUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': '',
                'Authorization': authHeader,
            },
            body: soapEnvelope,
        });

        const responseText = await siraResponse.text();

        // --- DEBUG: GUARDAR RESPUESTA XML (SOLO DESARROLLO) ---
        if (process.env.NODE_ENV === 'development') {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const logDir = path.join(process.cwd(), 'sira_xml_logs');
                const filePathRes = path.join(logDir, `res_${documentId}_${timestamp}.xml`);
                fs.writeFileSync(filePathRes, responseText);
            } catch (logErr) {
                console.error('Error guardando log respuesta:', logErr);
            }
        }
        // ------------------------------------

        // 7. Procesar respuesta y buscar errores dentro del XML
        const hasFault = responseText.includes('<soapenv:Fault>') || responseText.includes('<resultWrong>');
        const matchId = responseText.match(/<IdSira>(.*?)<\/IdSira>/);
        const siraId = matchId ? matchId[1] : null;

        if (!siraResponse.ok || hasFault || !siraId) {
            console.error('SIRA API Error/Fault:', responseText);

            const errorMessage = siraService.extractSiraError(responseText);

            // Actualizar sira_submissions con estado 'rechazado'
            if (submissionId) {
                try {
                    await supabase
                        .from('sira_submissions')
                        .update({
                            estado: 'rechazado',
                            xml_respuesta: responseText,
                            mensaje_error: errorMessage
                        })
                        .eq('id', submissionId);
                } catch { /* best-effort: no bloquear el flujo principal */ }
            }

            // Registrar fallo en audit_logs
            try {
                await supabase.from('audit_logs').insert({
                    user_id: user?.id || null,
                    company_id: doc.company_id,
                    entidad: 'integracion_sira',
                    entidad_id: String(documentId),
                    accion: 'sincronizar_sira',
                    detalles: {
                        resultado: 'rechazado',
                        error: errorMessage,
                        numero_documento: doc.numero_documento,
                        submission_id: submissionId
                    }
                });
            } catch { /* best-effort: no bloquear el flujo principal */ }

            return NextResponse.json({
                error: 'SIRA ha rechazado el documento',
                details: responseText.substring(0, 1000),
                message: errorMessage,
                submissionId
            }, { status: siraResponse.ok ? 400 : siraResponse.status });
        }

        // 8. Actualizar submission y estado del documento localmente (ÉXITO REAL)
        if (submissionId) {
            try {
                await supabase
                    .from('sira_submissions')
                    .update({
                        estado: 'aceptado',
                        codigo_acuse: siraId,
                        xml_respuesta: responseText
                    })
                    .eq('id', submissionId);
            } catch { /* best-effort: no bloquear el flujo principal */ }
        }

        await supabase
            .from('identification_documents')
            .update({
                estado: 'pendiente-firma',
                notas: `${doc.notas || ''  }\n[SIRA] Enviado con éxito. ID SIRA: ${siraId}`
            })
            .eq('id', documentId)
            .eq('user_id', user.id);

        // Registrar en audit_logs
        try {
            await supabase.from('audit_logs').insert({
                user_id: user?.id || null,
                company_id: doc.company_id,
                entidad: 'di',
                entidad_id: String(documentId),
                accion: 'sincronizar_sira',
                detalles: {
                    resultado: 'aceptado',
                    sira_id: siraId,
                    numero_documento: doc.numero_documento,
                    submission_id: submissionId
                }
            });
        } catch { /* best-effort: no bloquear el flujo principal */ }

        return NextResponse.json({
            success: true,
            message: 'Documento aceptado correctamente por SIRA',
            siraId,
            submissionId
        });

    } catch (error: any) {
        console.error('API Route SIRA Error:', error);

        if (submissionId) {
            try {
                const supabase = await createClient();
                await supabase
                    .from('sira_submissions')
                    .update({
                        estado: 'error',
                        mensaje_error: error.message
                    })
                    .eq('id', submissionId);
            } catch { /* best-effort: no bloquear el flujo principal */ }
        }

        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
