export type BookingFlowMode = 'standard' | 'resell';

export const DEFAULT_BOOKING_ENTRY_SOURCE_PATH = '/';

export function createBookingEntrySourcePath({
   pathname,
   search,
   hash,
}: {
   pathname: string;
   search?: string;
   hash?: string;
}) {
   return `${pathname}${search ?? ''}${hash ?? ''}`;
}

export function resolveBookingEntrySourcePath(path?: string) {
   if (!path?.startsWith('/')) {
      return DEFAULT_BOOKING_ENTRY_SOURCE_PATH;
   }

   return path;
}
