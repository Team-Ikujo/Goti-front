const normalizeSeatLookupToken = (value: string) => value.replace(/\s+/g, '').toUpperCase();

export const createResellSeatLookupKey = ({
   sectionCode,
   rowLabel,
   seatNumber,
}: {
   sectionCode: string;
   rowLabel: string;
   seatNumber: number;
}) => `${normalizeSeatLookupToken(sectionCode)}::${rowLabel}::${seatNumber}`;

export const parseResellSeatInfo = (seatInfo: string) => {
   const sectionMatch = seatInfo.match(/([A-Z0-9-]+)구역/i);
   const rowMatch = seatInfo.match(/([A-Z0-9가-힣]+)열/i);
   const seatNumberMatch = seatInfo.match(/(\d+)번/);

   if (!sectionMatch || !rowMatch || !seatNumberMatch) {
      return null;
   }

   return {
      sectionCode: normalizeSeatLookupToken(sectionMatch[1]),
      rowLabel: `${rowMatch[1]}열`,
      seatNumber: Number(seatNumberMatch[1]),
   };
};
