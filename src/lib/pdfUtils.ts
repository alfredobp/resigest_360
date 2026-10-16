import jsPDF from 'jspdf';
import type { WasteContract, IdentificationDocument, MemoriaAnual, CommercialOperation } from '@/types/wasteManagement';

/**
 * Funciones auxiliares para formateo seguro de fechas
 */
function formatSafeDate(d?: string | null): string {
  if (!d) return 'No especificada';
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-ES');
}

function formatSafeDateTime(d?: string | null): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('es-ES');
}

/**
 * Carga una imagen desde una URL y la devuelve como Base64 para jsPDF
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Advertencia: no se pudo cargar la imagen para el PDF:', error);
    return null;
  }
}

export async function generateContractPDF(contract: WasteContract) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [37, 99, 235]; // Azul profesional (Royal Blue)
  const secondaryColor = [75, 85, 99]; // Gris oscuro
  const accentColor = [243, 244, 246]; // Gris muy claro para fondos

  // Función auxiliar para dibujar encabezados de sección
  const drawSectionHeader = (text: string, y: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, y, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(text.toUpperCase(), 25, y + 5.5);
    doc.setTextColor(0, 0, 0);
    return y + 15;
  };

  // --- ENCABEZADO ---
  // Rectángulo decorativo superior
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE TRATAMIENTO', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RESIGEST 360 - SISTEMA DE GESTIÓN MEDIOAMBIENTAL', pageWidth / 2, 30, { align: 'center' });

  // --- INFORMACIÓN GENERAL ---
  let yPos = 55;

  // Caja de información del contrato
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(20, yPos, pageWidth - 40, 25, 2, 2, 'F');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(9);
  doc.text('REFERENCIA DEL CONTRATO', 25, yPos + 7);
  doc.text('FECHA DE EMISIÓN', pageWidth / 2, yPos + 7);
  doc.text('ESTADO CORRIENTE', pageWidth - 25, yPos + 7, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(contract.numero_contrato || `#${contract.id}`, 25, yPos + 15);
  doc.text(formatSafeDate(contract.fecha_contrato), pageWidth / 2, yPos + 15);

  const estado = (contract.estado || 'borrador').toUpperCase();
  doc.text(estado, pageWidth - 25, yPos + 15, { align: 'right' });

  yPos += 35;

  // --- PARTES INTERVINIENTES ---
  // Columna Izquierda: Productor
  yPos = drawSectionHeader('DATOS DEL PRODUCTOR (CLIENTE)', yPos - 5);
  doc.setFontSize(10);
  if (contract.company) {
    doc.setFont('helvetica', 'bold');
    doc.text('Razón Social:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(contract.company.razon_social || '-', 60, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('CIF / NIF:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(contract.company.cif || '-', 60, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('NIMA:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(contract.company.nima || '-', 60, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Domicilio:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    const dirProductor = doc.splitTextToSize(`${contract.company.domicilio_social || '-'}, ${contract.company.municipio_social || ''}`, 120);
    doc.text(dirProductor, 60, yPos);
    yPos += (dirProductor.length * 5) + 5;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Datos del productor no asociados en este contrato.', 25, yPos);
    yPos += 12;
  }

  // Columna Derecha / Siguiente: Gestor
  const gestorData = contract.treatment_manager || contract.gestor_company;
  yPos = drawSectionHeader('DATOS DEL GESTOR (DESTINATARIO)', yPos);
  doc.setFontSize(10);
  if (gestorData) {
    doc.setFont('helvetica', 'bold');
    doc.text('Razón Social:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(gestorData.razon_social || '-', 60, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('CIF / NIF:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(gestorData.cif || '-', 60, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('NIMA:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(gestorData.nima || '-', 60, yPos);
    yPos += 7;

    if ('numero_autorizacion' in gestorData && gestorData.numero_autorizacion) {
      doc.setFont('helvetica', 'bold');
      doc.text('Nº Autorización:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(gestorData.numero_autorizacion, 60, yPos);
      yPos += 7;
    } else if ('numero_inscripcion' in gestorData && gestorData.numero_inscripcion) {
      doc.setFont('helvetica', 'bold');
      doc.text('Nº Inscripción:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(gestorData.numero_inscripcion, 60, yPos);
      yPos += 7;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Domicilio:', 25, yPos);
    doc.setFont('helvetica', 'normal');

    const address = ('direccion' in gestorData ? gestorData.direccion : '') || ('domicilio_social' in gestorData ? gestorData.domicilio_social : '');
    const muni = ('municipio' in gestorData ? gestorData.municipio : '') || ('municipio_social' in gestorData ? gestorData.municipio_social : '');

    const dirGestor = doc.splitTextToSize(`${address || '-'}, ${muni || ''}`, 120);
    doc.text(dirGestor, 60, yPos);
    yPos += (dirGestor.length * 5) + 5;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Gestor autorizado no asignado en este contrato.', 25, yPos);
    yPos += 12;
  }

  // --- VIGENCIA ---
  if (contract.fecha_inicio || contract.fecha_fin) {
    yPos = drawSectionHeader('VIGENCIA Y DURACIÓN', yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Inicio de Actividad:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatSafeDate(contract.fecha_inicio), 80, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Finalización:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatSafeDate(contract.fecha_fin), 80, yPos);
    yPos += 12;
  }

  // --- CONDICIONES TÉCNICAS Y ECONÓMICAS ---
  yPos = drawSectionHeader('CONDICIONES TÉCNICAS Y ECONÓMICAS', yPos);

  // Residuos
  doc.setFont('helvetica', 'bold');
  doc.text('Residuos Objeto del Contrato:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  const descResiduos = doc.splitTextToSize(contract.descripcion_residuos || 'Según anexo o DIs asociados.', pageWidth - 100);
  doc.text(descResiduos, 80, yPos);
  yPos += (descResiduos.length * 5) + 5;

  // Cantidad Máxima
  doc.setFont('helvetica', 'bold');
  doc.text('Cantidad Máxima Anual:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  const cantText = contract.cantidad_maxima_anual
    ? `${contract.cantidad_maxima_anual} ${contract.unidad_cantidad || 't'}/año`
    : 'Sin límite especificado';
  doc.text(cantText, 80, yPos);
  yPos += 7;

  // Precio
  doc.setFont('helvetica', 'bold');
  doc.text('Precio por Tonelada / Servicio:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  const precioText = contract.precio_unitario
    ? `${contract.precio_unitario} ${contract.moneda || 'EUR'}`
    : 'Según tarifa vigente en el momento de la entrega';
  doc.text(precioText, 80, yPos);
  yPos += 12;

  // --- NOTAS ADICIONALES ---
  if (contract.notas) {
    yPos = drawSectionHeader('CLÁUSULAS ADICIONALES / NOTAS', yPos);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const noteLines = doc.splitTextToSize(contract.notas, pageWidth - 50);
    doc.text(noteLines, 25, yPos);
    yPos += (noteLines.length * 5) + 10;
  }

  // --- FIRMAS ---
  // Asegurar que las firmas queden al final o en nueva página
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = 30;
  } else {
    yPos = pageHeight - 70;
  }

  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);

  // Firma Productor
  if (contract.firma_productor_url) {
    const signatureBase64 = await loadImageAsBase64(contract.firma_productor_url);
    if (signatureBase64) {
      try {
        doc.addImage(signatureBase64, 'PNG', 25, yPos - 25, 60, 20);
      } catch (e) {
        console.warn('No se pudo renderizar la firma del productor en el PDF:', e);
      }
    }
  }
  doc.line(25, yPos, 85, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('POR EL PRODUCTOR', 25, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Firmado digitalmente', 25, yPos + 10);
  if (contract.fecha_firma_productor) {
    doc.setFontSize(7);
    doc.text(`Fecha: ${formatSafeDateTime(contract.fecha_firma_productor)}`, 25, yPos + 15);
  }

  // Firma Gestor
  if (contract.firma_gestor_url) {
    const signatureBase64 = await loadImageAsBase64(contract.firma_gestor_url);
    if (signatureBase64) {
      try {
        doc.addImage(signatureBase64, 'PNG', pageWidth - 85, yPos - 25, 60, 20);
      } catch (e) {
        console.warn('No se pudo renderizar la firma del gestor en el PDF:', e);
      }
    }
  }
  doc.line(pageWidth - 85, yPos, pageWidth - 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('POR EL GESTOR AUTORIZADO', pageWidth - 85, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Firmado digitalmente', pageWidth - 85, yPos + 10);
  if (contract.fecha_firma_gestor) {
    doc.setFontSize(7);
    doc.text(`Fecha: ${formatSafeDateTime(contract.fecha_firma_gestor)}`, pageWidth - 85, yPos + 15);
  }

  // --- PIE DE PÁGINA ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Este documento tiene validez contractual según el RD 553/2020 de traslado de residuos.`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 25, pageHeight - 15, { align: 'right' });

    // Línea decorativa inferior
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(0, pageHeight - 10, pageWidth, pageHeight - 10);
  }

  return doc;
}

/**
 * Genera el PDF oficial del Documento de Identificación (DI) según el RD 553/2020
 */
export async function generateIdentificationDocumentPDF(docData: IdentificationDocument): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [15, 76, 129];
  const secondaryColor = [71, 85, 105];
  const darkColor = [30, 41, 59];

  let yPos = 20;

  // --- CABECERA GUBERNAMENTAL ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 8, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DOCUMENTO DE IDENTIFICACIÓN (DI) DE TRASLADO DE RESIDUOS', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Régimen de traslados en el interior del territorio del Estado (Real Decreto 553/2020)', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  // Caja de referencia
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos, pageWidth - 30, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Nº DE IDENTIFICACIÓN (DI):', 20, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.numero_documento, 65, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA TRASLADO:', 120, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(formatSafeDate(docData.fecha_documento), 155, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('TIPO DE TRASLADO:', 20, yPos + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.tipo_notificacion === 'con-notificacion-previa' ? 'Con Notificación Previa (NT)' : 'Sin Notificación Previa', 65, yPos + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO:', 120, yPos + 11);
  doc.setFont('helvetica', 'normal');
  doc.text((docData.estado_traslado || docData.estado || 'BORRADOR').toUpperCase(), 155, yPos + 11);

  yPos += 18;

  const drawSection = (title: string, currentY: number): number => {
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, pageWidth - 30, 6, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, 18, currentY + 4.2);
    return currentY + 9;
  };

  // --- SECCIÓN 1: PRODUCTOR / ORIGEN ---
  yPos = drawSection('1. OPERADOR DEL TRASLADO / PRODUCTOR (ORIGEN)', yPos);
  doc.setFontSize(8);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  doc.setFont('helvetica', 'bold');
  doc.text('Razón Social:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.productor_razon_social || '-', 42, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('NIF/CIF:', 130, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.productor_cif || '-', 150, yPos);
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('NIMA Origen:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.productor_nima || '-', 42, yPos);

  if (docData.production_center) {
    doc.setFont('helvetica', 'bold');
    doc.text('Centro:', 130, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(docData.production_center.nombre, 150, yPos);
  }
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Domicilio:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  const dirProd = doc.splitTextToSize(
    `${docData.productor_direccion || '-'}, ${docData.productor_municipio || ''} (${docData.productor_provincia || ''})`,
    pageWidth - 65
  );
  doc.text(dirProd, 42, yPos);
  yPos += (dirProd.length * 4) + 3;

  // --- SECCIÓN 2: TRANSPORTISTA ---
  yPos = drawSection('2. TRANSPORTISTA DEL TRASLADO', yPos);
  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');
  doc.text('Razón Social:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.transportista_razon_social || 'Transporte propio / No asignado', 42, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('NIF/CIF:', 130, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.transportista_cif || '-', 150, yPos);
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('NIMA Transp.:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.transportista_nima || '-', 42, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', 130, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.transportista_matricula || '-', 150, yPos);
  yPos += 4.5;

  if (docData.fecha_salida) {
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha/Hora Salida:', 18, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatSafeDateTime(docData.fecha_salida), 46, yPos);
    yPos += 4.5;
  }
  yPos += 2;

  // --- SECCIÓN 3: GESTOR / DESTINATARIO ---
  yPos = drawSection('3. GESTOR DESTINATARIO / INSTALACIÓN DE TRATAMIENTO', yPos);
  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');
  doc.text('Razón Social:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.gestor_razon_social || '-', 42, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('NIF/CIF:', 130, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.gestor_cif || '-', 150, yPos);
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('NIMA Destino:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.gestor_nima || '-', 42, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Nº Autorización:', 130, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.gestor_numero_autorizacion || '-', 155, yPos);
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Domicilio:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  const dirGestor = doc.splitTextToSize(
    `${docData.gestor_direccion || '-'}, ${docData.gestor_municipio || ''} (${docData.gestor_provincia || ''})`,
    pageWidth - 65
  );
  doc.text(dirGestor, 42, yPos);
  yPos += (dirGestor.length * 4) + 3;

  // --- SECCIÓN 4: RESIDUO TRASLADADO ---
  yPos = drawSection('4. CARACTERIZACIÓN DEL RESIDUO', yPos);
  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');
  doc.text('Código LER:', 18, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(docData.peligrosidad === 'peligroso' ? 180 : 0, docData.peligrosidad === 'peligroso' ? 0 : 100, 0);
  doc.text(`${docData.codigo_ler} (${docData.peligrosidad === 'peligroso' ? 'PELIGROSO' : 'NO PELIGROSO'})`, 42, yPos);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  doc.setFont('helvetica', 'bold');
  doc.text('Estado Físico:', 130, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.estado_fisico || '-', 155, yPos);
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Descripción:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  const descRes = doc.splitTextToSize(docData.descripcion_residuo || '-', pageWidth - 65);
  doc.text(descRes, 42, yPos);
  yPos += (descRes.length * 4) + 2;

  doc.setFont('helvetica', 'bold');
  doc.text('Operación Prevista:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.operacion_tratamiento || 'Según contrato / autorización', 48, yPos);

  if (docData.numero_envases || docData.tipo_envases) {
    doc.setFont('helvetica', 'bold');
    doc.text('Envases:', 130, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${docData.numero_envases || '-'} (${docData.tipo_envases || 'bultos'})`, 150, yPos);
  }
  yPos += 6;

  // --- SECCIÓN 5: PESAJE EN BÁSCULA Y RECEPCIÓN ---
  yPos = drawSection('5. CONTROL DE PESAJE EN BÁSCULA Y DICTAMEN DE RECEPCIÓN (DESTINO)', yPos);
  doc.setFontSize(8);

  const pesoOrigenText = docData.peso_origen_kg ? `${docData.peso_origen_kg} kg` : `${docData.cantidad} ${docData.unidad}`;
  const pesoDestinoText = docData.peso_destino_kg ? `${docData.peso_destino_kg} kg` : 'Pendiente en báscula';

  doc.setFont('helvetica', 'bold');
  doc.text('Peso Declarado en Origen:', 18, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(pesoOrigenText, 62, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Peso Neto en Destino:', 115, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(pesoDestinoText, 155, yPos);
  yPos += 4.5;

  if (docData.diferencia_peso_kg !== undefined && docData.diferencia_peso_kg !== null) {
    doc.setFont('helvetica', 'bold');
    doc.text('Discrepancia de Báscula:', 18, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${docData.diferencia_peso_kg > 0 ? '+' : ''}${docData.diferencia_peso_kg} kg (${docData.porcentaje_discrepancia || 0}%)`, 62, yPos);
  }

  if (docData.numero_albaran_gestor) {
    doc.setFont('helvetica', 'bold');
    doc.text('Nº Albarán Gestor:', 115, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(docData.numero_albaran_gestor, 155, yPos);
  }
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Dictamen Recepción:', 18, yPos);
  doc.setFont('helvetica', 'bold');
  const dictamen = (docData.resultado_recepcion || 'Conforme pendiente').toUpperCase();
  doc.text(dictamen, 62, yPos);

  if (docData.fecha_llegada_destino) {
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha Llegada:', 115, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatSafeDateTime(docData.fecha_llegada_destino), 155, yPos);
  }
  yPos += 4.5;

  if (docData.motivo_incidencia) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text('Incidencia/Rechazo:', 18, yPos);
    doc.setFont('helvetica', 'normal');
    const motivoText = doc.splitTextToSize(`${docData.tipo_incidencia || ''}: ${docData.motivo_incidencia}`, pageWidth - 65);
    doc.text(motivoText, 52, yPos);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    yPos += (motivoText.length * 4) + 2;
  }
  yPos += 4;

  // --- SECCIÓN 6: FIRMAS DE LOS INTERVINIENTES ---
  yPos = Math.max(yPos, pageHeight - 55);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);

  // Productor
  doc.line(18, yPos, 68, yPos);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('EL PRODUCTOR / REMITENTE', 18, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.firmado_productor ? '✓ Firmado en salida' : 'Pendiente de firma', 18, yPos + 8);
  if (docData.fecha_firma_productor) {
    doc.setFontSize(6.5);
    doc.text(formatSafeDateTime(docData.fecha_firma_productor), 18, yPos + 11.5);
  }

  // Transportista
  doc.line(80, yPos, 130, yPos);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('EL TRANSPORTISTA', 80, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.firmado_transportista ? '✓ Conforme en carga' : 'Pendiente de firma', 80, yPos + 8);
  if (docData.fecha_firma_transportista) {
    doc.setFontSize(6.5);
    doc.text(formatSafeDateTime(docData.fecha_firma_transportista), 80, yPos + 11.5);
  }

  // Gestor
  doc.line(142, yPos, 192, yPos);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('EL GESTOR DESTINATARIO', 142, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(docData.firmado_gestor ? '✓ Recepcionado y pesado' : 'Pendiente de recepción', 142, yPos + 8);
  if (docData.fecha_firma_gestor) {
    doc.setFontSize(6.5);
    doc.text(formatSafeDateTime(docData.fecha_firma_gestor), 142, yPos + 11.5);
  }

  // Pie de página
  doc.setFontSize(7);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(
    'Documento oficial de control y seguimiento de traslados según art. 6 del Real Decreto 553/2020. Validez legal ante autoridades competentes.',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}

/**
 * Genera el PDF oficial de la Memoria Anual de Residuos (Ley 7/2022)
 */
export async function generateMemoriaAnualPDF(memoria: MemoriaAnual) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [4, 120, 87]; // Emerald Green profesional
  const secondaryColor = [75, 85, 99];
  const accentBg = [240, 253, 244];

  // Encabezado
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MEMORIA ANUAL DE RESIDUOS - LEY 7/2022', 14, 12);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`EJERCICIO: ${memoria.año}  |  TIPO: ${memoria.tipo_memoria.toUpperCase()}  |  REF: ${memoria.numero_memoria}`, 14, 21);

  let yPos = 36;

  // Tarjeta de Datos de la Empresa y Centro
  doc.setFillColor(accentBg[0], accentBg[1], accentBg[2]);
  doc.roundedRect(14, yPos, pageWidth - 28, 30, 2, 2, 'F');
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, yPos, pageWidth - 28, 30, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. DATOS IDENTIFICATIVOS DE LA EMPRESA Y CENTRO', 20, yPos + 7);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Razón Social:', 20, yPos + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(memoria.nombre_empresa || '-', 46, yPos + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('NIF / CIF:', 115, yPos + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(memoria.nif_empresa || '-', 135, yPos + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Instalación / Centro:', 20, yPos + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(memoria.nombre_centro || 'Sede Principal', 55, yPos + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('NIMA:', 115, yPos + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(memoria.nima || '-', 130, yPos + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Municipio:', 20, yPos + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(memoria.municipio_centro || '-', 40, yPos + 27);

  doc.setFont('helvetica', 'bold');
  doc.text('Estado:', 115, yPos + 27);
  doc.setFont('helvetica', 'normal');
  doc.text((memoria.estado || 'borrador').toUpperCase(), 130, yPos + 27);

  yPos += 36;

  // Balance y Totales
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, yPos, pageWidth - 28, 20, 2, 2, 'F');

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total Movimientos / DIs:', 22, yPos + 12);
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(String(memoria.total_movimientos || 0), 65, yPos + 12);

  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('Total Gestionado:', 110, yPos + 12);
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${(memoria.total_toneladas || 0).toFixed(3)} t`, 145, yPos + 12);

  yPos += 28;

  // Tabla Resumen LER
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, yPos, pageWidth - 28, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CÓDIGO LER', 18, yPos + 5);
  doc.text('DESCRIPCIÓN DEL RESIDUO', 48, yPos + 5);
  doc.text('MOVIMIENTOS', 135, yPos + 5);
  doc.text('TOTAL (t)', 170, yPos + 5);

  yPos += 7;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const resumen = memoria.resumen_ler || [];
  if (resumen.length === 0) {
    doc.text('No hay registros de residuos computados en este ejercicio.', 18, yPos + 8);
    yPos += 14;
  } else {
    resumen.forEach((item, index) => {
      if (yPos > pageHeight - 35) {
        doc.addPage();
        yPos = 20;
      }

      if (index % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.text(item.codigo_ler, 18, yPos + 5.5);
      doc.setFont('helvetica', 'normal');

      const desc = item.descripcion.length > 50 ? item.descripcion.substring(0, 48) + '...' : item.descripcion;
      doc.text(desc, 48, yPos + 5.5);
      doc.text(String(item.numero_movimientos), 145, yPos + 5.5);
      doc.text((item.cantidad_total || 0).toFixed(3) + ' t', 170, yPos + 5.5);

      yPos += 8;
    });
  }

  yPos += 10;

  // Observaciones y Diligencia Legal
  if (yPos > pageHeight - 45) {
    doc.addPage();
    yPos = 20;
  }

  doc.setDrawColor(209, 213, 219);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 8;

  doc.setFontSize(7.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(
    `Memoria Anual generada conforme al artículo 65 de la Ley 7/2022 y normativa autonómica aplicable.`,
    14,
    yPos
  );
  doc.text(
    `Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}. Sistema de Gestión RESIGEST 360.`,
    14,
    yPos + 5
  );

  return doc;
}

/**
 * Genera el documento oficial de Liquidación de la Operación Comercial (Negociante / Agente)
 */
export async function generateCommercialOperationPDF(op: CommercialOperation) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [29, 78, 216]; // Blue 700 corporativo
  const secondaryColor = [75, 85, 99];
  const accentBg = [239, 246, 255]; // Blue 50

  // Encabezado
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LIQUIDACIÓN DE OPERACIÓN COMERCIAL', 14, 12);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `REF: ${op.numero_operacion}  |  FECHA: ${formatSafeDate(op.fecha)}  |  ESTADO: ${op.estado.toUpperCase()}`,
    14,
    21
  );

  let yPos = 36;

  // 1. Datos del Residuo y Flujo Físico
  doc.setFillColor(accentBg[0], accentBg[1], accentBg[2]);
  doc.roundedRect(14, yPos, pageWidth - 28, 42, 2, 2, 'F');
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, yPos, pageWidth - 28, 42, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. TRAZABILIDAD FÍSICA Y AMBIENTAL DEL RESIDUO', 20, yPos + 7);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Código LER:', 20, yPos + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${op.codigo_ler} - ${op.descripcion_residuo}`, 45, yPos + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Productor (Origen):', 20, yPos + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(op.origen_nombre_personalizado || op.origen_productor?.razon_social || '-', 56, yPos + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Gestor (Destino):', 115, yPos + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(op.destino_nombre_personalizado || op.destino_gestor?.razon_social || '-', 145, yPos + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Transportista:', 20, yPos + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(op.transportista_nombre_personalizado || op.transportista?.razon_social || '-', 45, yPos + 28);

  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', 115, yPos + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(op.transportista_matricula || '-', 135, yPos + 28);

  doc.setFont('helvetica', 'bold');
  doc.text('Toneladas Totales:', 20, yPos + 35);
  doc.setFont('helvetica', 'normal');
  const ton = (op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;
  doc.text(`${ton.toFixed(3)} t ${op.cantidad_real_t ? '(Verificado en báscula)' : '(Estimado)'}`, 52, yPos + 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Documento DI:', 115, yPos + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(op.identification_document_id ? `DI #${op.identification_document_id}` : 'No vinculado', 142, yPos + 35);

  yPos += 48;

  // 2. Liquidación Económica y Desglose Financiero
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, yPos, pageWidth - 28, 48, 2, 2, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(14, yPos, pageWidth - 28, 48, 2, 2, 'S');

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. LIQUIDACIÓN ECONÓMICA DE INTERMEDIACIÓN', 20, yPos + 7);

  // Venta
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Ingreso Venta (Cliente):', 20, yPos + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${op.cliente_razon_social || op.cliente_comercial?.razon_social || '-'}`, 60, yPos + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(`+ ${(op.ingreso_venta_total || 0).toFixed(2)} €`, 160, yPos + 15);

  // Compra
  doc.text('Coste Compra (Proveedor):', 20, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`${op.proveedor_razon_social || op.proveedor_comercial?.razon_social || '-'}`, 65, yPos + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`- ${(op.coste_compra_total || 0).toFixed(2)} €`, 160, yPos + 22);

  // Transporte
  doc.setTextColor(31, 41, 55);
  doc.text('Coste de Transporte (Flete):', 20, yPos + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(`${op.transportista_nombre_personalizado || op.transportista?.razon_social || '-'}`, 68, yPos + 29);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`- ${(op.coste_transporte || 0).toFixed(2)} €`, 160, yPos + 29);

  // Otros costes
  if (op.otros_costes > 0) {
    doc.setTextColor(31, 41, 55);
    doc.text('Otros Costes Accesorios:', 20, yPos + 36);
    doc.setFont('helvetica', 'normal');
    doc.text(op.descripcion_otros_costes || 'Tasas / Cánones', 65, yPos + 36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`- ${(op.otros_costes || 0).toFixed(2)} €`, 160, yPos + 36);
  }

  yPos += 54;

  // 3. Tarjeta de Margen Neto
  const esPositivo = (op.margen_bruto_total || 0) >= 0;
  const margenBg = esPositivo ? [240, 253, 244] : [254, 242, 242];
  const margenText = esPositivo ? [22, 101, 52] : [153, 27, 27];

  doc.setFillColor(margenBg[0], margenBg[1], margenBg[2]);
  doc.roundedRect(14, yPos, pageWidth - 28, 26, 2, 2, 'F');
  doc.setDrawColor(margenText[0], margenText[1], margenText[2]);
  doc.roundedRect(14, yPos, pageWidth - 28, 26, 2, 2, 'S');

  doc.setTextColor(margenText[0], margenText[1], margenText[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MARGEN BRUTO RESULTANTE:', 22, yPos + 11);
  doc.setFontSize(16);
  doc.text(`${(op.margen_bruto_total || 0).toFixed(2)} €`, 140, yPos + 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Margen Unitario: ${(op.margen_unitario_tonelada || 0).toFixed(2)} € / tonelada`, 22, yPos + 19);
  doc.text(`Rentabilidad sobre venta: ${(op.porcentaje_margen || 0).toFixed(1)}%`, 130, yPos + 19);

  yPos += 38;

  // Observaciones
  if (op.observaciones) {
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Observaciones y Condiciones Particulares:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(op.observaciones, 14, yPos + 6);
    yPos += 16;
  }

  // Pie de página
  doc.setDrawColor(209, 213, 219);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

  doc.setFontSize(7.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(
    'Liquidación de Operación de Negociación/Agencia según Arts. 23 y 24 Ley 7/2022 de Residuos y Suelos Contaminados.',
    14,
    pageHeight - 14
  );
  doc.text(
    `Generado por RESIGEST 360 el ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}.`,
    14,
    pageHeight - 9
  );

  return doc;
}



