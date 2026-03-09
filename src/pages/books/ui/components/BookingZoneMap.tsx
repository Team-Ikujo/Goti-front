import { useMemo, useRef, useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import type { ZoneItem } from '@/pages/books/model/types';

type BookingZoneMapProps = {
   zones: ZoneItem[];
   selectedZoneId: string;
   onSelectZone: (zoneId: string) => void;
};

const MIN_SCALE = 0.8;
const MAX_SCALE = 2;
const SCALE_STEP = 0.2;
const KIA_STADIUM_IMAGE = '/baseball/seat/kia.png';

function BookingZoneMap({ zones, selectedZoneId, onSelectZone }: BookingZoneMapProps) {
   const [scale, setScale] = useState(1);
   const [offset, setOffset] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const dragStartRef = useRef<{ x: number; y: number } | null>(null);

   const selectedZone = useMemo(
      () => zones.find((zone) => zone.id === selectedZoneId) ?? zones[0],
      [selectedZoneId, zones],
   );

   const zoomIn = () => {
      setScale((prev) => Math.min(MAX_SCALE, Number((prev + SCALE_STEP).toFixed(2))));
   };

   const zoomOut = () => {
      setScale((prev) => Math.max(MIN_SCALE, Number((prev - SCALE_STEP).toFixed(2))));
   };

   const resetView = () => {
      setScale(1);
      setOffset({ x: 0, y: 0 });
   };

   const handleMapPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (scale <= 1) {
         return;
      }

      const target = event.target as HTMLElement;
      if (target.closest('button')) {
         return;
      }

      dragStartRef.current = {
         x: event.clientX - offset.x,
         y: event.clientY - offset.y,
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
   };

   const handleMapPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStartRef.current) {
         return;
      }

      setOffset({
         x: event.clientX - dragStartRef.current.x,
         y: event.clientY - dragStartRef.current.y,
      });
   };

   const handleMapPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
      dragStartRef.current = null;
      setIsDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
         event.currentTarget.releasePointerCapture(event.pointerId);
      }
   };

   return (
      <section className="relative flex-1 overflow-hidden bg-surface p-4 lg:p-0" aria-label="구장 맵">
         <div className="mx-auto flex h-full min-h-[420px] w-full items-center justify-center overflow-hidden">
            <div className="relative aspect-square w-[min(100%,calc(100vh-220px))] overflow-visible lg:w-[min(100%,calc(100vh-180px))]">
               <div
                  className={[
                     'absolute inset-0 origin-center',
                     isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default',
                     isDragging ? '' : 'transition-transform duration-150',
                  ].join(' ')}
                  style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
                  aria-live="polite"
                  onPointerDown={handleMapPointerDown}
                  onPointerMove={handleMapPointerMove}
                  onPointerUp={handleMapPointerUp}
                  onPointerCancel={handleMapPointerUp}
               >
                  <img
                     src={KIA_STADIUM_IMAGE}
                     alt="기아 챔피언스필드 구역도"
                     className="h-full w-full object-contain"
                     draggable={false}
                  />

                  {zones.map((zone) => {
                     const isSelected = zone.id === selectedZone.id;

                     return (
                        <button
                           key={zone.id}
                           type="button"
                           onClick={() => onSelectZone(zone.id)}
                           className={[
                              'absolute rounded-md border text-caption-1-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                              isSelected
                                 ? 'text-white ring-2 ring-primary'
                                 : 'text-foreground hover:-translate-y-0.5',
                           ].join(' ')}
                           style={{
                              left: `${zone.hotspot.x}%`,
                              top: `${zone.hotspot.y}%`,
                              width: `${zone.hotspot.w}%`,
                              height: `${zone.hotspot.h}%`,
                              borderColor: zone.color,
                              backgroundColor: isSelected ? `${zone.color}CC` : `${zone.color}66`,
                              cursor: scale > 1 ? 'pointer' : 'default',
                           }}
                           aria-label={`${zone.name} 구역 선택`}
                           aria-pressed={isSelected}
                        >
                           {zone.sectionCode}
                        </button>
                     );
                  })}
               </div>

               <div className="absolute right-4 top-4 rounded-md bg-black/55 px-2.5 py-1 text-caption-1-medium text-white">
                  줌 {Math.round(scale * 100)}%
               </div>
            </div>
         </div>

         {scale > 1 ? (
            <div className="pointer-events-none absolute left-6 top-6 rounded-md bg-black/50 px-2 py-1 text-caption-1-medium text-white">
               드래그로 이동
            </div>
         ) : null}

         <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button
               type="button"
               aria-label="확대"
               onClick={zoomIn}
               className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-white shadow-sm"
            >
               <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
               type="button"
               aria-label="축소"
               onClick={zoomOut}
               className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-white shadow-sm"
            >
               <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
               type="button"
               aria-label="초기화"
               onClick={resetView}
               className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-white shadow-sm"
            >
               <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
         </div>
      </section>
   );
}

export default BookingZoneMap;
