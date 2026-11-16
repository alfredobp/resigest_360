import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { priorNotificationService } from '@/services/priorNotificationService';
import { siraService } from '@/services/siraService';
import { isSiraTestModeCensusOnlyError } from '@/lib/validations/sira';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Endpoint para enviar o validar una Notificación Previa (NT) en SIRA (Junta de Andalucía)
 * Realiza la comunicación SOAP de forma segura desde el servidor, registrando
 * el resultado en sira_submissions, prior_notifications y audit_logs.
 */
export async function POST(req: NextRequest) {
  let submissionId: number | null = null;
  let notificationId: number | null = null;

  try {
    const body = await req.json();
    notificationId = body.notificationId;
    const validateOnly = Boolean(body.validateOnly);

    if (!notificationId) {
      return NextResponse.json({ error: 'ID de Notificación Previa no proporcionado' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Se requiere inicio de sesión.' }, { status: 401 });
    }

    // 1. Obtener la Notificación Previa con su empresa vinculada
    const { data: nt, error: ntError } = await supabase
      .from('prior_notifications')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single();

    if (ntError || !nt) {
      console.error('NT Not Found or access denied:', ntError);
      return NextResponse.json(
        { error: 'Notificación Previa no encontrada o sin permisos de acceso' },
        { status: 404 }
      );
    }

    // 2. Validar estructura antes de enviar
    const validation = priorNotificationService.validateForE3L(nt);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'La Notificación Previa no cumple las reglas del esquema E3L',
        details: validation.errors,
      }, { status: 400 });
    }

    // 3. Obtener credenciales de SIRA
    const companyData = Array.isArray(nt.company) ? nt.company[0] : nt.company;
    let sira_usuario = companyData?.sira_usuario?.trim();
    let sira_password = companyData?.sira_password?.trim();

    if (!sira_usuario || !sira_password) {
      const { data: myCompany } = await supabase
        .from('companies')
        .select('id, razon_social, sira_usuario, sira_password')
        .eq('user_id', user.id)
        .eq('is_my_company', true)
        .eq('activo', true)
        .not('sira_usuario', 'is', null)
        .neq('sira_usuario', '')
        .limit(1)
        .maybeSingle();

      if (myCompany?.sira_usuario && myCompany?.sira_password) {
        sira_usuario = myCompany.sira_usuario.trim();
        sira_password = myCompany.sira_password.trim();
      } else {
        const { data: anyCompany } = await supabase
          .from('companies')
          .select('id, razon_social, sira_usuario, sira_password')
          .eq('user_id', user.id)
          .eq('activo', true)
          .not('sira_usuario', 'is', null)
          .neq('sira_usuario', '')
          .limit(1)
          .maybeSingle();

        if (anyCompany?.sira_usuario && anyCompany?.sira_password) {
          sira_usuario = anyCompany.sira_usuario.trim();
          sira_password = anyCompany.sira_password.trim();
        }
      }
    }

    if (!sira_usuario || !sira_password) {
      return NextResponse.json({
        error: 'Credenciales de SIRA no configuradas para esta empresa. Por favor, configúralas en Mi Empresa.',
      }, { status: 400 });
    }

    // 4. Generar el XML E3L <wasteNT>
    const e3lXml = priorNotificationService.generateNTXml(nt);
    const operation = validateOnly ? 'validateWasteNT' : 'sendWasteNT';

    // 5. Construir SOAP Envelope
    const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:e3l="e3l://esir2014">
   <soapenv:Header/>
   <soapenv:Body>
      <e3l:${operation}>
         ${e3lXml}
      </e3l:${operation}>
   </soapenv:Body>
</soapenv:Envelope>`.trim();

    // 6. Registrar en sira_submissions
    try {
      const { data: subData } = await supabase
        .from('sira_submissions')
        .insert({
          user_id: user.id,
          company_id: nt.company_id,
          tipo_envio: 'notificacion_previa',
          estado: 'enviado',
          xml_enviado: soapEnvelope,
          intentos: 1,
          ultimo_intento: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (subData?.id) {
        submissionId = subData.id;
      }
    } catch (dbErr) {
      console.warn('sira_submissions insert warning:', dbErr);
    }

    // Debug opcional en desarrollo
    if (process.env.NODE_ENV === 'development') {
      try {
        const logDir = path.join(process.cwd(), 'sira_xml_logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFileSync(path.join(logDir, `nt_req_${notificationId}_${timestamp}.xml`), soapEnvelope);
      } catch (logErr) {
        console.error('Error guardando log XML NT:', logErr);
      }
    }

    // 7. Enviar petición HTTP al Web Service de SIRA
    const siraUrl = 'https://www.juntadeandalucia.es/medioambiente/sira_servicios/SIRA_Empresas_Obligaciones';
    const authHeader = `Basic ${Buffer.from(`${sira_usuario}:${sira_password}`).toString('base64')}`;

    const siraResponse = await fetch(siraUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: '',
        Authorization: authHeader,
      },
      body: soapEnvelope,
    });

    const responseText = await siraResponse.text();

    if (process.env.NODE_ENV === 'development') {
      try {
        const logDir = path.join(process.cwd(), 'sira_xml_logs');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFileSync(path.join(logDir, `nt_res_${notificationId}_${timestamp}.xml`), responseText);
      } catch (logErr) {
        console.error('Error guardando log respuesta NT:', logErr);
      }
    }

    // 8. Procesar respuesta
    const hasFault = responseText.includes('<soapenv:Fault>') || responseText.includes('<resultWrong');
    const matchId = responseText.match(/<IdSira>(.*?)<\/IdSira>/);
    const extractedSiraId = matchId ? matchId[1] : null;
    const allowTestCensus =
      process.env.SIRA_ALLOW_TEST_CENSUS === 'true' ||
      (process.env.NODE_ENV !== 'production' && process.env.SIRA_ALLOW_TEST_CENSUS !== 'false');
    const isTestModeCensusPass = allowTestCensus && siraResponse.ok && isSiraTestModeCensusOnlyError(responseText);

    if (!siraResponse.ok || (!isTestModeCensusPass && (hasFault || (!validateOnly && !extractedSiraId)))) {
      const errorMessage = siraService.extractSiraError(responseText);

      if (submissionId) {
        try {
          await supabase
            .from('sira_submissions')
            .update({
              estado: 'rechazado',
              xml_respuesta: responseText,
              mensaje_error: errorMessage,
            })
            .eq('id', submissionId);
        } catch { /* best-effort */ }
      }

      await supabase
        .from('prior_notifications')
        .update({
          estado: 'rechazada',
          sira_error_detalles: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', nt.user_id || user.id);

      return NextResponse.json({
        error: 'SIRA ha rechazado la Notificación Previa',
        details: responseText.substring(0, 1000),
        message: errorMessage,
        submissionId,
      }, { status: siraResponse.ok ? 400 : siraResponse.status });
    }

    const siraId = isTestModeCensusPass
      ? `SIRA-TEST-NT-${notificationId}-${Date.now().toString().slice(-4)}`
      : extractedSiraId;

    // 9. Éxito (real o modo prueba)
    if (submissionId) {
      try {
        await supabase
          .from('sira_submissions')
          .update({
            estado: 'aceptado',
            codigo_acuse: siraId || 'VALIDADO',
            xml_respuesta: responseText,
          })
          .eq('id', submissionId);
      } catch { /* best-effort */ }
    }

    await supabase
      .from('prior_notifications')
      .update({
        estado: validateOnly ? 'validada_sira' : 'aceptada',
        sira_id: siraId,
        sira_envio_fecha: validateOnly ? null : new Date().toISOString(),
        sira_error_detalles: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', nt.user_id || user.id);

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        company_id: nt.company_id,
        entidad: 'notificacion_previa',
        entidad_id: String(notificationId),
        accion: 'sincronizar_sira',
        detalles: {
          resultado: isTestModeCensusPass ? 'aceptada_modo_prueba' : 'aceptada',
          sira_id: siraId,
          numero_notificacion: nt.numero_notificacion,
          submission_id: submissionId,
        },
      });
    } catch { /* best-effort */ }

    return NextResponse.json({
      success: true,
      ...(isTestModeCensusPass ? { isTestMode: true } : {}),
      message: isTestModeCensusPass
        ? 'Notificación Previa validada en esquema E3L por SIRA y aceptada en Modo Prueba'
        : validateOnly
          ? 'Notificación Previa validada con éxito por SIRA'
          : 'Notificación Previa presentada y aceptada por SIRA',
      siraId,
      submissionId,
    });
  } catch (error: any) {
    console.error('API Route SIRA NT Error:', error);

    if (submissionId) {
      try {
        const supabase = await createClient();
        await supabase
          .from('sira_submissions')
          .update({
            estado: 'error',
            mensaje_error: error.message,
          })
          .eq('id', submissionId);
      } catch { /* best-effort */ }
    }

    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

