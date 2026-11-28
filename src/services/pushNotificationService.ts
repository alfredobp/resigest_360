import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export interface PushDecaNotificationInput {
  userId: string;
  companyId?: number | null;
  conductorDni?: string | null;
  numeroDeca: string;
  token: string;
  origenMunicipio?: string;
  destinoMunicipio?: string;
  matricula?: string;
}

export interface PushSendSummary {
  sent: number;
  failed: number;
  skippedReason?: string;
}

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

function normalizeDni(dni?: string | null): string {
  return (dni || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

function configureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@resigest360.com';

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export const pushNotificationService = {
  /**
   * Envía notificación Push Web (VAPID) a los dispositivos suscritos del conductor asignado al DeCA.
   */
  async sendDecaAssignedNotification(
    input: PushDecaNotificationInput
  ): Promise<PushSendSummary> {
    if (!configureVapid()) {
      return { sent: 0, failed: 0, skippedReason: 'VAPID_NOT_CONFIGURED' };
    }

    const normalizedDni = normalizeDni(input.conductorDni);
    if (!normalizedDni) {
      return { sent: 0, failed: 0, skippedReason: 'NO_DRIVER_DNI' };
    }

    const supabase = getServiceSupabase();

    // Buscar conductor activo por DNI dentro del tenant
    const { data: drivers } = await supabase
      .from('carrier_drivers')
      .select('id, dni')
      .eq('user_id', input.userId)
      .eq('activo', true);

    const matchingDriver = (drivers || []).find(
      (d) => normalizeDni(d.dni) === normalizedDni
    );

    if (!matchingDriver) {
      return { sent: 0, failed: 0, skippedReason: 'DRIVER_NOT_FOUND' };
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('driver_id', matchingDriver.id);

    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0, skippedReason: 'NO_SUBSCRIPTIONS' };
    }

    const routeDesc =
      input.origenMunicipio && input.destinoMunicipio
        ? `${input.origenMunicipio} → ${input.destinoMunicipio}`
        : 'Nuevo porte asignado';

    const payload = JSON.stringify({
      title: `Nuevo DeCA ${input.numeroDeca}`,
      body: `${routeDesc}${input.matricula ? ` · ${input.matricula}` : ''}`,
      url: `/mobile/deca/${input.token}`,
      numero_deca: input.numeroDeca,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent += 1;
      } catch (err: unknown) {
        failed += 1;
        const statusCode =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return { sent, failed };
  },
};

export default pushNotificationService;

