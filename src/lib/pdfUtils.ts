import jsPDF from 'jspdf';
import type { WasteContract } from '@/types/wasteManagement';

/**
 * Carga una imagen desde una URL y la devuelve como Base64 para jsPDF
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error cargando imagen para PDF:', error);
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
  doc.text(new Date(contract.fecha_contrato).toLocaleDateString('es-ES'), pageWidth / 2, yPos + 15);

  const estado = contract.estado.toUpperCase();
  doc.text(estado, pageWidth - 25, yPos + 15, { align: 'right' });

  yPos += 35;

  // --- PARTES INTERVINIENTES ---
  // Productor y Gestor en dos columnas
  doc.setFontSize(12);

  // Columna Izquierda: Productor
  if (contract.company) {
    yPos = drawSectionHeader('DATOS DEL PRODUCTOR (CLIENTE)', yPos - 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Razón Social:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(contract.company.razon_social, 60, yPos);
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
  }

  // Columna Derecha / Siguiente: Gestor
  const gestorData = contract.treatment_manager || contract.gestor_company;

  if (gestorData) {
    yPos = drawSectionHeader('DATOS DEL GESTOR (DESTINATARIO)', yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Razón Social:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(gestorData.razon_social, 60, yPos);
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

    // Support both 'direccion' (TreatmentManager) and 'domicilio_social' (Company)
    const address = contract.treatment_manager?.direccion || contract.gestor_company?.domicilio_social;
    const municipio = contract.treatment_manager?.municipio || contract.gestor_company?.municipio_social;

    const dirGestor = doc.splitTextToSize(`${address || '-'}, ${municipio || ''}`, 120);
    doc.text(dirGestor, 60, yPos);
    yPos += (dirGestor.length * 5) + 5;
  }

  // --- VIGENCIA ---
  if (contract.fecha_inicio && contract.fecha_fin) {
    yPos = drawSectionHeader('VIGENCIA Y DURACIÓN', yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Inicio de Actividad:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(contract.fecha_inicio).toLocaleDateString('es-ES'), 80, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Finalización:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(contract.fecha_fin).toLocaleDateString('es-ES'), 80, yPos);
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

  // Cantidad
  doc.setFont('helvetica', 'bold');
  doc.text('Cantidad Máxima Estimada:', 25, yPos);
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
      doc.addImage(signatureBase64, 'PNG', 25, yPos - 25, 60, 20);
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
    doc.text(`Fecha: ${new Date(contract.fecha_firma_productor).toLocaleString('es-ES')}`, 25, yPos + 15);
  }

  // Firma Gestor
  if (contract.firma_gestor_url) {
    const signatureBase64 = await loadImageAsBase64(contract.firma_gestor_url);
    if (signatureBase64) {
      doc.addImage(signatureBase64, 'PNG', pageWidth - 85, yPos - 25, 60, 20);
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
    doc.text(`Fecha: ${new Date(contract.fecha_firma_gestor).toLocaleString('es-ES')}`, pageWidth - 85, yPos + 15);
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
