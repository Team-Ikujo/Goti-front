export type TicketNumberKind = 'ticket' | 'resale';

const TICKET_NUMBER_DIGIT_LENGTH = 13;

const normalizeTicketDigits = (value: string) => value.replace(/\D/g, '');
const formatNumberWithPrefix = (rawValue: string | undefined | null, prefix: string) => {
   if (!rawValue) {
      return '-';
   }

   const digits = normalizeTicketDigits(rawValue)
      .slice(-TICKET_NUMBER_DIGIT_LENGTH)
      .padStart(TICKET_NUMBER_DIGIT_LENGTH, '0');

   return `${prefix}${digits}`;
};

export const formatTicketNumber = (
   rawValue: string | undefined | null,
   _kind: TicketNumberKind = 'ticket',
) => {
   return formatNumberWithPrefix(rawValue, 'ORD');
};

export const formatReservationNumber = (rawValue: string | undefined | null) => {
   return formatNumberWithPrefix(rawValue, 'GT');
};

export const getTicketNumberKind = (rawValue: string | undefined | null, fallback: TicketNumberKind = 'ticket'): TicketNumberKind => {
   if (!rawValue) {
      return fallback;
   }

   return /^RESALE/i.test(rawValue) ? 'resale' : fallback;
};
