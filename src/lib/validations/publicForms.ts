import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);

/** Formulario comercial público (/api/contact). `website` es un honeypot: debe venir vacío. */
export const contactFormSchema = z.object({
  name: text(120).min(1),
  email: z.string().trim().max(254).email(),
  company: text(160).optional(),
  phone: text(40).optional(),
  role: text(80).optional(),
  volume: text(80).optional(),
  message: text(3000).optional(),
  website: z.string().max(0).optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

/** Ticket de soporte (/api/support/ticket), solo usuarios autenticados. */
export const supportTicketSchema = z.object({
  name: text(120).min(1),
  email: z.string().trim().max(254).email(),
  company: text(160).optional(),
  modulo: text(80).optional(),
  priority: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
  subject: text(200).min(1),
  message: text(5000).min(1),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
