import type { ZoneItem } from '@/pages/books/model/types';

type BookingZoneMapProps = {
   zones: ZoneItem[];
   selectedZoneId: string;
   onSelectZone: (zoneId: string) => void;
};

const KIA_STADIUM_IMAGE = '/baseball/seat/kia.png';

function BookingZoneMap({ selectedZoneId }: BookingZoneMapProps) {
   return (
      <section
         className="flex min-h-[360px] items-center justify-center overflow-hidden bg-[#f1f2f4] px-5 py-8 sm:px-8 lg:min-h-0 lg:px-[70px] lg:py-[74px]"
         aria-label="구장 맵"
      >
         <div className="flex aspect-square w-full max-w-[740px] items-center justify-center">
            <img
               src={KIA_STADIUM_IMAGE}
               alt="기아 챔피언스필드 구역도"
               className="h-full w-full object-contain"
               draggable={false}
            />
            <span className="sr-only">
               현재 선택된 구역은 {selectedZoneId}이며, 구역 선택은 우측 좌석 등급 목록에서 진행할 수 있습니다.
            </span>
         </div>
      </section>
   );
}

export default BookingZoneMap;
