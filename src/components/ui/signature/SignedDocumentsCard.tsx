'use client';

import React, { useState } from 'react';
import { ShieldCheck, Download, FileSignature } from 'lucide-react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { toast } from '@/context/ToastContext';
import pdfSignatureService from '@/services/pdfSignatureService';
import type { SignedDocumentRecord } from '@/lib/validations/digitalSignature';

interface SignedDocumentsCardProps {
  documents: SignedDocumentRecord[];
  loading?: boolean;
  onOpenAutoFirma: (coSignBase?: SignedDocumentRecord | null) => void;
}

export const SignedDocumentsCard: React.FC<SignedDocumentsCardProps> = ({
  documents,
  loading = false,
  onOpenAutoFirma,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const latest = documents[0] ?? null;

  const handleDownload = async (doc: SignedDocumentRecord) => {
    try {
      setDownloadingId(doc.id);
      await pdfSignatureService.downloadSignedDocument(doc.id, doc.file_name);
      toast.success('PDF firmado custodiado descargado con éxito.');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Error al descargar el documento firmado.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ComponentCard
      title="Firma Electrónica con Certificado Digital (AutoFirma / PAdES)"
      desc="Complementa la firma manuscrita con firma criptográfica oficial (FNMT, Camerfirma o DNIe) verificable en Adobe Acrobat y VALIDe."
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {latest ? 'Documento firmado electrónicamente' : 'Pendiente de firma con certificado digital'}
                </span>
                {latest && (
                  <Badge color="success" size="sm">
                    {latest.signature_level} · {latest.signature_count} firma
                    {latest.signature_count > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {latest
                  ? `Última firma por ${latest.signer_cn}${latest.signer_nif ? ` (${latest.signer_nif})` : ''} el ${new Date(latest.signed_at).toLocaleString('es-ES')}.`
                  : 'Firma localmente con AutoFirma sin subir tu certificado al servidor. El PDF firmado queda custodiado de forma inmutable.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {latest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(latest)}
                disabled={downloadingId === latest.id}
              >
                <Download className="w-4 h-4 mr-1.5" />
                {downloadingId === latest.id ? 'Descargando...' : 'Descargar PDF Firmado'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onOpenAutoFirma(latest)}
            >
              <FileSignature className="w-4 h-4 mr-1.5" />
              {latest ? 'Añadir Co-firma (AutoFirma)' : 'Firmar con AutoFirma'}
            </Button>
          </div>
        </div>

        {!loading && documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Custodia inmutable de versiones firmadas ({documents.length})
            </h4>
            <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-white dark:bg-gray-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        {doc.signer_cn}
                      </span>
                      {doc.signer_nif && (
                        <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                          {doc.signer_nif}
                        </span>
                      )}
                      <Badge color="light" size="sm">
                        {doc.signature_level} ({doc.signature_count} firma{doc.signature_count > 1 ? 's' : ''})
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Emisor: {doc.issuer_cn} · {new Date(doc.signed_at).toLocaleString('es-ES')} · SHA-256:{' '}
                      <span className="font-mono">{doc.sha256_hash.slice(0, 16)}…</span>
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="shrink-0"
                  >
                    {downloadingId === doc.id ? 'Descargando...' : 'Descargar'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ComponentCard>
  );
};

export default SignedDocumentsCard;

