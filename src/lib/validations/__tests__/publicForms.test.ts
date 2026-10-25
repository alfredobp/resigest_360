import { contactFormSchema, supportTicketSchema } from '../publicForms';

describe('contactFormSchema', () => {
  it('acepta un contacto válido y recorta espacios', () => {
    const r = contactFormSchema.safeParse({ name: '  Ana ', email: ' ana@empresa.com ' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe('Ana');
      expect(r.data.email).toBe('ana@empresa.com');
    }
  });

  it('rechaza nombre vacío, email inválido y mensajes demasiado largos', () => {
    expect(contactFormSchema.safeParse({ name: '', email: 'a@b.com' }).success).toBe(false);
    expect(contactFormSchema.safeParse({ name: 'A', email: 'no-es-email' }).success).toBe(false);
    expect(contactFormSchema.safeParse({ name: 'A', email: 'a@b.com', message: 'x'.repeat(3001) }).success).toBe(false);
  });

  it('rechaza cuerpos no objeto', () => {
    expect(contactFormSchema.safeParse(null).success).toBe(false);
  });

  it('el honeypot rellenado no pasa la validación estricta de longitud 0', () => {
    expect(contactFormSchema.safeParse({ name: 'A', email: 'a@b.com', website: 'http://spam' }).success).toBe(false);
    expect(contactFormSchema.safeParse({ name: 'A', email: 'a@b.com', website: '' }).success).toBe(true);
  });
});

describe('supportTicketSchema', () => {
  const base = { name: 'Ana', email: 'ana@empresa.com', subject: 'Fallo', message: 'Detalle' };

  it('acepta un ticket válido con prioridad permitida', () => {
    expect(supportTicketSchema.safeParse({ ...base, priority: 'urgente' }).success).toBe(true);
    expect(supportTicketSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza prioridad desconocida y campos obligatorios vacíos', () => {
    expect(supportTicketSchema.safeParse({ ...base, priority: 'critica' }).success).toBe(false);
    expect(supportTicketSchema.safeParse({ ...base, subject: '' }).success).toBe(false);
    expect(supportTicketSchema.safeParse({ ...base, message: '' }).success).toBe(false);
  });
});
