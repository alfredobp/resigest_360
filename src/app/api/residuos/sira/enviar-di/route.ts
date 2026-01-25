import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { siraService } from '@/services/siraService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Endpoint para enviar un Documento de Identificación a SIRA (Junta de Andalucía)
 * Realiza la comunicación SOAP de forma segura desde el servidor
 */
export async function POST(req: NextRequest) {
    try {
        const { documentId } = await req.json();

        if (!documentId) {
            return NextResponse.json({ error: 'ID de documento no proporcionado' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Obtener los datos del documento con sus relaciones
        const { data: doc, error: docError } = await supabase
            .from('identification_documents')
            .select(`
        *,
        company:companies(*),
        production_center:production_centers(*)
      `)
            .eq('id', documentId)
            .single();

        if (docError || !doc) {
            console.error('DI Not Found:', docError);
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        // 2. Obtener credenciales de SIRA de la empresa (manejar objeto o array si el join es ambiguo)
        const companyData = Array.isArray(doc.company) ? doc.company[0] : doc.company;
        const { sira_usuario, sira_password, sira_activo } = companyData || {};

        console.log(`🔐 Intentando envío SIRA para DI ${doc.numero_documento}`);
        console.log(`📍 Empresa: ${doc.productor_razon_social} (ID: ${doc.company_id})`);

        if (!sira_usuario || !sira_password) {
            console.warn('❌ SIRA: Credenciales incompletas en la base de datos:', {
                hasUser: !!sira_usuario,
                hasPass: !!sira_password,
                companyId: doc.company_id
            });
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

        // --- DEBUG: GUARDAR XML EN ARCHIVO Y CONSOLA ---
        try {
            console.log('📦 Generando XML para SIRA...');
            const logDir = path.join(process.cwd(), 'sira_xml_logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filenameReq = `req_${documentId}_${timestamp}.xml`;
            const filePathReq = path.join(logDir, filenameReq);

            fs.writeFileSync(filePathReq, soapEnvelope);
            console.log(`✅ XML de petición guardado en: ${filePathReq}`);

            // Console log recortado para no inundar la terminal
            console.log('--- XML PREVIEW ---\n', soapEnvelope.substring(0, 500) + '... (ver archivo para completo)\n-------------------');

        } catch (logErr) {
            console.error('Error guardando log XML:', logErr);
        }
        // ------------------------------------------------

        // 5. Realizar la petición al Web Service de la Junta
        const siraUrl = 'https://www.juntadeandalucia.es/medioambiente/sira_servicios/SIRA_Empresas_Obligaciones';

        // El error JA000018 indica que falta la cabecera HTTP Authorization (Basic Auth)
        const authHeader = `Basic ${Buffer.from(`${sira_usuario}:${sira_password}`).toString('base64')}`;

        const siraResponse = await fetch(siraUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': '', // A veces necesario vacío o con la acción específica
                'Authorization': authHeader, // Autenticación Basic HTTP
            },
            body: soapEnvelope,
        });

        const responseText = await siraResponse.text();

        // --- DEBUG: GUARDAR RESPUESTA XML ---
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filenameRes = `res_${documentId}_${timestamp}.xml`;
            const logDir = path.join(process.cwd(), 'sira_xml_logs');
            const filePathRes = path.join(logDir, filenameRes);

            fs.writeFileSync(filePathRes, responseText);
            console.log(`📩 Respuesta SIRA guardada en: ${filePathRes}`);
        } catch (logErr) {
            console.error('Error guardando log respuesta:', logErr);
        }
        // ------------------------------------

        // 6. Procesar respuesta y buscar errores dentro del XML (incluso si el HTTP es 200)
        const hasFault = responseText.includes('<soapenv:Fault>') || responseText.includes('<resultWrong>');
        const matchId = responseText.match(/<IdSira>(.*?)<\/IdSira>/);
        const siraId = matchId ? matchId[1] : null;

        if (!siraResponse.ok || hasFault || !siraId) {
            console.error('SIRA API Error/Fault:', responseText);

            // Intentar extraer un mensaje de error legible del XML
            const errorMatch = responseText.match(/<description>(.*?)<\/description>/) ||
                responseText.match(/<faultstring>(.*?)<\/faultstring>/) ||
                responseText.match(/<message.*?>(.*?)<\/message>/);

            const errorMessage = errorMatch ? errorMatch[1] : 'Error en la validación de SIRA. Ver logs XML.';

            return NextResponse.json({
                error: 'SIRA ha rechazado el documento',
                details: responseText.substring(0, 1000), // Limitamos longitud
                message: errorMessage
            }, { status: siraResponse.ok ? 400 : siraResponse.status });
        }

        // 7. Actualizar el estado del documento localmente (ÉXITO REAL)
        await supabase
            .from('identification_documents')
            .update({
                estado: 'pendiente-firma',
                notas: (doc.notas || '') + `\n[SIRA] Enviado con éxito. ID SIRA: ${siraId}`
            })
            .eq('id', documentId);

        return NextResponse.json({
            success: true,
            message: 'Documento aceptado correctamente por SIRA',
            siraId
        });

    } catch (error: any) {
        console.error('API Route SIRA Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
