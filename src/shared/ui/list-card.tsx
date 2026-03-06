import * as React from "react";
import { cn } from "@/shared/lib/utils";
import CalendarIcon from "@/shared/ui/icon/Calendar";
import LocationIcon from "@/shared/ui/icon/Location";

export interface ListCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 랭크 배지 텍스트 (예: N, 1, 2) */
  rank?: string;
  /** 좌측 팀명 */
  team1: string;
  /** 우측 팀명 */
  team2: string;
  /** 경기 날짜 */
  date: string;
  /** 경기 시간 */
  time: string;
  /** 경기 장소 */
  location: string;
  /** 상단 이미지 URL. 없으면 플레이스홀더를 렌더링합니다. */
  imageSrc?: string;
  /** 상단 이미지 대체 텍스트 */
  imageAlt?: string;
}

/**
 * Figma `690:75` 기반 리스트 카드 컴포넌트.
 * 경기 기본 정보(팀/일시/장소)를 일관된 레이아웃으로 표시합니다.
 */
const ListCard = React.forwardRef<HTMLDivElement, ListCardProps>(
  (
    {
      className,
      rank = "N",
      team1,
      team2,
      date,
      time,
      location,
      imageSrc,
      imageAlt = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="list-card"
        className={cn(
          "w-75 overflow-hidden rounded-[14px] border border-border bg-background",
          className,
        )}
        {...props}
      >
        <div className="relative h-50 border-b border-border">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="size-full object-cover"
            />
          ) : (
            <img src="/empty/EmptyImage.png" alt="" className="size-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-black/20" />
          <p className="absolute bottom-0 left-2.5 text-display-1-bold text-white">
            {rank}
          </p>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex h-7 items-center justify-between">
            <p className="max-w-30 truncate text-heading-4-bold text-foreground">
              {team1}
            </p>
            <span className="text-body-2-bold text-(--text-tertiary)">vs</span>
            <p className="max-w-30 truncate text-right text-heading-4-bold text-foreground">
              {team2}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex h-5 items-center gap-2">
              <CalendarIcon className="size-4 text-(--text-tertiary)" />
              <p className="flex items-center gap-2 text-label-2-medium text-(--text-tertiary)">
                <span>{date}</span>
                <span
                  aria-hidden="true"
                  className="h-3 w-px bg-(--border-strong)"
                />
                <span>{time}</span>
              </p>
            </div>
            <div className="flex h-5 items-center gap-2">
              <LocationIcon className="size-4 text-(--text-tertiary)" />
              <p className="truncate text-label-2-medium text-(--text-tertiary)">
                {location}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ListCard.displayName = "ListCard";

export { ListCard };
