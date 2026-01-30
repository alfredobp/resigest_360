/**
 * SERVICIO DE INTEGRACIÓN CON HOLDED
 * Proporciona métodos para interactuar con la API de Holded a través del proxy interno.
 */

export const holdedService = {
    /**
     * Obtiene el API Key de Holded para la empresa del usuario
     */
    async getApiKey() {
        // Esta lógica podría estar aquí o en el proxy. Para mayor seguridad,
        // el proxy de la API interna debería obtener la clave directamente de Supabase.
        // Pero por ahora, permitiremos que el servicio la maneje si es necesario.
    },

    /**
     * Crea un contacto en Holded
     */
    async createContact(contactData: {
        name: string;
        email?: string;
        type: string | number; // 'client', 'supplier', or numeric 0, 1
        isSupplier?: number; // 1 = yes
        code?: string; // Contact ID/Code
        vatnumber?: string; // CIF/NIF
        address?: string;
        city?: string;
        postalCode?: string;
        province?: string;
        billAddress?: {
            address?: string;
            city?: string;
            postalCode?: string;
            province?: string;
            country?: string;
            countryCode?: string;
        };
        country?: string;
        countryCode?: string;
        phone?: string;
    }, apiKey?: string) {
        if (!apiKey) {
            console.warn('Holded: No hay API Key configurada para esta empresa. Saltando sincronización.');
            return null;
        }

        try {
            const response = await fetch('/api/holded?action=createContact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-holded-key': apiKey // Pasamos la clave por una cabecera personalizada al proxy
                },
                body: JSON.stringify(contactData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al crear contacto en Holded');
            return result;
        } catch (error: any) {
            console.error('Holded Service Error (createContact):', error);
            throw error;
        }
    },

    /**
     * Actualiza un contacto en Holded
     */
    async updateContact(contactId: string, contactData: Partial<{
        name: string;
        email?: string;
        type: string | number;
        isSupplier?: number;
        code?: string;
        vatnumber?: string;
        address?: string;
        city?: string;
        postalCode?: string;
        province?: string;
        billAddress?: {
            address?: string;
            city?: string;
            postalCode?: string;
            province?: string;
            country?: string;
            countryCode?: string;
        };
        country?: string;
        countryCode?: string;
        phone?: string;
    }>, apiKey?: string) {
        if (!apiKey || !contactId) return null;

        try {
            const response = await fetch(`/api/holded?action=updateContact&id=${contactId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-holded-key': apiKey
                },
                body: JSON.stringify(contactData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al actualizar contacto en Holded');
            return result;
        } catch (error: any) {
            console.error('Holded Service Error (updateContact):', error);
            throw error;
        }
    },

    /**
     * Lista los contactos de Holded
     */
    async listContacts(apiKey?: string) {
        if (!apiKey) return [];
        try {
            const response = await fetch('/api/holded?action=listContacts', {
                headers: { 'x-holded-key': apiKey }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al listar contactos de Holded');
            return result;
        } catch (error: any) {
            console.error('Holded Service Error (listContacts):', error);
            throw error;
        }
    },

    /**
     * Crea una factura en Holded
     */
    async createInvoice(invoiceData: any, apiKey?: string) {
        if (!apiKey) throw new Error('API Key de Holded no configurada');
        try {
            const response = await fetch('/api/holded?action=createInvoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-holded-key': apiKey
                },
                body: JSON.stringify(invoiceData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al crear factura en Holded');
            return result;
        } catch (error: any) {
            console.error('Holded Service Error (createInvoice):', error);
            throw error;
        }
    },

    /**
     * Crea una factura recurrente (Contrato) en Holded
     */
    async createRecurringInvoice(recurringData: {
        contact: string; // contact ID in Holded
        desc: string;
        date: number; // timestamp
        frequency: 'monthly' | 'quarterly' | 'yearly';
        items: any[];
        enddate?: number;
    }, apiKey?: string) {
        if (!apiKey) throw new Error('API Key de Holded no configurada');
        try {
            const response = await fetch('/api/holded?action=createRecurringInvoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-holded-key': apiKey
                },
                body: JSON.stringify(recurringData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al crear contrato en Holded');
            return result;
        } catch (error: any) {
            console.error('Holded Service Error (createRecurringInvoice):', error);
            throw error;
        }
    }
};

export default holdedService;
