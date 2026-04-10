// src/pages/mypage/ui/HistoryCard.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Separator } from '@/shared/ui/separator';
import { Button } from '@/shared/ui/button';
import TicketTypeBadge from './TicketTypeBadge';
import type { TicketType } from './TicketTypeBadge';
import ResellRegisterDialog from './ResellRegisterDialog';
import QrViewDialog from './QrViewDialog';
import CancelBookingDialog from './CancelBookingDialog';
import NoAccountDialog from './NoAccountDialog';
import ActionStatusDialog from './ActionStatusDialog';
import { cancelResaleListing } from '@/entities/resale/api/resaleApi';

export type PurchaseStatus = '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
export type SaleStatus = '판매 중' | '판매 완료' | '정산 대기' | '판매 취소 대기' | '취소 대기' | '취소 완료';

export interface PurchaseHistoryItem {
   id: string;
   rawOrderId?: string;
   rawOrderDate?: string;
   gameId?: string;
   stadiumId?: string;
   orderId: string;
   orderDate: string;
   type: TicketType;
   seatGradeName?: string;
   game: {
      teams: string;
      venue: string;
      datetime: string;
      quantity: number;
      section: string;
      seats: string[];
   };
   price: number;
   paymentStatus: PurchaseStatus;
   deliveryType: string;
   /** 모바일 티켓이고 판매 등록 가능한 경우 */
   canSell: boolean;
   ticketIds?: string[];
   seatPrices?: number[];
}

export interface SaleHistoryItem {
   id: string;
   ticketId?: string;
   orderId: string;
   orderDate: string;
   soldAt?: string;
   canceledAt?: string;
   type: TicketType;
   game: {
      teams: string;
      venue: string;
      datetime: string;
      quantity: number;
      section: string;
      seats: string[];
   };
   salePrice: number;
   saleStatus: SaleStatus;
   deliveryType: string;
   /** 판매 취소 가능 여부 (판매중일 때만 true) */
   canCancel: boolean;
}

type HistoryCardProps = ({ mode: 'purchase'; item: PurchaseHistoryItem } | { mode: 'sale'; item: SaleHistoryItem }) & {
   onResellCompleteConfirm?: () => void;
};

const isPurchaseHistoryItem = (
   mode: HistoryCardProps['mode'],
   _item: PurchaseHistoryItem | SaleHistoryItem,
): _item is PurchaseHistoryItem => mode === 'purchase';


export default function HistoryCard(props: HistoryCardProps) {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const [expanded, setExpanded] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [noAccountOpen, setNoAccountOpen] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);
   const [saleCancelDialogType, setSaleCancelDialogType] = useState<'success' | 'error' | null>(null);

   const { mode, item } = props;
   const isPurchase = isPurchaseHistoryItem(mode, item);
   const purchaseItem = isPurchase ? item : null;
   const purchaseOrderId = purchaseItem?.rawOrderId;

   // 모드별 파생값
   const dateLabel = isPurchase ? '예약일자' : '판매일자';
   const detailLabel = isPurchase ? '예약상세' : '판매상세';
   const detailRoute = isPurchase ? `/mypage/purchase/${purchaseOrderId ?? item.id}` : `/mypage/sale/${item.id}`;
   const navigateToDetail = () => {
      if (isPurchase) {
         navigate(detailRoute, { state: { historyItem: item } });
      } else {
         navigate(detailRoute);
      }
   };
   const priceLabel = isPurchase ? '구매가' : '판매가';
   const price = isPurchase ? (item as PurchaseHistoryItem).price : (item as SaleHistoryItem).salePrice;
   const status = isPurchase ? (item as PurchaseHistoryItem).paymentStatus : (item as SaleHistoryItem).saleStatus;
   const hasPurchaseOrder = Boolean(purchaseOrderId);
   const isResalePurchase = purchaseItem?.type === '리셀';
   const isCancelablePurchaseStatus =
      (purchaseItem?.paymentStatus === '입금 대기' ||
         purchaseItem?.paymentStatus === '예매 완료' ||
         purchaseItem?.paymentStatus === '부분 처리');
   const isSellablePurchaseStatus =
      !isResalePurchase &&
      (purchaseItem?.paymentStatus === '예매 완료' || purchaseItem?.paymentStatus === '부분 처리');
   const showSellBtn =
      hasPurchaseOrder &&
      purchaseItem?.deliveryType === '모바일 티켓' &&
      isSellablePurchaseStatus;
   const showCancelBtn = hasPurchaseOrder && isCancelablePurchaseStatus;
   const showQrBtn =
      hasPurchaseOrder &&
      item.deliveryType === '모바일 티켓' &&
      isSellablePurchaseStatus;
   const showDash =
      isPurchase && (purchaseItem?.paymentStatus === '취소/환불' || purchaseItem?.paymentStatus === '관람 완료');
   const canCancelSale = !isPurchase && (item as SaleHistoryItem).canCancel;
   const showSaleDash = !isPurchase && !canCancelSale;
   const { mutate: cancelSale, isPending: isCancelingSale } = useMutation({
      mutationFn: () => cancelResaleListing(item.id),
      onSuccess: () => {
         void queryClient.invalidateQueries({ queryKey: ['myResales'] });
         void queryClient.invalidateQueries({ queryKey: ['myResaleUnsettledAmount'] });
         setSaleCancelDialogType('success');
      },
      onError: () => {
         setSaleCancelDialogType('error');
      },
   });

   return (
      <>
         {!isPurchase && (
            <ActionStatusDialog
               open={saleCancelDialogType !== null}
               title="판매 취소"
               message={
                  saleCancelDialogType === 'success'
                     ? '판매가 취소되었습니다.'
                     : '판매 취소에 실패했습니다. 잠시 후 다시 시도해주세요.'
               }
               onClose={() => setSaleCancelDialogType(null)}
               onRetry={
                  saleCancelDialogType === 'error'
                     ? () => {
                          setSaleCancelDialogType(null);
                          cancelSale();
                       }
                     : undefined
               }
            />
         )}
         {isPurchase && resellOpen && purchaseItem && (
            purchaseItem.ticketIds && purchaseItem.ticketIds.length > 0 ? (
               <ResellRegisterDialog
                  open={resellOpen}
                  onClose={() => setResellOpen(false)}
                  onCompleteConfirm={props.onResellCompleteConfirm}
                  item={purchaseItem}
               />
            ) : (
               <ActionStatusDialog
                  open={resellOpen}
                  title="판매 등록"
                  message="판매 가능한 티켓이 없습니다."
                  onClose={() => setResellOpen(false)}
               />
            )
         )}
         {isPurchase && noAccountOpen && (
            <NoAccountDialog open={noAccountOpen} onClose={() => setNoAccountOpen(false)} />
         )}
         {isPurchase && cancelOpen && purchaseItem && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={() => setCancelOpen(false)}
               orderId={purchaseItem.rawOrderId ?? purchaseItem.id}
               game={{ teams: item.game.teams, datetime: item.game.datetime }}
               seats={item.game.seats.map((seat, index) => ({
                  orderId: item.orderId,
                  section: item.game.section,
                  seatDetail: seat,
                  price: purchaseItem.seatPrices?.[index] ?? Math.round(purchaseItem.price / Math.max(item.game.seats.length, 1)),
                  ticketId: purchaseItem.ticketIds?.[index],
               }))}
            />
         )}
         {isPurchase && qrOpen && (
            <QrViewDialog
               open={qrOpen}
               onClose={() => setQrOpen(false)}
               seats={item.game.seats.map((seat, index) => ({
                  ticketId: purchaseItem?.ticketIds?.[index],
                  section: item.game.section,
                  seatDetail: seat,
               }))}
            />
         )}

         <div
            className="bg-background border border-border rounded-[14px] flex flex-col gap-2.5 px-px py-3.25 cursor-pointer hover:border-primary/40 transition-colors"
            onClick={navigateToDetail}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
               if (e.key === 'Enter' || e.key === ' ') navigateToDetail();
            }}
            aria-label={`${item.game.teams} ${detailLabel}`}
         >
            <div className="flex items-center justify-between px-4 py-1 lg:grid lg:grid-cols-[11.5rem_minmax(0,1fr)] lg:items-center lg:gap-4">
               <div className="flex items-center gap-1 text-body-2-regular shrink-0">
                  <span className="text-foreground">{dateLabel}:</span>
                  <span className="text-body-2-semibold text-foreground">{item.orderDate}</span>
               </div>
               <Button
                  variant="none"
                  size="xs"
                  className="flex items-center text-body-2-regular text-foreground shrink-0 px-0 hover:text-primary transition-colors gap-0 lg:justify-self-start"
                  onClick={e => {
                     e.stopPropagation();
                     navigateToDetail();
                  }}
               >
                  {detailLabel} <ChevronRight size={16} />
               </Button>
            </div>

            <Separator />

            <div className="hidden lg:flex flex-row gap-4 p-4 items-stretch min-h-26.75">
               <div className="flex w-44 flex-col items-center justify-start shrink-0 px-1 gap-1.5">
                  <div className="flex flex-col items-start gap-1.5 w-full h-full">
                     <div className="flex flex-col items-start w-full h-full">
                        <TicketTypeBadge type={item.type} />
                     </div>
                     <p className="w-full text-foreground text-body-2-medium whitespace-nowrap">{item.orderId}</p>
                     <p className="flex w-full items-center justify-center text-(--text-tertiary) text-caption-1-regular text-center whitespace-nowrap mt-auto h-full">
                        {item.deliveryType}
                     </p>
                  </div>
               </div>

               <div className="flex flex-1 flex-col gap-2 min-w-0 px-1 justify-center min-h-24">
                  <p className="text-foreground text-body-1-bold whitespace-nowrap">{item.game.teams}</p>
                  <div className="flex items-center gap-2 h-4">
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">
                        {item.game.venue}
                     </span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">
                        {item.game.datetime}
                     </span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">
                        {item.game.quantity}매
                     </span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <button
                        className="flex items-center gap-1 text-left"
                        onClick={e => {
                           e.stopPropagation();
                           setExpanded(v => !v);
                        }}
                        aria-expanded={expanded}
                     >
                        <span className="text-foreground text-body-2-medium whitespace-nowrap">
                           {item.game.section}({item.game.seats.length})
                        </span>
                        <ChevronDown
                           size={16}
                           className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                        />
                     </button>
                     {expanded && (
                        <div className="flex flex-wrap gap-1.5">
                           {item.game.seats.map((seat, i) => (
                              <span
                                 key={i}
                                 className="border border-border rounded-[5px] px-1 py-0.5 text-muted-foreground text-caption-1-regular whitespace-nowrap"
                              >
                                 {seat}
                              </span>
                           ))}
                        </div>
                     )}
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
                     showDash ? (
                        <span className="text-body-1-regular text-muted-foreground">-</span>
                     ) : (
                        <>
                           {showSellBtn ? (
                              <Button
                                 variant="secondary"
                                 size="sm"
                                 className="w-full"
                                 onClick={e => {
                                    e.stopPropagation();
                                    setResellOpen(true);
                                 }}
                              >
                                 판매 등록
                              </Button>
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                           {showCancelBtn ? (
                              <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="w-full"
                                 onClick={e => {
                                    e.stopPropagation();
                                    setCancelOpen(true);
                                 }}
                              >
                                 예매 취소
                              </Button>
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                           {showQrBtn ? (
                              <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="w-full"
                                 onClick={e => {
                                    e.stopPropagation();
                                    setQrOpen(true);
                                 }}
                              >
                                 QR 확인
                              </Button>
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                        </>
                     )
                  ) : showSaleDash ? (
                     <span className="text-body-1-regular text-muted-foreground">-</span>
                  ) : (
                     <Button
                        variant="tertiary"
                        size="sm"
                        className="w-full"
                        disabled={isCancelingSale}
                        onClick={e => {
                           e.stopPropagation();
                           cancelSale();
                        }}
                     >
                        {isCancelingSale ? '처리 중...' : '판매 취소'}
                     </Button>
                  )}
               </div>
            </div>

            <div className="flex flex-col gap-4 px-4 pt-1 pb-3 lg:hidden">
               <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                     <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <TicketTypeBadge type={item.type} />
                        <span className="min-w-0 whitespace-nowrap text-[14px] font-medium leading-5.25 text-[#161d24]">
                           {item.orderId}
                        </span>
                     </div>
                     <span className="text-[16px] font-semibold leading-6 text-[#161d24] whitespace-nowrap">
                        {status}
                     </span>
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
                        <button
                           className="flex items-center gap-1 text-left"
                           onClick={e => {
                              e.stopPropagation();
                              setExpanded(v => !v);
                           }}
                           aria-expanded={expanded}
                        >
                           <span className="text-[14px] font-medium leading-5.25 text-[#161d24]">
                              {item.game.section}({item.game.seats.length})
                           </span>
                           <ChevronDown
                              size={16}
                              className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                           />
                        </button>
                     </div>
                     {expanded && (
                        <div className="flex flex-wrap gap-1.5 pl-13">
                           {item.game.seats.map((seat, i) => (
                              <span
                                 key={i}
                                 className="border border-border rounded-[5px] px-1 py-0.5 text-muted-foreground text-caption-1-regular whitespace-nowrap"
                              >
                                 {seat}
                              </span>
                           ))}
                        </div>
                     )}
                     <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">
                           수령방법
                        </span>
                        <span className="text-[14px] font-normal leading-5.25 text-[#374553]">{item.deliveryType}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">
                           {priceLabel}
                        </span>
                        <span className="text-[14px] font-normal leading-5.25 text-[#374553]">
                           {price.toLocaleString()}원
                        </span>
                     </div>
                  </div>
               </div>

               {isPurchase
                  ? !showDash && (
                       <div className="flex gap-2">
                          {showSellBtn && (
                             <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1"
                                onClick={e => {
                                   e.stopPropagation();
                                   setResellOpen(true);
                                }}
                             >
                                판매 등록
                             </Button>
                          )}
                          {showCancelBtn && (
                             <Button
                                variant="tertiary"
                                size="sm"
                                className="flex-1"
                                onClick={e => {
                                   e.stopPropagation();
                                   setCancelOpen(true);
                                }}
                             >
                                예매 취소
                             </Button>
                          )}
                          {showQrBtn && (
                             <Button
                                variant="tertiary"
                                size="sm"
                                className="flex-1"
                                onClick={e => {
                                   e.stopPropagation();
                                   setQrOpen(true);
                                }}
                             >
                                QR 확인
                             </Button>
                          )}
                       </div>
                    )
                  : canCancelSale && (
                       <div className="flex gap-2">
                          <Button
                             variant="tertiary"
                             size="sm"
                             className="flex-1"
                             disabled={isCancelingSale}
                             onClick={e => {
                                e.stopPropagation();
                                cancelSale();
                             }}
                          >
                             {isCancelingSale ? '처리 중...' : '판매 취소'}
                          </Button>
                       </div>
                    )}
            </div>
         </div>
      </>
   );
}
