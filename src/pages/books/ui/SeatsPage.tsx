import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import { createSeatsForZone, getSeatBlocks } from '@/pages/books/model/seatData';
import { useSeatSelectionStore } from '@/pages/books/model/useSeatSelectionStore';
import { BOOKING_ZONES, formatPrice } from '@/pages/books/model/zoneData';
import type { SeatItem } from '@/pages/books/model/types';
import SeatBlockGrid from './components/SeatBlockGrid';

const KIA_STADIUM_IMAGE = '/baseball/seat/kia.png';
const MIN_SCALE = 0.8;
const MAX_SCALE = 2.4;
const SCALE_STEP = 0.2;
const OVERVIEW_MIN_SCALE = 0.8;
const OVERVIEW_MAX_SCALE = 2;
const OVERVIEW_SCALE_STEP = 0.2;
const STAGE_WIDTH = 1240;
const STAGE_HEIGHT = 620;
const BLOCK_SEAT_SIZE = 18;
const BLOCK_SEAT_GAP = 2;
const MINIMAP_WIDTH = 215;
const MINIMAP_HEIGHT = 140;
const MINIMAP_PADDING_X = 24;
const MINIMAP_PADDING_Y = 18;

const stepLabels = ['구역 선택', '좌석 선택', '배송/주문자 확인', '결제'];

type SelectedSeatSummaryItem = {
   seat: SeatItem;
   zoneId: string;
   zoneName: string;
   price: number;
};

function SeatsPage() {
   const navigate = useNavigate();
   const { zoneId = '' } = useParams();

   const zone = useMemo(
      () => BOOKING_ZONES.find((item) => item.id === zoneId) ?? BOOKING_ZONES[0],
      [zoneId],
   );

   const initialSeats = useMemo(() => createSeatsForZone(zone), [zone]);
   const seatBlocks = useMemo(() => getSeatBlocks(zone.id), [zone.id]);
   const zonesState = useSeatSelectionStore((state) => state.zones);
   const zoneSeatState = useSeatSelectionStore((state) => state.zones[zone.id]);
   const initializeZone = useSeatSelectionStore((state) => state.initializeZone);
   const toggleSelectedSeat = useSeatSelectionStore((state) => state.toggleSelectedSeat);
   const clearAllSelections = useSeatSelectionStore((state) => state.clearAllSelections);

   const [seatMapScale, setSeatMapScale] = useState(1);
   const [seatMapOffset, setSeatMapOffset] = useState({ x: 0, y: 0 });
   const [isSeatMapDragging, setIsSeatMapDragging] = useState(false);
   const dragStartRef = useRef<{ x: number; y: number } | null>(null);
   const [overviewScale, setOverviewScale] = useState(1);
   const mapViewportRef = useRef<HTMLDivElement | null>(null);
   const [mapViewportSize, setMapViewportSize] = useState({ width: 0, height: 0 });

   useEffect(() => {
      initializeZone(zone.id, initialSeats);
   }, [initialSeats, initializeZone, zone.id]);

   useEffect(() => {
      const updateViewportSize = () => {
         const element = mapViewportRef.current;

         if (!element) {
            return;
         }

         setMapViewportSize({
            width: element.clientWidth,
            height: element.clientHeight,
         });
      };

      updateViewportSize();
      window.addEventListener('resize', updateViewportSize);

      return () => {
         window.removeEventListener('resize', updateViewportSize);
      };
   }, []);

   const seats = useMemo(() => {
      if (!zoneSeatState) {
         return initialSeats;
      }

      return zoneSeatState.seatOrder
         .map((seatId) => zoneSeatState.seatMap[seatId])
         .filter((seat): seat is SeatItem => Boolean(seat));
   }, [initialSeats, zoneSeatState]);

   const selectedSeatIds = zoneSeatState?.selectedSeatIds ?? [];

   const selectedSeats = useMemo<SelectedSeatSummaryItem[]>(() => {
      return Object.entries(zonesState).flatMap(([selectedZoneId, selectedZoneState]) => {
         const selectedZone = BOOKING_ZONES.find((item) => item.id === selectedZoneId);

         if (!selectedZone) {
            return [];
         }

         return selectedZoneState.selectedSeatIds
            .map((seatId) => selectedZoneState.seatMap[seatId])
            .filter((seat): seat is SeatItem => Boolean(seat))
            .map((seat) => ({
               seat,
               zoneId: selectedZoneId,
               zoneName: selectedZone.name,
               price: selectedZone.price,
            }));
      });
   }, [zonesState]);

   const selectedPrice = selectedSeats.reduce((total, item) => total + item.price, 0);

   const sectionBounds = useMemo(() => {
      if (seatBlocks.length === 0) {
         return null;
      }

      const blockMetrics = seatBlocks.map((block) => {
         const width = block.cols * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;
         const height = block.rows * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;

         return {
            ...block,
            width,
            height,
            right: block.offsetX + width,
            bottom: block.offsetY + height,
         };
      });

      return {
         left: Math.min(...blockMetrics.map((block) => block.offsetX)),
         top: Math.min(...blockMetrics.map((block) => block.offsetY)),
         right: Math.max(...blockMetrics.map((block) => block.right)),
         bottom: Math.max(...blockMetrics.map((block) => block.bottom)),
         blocks: blockMetrics,
      };
   }, [seatBlocks]);

   const minimapLayout = useMemo(() => {
      if (!sectionBounds) {
         return null;
      }

      const width = sectionBounds.right - sectionBounds.left;
      const height = sectionBounds.bottom - sectionBounds.top;
      const scale = Math.min(
         (MINIMAP_WIDTH - MINIMAP_PADDING_X * 2) / width,
         (MINIMAP_HEIGHT - MINIMAP_PADDING_Y * 2) / height,
      );
      const offsetX = (MINIMAP_WIDTH - width * scale) / 2;
      const offsetY = (MINIMAP_HEIGHT - height * scale) / 2;

      return {
         bounds: sectionBounds,
         scale,
         offsetX,
         offsetY,
         blocks: sectionBounds.blocks.map((block) => ({
            id: block.id,
            x: offsetX + (block.offsetX - sectionBounds.left) * scale,
            y: offsetY + (block.offsetY - sectionBounds.top) * scale,
            width: block.width * scale,
            height: block.height * scale,
         })),
      };
   }, [sectionBounds]);

   const minimapViewport = useMemo(() => {
      if (!sectionBounds) {
         return null;
      }

      if (mapViewportSize.width === 0 || mapViewportSize.height === 0) {
         return null;
      }

      const stageLeft = (mapViewportSize.width - STAGE_WIDTH * seatMapScale) / 2 + seatMapOffset.x;
      const stageTop = 56 + seatMapOffset.y;
      const visibleX = Math.max(0, (0 - stageLeft) / seatMapScale);
      const visibleY = Math.max(0, (0 - stageTop) / seatMapScale);
      const visibleWidth = Math.min(STAGE_WIDTH - visibleX, mapViewportSize.width / seatMapScale);
      const visibleHeight = Math.min(STAGE_HEIGHT - visibleY, mapViewportSize.height / seatMapScale);

      const intersectLeft = Math.max(sectionBounds.left, visibleX);
      const intersectTop = Math.max(sectionBounds.top, visibleY);
      const intersectRight = Math.min(sectionBounds.right, visibleX + visibleWidth);
      const intersectBottom = Math.min(sectionBounds.bottom, visibleY + visibleHeight);

      if (intersectRight <= intersectLeft || intersectBottom <= intersectTop || !minimapLayout) {
         return null;
      }

      return {
         left: minimapLayout.offsetX + (intersectLeft - sectionBounds.left) * minimapLayout.scale,
         top: minimapLayout.offsetY + (intersectTop - sectionBounds.top) * minimapLayout.scale,
         width: (intersectRight - intersectLeft) * minimapLayout.scale,
         height: (intersectBottom - intersectTop) * minimapLayout.scale,
      };
   }, [
      mapViewportSize.height,
      mapViewportSize.width,
      minimapLayout,
      seatMapOffset.x,
      seatMapOffset.y,
      seatMapScale,
      sectionBounds,
   ]);

   const updateSeatMapScale = (nextScale: number) => {
      setSeatMapScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(nextScale.toFixed(2)))));
   };

   const resetSeatMapView = () => {
      setSeatMapScale(1);
      setSeatMapOffset({ x: 0, y: 0 });
   };

   const updateOverviewScale = (nextScale: number) => {
      setOverviewScale(
         Math.min(OVERVIEW_MAX_SCALE, Math.max(OVERVIEW_MIN_SCALE, Number(nextScale.toFixed(2)))),
      );
   };

   const resetOverviewView = () => {
      setOverviewScale(1);
   };

   const toggleSeat = (seat: SeatItem) => {
      if (seat.status === 'disabled' || seat.status === 'held') {
         return;
      }

      toggleSelectedSeat(zone.id, seat.id);
   };

   const handleMapPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (seatMapScale <= 1) {
         return;
      }

      const target = event.target as HTMLElement;
      if (target.closest('button')) {
         return;
      }

      dragStartRef.current = {
         x: event.clientX - seatMapOffset.x,
         y: event.clientY - seatMapOffset.y,
      };
      setIsSeatMapDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
   };

   const handleMapPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isSeatMapDragging || !dragStartRef.current) {
         return;
      }

      setSeatMapOffset({
         x: event.clientX - dragStartRef.current.x,
         y: event.clientY - dragStartRef.current.y,
      });
   };

   const handleMapPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
      dragStartRef.current = null;
      setIsSeatMapDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
         event.currentTarget.releasePointerCapture(event.pointerId);
      }
   };

   return (
      <div className="w-full bg-background text-foreground">
         <main className="flex min-h-[calc(100vh-140px)] flex-col xl:h-[calc(100vh-140px)] xl:flex-row">
            <section className="flex min-h-[680px] flex-1 flex-col overflow-hidden bg-[#f1f2f4]">
               <div className="flex items-center justify-between gap-4 px-5 py-3 lg:px-8">
                  <div className="inline-flex min-w-0 items-center gap-2 rounded-[12px] bg-background px-3 py-2">
                     <span className="inline-flex items-center justify-center rounded-[8px] bg-primary-light px-2 py-1 text-caption-1-bold text-primary">
                        선택 구역
                     </span>
                     <span className="truncate text-body-2-bold text-foreground">{zone.name}</span>
                  </div>

                  <div className="hidden items-center lg:flex" aria-label="예매 단계">
                     {stepLabels.map((label, index) => {
                        const isCurrent = index === 1;

                        return (
                           <div key={label} className="flex items-center">
                              <span
                                 className={[
                                    'px-4 py-2 text-label-3-semibold whitespace-nowrap',
                                    isCurrent ? 'text-[#646f7c]' : 'text-[#9ba3ae]',
                                 ].join(' ')}
                              >
                                 {label}
                              </span>
                              {index < stepLabels.length - 1 ? (
                                 <span className="text-[18px] leading-none font-bold text-border-light" aria-hidden="true">
                                    ›
                                 </span>
                              ) : null}
                           </div>
                        );
                     })}
                  </div>
               </div>

               <div className="relative flex-1 overflow-hidden px-4 pb-6 lg:px-8">
                  <div className="relative h-full min-h-[560px] overflow-hidden rounded-[24px] bg-[#eef0f3]">
                     <div ref={mapViewportRef} className="absolute inset-0 overflow-hidden">
                        <div
                           className={[
                              'absolute left-1/2 top-14 origin-top',
                              isSeatMapDragging ? 'cursor-grabbing' : seatMapScale > 1 ? 'cursor-grab' : 'cursor-default',
                              isSeatMapDragging ? '' : 'transition-transform duration-150',
                           ].join(' ')}
                           style={{
                              width: `${STAGE_WIDTH}px`,
                              height: `${STAGE_HEIGHT}px`,
                              transform: `translate3d(calc(-50% + ${seatMapOffset.x}px), ${seatMapOffset.y}px, 0) scale(${seatMapScale})`,
                           }}
                           onPointerDown={handleMapPointerDown}
                           onPointerMove={handleMapPointerMove}
                           onPointerUp={handleMapPointerUp}
                           onPointerCancel={handleMapPointerUp}
                        >
                           <div
                              className="absolute rounded-xl bg-white/70 px-8 py-3 text-body-2-semibold text-muted-foreground shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur"
                              style={{
                                 left: '50%',
                                 top: '24px',
                                 transform: 'translateX(-50%)',
                              }}
                           >
                              경기장 방향
                           </div>

                           {seatBlocks.map((block, index) => (
                              <SeatBlockGrid
                                 key={block.id}
                                 block={block}
                                 blockIndex={index}
                                 seats={seats.filter((seat) => seat.block === block.id)}
                                 selectedSeatIds={selectedSeatIds}
                                 onToggleSeat={toggleSeat}
                              />
                           ))}
                        </div>
                     </div>

                     <div className="absolute bottom-5 left-5 overflow-hidden rounded-[16px] bg-[#b0b0b0] shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                        <div className="relative h-[140px] w-[215px]">
                           <svg
                              viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
                              className="h-full w-full"
                              role="img"
                              aria-label={`${zone.name} 섹션 미니맵`}
                           >
                              <rect width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} fill="#b0b0b0" />
                              {minimapLayout?.blocks.map((block) => (
                                 <rect
                                    key={block.id}
                                    x={block.x}
                                    y={block.y}
                                    width={block.width}
                                    height={block.height}
                                    rx="2"
                                    fill={zone.color}
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

                     <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                        <MapControlButton ariaLabel="확대" onClick={() => updateSeatMapScale(seatMapScale + SCALE_STEP)}>
                           <Plus className="h-5 w-5" aria-hidden="true" />
                        </MapControlButton>
                        <MapControlButton ariaLabel="축소" onClick={() => updateSeatMapScale(seatMapScale - SCALE_STEP)}>
                           <Minus className="h-5 w-5" aria-hidden="true" />
                        </MapControlButton>
                        <MapControlButton ariaLabel="초기화" onClick={resetSeatMapView}>
                           <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        </MapControlButton>
                     </div>
                  </div>
               </div>
            </section>

            <aside className="flex w-full shrink-0 flex-col border-l border-border-light bg-background xl:w-[420px]">
               <div className="relative h-[220px] overflow-hidden border-b border-border-light bg-[#e9ebee] px-5 py-4">
                  <div
                     className="relative mx-auto h-full max-w-[260px] origin-center transition-transform duration-150"
                     style={{ transform: `scale(${overviewScale})` }}
                  >
                     <img
                        src={KIA_STADIUM_IMAGE}
                        alt="기아 챔피언스필드 전체 좌석도"
                        className="h-full w-full object-contain"
                        draggable={false}
                     />

                     {BOOKING_ZONES.map((item) => {
                        const hotspot = item.hotspot[0];
                        const isCurrent = item.id === zone.id;

                        if (!hotspot) {
                           return null;
                        }

                        return (
                           <button
                              key={item.id}
                              type="button"
                              onClick={() => navigate(`/books/seats/${item.id}`)}
                              className={[
                                 'absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-1 text-caption-1-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                 isCurrent ? 'scale-105 text-white shadow-sm ring-2 ring-white/80' : 'text-foreground hover:-translate-y-[55%]',
                              ].join(' ')}
                              style={{
                                 left: `${hotspot.x}%`,
                                 top: `${hotspot.y}%`,
                                 borderColor: item.color,
                                 backgroundColor: isCurrent ? `${item.color}D9` : `${item.color}7A`,
                              }}
                              aria-label={`${item.name} 구역으로 이동`}
                              aria-pressed={isCurrent}
                           >
                              {item.sectionCode}
                           </button>
                        );
                     })}
                  </div>

                  <div className="absolute bottom-5 right-5 flex flex-col gap-2">
                     <MapControlButton
                        ariaLabel="확대"
                        onClick={() => updateOverviewScale(overviewScale + OVERVIEW_SCALE_STEP)}
                     >
                        <Plus className="h-5 w-5" aria-hidden="true" />
                     </MapControlButton>
                     <MapControlButton
                        ariaLabel="축소"
                        onClick={() => updateOverviewScale(overviewScale - OVERVIEW_SCALE_STEP)}
                     >
                        <Minus className="h-5 w-5" aria-hidden="true" />
                     </MapControlButton>
                     <MapControlButton ariaLabel="초기화" onClick={resetOverviewView}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                     </MapControlButton>
                  </div>
               </div>

               <div className="flex items-center justify-between px-5 py-5">
                  <div className="flex items-center gap-2">
                     <h2 className="text-heading-3-bold text-foreground">선택 좌석</h2>
                     {selectedSeats.length > 0 ? (
                        <span className="text-heading-4-bold text-primary">{selectedSeats.length}</span>
                     ) : null}
                  </div>
                  {selectedSeats.length > 0 ? (
                     <button
                        type="button"
                        onClick={clearAllSelections}
                        className="text-body-2-medium text-muted-foreground transition-colors hover:text-foreground"
                     >
                        전체 삭제
                     </button>
                  ) : null}
               </div>

               <div className="flex flex-1 flex-col justify-between gap-4 px-5 pb-5">
                  <div className="flex-1 overflow-y-auto rounded-2xl bg-background">
                     {selectedSeats.length > 0 ? (
                        <ul className="space-y-3">
                           {selectedSeats.map((item) => (
                              <li
                                 key={item.seat.id}
                                 className="flex items-center justify-between rounded-xl border border-border-light px-4 py-3"
                              >
                                 <div>
                                    <p className="text-body-2-semibold text-foreground">{item.zoneName}</p>
                                    <p className="text-body-2-regular text-muted-foreground">
                                       {item.seat.block}구역 {item.seat.rowLabel} {item.seat.seatNumber}번
                                    </p>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <span className="text-body-2-semibold text-primary">{formatPrice(item.price)}</span>
                                    <button
                                       type="button"
                                       onClick={() => toggleSelectedSeat(item.zoneId, item.seat.id)}
                                       className="text-caption-1-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                       삭제
                                    </button>
                                 </div>
                              </li>
                           ))}
                        </ul>
                     ) : (
                        <div className="flex h-full min-h-[320px] items-center justify-center text-body-1-regular text-muted-foreground">
                           선택한 좌석이 없습니다.
                        </div>
                     )}
                  </div>

                  <div className="space-y-3 rounded-2xl bg-surface p-4">
                     <div className="flex items-center justify-between text-body-2-regular text-muted-foreground">
                        <span>선택 구역</span>
                        <span className="text-body-2-semibold text-foreground">
                           {selectedSeats.length > 0 ? `${selectedSeats.length}개 좌석 선택` : '-'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between text-body-2-regular text-muted-foreground">
                        <span>총 좌석 수</span>
                        <span className="text-body-2-semibold text-foreground">{selectedSeats.length}석</span>
                     </div>
                     <div className="flex items-center justify-between text-body-1-semibold text-foreground">
                        <span>예상 결제 금액</span>
                        <span>{formatPrice(selectedPrice)}</span>
                     </div>
                  </div>

                  <button
                     type="button"
                     disabled={selectedSeats.length === 0}
                     className={[
                        'h-[56px] w-full rounded-[8px] text-label-1-bold transition-colors',
                        selectedSeats.length === 0
                           ? 'bg-fill-disabled text-disabled-foreground'
                           : 'bg-primary text-white hover:bg-primary-strong',
                     ].join(' ')}
                  >
                     예매하기
                  </button>
               </div>
            </aside>
         </main>
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

export default SeatsPage;
