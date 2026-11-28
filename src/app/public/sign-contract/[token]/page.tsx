'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ShieldCheck, PenTool, Download, ExternalLink, Loader2 } from 'lucide-react';
import wasteContractService from '@/services/wasteContractService';
import type { WasteContract } from '@/types/wasteManagement';
import SignaturePad from '@/components/ui/signature/SignaturePad';
import Alert from '@/components/ui/alert/Alert';
import ComponentCard from '@/components/common/ComponentCard';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { generateContractPDF } from '@/lib/pdfUtils';
import type { JsPDFWithSignatureBoxes } from '@/lib/pdf/pdfComponents';
import {
    AUTOFIRMA_DOWNLOAD_URL,
    AutoFirmaError,
    arrayBufferToBase64,
    base64ToPdfBlob,
    computeSha256Hex,
    signPdfWithAutoFirma,
} from '@/lib/signature/autoFirmaClient';

interface PublicSignedDocSummary {
    id: string;
    file_name: string;
    sha256_hash: string;
    signature_level: string;
    signature_count: number;
    signer_cn: string;
    signer_nif?: string | null;
    issuer_cn: string;
    signed_at: string;
}

function PublicSignatureContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const token = params?.token as string;
    const roleParam = searchParams?.get('role') as 'productor' | 'gestor' | null;

    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState<WasteContract | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [signError, setSignError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'productor' | 'gestor'>('productor');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [signatureMethod, setSignatureMethod] = useState<'graphic' | 'digital'>('graphic');
    const [digitalSignEnabled, setDigitalSignEnabled] = useState(false);
    const [latestPadesDoc, setLatestPadesDoc] = useState<PublicSignedDocSummary | null>(null);
    const [digitalSigning, setDigitalSigning] = useState(false);
    const [digitalError, setDigitalError] = useState<string | null>(null);
    const [digitalErrorCode, setDigitalErrorCode] = useState<AutoFirmaError['code'] | null>(null);
    const [includeVisualStamp, setIncludeVisualStamp] = useState(true);
    const [downloadingPublicPdf, setDownloadingPublicPdf] = useState(false);

    useEffect(() => {
        if (token) {
            loadContract();
        }
    }, [token]);

    const loadContract = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await wasteContractService.getBySigningToken(token);
            if (!data) {
                setError('El enlace de firma es inválido o el contrato ya no está disponible.');
                return;
            }
            setContract(data);

            // RES6-I06: Determinar el rol disponible según estado de firmas del contrato
            if (data) {
                    if ((data.firmado_productor || Boolean(data.firma_productor_url)) && !(data.firmado_gestor || Boolean(data.firma_gestor_url))) {
                        setSelectedRole('gestor');
                    } else if ((data.firmado_gestor || Boolean(data.firma_gestor_url)) && !(data.firmado_productor || Boolean(data.firma_productor_url))) {
                        setSelectedRole('productor');
                    } else if (roleParam === 'productor' || roleParam === 'gestor') {
                        setSelectedRole(roleParam);
                    }
                }

                // Consultar si la empresa tiene habilitada la firma digital (AutoFirma / PAdES)
                try {
                    const padesRes = await fetch(
                        `/api/public/sign-contract-pades?token=${encodeURIComponent(token)}`
                    );
                    if (padesRes.ok) {
                        const padesData = await padesRes.json();
                        setDigitalSignEnabled(Boolean(padesData.enabled));
                        setLatestPadesDoc(padesData.latestSignedDocument ?? null);
                    }
                } catch {
                    setDigitalSignEnabled(false);
                }
            } catch {
                setError('El enlace de firma es inválido o el contrato ya no está disponible.');
            } finally {
                setLoading(false);
            }
        };

        // Evaluar si ambas partes ya formalizaron el contrato
        const isFullySigned = useMemo(() => {
            if (!contract) return false;
            const prodSigned = Boolean(contract.firmado_productor || contract.firma_productor_url);
            const gestSigned = Boolean(contract.firmado_gestor || contract.firma_gestor_url);
            return prodSigned && gestSigned;
        }, [contract]);

        // Evaluar si el rol predeterminado ya firmó
        const isRoleAlreadySigned = useMemo(() => {
            if (!contract) return false;
            if (selectedRole === 'productor' && (contract.firmado_productor || Boolean(contract.firma_productor_url))) return true;
            if (selectedRole === 'gestor' && (contract.firmado_gestor || Boolean(contract.firma_gestor_url))) return true;
            return false;
        }, [contract, selectedRole]);

        const handleDownloadPublicContractPDF = async () => {
            if (!contract) return;
            try {
                setDownloadingPublicPdf(true);
                const pdfDoc = await generateContractPDF(contract);
                pdfDoc.save(`contrato_${contract.numero_contrato || contract.id}.pdf`);
            } catch {
                setSignError('No se pudo generar la descarga del PDF del contrato.');
            } finally {
                setDownloadingPublicPdf(false);
            }
        };

        const handleSaveSignature = async (signatureBase64: string) => {
            if (!token || !termsAccepted) return;
            try {
                setLoading(true);
                setSignError(null);
                const updated = await wasteContractService.signContractByToken(token, signatureBase64, selectedRole);
                if (updated) {
                    setContract((prev) => (prev ? { ...prev, ...updated } : updated));
                }
                setSuccess(true);
            } catch (err: any) {
                setSignError(`Error al guardar la firma: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        const handleDigitalSignWithAutoFirma = async () => {
            if (!token || !contract || !termsAccepted || isRoleAlreadySigned) return;
            try {
                setDigitalSigning(true);
                setDigitalError(null);
                setDigitalErrorCode(null);

                const nowIso = new Date().toISOString();
                const previewContract: WasteContract =
                    selectedRole === 'productor'
                        ? {
                            ...contract,
                            firmado_productor: true,
                            fecha_firma_productor: contract.fecha_firma_productor || nowIso,
                            estado: contract.firmado_gestor ? 'vigente' : contract.estado,
                        }
                        : {
                            ...contract,
                            firmado_gestor: true,
                            fecha_firma_gestor: contract.fecha_firma_gestor || nowIso,
                            estado: contract.firmado_productor ? 'vigente' : contract.estado,
                        };

                const pdfDoc = (await generateContractPDF(previewContract, undefined, {
                    padesMode: true,
                })) as JsPDFWithSignatureBoxes;
                const matchedBox = pdfDoc.__signatureBoxes?.find((b) => b.roleKey === selectedRole);

                // Comprobar siempre en servidor el estado más reciente para no perder una firma PAdES previa
                let activeLatestDoc = latestPadesDoc;
                if (!activeLatestDoc) {
                    const checkRes = await fetch(
                        `/api/public/sign-contract-pades?token=${encodeURIComponent(token)}`
                    ).catch(() => null);
                    if (checkRes?.ok) {
                        const checkData = await checkRes.json().catch(() => ({}));
                        activeLatestDoc = checkData.latestSignedDocument ?? null;
                    }
                }

                let pdfBuffer: ArrayBuffer;
                if (activeLatestDoc) {
                    const prevRes = await fetch(
                        `/api/public/sign-contract-pades?token=${encodeURIComponent(token)}&download=1`
                    );
                    if (!prevRes.ok) {
                        throw new Error('No se pudo recuperar el PDF firmado previo para co-firma.');
                    }
                    pdfBuffer = await prevRes.arrayBuffer();
                } else {
                    pdfBuffer = pdfDoc.output('arraybuffer');
                }

                const [pdfBase64, originalSha256Hash] = await Promise.all([
                    Promise.resolve(arrayBufferToBase64(pdfBuffer)),
                    computeSha256Hex(pdfBuffer),
                ]);

                const signedBase64 = await signPdfWithAutoFirma(pdfBase64, {
                    includeVisualStamp,
                    stampBox: matchedBox
                        ? {
                            page: matchedBox.page,
                            llx: matchedBox.llx,
                            lly: matchedBox.lly,
                            urx: matchedBox.urx,
                            ury: matchedBox.ury,
                        }
                        : undefined,
                    reason: `Firma de Contrato de Tratamiento (${selectedRole.toUpperCase()}) - RD 553/2020`,
                    isCoSign: Boolean(activeLatestDoc),
                    signatureSlotIndex: activeLatestDoc ? activeLatestDoc.signature_count : 0,
                });

                const signedBlob = base64ToPdfBlob(signedBase64);
                const fileName = `contrato_${contract.numero_contrato || contract.id}_firmado.pdf`;
                const formData = new FormData();
                formData.append('token', token);
                formData.append('role', selectedRole);
                formData.append('file', signedBlob, fileName);
                formData.append('fileName', fileName);
                if (originalSha256Hash) {
                    formData.append('originalSha256Hash', originalSha256Hash);
                }

                const uploadRes = await fetch('/api/public/sign-contract-pades', {
                    method: 'POST',
                    body: formData,
                });
                const payload = await uploadRes.json().catch(() => ({}));
                if (!uploadRes.ok) {
                    throw new Error(payload.error || 'No se pudo verificar y registrar la firma digital.');
                }

                setLatestPadesDoc(payload.document ?? null);
                setSuccess(true);
            } catch (err) {
                if (err instanceof AutoFirmaError) {
                    setDigitalErrorCode(err.code);
                    setDigitalError(err.message);
                } else {
                    setDigitalErrorCode('UNKNOWN');
                    setDigitalError(
                        err instanceof Error ? err.message : 'Error inesperado al firmar con AutoFirma.'
                    );
                }
            } finally {
                setDigitalSigning(false);
            }
        };

        if (loading && !contract) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-gray-500">Cargando contrato...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full">
                        <Alert variant="error" title="Enlace Inválido" message={error} />
                    </div>
                </div>
            );
        }

        if (success) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Firma Formalizada!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            Su firma electrónica ha sido vinculada legalmente al contrato #{contract?.numero_contrato || contract?.id}.
                        </p>
                            {
                                latestPadesDoc?(
                        <div className = "mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-left text-xs space-y-1.5" >
                            <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                                Custodia PAdES verificada ({latestPadesDoc.signature_level})
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-200">
                                Titular: <strong>{latestPadesDoc.signer_cn}</strong>
                                {latestPadesDoc.signer_nif ? ` (${latestPadesDoc.signer_nif})` : ''}
                            </p>
                            <a
                                href={`/api/public/sign-contract-pades?token=${encodeURIComponent(token)}&download=1`}
                                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Descargar copia del PDF firmado
                            </a>
                        </div>
                    ) : (
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPublicContractPDF}
                            disabled={downloadingPublicPdf}
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            {downloadingPublicPdf ? 'Generando PDF...' : 'Descargar Copia del Contrato (PDF)'}
                        </Button>
                    </div>
                    )}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                        <p className="text-xs text-gray-400 italic">
                            RESIGEST 360 - Plataforma de Trazabilidad y Gestión Ambiental RD 553/2020
                        </p>
                    </div>
                </div>
            </div >
        );
}

if (!contract) return null;

const snapshot = contract.metadata_snapshot;
const productorData = snapshot?.company || contract.company;
const gestorData = snapshot?.gestor_company || contract.treatment_manager || contract.gestor_company;
const wasteList = contract.contract_waste_codes || [];
const simpleLers = contract.codigos_ler || [];

return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Logo/Title */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                    Contrato Oficial de Tratamiento de Residuos (Art. 5 RD 553/2020)
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Formalización y Firma Digital
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Revise exhaustivamente los términos, matriz de residuos y condiciones legales antes de rubricar el documento.
                </p>
            </div>

            {/* Si ya está completamente firmado por ambas partes */}
            {isFullySigned ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-3">
                    <Badge color="success" size="md">✓ Contrato Formalizado y Vigente</Badge>
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                        Este contrato ya ha sido firmado formalmente por ambas partes
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-xl mx-auto">
                        Tanto el Productor como el Gestor Destinatario han suscrito electrónicamente el presente contrato.
                        El documento goza de plena validez jurídica según la Ley 6/2020 y el RD 553/2020.
                    </p>
                    {latestPadesDoc && (
                        <div className="pt-2">
                            <a
                                href={`/api/public/sign-contract-pades?token=${encodeURIComponent(token)}&download=1`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                            >
                                <Download className="w-4 h-4" />
                                Descargar PDF Firmado Digitalmente ({latestPadesDoc.signature_level})
                            </a>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Resumen General y Partes Intervinientes */}
            <ComponentCard title="1. Partes Intervinientes">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Productor */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold uppercase tracking-wider text-muted">Productor / Remitente</span>
                            {contract.firmado_productor ? (
                                <Badge color="success">✓ Firmado</Badge>
                            ) : (
                                <Badge color="light">Pendiente de firma</Badge>
                            )}
                        </div>
                        <p className="text-sm font-bold text-foreground">{productorData?.razon_social || 'No especificado'}</p>
                        <p><span className="text-muted font-semibold">NIF/CIF:</span> <span className="font-mono">{productorData?.cif || '-'}</span></p>
                        {snapshot?.producer_center?.nima && (
                            <p><span className="text-muted font-semibold">NIMA Productor:</span> <span className="font-mono">{snapshot.producer_center.nima}</span></p>
                        )}
                        <p className="text-muted pt-1 border-t border-gray-100 dark:border-gray-800">
                            {snapshot?.producer_center?.direccion || (productorData as any)?.direccion || (productorData as any)?.domicilio_social || '-'}
                        </p>
                    </div>

                    {/* Gestor */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold uppercase tracking-wider text-muted">Gestor Destinatario</span>
                            {contract.firmado_gestor ? (
                                <Badge color="success">✓ Firmado</Badge>
                            ) : (
                                <Badge color="light">Pendiente de firma</Badge>
                            )}
                        </div>
                        <p className="text-sm font-bold text-foreground">{gestorData?.razon_social || 'No especificado'}</p>
                        <p><span className="text-muted font-semibold">NIF/CIF:</span> <span className="font-mono">{gestorData?.cif || '-'}</span></p>
                        {(gestorData as any)?.numero_autorizacion && (
                            <p><span className="text-muted font-semibold">Autorización Ambiental:</span> <span className="font-mono">{(gestorData as any).numero_autorizacion}</span></p>
                        )}
                        {snapshot?.gestor_center?.nima && (
                            <p><span className="text-muted font-semibold">NIMA Instalación:</span> <span className="font-mono">{snapshot.gestor_center.nima}</span></p>
                        )}
                        <p className="text-muted pt-1 border-t border-gray-100 dark:border-gray-800">
                            {snapshot?.gestor_center?.direccion || (gestorData as any)?.direccion || (gestorData as any)?.domicilio_social || '-'}
                        </p>
                    </div>
                </div>
            </ComponentCard>

            {/* 2. Vigencia y Matriz de Residuos */}
            <ComponentCard title="2. Vigencia y Residuos Objeto del Contrato">
                <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="text-muted font-semibold block">Número Contrato:</span>
                                <span className="font-mono font-bold text-sm text-foreground">{contract.numero_contrato || `#${contract.id}`}</span>
                            </div>
                            <div>
                                <span className="text-muted font-semibold block">Tipo Servicio:</span>
                                <span className="font-medium text-foreground capitalize">{contract.tipo_contrato}</span>
                            </div>
                            <div>
                                <span className="text-muted font-semibold block">Fecha Inicio:</span>
                                <span className="font-medium text-foreground">{contract.fecha_inicio ? new Date(contract.fecha_inicio).toLocaleDateString('es-ES') : 'Inmediata'}</span>
                            </div>
                            <div>
                                <span className="text-muted font-semibold block">Fecha Finalización:</span>
                                <span className="font-medium text-foreground">{contract.fecha_fin ? new Date(contract.fecha_fin).toLocaleDateString('es-ES') : 'Indefinida'}</span>
                            </div>
                            <div>
                                <span className="text-muted font-semibold block">Cantidad Estimada / Máx.:</span>
                                <span className="font-medium text-foreground">
                                    {contract.cantidad_maxima_anual
                                        ? `${contract.cantidad_maxima_anual} ${contract.unidad_cantidad || 'toneladas'}/año`
                                        : 'Según matriz LER'}
                                </span>
                            </div>
                        </div>

                        {/* Matriz de LER */}
                        {wasteList.length > 0 ? (
                            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-muted uppercase">
                                        <tr>
                                            <th className="px-3 py-2">Código LER</th>
                                            <th className="px-3 py-2">Descripción</th>
                                            <th className="px-3 py-2">Operación R/D</th>
                                            <th className="px-3 py-2">Cantidad Estimada</th>
                                            <th className="px-3 py-2">Tarifa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {wasteList.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                                <td className="px-3 py-2 font-mono font-bold text-foreground">{item.codigo_ler}</td>
                                                <td className="px-3 py-2 text-muted">{item.descripcion_ler || contract.descripcion_residuos || '-'}</td>
                                                <td className="px-3 py-2 font-mono font-bold text-primary">{item.operacion_tratamiento || contract.operaciones_tratamiento?.[0] || 'R/D'}</td>
                                                <td className="px-3 py-2 text-foreground">
                                                    {item.cantidad_estimada_anual
                                                        ? `${item.cantidad_estimada_anual} t/año`
                                                        : contract.cantidad_maxima_anual
                                                            ? `${contract.cantidad_maxima_anual} ${contract.unidad_cantidad || 't'}/año`
                                                            : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-foreground">
                                                    {item.tarifa_gestion
                                                        ? `${item.tarifa_gestion} €/t`
                                                        : contract.precio_unitario
                                                            ? `${contract.precio_unitario} ${contract.moneda || 'EUR'}`
                                                            : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : simpleLers.length > 0 ? (
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-muted">Códigos LER contratados:</span>
                                            {simpleLers.map((ler, i) => (
                                                <span key={i} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-mono font-bold text-xs border border-gray-300 dark:border-gray-700">
                                                    {ler}
                                                </span>
                                            ))}
                                        </div>
                                        {contract.operaciones_tratamiento && contract.operaciones_tratamiento.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-muted">Operaciones de tratamiento (R/D):</span>
                                                {contract.operaciones_tratamiento.map((op, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                                                        {op}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {contract.descripcion_residuos && (
                                            <p className="text-muted">{contract.descripcion_residuos}</p>
                                        )}
                                    </div>
                                    ) : (
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl space-y-1.5">
                                        <p className="text-foreground">{contract.descripcion_residuos || 'Residuos según autorizaciones vigentes de las partes.'}</p>
                                        {contract.operaciones_tratamiento && contract.operaciones_tratamiento.length > 0 && (
                                            <p className="text-muted">
                                                <strong>Operaciones R/D previstas:</strong> {contract.operaciones_tratamiento.join(', ')}
                                            </p>
                                        )}
                                    </div>
                        )}
                                </div>
                            </ComponentCard>

                {/* 3. Cláusulas y Condiciones Legales RD 553/2020 */}
                        <ComponentCard title="3. Cláusulas Contractuales y Régimen de Aceptación/Rechazo (RD 553/2020)">
                            <div className="space-y-4 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                                <div>
                                    <h4 className="font-bold text-foreground uppercase tracking-wide mb-1">
                                        Cláusula 1ª. Objeto y Alcance del Tratamiento
                                    </h4>
                                    <p>
                                        El presente contrato regula las condiciones bajo las cuales el Productor/Poseedor entrega y el Gestor asume la gestión y tratamiento de los residuos especificados en la Cláusula 2ª, conforme al régimen legal establecido en la Ley 7/2022 de residuos y suelos contaminados para una economía circular y el Real Decreto 553/2020.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-foreground uppercase tracking-wide mb-1">
                                        Cláusula 2ª. Condiciones de Entrega, Pesaje y Aceptación
                                    </h4>
                                    <p>
                                        Todo traslado de residuos al amparo de este contrato deberá ir acompañado del correspondiente Documento de Identificación (DI). El Gestor verificará a la entrada en báscula la adecuación cuantitativa y cualitativa del residuo, su codificación LER y la ausencia de impropios no autorizados.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-foreground uppercase tracking-wide mb-1">
                                        Cláusula 3ª. Régimen y Obligaciones en caso de Rechazo (Art. 5.h y Arts. 6 y 7 RD 553/2020)
                                    </h4>
                                    <p>
                                        En caso de no conformidad o discrepancia sustancial que impida la recepción, el Gestor notificará motivadamente el rechazo (total o parcial) en un plazo máximo de 30 días naturales desde la llegada a sus instalaciones. En caso de rechazo, el residuo será devuelto a la instalación de origen o reenviado a otra instalación debidamente autorizada a costa del operador del traslado, formalizando la trazabilidad documental correspondiente.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-foreground uppercase tracking-wide mb-1">
                                        Cláusula 4ª. Trazabilidad Telemática y Validez Jurídica
                                    </h4>
                                    <p>
                                        Ambas partes consienten expresamente la formalización electrónica del contrato y el intercambio telemático de los documentos de traslado (e3l/SIRA u homólogos autonómicos), reconociendo plenos efectos jurídicos al presente documento suscrito mediante firma electrónica de conformidad con la Ley 6/2020.
                                    </p>
                                </div>

                                {contract.notas && (
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-foreground uppercase tracking-wide mb-1">
                                            Estipulaciones Específicas / Notas
                                        </h4>
                                        <p className="italic">{contract.notas}</p>
                                    </div>
                                )}
                            </div>
                        </ComponentCard>

                        {/* 4. Selección/Confirmación de Rol y Firma */}
                        {!isFullySigned && (
                            <ComponentCard title="4. Confirmación de Identidad y Firma Electrónica">
                                <div className="space-y-6">
                                    {/* Verificación del rol del firmante */}
                                    {contract.firmado_productor && !contract.firmado_gestor ? (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-500/30 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                                            <p className="font-bold">Firmando como: GESTOR DESTINATARIO</p>
                                            <p className="opacity-80">El Productor ya formalizó su firma el {contract.fecha_firma_productor ? new Date(contract.fecha_firma_productor).toLocaleDateString('es-ES') : ''}. Su firma cerrará y dejará vigente el contrato.</p>
                                        </div>
                                    ) : contract.firmado_gestor && !contract.firmado_productor ? (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-500/30 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                                            <p className="font-bold">Firmando como: PRODUCTOR / REMITENTE</p>
                                            <p className="opacity-80">El Gestor ya formalizó su firma el {contract.fecha_firma_gestor ? new Date(contract.fecha_firma_gestor).toLocaleDateString('es-ES') : ''}. Su firma cerrará y dejará vigente el contrato.</p>
                                        </div>
                                    ) : roleParam ? (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-500/30 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                                            <p className="font-bold">Firmando como: {selectedRole === 'productor' ? 'PRODUCTOR / CLIENTE' : 'GESTOR DESTINATARIO'}</p>
                                            <p className="opacity-80">Enlace asignado específicamente para la parte {selectedRole}.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                                                Seleccione en calidad de qué parte suscribe este contrato:
                                            </p>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRole('productor')}
                                                    disabled={Boolean(contract.firmado_productor)}
                                                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${selectedRole === 'productor'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="font-bold text-sm">Productor / Remitente</div>
                                                    <div className="text-[11px] mt-0.5 opacity-80">{productorData?.razon_social}</div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRole('gestor')}
                                                    disabled={Boolean(contract.firmado_gestor)}
                                                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${selectedRole === 'gestor'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="font-bold text-sm">Gestor Destinatario</div>
                                                    <div className="text-[11px] mt-0.5 opacity-80">{gestorData?.razon_social}</div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {isRoleAlreadySigned ? (
                                        <Alert
                                            variant="warning"
                                            title="Firma Ya Registrada"
                                            message={`La parte ${selectedRole === 'productor' ? 'Productor' : 'Gestor'} ya ha formalizado su firma en este contrato y no puede sobrescribirse.`}
                                        />
                                    ) : (
                                        <>
                                            {/* Checkbox obligatorio de aceptación previa de cláusulas */}
                                            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="accept-terms-checkbox"
                                                    checked={termsAccepted}
                                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                                <label htmlFor="accept-terms-checkbox" className="text-xs text-foreground cursor-pointer font-medium leading-relaxed">
                                                    He leído, comprendido y acepto íntegramente las cláusulas contractuales, las especificaciones de los residuos con sus códigos LER y las condiciones de aceptación y rechazo del traslado establecidas en este contrato de conformidad con el RD 553/2020.
                                                </label>
                                            </div>

                                            {/* Selector de método de firma (solo si la empresa habilitó firma electrónica) */}
                                            <div className={`space-y-4 transition-opacity ${termsAccepted ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                                {digitalSignEnabled && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSignatureMethod('graphic')}
                                                            className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${signatureMethod === 'graphic'
                                                                    ? 'border-primary bg-primary/5 text-primary'
                                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <PenTool className="w-5 h-5 shrink-0 mt-0.5" />
                                                            <div>
                                                                <div className="font-bold text-sm">Firma Gráfica (Manuscrita)</div>
                                                                <div className="text-[11px] opacity-80">Rúbrica en pantalla (móvil, tablet o PC)</div>
                                                            </div>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setSignatureMethod('digital')}
                                                            className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${signatureMethod === 'digital'
                                                                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                                                            <div>
                                                                <div className="font-bold text-sm">Certificado Digital (AutoFirma)</div>
                                                                <div className="text-[11px] opacity-80">Firma oficial PAdES con FNMT o DNIe</div>
                                                            </div>
                                                        </button>
                                                    </div>
                                                )}

                                                {(!digitalSignEnabled || signatureMethod === 'graphic') && (
                                                    <div>
                                                        {signError && (
                                                            <div className="mb-4">
                                                                <Alert variant="error" title="No se pudo registrar la firma" message={signError} />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-bold text-foreground">
                                                                Dibuje su firma manuscrita en el recuadro inferior:
                                                            </h4>
                                                            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                                                                Firma electrónica Ley 6/2020
                                                            </span>
                                                        </div>

                                                        <div className="p-2 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900">
                                                            <SignaturePad
                                                                onSave={handleSaveSignature}
                                                                height={240}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {digitalSignEnabled && signatureMethod === 'digital' && (
                                                    <div className="p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-4">
                                                        <div className="space-y-1">
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                                {latestPadesDoc
                                                                    ? 'Co-firma con Certificado Digital (AutoFirma)'
                                                                    : 'Firma con Certificado Digital (AutoFirma)'}
                                                            </h4>
                                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                                Tu certificado digital nunca sale de tu ordenador. AutoFirma firmará el PDF localmente y ResiGest verificará y custodiará la firma PAdES.
                                                            </p>
                                                        </div>

                                                        {digitalError && (
                                                            <div className="space-y-2">
                                                                <Alert variant="error" title="Error en firma digital" message={digitalError} />
                                                                {(digitalErrorCode === 'NOT_INSTALLED' || digitalErrorCode === 'SCRIPT_LOAD') && (
                                                                    <a
                                                                        href={AUTOFIRMA_DOWNLOAD_URL}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 underline"
                                                                    >
                                                                        Descargar AutoFirma oficial (firmaelectronica.gob.es)
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                        <label className="flex items-start gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={includeVisualStamp}
                                                                onChange={(e) => setIncludeVisualStamp(e.target.checked)}
                                                                className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                            />
                                                            <span className="text-xs text-gray-700 dark:text-gray-300">
                                                                Estampar sello visual con titular y fecha dentro del recuadro de {selectedRole === 'productor' ? 'Productor' : 'Gestor Autorizado'}.
                                                            </span>
                                                        </label>

                                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                                            <a
                                                                href={AUTOFIRMA_DOWNLOAD_URL}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-gray-500 hover:text-emerald-600 inline-flex items-center gap-1"
                                                            >
                                                                ¿No tienes AutoFirma? Descargar aquí
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>

                                                            <Button
                                                                onClick={handleDigitalSignWithAutoFirma}
                                                                disabled={digitalSigning || !termsAccepted}
                                                            >
                                                                {digitalSigning ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                        Firmando en AutoFirma...
                                                                    </>
                                                                ) : latestPadesDoc ? (
                                                                    'Co-firmar con AutoFirma'
                                                                ) : (
                                                                    'Firmar con AutoFirma'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </ComponentCard>
                        )}

                        {/* Footer Legal */}
                        <div className="text-center py-4 text-[10px] text-gray-400 dark:text-gray-600 font-medium">
                            RESIGEST 360 © {new Date().getFullYear()} - Sistema de Gestión y Trazabilidad de Residuos (RD 553/2020)
                        </div>
                    </div>
                </div>
                );
}

                export default function PublicSignaturePage() {
    return (
                <Suspense
                    fallback={
                        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Cargando documento para firma...</p>
                            </div>
                        </div>
                    }
                >
                    <PublicSignatureContent />
                </Suspense>
                );
}
