import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import TicketTypeBadge from './TicketTypeBadge';
import type { PurchaseHistoryItem, SaleHistoryItem } from '../model/historyCard';

type BaseHistoryLayoutProps = {
   item: PurchaseHistoryItem | SaleHistoryItem;
   expanded: boolean;
   isPurchase: boolean;
   showDash: boolean;
   showSaleDash: boolean;
   showSellBtn: boolean;
   showCancelBtn: boolean;
   showQrBtn: boolean;
   canCancelSale: boolean;
   onToggleExpanded: () => void;
   onNavigateDetail: () => void;
   onOpenResell: () => void;
   onOpenCancel: () => void;
   onOpenQr: () => void;
};

function SeatToggle({
   section,
   seatCount,
   expanded,
   onToggle,
}: {
   section: string;
   seatCount: number;
   expanded: boolean;
   onToggle: () => void;
}) {
   return (
      <button className="flex items-center gap-1 text-left" onClick={onToggle} aria-expanded={expanded}>
         <span className="text-foreground text-body-2-medium whitespace-nowrap">
            {section}({seatCount})
         </span>
         <ChevronDown
            size={16}
            className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
         />
      </button>
   );
}

function SeatTags({ seats, className }: { seats: string[]; className?: string }) {
   return (
      <div className={className}>
         {seats.map((seat, index) => (
            <span
               key={index}
               className="border border-border rounded-[5px] px-1 py-0.5 text-muted-foreground text-caption-1-regular whitespace-nowrap"
            >
               {seat}
            </span>
         ))}
      </div>
   );
}

function PurchaseActionButtons({
   showDash,
   showSellBtn,
   showCancelBtn,
   showQrBtn,
   vertical,
   onOpenResell,
   onOpenCancel,
   onOpenQr,
}: {
   showDash: boolean;
   showSellBtn: boolean;
   showCancelBtn: boolean;
   showQrBtn: boolean;
   vertical: boolean;
   onOpenResell: () => void;
   onOpenCancel: () => void;
   onOpenQr: () => void;
}) {
   if (showDash) {
      return <span className="text-body-1-regular text-muted-foreground">-</span>;
   }

   const buttonClassName = vertical ? 'w-full' : 'flex-1';

   return (
      <>
         {showSellBtn ? (
            <Button variant="secondary" size="sm" className={buttonClassName} onClick={onOpenResell}>
               판매 등록
            </Button>
         ) : vertical ? (
            <div className="h-8.25 w-full" />
         ) : null}
         {showCancelBtn ? (
            <Button variant="tertiary" size="sm" className={buttonClassName} onClick={onOpenCancel}>
               예매 취소
            </Button>
         ) : vertical ? (
            <div className="h-8.25 w-full" />
         ) : null}
         {showQrBtn ? (
            <Button variant="tertiary" size="sm" className={buttonClassName} onClick={onOpenQr}>
               QR 확인
            </Button>
         ) : vertical ? (
            <div className="h-8.25 w-full" />
         ) : null}
      </>
   );
}

function SaleActionButton({
   showSaleDash,
   canCancelSale,
}: {
   showSaleDash: boolean;
   canCancelSale: boolean;
}) {
   if (showSaleDash) {
      return <span className="text-body-1-regular text-muted-foreground">-</span>;
   }

   if (!canCancelSale) {
      return null;
   }

   return (
      <Button variant="tertiary" size="sm" className="w-full" onClick={event => event.stopPropagation()}>
         판매 취소
      </Button>
   );
}

export function HistoryCardShell({
   item,
   isPurchase,
   onNavigateDetail,
   children,
}: {
   item: PurchaseHistoryItem | SaleHistoryItem;
   isPurchase: boolean;
   onNavigateDetail: () => void;
   children: React.ReactNode;
}) {
   const dateLabel = isPurchase ? '예약일자' : '판매일자';
   const detailLabel = isPurchase ? '예약상세' : '판매상세';

   return (
      <div
         className="bg-background border border-border rounded-[14px] flex flex-col gap-2.5 px-px py-3.25 cursor-pointer hover:border-primary/40 transition-colors"
         onClick={onNavigateDetail}
         role="button"
         tabIndex={0}
         onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
               onNavigateDetail();
            }
         }}
         aria-label={`${item.game.teams} ${detailLabel}`}
      >
         <div className="flex items-center justify-between lg:justify-start lg:gap-8 px-4 py-1">
            <div className="flex items-center gap-1 text-body-2-regular shrink-0 w-33">
               <span className="text-foreground">{dateLabel}:</span>
               <span className="text-body-2-semibold text-foreground">{item.orderDate}</span>
            </div>
            <Button
               variant="none"
               size="xs"
               className="flex items-center text-body-2-regular text-foreground shrink-0 px-0 hover:text-primary transition-colors gap-0"
               onClick={event => {
                  event.stopPropagation();
                  onNavigateDetail();
               }}
            >
               {detailLabel} <ChevronRight size={16} />
            </Button>
         </div>

         <Separator />
         {children}
      </div>
   );
}

export function DesktopHistoryCardLayout(props: BaseHistoryLayoutProps) {
   const { item, expanded, isPurchase, showDash, showSaleDash, showSellBtn, showCancelBtn, showQrBtn, canCancelSale } =
      props;
   const priceLabel = isPurchase ? '구매가' : '판매가';
   const price = isPurchase ? (item as PurchaseHistoryItem).price : (item as SaleHistoryItem).salePrice;
   const status = isPurchase ? (item as PurchaseHistoryItem).paymentStatus : (item as SaleHistoryItem).saleStatus;

   return (
      <div className="hidden lg:flex flex-row gap-4 p-4 items-stretch min-h-26.75">
         <div className="flex flex-col items-center justify-start w-36 shrink-0 px-1 gap-1.5">
            <div className="flex flex-col items-start gap-1.5 w-full h-full">
               <div className="flex flex-col items-start w-full h-full">
                  <TicketTypeBadge type={item.type} />
               </div>
               <p className="text-foreground text-body-2-medium break-all">{item.orderId}</p>
               <p className="flex w-full items-center justify-center text-(--text-tertiary) text-caption-1-regular text-center whitespace-nowrap mt-auto h-full">
                  {item.deliveryType}
               </p>
            </div>
         </div>

         <div className="flex flex-1 flex-col gap-2 min-w-0 px-1 justify-center min-h-24">
            <p className="text-foreground text-body-1-bold whitespace-nowrap">{item.game.teams}</p>
            <div className="flex items-center gap-2 h-4">
               <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.venue}</span>
               <span className="w-px h-2.5 bg-[#d1d5dc]" />
               <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.datetime}</span>
               <span className="w-px h-2.5 bg-[#d1d5dc]" />
               <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.quantity}매</span>
            </div>
            <div className="flex flex-col gap-1">
               <SeatToggle
                  section={item.game.section}
                  seatCount={item.game.seats.length}
                  expanded={expanded}
                  onToggle={props.onToggleExpanded}
               />
               {expanded && <SeatTags seats={item.game.seats} className="flex flex-wrap gap-1.5" />}
            </div>
         </div>

         <div className="flex flex-col items-center justify-center gap-1 w-28 shrink-0 text-center whitespace-nowrap">
            <p className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{priceLabel}</p>
            <p className="text-body-1-bold text-foreground">{price.toLocaleString()}원</p>
         </div>

         <div className="flex items-center justify-center w-28 shrink-0">
            <p className="text-body-1-semibold whitespace-nowrap text-foreground">{status}</p>
         </div>

         <div className="block w-px self-stretch bg-border shrink-0" />

         <div className="flex flex-col items-center justify-center gap-1 px-3 shrink-0 w-25 min-h-28.25">
            {isPurchase ? (
               <PurchaseActionButtons
                  showDash={showDash}
                  showSellBtn={showSellBtn}
                  showCancelBtn={showCancelBtn}
                  showQrBtn={showQrBtn}
                  vertical
                  onOpenResell={props.onOpenResell}
                  onOpenCancel={props.onOpenCancel}
                  onOpenQr={props.onOpenQr}
               />
            ) : (
               <SaleActionButton showSaleDash={showSaleDash} canCancelSale={canCancelSale} />
            )}
         </div>
      </div>
   );
}

export function MobileHistoryCardLayout(props: BaseHistoryLayoutProps) {
   const { item, expanded, isPurchase, showDash, showSaleDash, showSellBtn, showCancelBtn, showQrBtn, canCancelSale } =
      props;
   const priceLabel = isPurchase ? '구매가' : '판매가';
   const price = isPurchase ? (item as PurchaseHistoryItem).price : (item as SaleHistoryItem).salePrice;
   const status = isPurchase ? (item as PurchaseHistoryItem).paymentStatus : (item as SaleHistoryItem).saleStatus;

   return (
      <div className="flex flex-col gap-4 px-4 pt-1 pb-3 lg:hidden">
         <div className="flex flex-col gap-2.5 border border-[#e5e7eb]">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5">
                  <TicketTypeBadge type={item.type} />
                  <span className="text-[14px] font-medium leading-5.25 text-[#161d24] break-all max-w-40">{item.orderId}</span>
               </div>
               <span className="text-[16px] font-semibold leading-6 text-[#161d24] whitespace-nowrap">{status}</span>
            </div>

            <div className="flex flex-col gap-1">
               <p className="text-[16px] font-bold leading-6 text-black whitespace-nowrap">{item.game.teams}</p>
               <div className="flex items-center gap-2">
                  <span className="text-[14px] text-[#646f7c] whitespace-nowrap">{item.game.venue}</span>
                  <span className="w-px h-2.5 bg-[#d1d5dc] shrink-0" />
                  <span className="text-[14px] text-[#646f7c] whitespace-nowrap">{item.game.datetime}</span>
                  <span className="w-px h-2.5 bg-[#d1d5dc] shrink-0" />
                  <span className="text-[14px] text-[#646f7c] whitespace-nowrap">{item.game.quantity}매</span>
               </div>
            </div>

            <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">좌석</span>
                  <SeatToggle
                     section={item.game.section}
                     seatCount={item.game.seats.length}
                     expanded={expanded}
                     onToggle={props.onToggleExpanded}
                  />
               </div>
               {expanded && <SeatTags seats={item.game.seats} className="flex flex-wrap gap-1.5 pl-13" />}
               <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">수령방법</span>
                  <span className="text-[14px] font-normal leading-5.25 text-[#374553]">{item.deliveryType}</span>
               </div>
               <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">{priceLabel}</span>
                  <span className="text-[14px] font-normal leading-5.25 text-[#374553]">{price.toLocaleString()}원</span>
               </div>
            </div>
         </div>

         {isPurchase
            ? !showDash && (
                 <div className="flex gap-2">
                    <PurchaseActionButtons
                       showDash={false}
                       showSellBtn={showSellBtn}
                       showCancelBtn={showCancelBtn}
                       showQrBtn={showQrBtn}
                       vertical={false}
                       onOpenResell={props.onOpenResell}
                       onOpenCancel={props.onOpenCancel}
                       onOpenQr={props.onOpenQr}
                    />
                 </div>
              )
            : canCancelSale && !showSaleDash && (
                 <div className="flex gap-2">
                    <Button variant="tertiary" size="sm" className="flex-1" onClick={event => event.stopPropagation()}>
                       판매 취소
                    </Button>
                 </div>
              )}
      </div>
   );
}
