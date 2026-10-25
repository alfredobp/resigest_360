import { holdedService } from '../holdedService';

describe('holdedService', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        // Silenciar logs de consola durante los tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    describe('getApiKey', () => {
        it('debe existir el método y resolver', async () => {
            const result = await holdedService.getApiKey();
            expect(result).toBeUndefined();
        });
    });

    describe('createContact', () => {
        it('debe retornar null si no se proporciona apiKey', async () => {
            const res = await holdedService.createContact({
                name: 'Cliente Prueba',
                type: 'client'
            });
            expect(res).toBeNull();
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('No hay API Key configurada')
            );
        });

        it('debe crear un contacto con éxito enviando cabecera y datos correctos', async () => {
            const mockResponse = { id: 'contact-123', status: 'ok' };
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            } as any);

            const contactData = {
                name: 'Empresa SL',
                email: 'info@empresa.com',
                type: 'client',
                vatnumber: 'B12345678',
                address: 'Calle Mayor 1',
                billAddress: {
                    city: 'Madrid',
                    country: 'Spain'
                }
            };

            const result = await holdedService.createContact(contactData, 'test-api-key');

            expect(global.fetch).toHaveBeenCalledWith('/api/holded?action=createContact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData),
            });
            expect(result).toEqual(mockResponse);
        });

        it('debe lanzar error si la respuesta no es ok con mensaje personalizado', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Error específico de Holded' }),
            } as any);

            await expect(
                holdedService.createContact({ name: 'Error', type: 'client' }, 'key-123')
            ).rejects.toThrow('Error específico de Holded');
        });

        it('debe lanzar error por defecto si la respuesta no es ok y no trae mensaje', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as any);

            await expect(
                holdedService.createContact({ name: 'Error', type: 'client' }, 'key-123')
            ).rejects.toThrow('Error al crear contacto en Holded');
        });

        it('debe relanzar errores de red', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            await expect(
                holdedService.createContact({ name: 'Test', type: 'client' }, 'key-123')
            ).rejects.toThrow('Network error');
        });
    });

    describe('updateContact', () => {
        it('debe retornar null si falta apiKey o contactId', async () => {
            expect(await holdedService.updateContact('', { name: 'A' }, 'key')).toBeNull();
            expect(await holdedService.updateContact('c1', { name: 'A' })).toBeNull();
            expect(await holdedService.updateContact('c1', { name: 'A' }, '')).toBeNull();
        });

        it('debe actualizar el contacto exitosamente', async () => {
            const mockResponse = { updated: true };
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            } as any);

            const result = await holdedService.updateContact('contact-456', { name: 'Nuevo Nombre' }, 'api-key');

            expect(global.fetch).toHaveBeenCalledWith('/api/holded?action=updateContact&id=contact-456', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: 'Nuevo Nombre' }),
            });
            expect(result).toEqual(mockResponse);
        });

        it('debe lanzar error cuando respuesta no es ok', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Fallo al actualizar' }),
            } as any);

            await expect(
                holdedService.updateContact('c1', { name: 'X' }, 'key')
            ).rejects.toThrow('Fallo al actualizar');
        });

        it('debe usar mensaje por defecto si la respuesta de error no tiene mensaje', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as any);

            await expect(
                holdedService.updateContact('c1', { name: 'X' }, 'key')
            ).rejects.toThrow('Error al actualizar contacto en Holded');
        });
    });

    describe('listContacts', () => {
        it('debe retornar un array vacío si no se pasa apiKey', async () => {
            const result = await holdedService.listContacts();
            expect(result).toEqual([]);
        });

        it('debe listar contactos si se proporciona apiKey', async () => {
            const mockContacts = [{ id: '1', name: 'Contacto 1' }];
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockContacts,
            } as any);

            const result = await holdedService.listContacts('key-123');

            expect(global.fetch).toHaveBeenCalledWith('/api/holded?action=listContacts');
            expect(result).toEqual(mockContacts);
        });

        it('debe lanzar error cuando listContacts falla', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Unauthorized' }),
            } as any);

            await expect(holdedService.listContacts('bad-key')).rejects.toThrow('Unauthorized');
        });

        it('debe usar mensaje de error por defecto cuando no hay detalle de error', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as any);

            await expect(holdedService.listContacts('bad-key')).rejects.toThrow('Error al listar contactos de Holded');
        });
    });

    describe('createInvoice', () => {
        it('debe lanzar error si no se pasa apiKey', async () => {
            await expect(holdedService.createInvoice({ total: 100 })).rejects.toThrow(
                'API Key de Holded no configurada'
            );
        });

        it('debe crear la factura cuando los datos y el apiKey son válidos', async () => {
            const invoiceData = { contactId: 'c1', items: [{ name: 'Residuo A', units: 1, subtotal: 50 }] };
            const mockResult = { invoiceId: 'inv-99', status: 'created' };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResult,
            } as any);

            const result = await holdedService.createInvoice(invoiceData, 'api-key-inv');

            expect(global.fetch).toHaveBeenCalledWith('/api/holded?action=createInvoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invoiceData),
            });
            expect(result).toEqual(mockResult);
        });

        it('debe manejar errores de respuesta de createInvoice', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Datos de factura inválidos' }),
            } as any);

            await expect(
                holdedService.createInvoice({ total: 100 }, 'valid-key')
            ).rejects.toThrow('Datos de factura inválidos');
        });

        it('debe manejar error por defecto de createInvoice', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as any);

            await expect(
                holdedService.createInvoice({ total: 100 }, 'valid-key')
            ).rejects.toThrow('Error al crear factura en Holded');
        });
    });

    describe('createRecurringInvoice', () => {
        it('debe lanzar error si falta apiKey', async () => {
            await expect(
                holdedService.createRecurringInvoice({
                    contact: 'c1',
                    desc: 'Contrato mensual',
                    date: 12345678,
                    frequency: 'monthly',
                    items: [],
                })
            ).rejects.toThrow('API Key de Holded no configurada');
        });

        it('debe crear la factura recurrente con éxito', async () => {
            const recurringData = {
                contact: 'c1',
                desc: 'Contrato mensual de gestión',
                date: 1700000000,
                frequency: 'monthly' as const,
                items: [{ name: 'Cuota gestión', units: 1, subtotal: 100 }],
                enddate: 1730000000,
            };
            const mockResult = { recurringInvoiceId: 'rec-1', status: 'active' };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResult,
            } as any);

            const result = await holdedService.createRecurringInvoice(recurringData, 'key-recurring');

            expect(global.fetch).toHaveBeenCalledWith('/api/holded?action=createRecurringInvoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recurringData),
            });
            expect(result).toEqual(mockResult);
        });

        it('debe manejar errores del servidor en createRecurringInvoice', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Error recurrente' }),
            } as any);

            await expect(
                holdedService.createRecurringInvoice(
                    { contact: 'c1', desc: '', date: 0, frequency: 'monthly', items: [] },
                    'key'
                )
            ).rejects.toThrow('Error recurrente');
        });

        it('debe usar mensaje por defecto en error de createRecurringInvoice', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as any);

            await expect(
                holdedService.createRecurringInvoice(
                    { contact: 'c1', desc: '', date: 0, frequency: 'monthly', items: [] },
                    'key'
                )
            ).rejects.toThrow('Error al crear contrato en Holded');
        });
    });
});
