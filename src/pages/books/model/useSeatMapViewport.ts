import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { SeatMapSectionBounds } from './useSeatMapLayout';

const MIN_SCALE = 0.8;
const MAX_SCALE = 2.4;
const STAGE_WIDTH = 1240;
const STAGE_TOP_OFFSET = 56;
const DEFAULT_SEAT_MAP_LEFT_PADDING = 24;
const DEFAULT_SEAT_MAP_TOP_PADDING = 24;

type UseSeatMapViewportParams = {
   sectionBounds: SeatMapSectionBounds;
   zoneId: string;
};

export function useSeatMapViewport({ sectionBounds, zoneId }: UseSeatMapViewportParams) {
   const [seatMapScale, setSeatMapScale] = useState(1);
   const [seatMapOffset, setSeatMapOffset] = useState({ x: 0, y: 0 });
   const [isSeatMapDragging, setIsSeatMapDragging] = useState(false);
   const [mapViewportSize, setMapViewportSize] = useState({ width: 0, height: 0 });
   const dragStartRef = useRef<{ x: number; y: number } | null>(null);
   const mapViewportRef = useRef<HTMLDivElement | null>(null);

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

   const getDefaultSeatMapView = () => {
      if (!sectionBounds || mapViewportSize.width === 0 || mapViewportSize.height === 0) {
         return {
            scale: 1,
            offset: { x: 0, y: 0 },
         };
      }

      const contentWidth = sectionBounds.right - sectionBounds.left;
      const contentHeight = sectionBounds.bottom - sectionBounds.top;
      const availableWidth = Math.max(1, mapViewportSize.width - DEFAULT_SEAT_MAP_LEFT_PADDING * 2);
      const availableHeight = Math.max(1, mapViewportSize.height - STAGE_TOP_OFFSET - DEFAULT_SEAT_MAP_TOP_PADDING * 2);
      const scale = Math.min(
         MAX_SCALE,
         Math.max(MIN_SCALE, Math.min(availableWidth / contentWidth, availableHeight / contentHeight)),
      );
      const contentCenterX = (sectionBounds.left + sectionBounds.right) / 2;
      const contentCenterY = (sectionBounds.top + sectionBounds.bottom) / 2;
      const targetCenterY = STAGE_TOP_OFFSET + DEFAULT_SEAT_MAP_TOP_PADDING + availableHeight / 2;

      return {
         scale: Number(scale.toFixed(2)),
         offset: {
            x: (STAGE_WIDTH / 2 - contentCenterX) * scale,
            y: targetCenterY - STAGE_TOP_OFFSET - contentCenterY * scale,
         },
      };
   };

   const resetSeatMapView = () => {
      const nextView = getDefaultSeatMapView();

      setSeatMapScale(nextView.scale);
      setSeatMapOffset(nextView.offset);
   };

   useEffect(() => {
      const nextView = getDefaultSeatMapView();

      setSeatMapScale(nextView.scale);
      setSeatMapOffset(nextView.offset);
   }, [mapViewportSize.height, mapViewportSize.width, sectionBounds, zoneId]);

   return {
      isSeatMapDragging,
      mapViewportRef,
      mapViewportSize,
      onMapPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
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
      },
      onMapPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
         if (!isSeatMapDragging || !dragStartRef.current) {
            return;
         }

         setSeatMapOffset({
            x: event.clientX - dragStartRef.current.x,
            y: event.clientY - dragStartRef.current.y,
         });
      },
      onMapPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
         dragStartRef.current = null;
         setIsSeatMapDragging(false);

         if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
         }
      },
      onUpdateSeatMapScale: (nextScale: number) => {
         setSeatMapScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(nextScale.toFixed(2)))));
      },
      resetSeatMapView,
      seatMapOffset,
      seatMapScale,
   };
}
