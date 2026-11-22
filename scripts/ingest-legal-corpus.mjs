#!/usr/bin/env node
/**
 * Script de ingesta del corpus legal inicial en Supabase pgvector.
 *
 * Requisitos (.env.local o variables de entorno):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GEMINI_API_KEY
 *
 * Uso:
 *   node --env-file=.env.local scripts/ingest-legal-corpus.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
  console.error(
    'Faltan variables de entorno obligatorias: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y GEMINI_API_KEY.'
  );
  process.exit(1);
}

const DOCUMENTS = [
  {
    code: 'LEY_7_2022',
    title: 'Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular',
    ambito: 'estatal',
    ccaa: null,
    boe_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809',
    published_at: '2022-04-09',
  },
  {
    code: 'RD_553_2020',
    title: 'Real Decreto 553/2020, de 2 de junio, por el que se regula el traslado de residuos en el interior del territorio del Estado',
    ambito: 'estatal',
    ccaa: null,
    boe_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-6422',
    published_at: '2020-06-19',
  },
  {
    code: 'DECISION_2014_955_UE',
    title: 'Decisión 2014/955/UE de la Comisión — Lista Europea de Residuos (LER)',
    ambito: 'ue',
    ccaa: null,
    boe_url: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2014-83641',
    published_at: '2014-12-30',
  },
];

const CHUNKS = [
  {
    document_code: 'LEY_7_2022',
    article_ref: 'Art. 20 Ley 7/2022',
    section_title: 'Obligaciones del productor inicial u otro poseedor relativas a la gestión de sus residuos',
    content:
      'El productor inicial u otro poseedor de residuos está obligado a asegurar el tratamiento adecuado de sus residuos, bien realizándolo por sí mismo si dispone de autorización, o encargándolo a un negociante registrado o a una entidad o empresa registrada que lleve a cabo operaciones de tratamiento. La entrega debe acreditarse documentalmente. La responsabilidad del productor inicial concluye cuando quede debidamente documentado el tratamiento completo a través de los correspondientes documentos de traslado de residuos y certificados de la instalación de destino.',
  },
  {
    document_code: 'LEY_7_2022',
    article_ref: 'Art. 21 Ley 7/2022',
    section_title: 'Almacenamiento, mezcla, envasado y etiquetado de residuos en el lugar de producción',
    content:
      'La duración máxima del almacenamiento de residuos no peligrosos en el lugar de producción será inferior a dos años cuando se destinen a valorización y a un año cuando se destinen a eliminación. En el caso de los residuos peligrosos, en ambos supuestos, la duración máxima será de seis meses. Está prohibido mezclar o diluir residuos peligrosos con otras categorías de residuos peligrosos o con otros residuos, sustancias o materiales. Los recipientes con residuos peligrosos deben estar correctamente envasados y etiquetados con código LER, datos del productor, fecha de inicio de almacenamiento y pictogramas de peligro.',
  },
  {
    document_code: 'LEY_7_2022',
    article_ref: 'Art. 23 Ley 7/2022',
    section_title: 'Obligaciones de los gestores de residuos',
    content:
      'Las entidades o empresas que realicen actividades de recogida y tratamiento de residuos deberán disponer de la autorización o comunicación previa correspondiente inscrita en el Registro de Producción y Gestión de Residuos (NIMA). Deben mantener los residuos almacenados en condiciones adecuadas de higiene y seguridad (máximo 6 meses para peligrosos y 1 o 2 años para no peligrosos), constituir fianza y suscribir seguro de responsabilidad civil cuando sea exigible.',
  },
  {
    document_code: 'LEY_7_2022',
    article_ref: 'Art. 35 Ley 7/2022',
    section_title: 'Comunicaciones previas al inicio de actividades de producción y gestión de residuos',
    content:
      'Deberán presentar comunicación previa ante la Comunidad Autónoma donde estén ubicadas: las instalaciones o actividades que generen residuos peligrosos (sin límite mínimo de cantidad) y las que generen más de 1.000 toneladas anuales de residuos no peligrosos. También requieren comunicación previa los transportistas de residuos con carácter profesional, los agentes y los negociantes.',
  },
  {
    document_code: 'LEY_7_2022',
    article_ref: 'Art. 64 Ley 7/2022',
    section_title: 'Archivo cronológico',
    content:
      'Las personas físicas o jurídicas registradas dispondrán de un archivo electrónico donde se recojan por orden cronológico la cantidad, naturaleza y origen del residuo generado y la cantidad de productos, materiales o sustancias y residuos resultantes de las operaciones de valorización y eliminación. La información del archivo cronológico se guardará durante al menos cinco años y estará a disposición de las autoridades competentes.',
  },
  {
    document_code: 'LEY_7_2022',
    article_ref: 'Art. 65 Ley 7/2022',
    section_title: 'Memoria anual de gestión de residuos',
    content:
      'Antes del 1 de marzo del año posterior respecto al cual se hayan recogido los datos, las personas físicas o jurídicas que hayan obtenido una autorización de tratamiento de residuos enviarán una memoria resumen de la información contenida en el archivo cronológico a la Comunidad Autónoma en la que esté ubicada la instalación.',
  },
  {
    document_code: 'RD_553_2020',
    article_ref: 'Art. 3 y Art. 5 RD 553/2020',
    section_title: 'Requisitos previos al traslado y Contrato de Tratamiento (CT)',
    content:
      'Todo traslado de residuos debe ir precedido de un Contrato de Tratamiento (CT) suscrito entre el operador del traslado y el gestor de la instalación de destino, especificando NIMA origen y destino, cantidad estimada, código LER, periodicidad, operación de tratamiento (R o D), condiciones de aceptación y obligaciones en caso de rechazo.',
  },
  {
    document_code: 'RD_553_2020',
    article_ref: 'Art. 6 RD 553/2020',
    section_title: 'Documento de Identificación (DI)',
    content:
      'Todos los traslados de residuos deberán ir acompañados desde el inicio hasta la entrega en destino de un Documento de Identificación (DI) cumplimentado por el operador del traslado. Cuando el traslado está sujeto a Notificación Previa (NT), el DI debe tramitarse obligatoriamente por vía electrónica a través de eSIR o la plataforma autonómica conectada.',
  },
  {
    document_code: 'RD_553_2020',
    article_ref: 'Art. 7 RD 553/2020',
    section_title: 'Aceptación o rechazo de residuos en destino y plazos del DI',
    content:
      'Una vez recibidos los residuos en la instalación de destino, el gestor dispone de un plazo máximo de treinta días naturales desde la recepción para efectuar las comprobaciones necesarias y remitir al operador del traslado el Documento de Identificación completado indicando la aceptación o el rechazo del residuo y la cantidad exacta pesada en destino.',
  },
  {
    document_code: 'RD_553_2020',
    article_ref: 'Art. 3.2 y Art. 8 RD 553/2020',
    section_title: 'Notificación Previa de Traslado (NT): cuándo es obligatoria y plazos',
    content:
      'Están sometidos a Notificación Previa (NT): todos los traslados de residuos peligrosos, los traslados de residuos no peligrosos destinados a eliminación, los residuos destinados a incineración R1 y los residuos domésticos mezclados (LER 20 03 01) destinados a valorización. Debe presentarse con al menos diez días naturales de antelación al traslado. Una NT general tiene una vigencia máxima de tres años.',
  },
  {
    document_code: 'DECISION_2014_955_UE',
    article_ref: 'Anexo Decisión 2014/955/UE (LER)',
    section_title: 'Clasificación de residuos mediante códigos LER y peligrosidad (HP)',
    content:
      'Todo residuo se clasifica mediante un código LER de seis dígitos agrupado en 20 capítulos según el proceso o actividad de origen. Los códigos marcados con asterisco (*) son residuos peligrosos (RP). En las entradas espejo debe evaluarse si el residuo presenta características de peligrosidad HP1 a HP15 conforme al Reglamento (UE) 1357/2014.',
  },
];

async function generateDocumentEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    EMBEDDING_MODEL
  )}:embedContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini embedContent falló (${res.status}): ${await res.text()}`);
  }

  const json = await res.json();
  return json.embedding.values;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const docIds = new Map();

  for (const doc of DOCUMENTS) {
    const { data, error } = await supabase
      .from('legal_documents')
      .upsert(doc, { onConflict: 'code' })
      .select('id, code')
      .single();

    if (error) {
      throw new Error(`Error al insertar documento ${doc.code}: ${error.message}`);
    }
    docIds.set(data.code, data.id);
    console.log(`✓ Documento listo: ${data.code} (id=${data.id})`);
  }

  for (const chunk of CHUNKS) {
    const documentId = docIds.get(chunk.document_code);
    const fullText = `[${chunk.article_ref} — ${chunk.section_title}]\n${chunk.content}`;
    const embedding = await generateDocumentEmbedding(fullText);

    const { error } = await supabase.from('legal_chunks').upsert(
      {
        document_id: documentId,
        article_ref: chunk.article_ref,
        section_title: chunk.section_title,
        content: chunk.content,
        embedding: `[${embedding.join(',')}]`,
      },
      { onConflict: 'document_id,article_ref' }
    );

    if (error) {
      throw new Error(`Error al insertar chunk ${chunk.article_ref}: ${error.message}`);
    }
    console.log(`  ✓ Indexado: ${chunk.article_ref}`);
  }

  console.log('\nIngesta completada correctamente.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
