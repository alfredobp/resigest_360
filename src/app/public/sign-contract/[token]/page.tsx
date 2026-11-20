'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import wasteContractService from '@/services/wasteContractService';
import type { WasteContract } from '@/types/wasteManagement';
import SignaturePad from '@/components/ui/signature/SignaturePad';
import Alert from '@/components/ui/alert/Alert';
import ComponentCard from '@/components/common/ComponentCard';
import Badge from '@/components/ui/badge/Badge';

function PublicSignatureContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const token = params?.token as string;
    const roleParam = searchParams?.get('role') as 'productor' | 'gestor' | null;

    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState<WasteContract | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'productor' | 'gestor'>('productor');
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => {
        if (token) {
            loadContract();
        }
    }, [token]);

    const loadContract = async () => {
        try {
            setLoading(true);
            const data = await wasteContractService.getBySigningToken(token);
            setContract(data);

            // RES6-I06: Determinar el rol disponible según estado de firmas del contrato
            if (data) {
                if (data.firmado_productor && !data.firmado_gestor) {
                    setSelectedRole('gestor');
                } else if (data.firmado_gestor && !data.firmado_productor) {
                    setSelectedRole('productor');
                } else if (roleParam === 'productor' || roleParam === 'gestor') {
                    setSelectedRole(roleParam);
                }
            }
        } catch {
            setError('El enlace de firma es inválido o el contrato ya no está disponible.');
        } finally {
            setLoading(false);
        }
    };

    // Evaluar si ambas partes ya formalizaron el contrato
    const isFullySigned = useMemo(() => {
        return Boolean(contract?.firmado_productor && contract?.firmado_gestor);
    }, [contract]);

    // Evaluar si el rol predeterminado ya firmó
    const isRoleAlreadySigned = useMemo(() => {
        if (!contract) return false;
        if (selectedRole === 'productor' && contract.firmado_productor) return true;
        if (selectedRole === 'gestor' && contract.firmado_gestor) return true;
        return false;
    }, [contract, selectedRole]);

    const handleSaveSignature = async (signatureBase64: string) => {
        if (!token || !termsAccepted) return;
        try {
            setLoading(true);
            await wasteContractService.signContractByToken(token, signatureBase64, selectedRole);
            setSuccess(true);
        } catch (err: any) {
            setError(`Error al guardar la firma: ${err.message}`);
        } finally {
            setLoading(false);
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
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                        Su firma electrónica ha sido vinculada legalmente al contrato #{contract?.numero_contrato || contract?.id}.
                    </p>
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                        <p className="text-xs text-gray-400 italic">
                            RESIGEST 360 - Plataforma de Trazabilidad y Gestión Ambiental RD 553/2020
                        </p>
                    </div>
                </div>
            </div>
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
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
                                                <td className="px-3 py-2 text-muted">{item.descripcion_ler || '-'}</td>
                                                <td className="px-3 py-2 font-mono font-bold text-primary">{item.operacion_tratamiento || 'R/D'}</td>
                                                <td className="px-3 py-2 text-foreground">{item.cantidad_estimada_anual ? `${item.cantidad_estimada_anual} t/año` : '-'}</td>
                                                <td className="px-3 py-2 text-foreground">{item.tarifa_gestion ? `${item.tarifa_gestion} €/t` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : simpleLers.length > 0 ? (
                            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl space-y-1">
                                <span className="font-semibold text-muted block mb-1">Códigos LER contratados:</span>
                                <div className="flex flex-wrap gap-2">
                                    {simpleLers.map((ler, i) => (
                                        <span key={i} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-mono font-bold text-xs border border-gray-300 dark:border-gray-700">
                                            {ler}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted italic">{contract.descripcion_residuos || 'Residuos según autorizaciones vigentes de las partes.'}</p>
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

                                    {/* Signature Pad */}
                                    <div className={`transition-opacity ${termsAccepted ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
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
