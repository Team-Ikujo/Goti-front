export type BookingFlowMode = 'standard' | 'resell';

const BOOKING_FLOW_QUERY_KEY = 'mode';
export const DEFAULT_BOOKING_ENTRY_SOURCE_PATH = '/';

export function getBookingFlowMode(search: string): BookingFlowMode {
   const params = new URLSearchParams(search);

   return params.get(BOOKING_FLOW_QUERY_KEY) === 'resell' ? 'resell' : 'standard';
}

export function createBookingFlowSearch(mode: BookingFlowMode): string {
   if (mode === 'standard') {
      return '';
   }

   const params = new URLSearchParams({
      [BOOKING_FLOW_QUERY_KEY]: mode,
   });

   return `?${params.toString()}`;
}

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
