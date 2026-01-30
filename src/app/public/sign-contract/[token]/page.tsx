'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import wasteContractService from '@/services/wasteContractService';
import type { WasteContract } from '@/types/wasteManagement';
import SignaturePad from '@/components/ui/signature/SignaturePad';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import Button from '@/components/ui/button/Button';
import ComponentCard from '@/components/common/ComponentCard';

const STATUS_LABELS = {
    borrador: 'Borrador',
    vigente: 'Vigente',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
};

export default function PublicSignaturePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = params?.token as string;
    const roleParam = searchParams?.get('role') as 'productor' | 'gestor' | null;

    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState<WasteContract | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'productor' | 'gestor'>(roleParam || 'productor');

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
        } catch (err: any) {
            setError('El enlace de firma es inválido o el contrato ya no está disponible.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSignature = async (signatureBase64: string) => {
        if (!token) return;
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading && !contract) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Firma Completada!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Su firma ha sido registrada correctamente en el documento contractual. Puede cerrar esta ventana.
                    </p>
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                        <p className="text-xs text-gray-400 italic">
                            RESIGEST 360 - Sistema de Gestión Medioambiental
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!contract) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Firma de Contrato Digital
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Por favor, revise los detalles del contrato y proceda con la firma electrónica.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Contract Info Card */}
                    <ComponentCard title="Información del Contrato">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Número de Contrato</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {contract.numero_contrato || `#${contract.id}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Tipo de Servicio</p>
                                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                    {contract.tipo_contrato}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Productor (Cliente)</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {contract.company?.razon_social}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Gestor (Destinatario)</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {contract.treatment_manager?.razon_social || contract.gestor_company?.razon_social}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-gray-500 text-xs mb-2 italic">Resumen de Residuos:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {contract.descripcion_residuos || 'Según anexo o DIs asociados.'}
                            </p>
                        </div>
                    </ComponentCard>

                    {/* Role Selection (If not pre-selected) */}
                    {!roleParam && (
                        <ComponentCard title="Identificación del Firmante">
                            <div className="flex flex-col gap-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    ¿En calidad de qué parte está firmando?
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setSelectedRole('productor')}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${selectedRole === 'productor'
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500'
                                            }`}
                                    >
                                        <div className="font-bold">Productor</div>
                                        <div className="text-[10px] mt-1 opacity-70">El cliente o generador del residuo</div>
                                    </button>
                                    <button
                                        onClick={() => setSelectedRole('gestor')}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${selectedRole === 'gestor'
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500'
                                            }`}
                                    >
                                        <div className="font-bold">Gestor</div>
                                        <div className="text-[10px] mt-1 opacity-70">La planta de tratamiento</div>
                                    </button>
                                </div>
                            </div>
                        </ComponentCard>
                    )}

                    {/* Signature Pad Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Garabatee su firma abajo
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                                    {loading ? 'Guardando...' : 'Sistema Seguro'}
                                </span>
                            </div>
                        </div>

                        <div className="p-2 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                            <SignaturePad
                                onSave={handleSaveSignature}
                                height={250}
                            />
                        </div>

                        <div className="mt-8 text-center px-4">
                            <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tighter">
                                Al firmar este documento, usted acepta las condiciones técnicas y económicas establecidas en el contrato #{contract.numero_contrato || contract.id}. Esta firma tiene validez legal según la ley 6/2020 de servicios electrónicos de confianza.
                            </p>
                        </div>
                    </div>

                    {/* Footer Legal */}
                    <div className="text-center py-4">
                        <p className="text-[10px] text-gray-300 dark:text-gray-600 font-medium">
                            RESIGEST 360 © {new Date().getFullYear()} - CUMPLIMIENTO RD 553/2020
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
