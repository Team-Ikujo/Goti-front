import type { ZoneItem } from "@/pages/books/model/types";

type BookingZoneMapProps = {
  zones: ZoneItem[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  mobileExpanded?: boolean;
};

const KIA_STADIUM_IMAGE = "/baseball/seat/kia.png";

function BookingZoneMap({
  selectedZoneId,
  mobileExpanded = false,
}: BookingZoneMapProps) {
  return (
    <section
      className={[
        "flex items-center justify-center overflow-hidden bg-[#f1f2f4] px-3 sm:px-8 lg:h-auto lg:min-h-0 lg:px-[70px] lg:py-[74px]",
        mobileExpanded ? "min-h-[268px] py-4" : "min-h-[172px] py-2",
      ].join(" ")}
      aria-label="구장 맵"
    >
      <div className="flex w-full items-center justify-center lg:max-w-[740px]">
        <img
          src={KIA_STADIUM_IMAGE}
          alt="기아 챔피언스필드 구역도"
          className={[
            "h-auto object-contain object-center lg:w-full lg:max-h-none",
            mobileExpanded ? "w-[122%] max-w-none" : "w-[112%] max-w-none",
          ].join(" ")}
          draggable={false}
        />
        <span className="sr-only">
          현재 선택된 구역은 {selectedZoneId}이며, 구역 선택은 우측 좌석 등급
          목록에서 진행할 수 있습니다.
        </span>
      </div>
    </section>
  );
}

export default BookingZoneMap;
