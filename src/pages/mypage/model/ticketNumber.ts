export type TicketNumberKind = 'ticket' | 'resale';

const TICKET_NUMBER_DIGIT_LENGTH = 13;

const normalizeTicketDigits = (value: string) => value.replace(/\D/g, '');

export const formatTicketNumber = (
   rawValue: string | undefined | null,
   kind: TicketNumberKind = 'ticket',
) => {
   if (!rawValue) {
      return '-';
   }

   const prefix = kind === 'resale' ? 'RESALE' : 'ORD';
   const digits = normalizeTicketDigits(rawValue).slice(-TICKET_NUMBER_DIGIT_LENGTH).padStart(TICKET_NUMBER_DIGIT_LENGTH, '0');

   return `${prefix}${digits}`;
};

export const getTicketNumberKind = (rawValue: string | undefined | null, fallback: TicketNumberKind = 'ticket'): TicketNumberKind => {
   if (!rawValue) {
      return fallback;
   }

   return /^RESALE/i.test(rawValue) ? 'resale' : fallback;
};
