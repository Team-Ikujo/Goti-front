import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import type { ZoneItem } from '@/pages/books/model/types';

export const summarizeBookingEntry = (entry: BookingEntryState | null | undefined) => {
   return entry ?? null;
};

export const summarizeZone = (zone: ZoneItem | null | undefined) => {
   return zone ?? null;
};

export const logBookingFlow = (_scope: string, _message: string, _payload?: unknown) => {};

export const logBookingFlowError = (_scope: string, _message: string, _payload?: unknown) => {};
