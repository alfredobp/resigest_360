// ==============================================================================
// RESIGEST 360 - SERVICIO DE CHATARRERÍA Y BÁSCULA MULTIMATERIAL (UXDEV-09)
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import {
  type ScrapYardEntry,
  type ScrapYardEntryFormData,
  type ScrapYardMaterialLine,
  type ChronologicalEntryFormData
} from '@/types/wasteManagement';
import { createChronologicalEntry } from './chronologicalRegistryService';
import companyService from './companyService';
import { auditService } from './auditService';

/**
 * Calcula con precisión los totales acumulados de peso (kg) e importe (€)
 * de las líneas de materiales pesadas en báscula.
 */
export function calculateMultiMaterialTotals(lines: ScrapYardMaterialLine[]) {
  let totalKg = 0;
  let totalEur = 0;

  for (const line of lines) {
    const kg = Number(line.peso_kg) || 0;
    const precio = Number(line.precio_eur_kg) || 0;
    const subtotal = Number((kg * precio).toFixed(2));
    totalKg += kg;
    totalEur += subtotal;
  }

  return {
    total_kg: Number(totalKg.toFixed(3)),
    total_importe_eur: Number(totalEur.toFixed(2)),
  };
}

/**
 * Genera un código correlativo para el ticket de báscula
 */
export function generateScaleTicketNumber(year = new Date().getFullYear()): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TB-${year}-${randomSuffix}`;
}

export const scrapYardService = {
  calculateMultiMaterialTotals,
  generateScaleTicketNumber,

  /**
   * Registra una recepción en báscula con múltiples materiales (líneas LER/kg)
   * asociadas a una única cabecera y ticket conjunto.
   * Genera los asientos cronológicos enlazados sin duplicar la cabecera.
   */
  async registerMultiMaterialEntry(
    data: ScrapYardEntryFormData
  ): Promise<ScrapYardEntry> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    if (!data.proveedor_nombre?.trim()) {
      throw new Error('Debe especificar el nombre o razón social del proveedor.');
    }

    if (!data.lineas || data.lineas.length === 0) {
      throw new Error('Debe incluir al menos una línea de material en la entrega.');
    }

    for (const [index, line] of data.lineas.entries()) {
      if (!line.codigo_ler?.trim()) {
        throw new Error(`La línea ${index + 1} no tiene un código LER seleccionado.`);
      }
      if (!line.peso_kg || line.peso_kg <= 0) {
        throw new Error(`La línea ${index + 1} (${line.descripcion_residuo || line.codigo_ler}) debe tener un peso superior a 0 kg.`);
      }
    }

    // Datos de la empresa receptora (chatarrería propia)
    const myCompany = await companyService.getUserCompany();
    const ownName = myCompany?.razon_social || myCompany?.nombre_comercial || 'Chatarrería Receptora';
    const ownCif = myCompany?.cif || '';
    const ownNima = myCompany?.nima || '';
    const ownDir = myCompany?.domicilio_instalacion || myCompany?.domicilio_social || '';
    const ownMuni = myCompany?.municipio_instalacion || myCompany?.municipio_social || '';
    const ownProv = myCompany?.provincia_instalacion || myCompany?.provincia_social || '';

    const ticketNumero = data.ticket_numero?.trim() || generateScaleTicketNumber();
    const entryDate = data.fecha || new Date().toISOString().split('T')[0];

    const processedLines: ScrapYardMaterialLine[] = [];

    // Crear un asiento cronológico por cada línea LER enlazado al ticket de báscula
    for (const line of data.lineas) {
      const precioKg = line.precio_eur_kg && line.precio_eur_kg > 0 ? Number(line.precio_eur_kg) : undefined;
      const subtotalEur = precioKg ? Number((line.peso_kg * precioKg).toFixed(2)) : undefined;

      const obsParts = [
        `Recepción báscula ticket ${ticketNumero}`,
        precioKg !== undefined ? `Precio compra: ${precioKg.toFixed(2)} €/kg` : null,
        subtotalEur !== undefined ? `Liquidación: ${subtotalEur.toFixed(2)} €` : null,
        data.vehiculo_matricula ? `Vehículo: ${data.vehiculo_matricula}` : null,
        data.observaciones ? `Notas: ${data.observaciones}` : null
      ].filter(Boolean);

      const chronoPayload: ChronologicalEntryFormData = {
        fecha: entryDate,
        tipo_operacion: 'entrada_recepcion',
        codigo_ler: line.codigo_ler,
        descripcion_residuo: line.descripcion_residuo || 'Residuo chatarra/metal',
        peligrosidad: line.peligrosidad || (line.codigo_ler.includes('*') ? 'peligroso' : 'no-peligroso'),
        cantidad_kg: Number(line.peso_kg),
        estado_fisico: 'solido',
        operacion_rd: line.operacion_rd || 'R13',
        production_center_id: data.production_center_id,
        origen_tipo: 'tercero_productor',
        origen_razon_social: data.proveedor_nombre,
        origen_nif: data.proveedor_nif,
        origen_direccion: data.proveedor_direccion,
        origen_municipio: data.proveedor_municipio,
        origen_provincia: data.proveedor_provincia,
        destino_tipo: 'propio',
        destino_razon_social: ownName,
        destino_nif: ownCif,
        destino_nima: ownNima,
        destino_direccion: ownDir,
        destino_municipio: ownMuni,
        destino_provincia: ownProv,
        numero_documento_referencia: ticketNumero,
        observaciones: obsParts.join(' | ')
      };

      const createdAsiento = await createChronologicalEntry(chronoPayload);

      processedLines.push({
        ...line,
        subtotal_eur: subtotalEur,
        asiento_id: createdAsiento.id,
        asiento_numero: createdAsiento.numero_asiento,
      });
    }

    const totals = calculateMultiMaterialTotals(processedLines);

    const fullEntry: ScrapYardEntry = {
      ...data,
      id: `entry-${ticketNumero}-${Date.now()}`,
      user_id: user.id,
      company_id: myCompany?.id,
      ticket_numero: ticketNumero,
      fecha: entryDate,
      lineas: processedLines,
      total_kg: totals.total_kg,
      total_importe_eur: totals.total_importe_eur,
      created_at: new Date().toISOString(),
    };

    // Registrar en auditoría de trazabilidad
    await auditService.logAction({
      entidad: 'archivo_cronologico',
      entidad_id: processedLines[0]?.asiento_id || 0,
      accion: 'crear',
      detalles: {
        tipo: 'entrada_bascula_multimaterial',
        ticket_numero: ticketNumero,
        proveedor: data.proveedor_nombre,
        total_kg: totals.total_kg,
        total_importe_eur: totals.total_importe_eur,
        lineas_count: processedLines.length
      }
    });

    return fullEntry;
  },

  /**
   * Genera el HTML para impresión física directa o visualización del ticket de báscula
   */
  generateScaleTicketPrintHTML(entry: ScrapYardEntry, companyInfo?: any): string {
    const linesRows = entry.lineas.map(line => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 6px 4px; font-weight: 600;">${line.codigo_ler}</td>
        <td style="padding: 6px 4px;">${line.descripcion_residuo}</td>
        <td style="padding: 6px 4px; text-align: right; font-weight: bold;">${line.peso_kg.toLocaleString('es-ES', { minimumFractionDigits: 1 })} kg</td>
        <td style="padding: 6px 4px; text-align: right;">${line.precio_eur_kg ? `${line.precio_eur_kg.toFixed(2)} €/kg` : '-'}</td>
        <td style="padding: 6px 4px; text-align: right; font-weight: bold;">${line.subtotal_eur ? `${line.subtotal_eur.toFixed(2)} €` : '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket de Báscula - ${entry.ticket_numero}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; color: #111827; margin: 0; padding: 20px; }
          .ticket-card { max-width: 600px; margin: auto; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; }
          .header { text-align: center; border-bottom: 2px dashed #9ca3af; padding-bottom: 12px; margin-bottom: 14px; }
          .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; }
          .ticket-info { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; padding: 6px 4px; border-bottom: 2px solid #374151; font-size: 11px; text-transform: uppercase; }
          .totals { margin-top: 16px; border-top: 2px solid #374151; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
          .total-row.grand { font-size: 16px; font-weight: bold; color: #047857; }
          .footer { margin-top: 20px; font-size: 10px; color: #6b7280; text-align: center; border-top: 1px dashed #d1d5db; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            .ticket-card { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="header">
            <div class="company-name">${companyInfo?.razon_social || 'RECUPERACIONES Y CHATARRERÍA'}</div>
            <div>CIF: ${companyInfo?.cif || 'B-XXXXXXXX'} | NIMA: ${companyInfo?.nima || 'XXXXXXXXXX'}</div>
            <div style="font-weight: bold; margin-top: 4px; font-size: 15px;">TICKET DE BÁSCULA / RECEPCIÓN EN PLANTA</div>
          </div>
          <div class="ticket-info">
            <div>
              <strong>Nº Ticket:</strong> ${entry.ticket_numero}<br>
              <strong>Fecha:</strong> ${entry.fecha}<br>
              ${entry.vehiculo_matricula ? `<strong>Matrícula:</strong> ${entry.vehiculo_matricula}<br>` : ''}
            </div>
            <div style="text-align: right;">
              <strong>Proveedor:</strong> ${entry.proveedor_nombre}<br>
              <strong>NIF/DNI:</strong> ${entry.proveedor_nif || 'No indicado'}<br>
              <strong>Condición:</strong> ${entry.proveedor_tipo === 'particular' ? 'Particular' : 'Empresa / Autónomo'}<br>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>LER</th>
                <th>Material</th>
                <th style="text-align: right;">Peso</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${linesRows}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row">
              <span>Peso Total Neto Báscula:</span>
              <span style="font-weight: bold;">${entry.total_kg.toLocaleString('es-ES', { minimumFractionDigits: 1 })} kg (${(entry.total_kg / 1000).toFixed(3)} t)</span>
            </div>
            ${entry.total_importe_eur > 0 ? `
              <div class="total-row grand">
                <span>Total Liquidación Compra:</span>
                <span>${entry.total_importe_eur.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            Justificante de pesaje conforme a la Ley 7/2022 de Residuos y RD 553/2020.<br>
            Generado por ResiGest 360 · Trazabilidad documental y archivo cronológico integrado.
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
  }
};

export default scrapYardService;

