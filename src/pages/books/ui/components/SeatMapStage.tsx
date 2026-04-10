import { useMemo, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

import type { SeatBlock, SeatItem } from '@/pages/books/model/types';

import SeatBlockGrid from './SeatBlockGrid';

const MIN_SCALE = 0.8;
const MAX_SCALE = 2.4;
const SCALE_STEP = 0.2;
const MINIMAP_WIDTH = 215;
const MINIMAP_HEIGHT = 140;

type MinimapLayout = {
   offsetX: number;
   offsetY: number;
   scale: number;
   blocks: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
   }>;
} | null;

type MinimapViewport = {
   left: number;
   top: number;
   width: number;
   height: number;
} | null;

type SeatMapStageProps = {
   directionBadgePosition: {
      left: number;
      top: number;
   } | null;
   isSeatMapDragging: boolean;
   mapViewportRef: RefObject<HTMLDivElement | null>;
   minimapLayout: MinimapLayout;
   minimapViewport: MinimapViewport;
   seatBlocks: SeatBlock[];
   seatMapOffset: {
      x: number;
      y: number;
   };
   seatMapScale: number;
   stageSize: {
      width: number;
      height: number;
   };
   seats: SeatItem[];
   selectedSeatIdSet: Set<string>;
   zoneColor: string;
   onMapPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
   onMapPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
   onMapPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
   onResetSeatMapView: () => void;
   onToggleSeat: (seat: SeatItem) => void;
   onUpdateSeatMapScale: (nextScale: number) => void;
   zoneName: string;
};

function SeatMapStage({
   directionBadgePosition,
   isSeatMapDragging,
   mapViewportRef,
   minimapLayout,
   minimapViewport,
   seatBlocks,
   seatMapOffset,
   seatMapScale,
   stageSize,
   seats,
   selectedSeatIdSet,
   zoneColor,
   onMapPointerDown,
   onMapPointerMove,
   onMapPointerUp,
   onResetSeatMapView,
   onToggleSeat,
   onUpdateSeatMapScale,
   zoneName,
}: SeatMapStageProps) {
   const seatsByBlock = useMemo(() => {
      return seats.reduce<Record<string, SeatItem[]>>((groups, seat) => {
         const key = seat.block;
         const currentSeats = groups[key];

         if (currentSeats) {
            currentSeats.push(seat);
         } else {
            groups[key] = [seat];
         }

         return groups;
      }, {});
   }, [seats]);

   return (
      <div className="relative h-full min-h-[516px] overflow-hidden bg-[#eef0f3] lg:min-h-[560px] lg:rounded-[24px]">
         <div ref={mapViewportRef} className="absolute inset-0 overflow-hidden">
            <div
               className={[
                  'absolute left-1/2 top-14 origin-top',
                  isSeatMapDragging ? 'cursor-grabbing' : 'cursor-grab',
                  isSeatMapDragging ? '' : 'transition-transform duration-150',
                  'touch-none',
               ].join(' ')}
               style={{
                  width: `${stageSize.width}px`,
                  height: `${stageSize.height}px`,
                  transform: `translate3d(calc(-50% + ${seatMapOffset.x}px), ${seatMapOffset.y}px, 0) scale(${seatMapScale})`,
               }}
               onPointerDown={onMapPointerDown}
               onPointerMove={onMapPointerMove}
               onPointerUp={onMapPointerUp}
               onPointerCancel={onMapPointerUp}
            >
               {directionBadgePosition ? (
                  <div
                     className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[10px] bg-[rgba(233,235,238,0.72)] px-8 py-3 text-body-1-bold text-muted-foreground shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur lg:rounded-xl lg:bg-white/70 lg:text-body-2-semibold"
                     style={{
                        left: `${directionBadgePosition.left}px`,
                        top: `${directionBadgePosition.top}px`,
                        transform: 'translateX(-50%)',
                     }}
                  >
                     경기장 방향
                  </div>
               ) : null}

               {seatBlocks.map((block, index) => (
                  <SeatBlockGrid
                     key={block.id}
                     block={block}
                     blockIndex={index}
                     seats={seatsByBlock[block.id] ?? seatsByBlock[block.label] ?? []}
                     selectedSeatIdSet={selectedSeatIdSet}
                     onToggleSeat={onToggleSeat}
                  />
               ))}
            </div>
         </div>

         <div className="absolute bottom-5 left-5 hidden overflow-hidden rounded-[16px] bg-[#b0b0b0] shadow-[0_16px_40px_rgba(15,23,42,0.18)] lg:block">
            <div className="relative h-[140px] w-[215px]">
               <svg viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`} className="h-full w-full" role="img" aria-label={`${zoneName} 섹션 미니맵`}>
                  <rect width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} fill="#b0b0b0" />
                  {minimapLayout?.blocks.map((block) => (
                     <rect
                        key={block.id}
                        x={block.x}
                        y={block.y}
                        width={block.width}
                        height={block.height}
                        rx="2"
                        fill={zoneColor}
                        fillOpacity="0.82"
                     />
                  ))}
                  {minimapViewport ? (
                     <rect
                        x={minimapViewport.left}
                        y={minimapViewport.top}
                        width={Math.max(12, minimapViewport.width)}
                        height={Math.max(12, minimapViewport.height)}
                        rx="6"
                        fill="rgba(255,255,255,0.08)"
                        stroke="#ffffff"
                        strokeWidth="4"
                     />
                  ) : null}
               </svg>
            </div>
         </div>

         <div className="absolute bottom-6 right-6 hidden flex-col gap-2 lg:flex">
            <MapControlButton ariaLabel="확대" onClick={() => onUpdateSeatMapScale(Math.min(MAX_SCALE, seatMapScale + SCALE_STEP))}>
               <Plus className="h-5 w-5" aria-hidden="true" />
            </MapControlButton>
            <MapControlButton ariaLabel="축소" onClick={() => onUpdateSeatMapScale(Math.max(MIN_SCALE, seatMapScale - SCALE_STEP))}>
               <Minus className="h-5 w-5" aria-hidden="true" />
            </MapControlButton>
            <MapControlButton ariaLabel="초기화" onClick={onResetSeatMapView}>
               <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </MapControlButton>
         </div>
      </div>
   );
}

type MapControlButtonProps = {
   ariaLabel: string;
   children: ReactNode;
   onClick: () => void;
};

function MapControlButton({ ariaLabel, children, onClick }: MapControlButtonProps) {
   return (
      <button
         type="button"
         aria-label={ariaLabel}
         onClick={onClick}
         className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-light bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
      >
         {children}
      </button>
   );
}

export default SeatMapStage;
