'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck2, Download, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Alert from '@/components/ui/alert/Alert';
import {
  AUTOFIRMA_DOWNLOAD_URL,
  AutoFirmaError,
} from '@/lib/signature/autoFirmaClient';
import pdfSignatureService from '@/services/pdfSignatureService';
import type {
  SignedDocumentRecord,
  SignedEntityType,
} from '@/lib/validations/digitalSignature';

export interface AutoFirmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: SignedEntityType;
  entityId: string | number;
  entityVersion?: number;
  documentLabel: string;
  defaultFileName: string;
  /** Genera el PDF base (ArrayBuffer) si es la primera firma. */
  generateBasePdfBuffer: () => Promise<ArrayBuffer>;
  /** Si existe un PDF firmado previo, permite co-firmarlo incrementalmente. */
  existingSignedDoc?: SignedDocumentRecord | null;
  onSignedSuccess?: (record: SignedDocumentRecord) => void | Promise<void>;
}

type ModalStep = 'ready' | 'signing' | 'success';

export const AutoFirmaModal: React.FC<AutoFirmaModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityVersion = 1,
  documentLabel,
  defaultFileName,
  generateBasePdfBuffer,
  existingSignedDoc = null,
  onSignedSuccess,
}) => {
  const [step, setStep] = useState<ModalStep>('ready');
  const [includeVisualStamp, setIncludeVisualStamp] = useState(true);
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AutoFirmaError['code'] | null>(null);
  const [signedRecord, setSignedRecord] = useState<SignedDocumentRecord | null>(null);
  const [downloading, setDownloading] = useState(false);

  const isCoSign = Boolean(existingSignedDoc);

  useEffect(() => {
    if (isOpen) {
      setStep('ready');
      setErrorMessage(null);
      setErrorCode(null);
      setSignedRecord(null);
      setStatusMessage('');
      setReason(
        entityType === 'contract'
          ? 'Firma de Contrato de Tratamiento de Residuos (RD 553/2020)'
          : 'Firma de Documento de Identificación de Traslado (RD 553/2020)'
      );
    }
  }, [isOpen, entityType]);

  const handleStartSign = async () => {
    try {
      setStep('signing');
      setErrorMessage(null);
      setErrorCode(null);

      let pdfBuffer: ArrayBuffer;
      if (isCoSign && existingSignedDoc) {
        setStatusMessage('Recuperando el PDF firmado custodiado para añadir co-firma...');
        pdfBuffer = await pdfSignatureService.fetchSignedPdfArrayBuffer(existingSignedDoc.id);
      } else {
        setStatusMessage('Generando PDF oficial determinista...');
        pdfBuffer = await generateBasePdfBuffer();
      }

      setStatusMessage(
        'Esperando a AutoFirma... Acepta abrir la aplicación en tu navegador y selecciona tu certificado digital.'
      );

      const fileName = defaultFileName.toLowerCase().endsWith('.pdf')
        ? defaultFileName.replace(/\.pdf$/i, '_firmado.pdf')
        : `${defaultFileName}_firmado.pdf`;

      const { record } = await pdfSignatureService.signAndStoreWithAutoFirma({
        pdfBuffer,
        entityType,
        entityId,
        entityVersion,
        fileName,
        options: {
          includeVisualStamp,
          reason: reason.trim() || undefined,
          location: location.trim() || undefined,
          isCoSign,
          signatureSlotIndex: existingSignedDoc ? existingSignedDoc.signature_count : 0,
        },
      });

      setSignedRecord(record);
      setStep('success');
      if (onSignedSuccess) {
        await onSignedSuccess(record);
      }
    } catch (err) {
      setStep('ready');
      if (err instanceof AutoFirmaError) {
        setErrorCode(err.code);
        setErrorMessage(err.message);
      } else {
        setErrorCode('UNKNOWN');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'No se pudo completar la firma electrónica con AutoFirma.'
        );
      }
    }
  };

  const handleDownloadSigned = async () => {
    if (!signedRecord) return;
    try {
      setDownloading(true);
      await pdfSignatureService.downloadSignedDocument(
        signedRecord.id,
        signedRecord.file_name
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al descargar el PDF firmado.'
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={step === 'signing' ? () => {} : onClose} className="max-w-xl">
      <div className="p-6 space-y-5">
        {/* Cabecera */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isCoSign
                ? 'Añadir Co-firma Electrónica (AutoFirma)'
                : 'Firmar PDF con Certificado Digital (AutoFirma)'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {documentLabel} · Formato PAdES-BES verificable en Adobe Acrobat y VALIDe.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="space-y-2">
            <Alert variant="error" title="No se pudo completar la firma" message={errorMessage} />
            {(errorCode === 'NOT_INSTALLED' || errorCode === 'SCRIPT_LOAD') && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  ¿No tienes AutoFirma instalado en este equipo?
                </p>
                <p>
                  Descarga e instala gratuitamente la aplicación oficial del Gobierno de España y vuelve a intentarlo:
                </p>
                <a
                  href={AUTOFIRMA_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline hover:opacity-80"
                >
                  Descargar AutoFirma oficial (firmaelectronica.gob.es)
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* PASO 1: PREPARACIÓN */}
        {step === 'ready' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p>
                <strong>Seguridad garantizada:</strong> tu certificado digital (FNMT, Camerfirma o DNIe) nunca sale de tu ordenador. AutoFirma firma localmente y ResiGest 360 verifica y custodia el PDF resultante.
              </p>
              {isCoSign && existingSignedDoc && (
                <p className="text-emerald-700 dark:text-emerald-300 font-medium pt-1">
                  Se aplicará una co-firma incremental sobre el documento ya firmado por{' '}
                  {existingSignedDoc.signer_cn} ({existingSignedDoc.signature_count} firma
                  {existingSignedDoc.signature_count > 1 ? 's' : ''} previa
                  {existingSignedDoc.signature_count > 1 ? 's' : ''}).
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de la firma (opcional)
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Conformidad de contrato de tratamiento"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación (opcional)
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Sevilla, España"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeVisualStamp}
                  onChange={(e) => setIncludeVisualStamp(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Estampar sello visual discreto</strong> en la última página del PDF (titular y fecha de firma). Si lo desactivas, la firma será invisible y verificable en el panel de firmas de Acrobat/VALIDe.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
              <a
                href={AUTOFIRMA_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400 inline-flex items-center gap-1"
              >
                Descargar AutoFirma
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleStartSign}>
                  {isCoSign ? 'Co-firmar con AutoFirma' : 'Firmar con AutoFirma'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: FIRMANDO */}
        {step === 'signing' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
            <div className="space-y-1 max-w-md">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Proceso de firma en curso
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{statusMessage}</p>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Si tu navegador muestra un aviso para abrir &quot;AutoFirma&quot;, pulsa Permitir.
            </p>
          </div>
        )}

        {/* PASO 3: ÉXITO */}
        {step === 'success' && signedRecord && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                <FileCheck2 className="w-5 h-5" />
                <span>Documento firmado y custodiado correctamente ({signedRecord.signature_level})</span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div>
                  <dt className="opacity-70">Titular certificado</dt>
                  <dd className="font-semibold">{signedRecord.signer_cn}</dd>
                </div>
                {signedRecord.signer_nif && (
                  <div>
                    <dt className="opacity-70">NIF / CIF</dt>
                    <dd className="font-mono font-semibold">{signedRecord.signer_nif}</dd>
                  </div>
                )}
                <div>
                  <dt className="opacity-70">Entidad emisora</dt>
                  <dd className="font-medium">{signedRecord.issuer_cn}</dd>
                </div>
                <div>
                  <dt className="opacity-70">Firmas en el PDF</dt>
                  <dd className="font-semibold">{signedRecord.signature_count}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="opacity-70">Huella SHA-256 (custodia inmutable)</dt>
                  <dd className="font-mono text-[11px] break-all">{signedRecord.sha256_hash}</dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={handleDownloadSigned} disabled={downloading}>
                <Download className="w-4 h-4 mr-1.5" />
                {downloading ? 'Descargando...' : 'Descargar PDF Firmado'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AutoFirmaModal;

