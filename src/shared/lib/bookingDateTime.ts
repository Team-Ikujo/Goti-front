const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

type BookingDateTimeFormat = 'header' | 'card';

export const parseBookingDateTime = (value: string) => {
   const normalizedValue = value.trim();
   const fullDateMatch = normalizedValue.match(
      /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})(?:\s*\(([일월화수목금토])\))?\s+(?:(오전|오후)\s*)?(\d{1,2}):(\d{2})$/,
   );

   if (fullDateMatch) {
      const [, year, month, day, , meridiem, hour, minute] = fullDateMatch;
      const parsedHour = Number(hour);
      const normalizedHour =
         meridiem === '오전' && parsedHour === 12
            ? 0
            : meridiem === '오후' && parsedHour < 12
              ? parsedHour + 12
              : parsedHour;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day), normalizedHour, Number(minute));

      if (!Number.isNaN(parsed.getTime())) {
         return parsed;
      }
   }

   const figmaStyleMatch = normalizedValue.match(
      /^(\d{1,2})\.(\d{1,2})\s+\(([일월화수목금토])\)\s+(오전|오후)\s+(\d{1,2}):(\d{2})$/,
   );

   if (!figmaStyleMatch) {
      return null;
   }

   const [, month, day, , meridiem, hour, minute] = figmaStyleMatch;
   const parsedHour = Number(hour);
   const normalizedHour =
      meridiem === '오전' && parsedHour === 12
         ? 0
         : meridiem === '오후' && parsedHour < 12
           ? parsedHour + 12
           : parsedHour;
   const parsed = new Date(new Date().getFullYear(), Number(month) - 1, Number(day), normalizedHour, Number(minute));

   return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatBookingDateTime = (value: string, format: BookingDateTimeFormat) => {
   const normalizedValue = value.trim();
   const parsed = parseBookingDateTime(normalizedValue);

   if (!parsed) {
      return normalizedValue;
   }

   const year = String(parsed.getFullYear());
   const month = String(parsed.getMonth() + 1).padStart(2, '0');
   const day = String(parsed.getDate()).padStart(2, '0');
   const dayLabel = DAY_LABELS[parsed.getDay()];
   const hours = parsed.getHours();
   const meridiem = hours < 12 ? '오전' : '오후';
   const displayHour = String(hours).padStart(2, '0');
   const minutes = String(parsed.getMinutes()).padStart(2, '0');

   switch (format) {
      case 'header':
         return `${Number(month)}.${day} (${dayLabel}) ${meridiem} ${displayHour}:${minutes}`;
      case 'card':
         return `${year}.${month}.${day} (${dayLabel}) ${displayHour}:${minutes}`;
   }
};

export const formatBookingHeaderDateTime = (value?: string) => {
   if (!value) {
      return undefined;
   }

   return formatBookingDateTime(value, 'header');
};

export const formatBookingCardDateTime = (value: string) => {
   return formatBookingDateTime(value, 'card');
};
