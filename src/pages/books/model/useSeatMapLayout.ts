import { useMemo } from 'react';

import type { SeatBlock } from './types';

const BLOCK_SEAT_SIZE = 18;
const BLOCK_SEAT_GAP = 2;
const BLOCK_CARD_COLUMN_GAP = 48;
const STAGE_MIN_WIDTH = 1240;
const STAGE_MIN_HEIGHT = 620;
const STAGE_HORIZONTAL_PADDING = 160;
const STAGE_VERTICAL_PADDING = 180;
const STAGE_TOP_OFFSET = 56;
const MINIMAP_WIDTH = 215;
const MINIMAP_HEIGHT = 140;
const MINIMAP_PADDING_X = 24;
const MINIMAP_PADDING_Y = 18;

export type SeatMapSectionBounds = {
   left: number;
   top: number;
   right: number;
   bottom: number;
   blocks: Array<
      SeatBlock & {
         width: number;
         height: number;
         renderedOffsetX: number;
         right: number;
         bottom: number;
      }
   >;
} | null;

type UseSeatMapLayoutParams = {
   mapViewportSize: {
      width: number;
      height: number;
   };
   seatBlocks: SeatBlock[];
   seatMapOffset: {
      x: number;
      y: number;
   };
   seatMapScale: number;
};

export function useSeatMapLayout({
   mapViewportSize,
   seatBlocks,
   seatMapOffset,
   seatMapScale,
}: UseSeatMapLayoutParams) {
   const sectionBounds = useMemo<SeatMapSectionBounds>(() => {
      if (seatBlocks.length === 0) {
         return null;
      }

      const blockMetrics = seatBlocks.map((block, index) => {
         const width = block.cols * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;
         const height = block.rows * (BLOCK_SEAT_SIZE + BLOCK_SEAT_GAP) - BLOCK_SEAT_GAP;
         const renderedOffsetX = block.offsetX + index * BLOCK_CARD_COLUMN_GAP;

         return {
            ...block,
            width,
            height,
            renderedOffsetX,
            right: renderedOffsetX + width,
            bottom: block.offsetY + height,
         };
      });

      return {
         left: Math.min(...blockMetrics.map(block => block.renderedOffsetX)),
         top: Math.min(...blockMetrics.map(block => block.offsetY)),
         right: Math.max(...blockMetrics.map(block => block.right)),
         bottom: Math.max(...blockMetrics.map(block => block.bottom)),
         blocks: blockMetrics,
      };
   }, [seatBlocks]);

   const directionBadgePosition = useMemo(() => {
      if (!sectionBounds) {
         return null;
      }

      const badgeHeight = 48;
      const sectionHeight = sectionBounds.bottom - sectionBounds.top;
      const badgeOffset = Math.max(156, Math.min(260, Math.round(sectionHeight * 0.44)));

      return {
         left: (sectionBounds.left + sectionBounds.right) / 2,
         top: Math.max(-160, sectionBounds.top - badgeHeight - badgeOffset),
      };
   }, [sectionBounds]);

   const stageSize = useMemo(() => {
      if (!sectionBounds) {
         return {
            width: STAGE_MIN_WIDTH,
            height: STAGE_MIN_HEIGHT,
         };
      }

      return {
         width: Math.max(
            STAGE_MIN_WIDTH,
            Math.ceil(sectionBounds.right - sectionBounds.left + STAGE_HORIZONTAL_PADDING * 2),
         ),
         height: Math.max(
            STAGE_MIN_HEIGHT,
            Math.ceil(sectionBounds.bottom - sectionBounds.top + STAGE_VERTICAL_PADDING * 2),
         ),
      };
   }, [sectionBounds]);

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
         blocks: sectionBounds.blocks.map(block => ({
            id: block.id,
            x: offsetX + (block.renderedOffsetX - sectionBounds.left) * scale,
            y: offsetY + (block.offsetY - sectionBounds.top) * scale,
            width: block.width * scale,
            height: block.height * scale,
         })),
         offsetX,
         offsetY,
         scale,
      };
   }, [sectionBounds]);

   const minimapViewport = useMemo(() => {
      if (!sectionBounds || !minimapLayout) {
         return null;
      }

      if (mapViewportSize.width === 0 || mapViewportSize.height === 0) {
         return null;
      }

      const stageLeft = (mapViewportSize.width - stageSize.width * seatMapScale) / 2 + seatMapOffset.x;
      const stageTop = STAGE_TOP_OFFSET + seatMapOffset.y;
      const visibleLeft = (0 - stageLeft) / seatMapScale;
      const visibleTop = (0 - stageTop) / seatMapScale;
      const visibleRight = (mapViewportSize.width - stageLeft) / seatMapScale;
      const visibleBottom = (mapViewportSize.height - stageTop) / seatMapScale;
      const intersectLeft = Math.max(sectionBounds.left, visibleLeft);
      const intersectTop = Math.max(sectionBounds.top, visibleTop);
      const intersectRight = Math.min(sectionBounds.right, visibleRight);
      const intersectBottom = Math.min(sectionBounds.bottom, visibleBottom);

      if (intersectRight <= intersectLeft || intersectBottom <= intersectTop) {
         return null;
      }

      return {
         left: minimapLayout.offsetX + (intersectLeft - sectionBounds.left) * minimapLayout.scale,
         top: minimapLayout.offsetY + (intersectTop - sectionBounds.top) * minimapLayout.scale,
         width: (intersectRight - intersectLeft) * minimapLayout.scale,
         height: (intersectBottom - intersectTop) * minimapLayout.scale,
      };
   }, [mapViewportSize.height, mapViewportSize.width, minimapLayout, seatMapOffset.x, seatMapOffset.y, seatMapScale, sectionBounds, stageSize.width]);

   return {
      directionBadgePosition,
      minimapLayout,
      minimapViewport,
      sectionBounds,
      stageSize,
   };
}
