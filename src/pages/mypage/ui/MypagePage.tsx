import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
   useMyProfileData,
   useMyOrdersData,
   useMyResaleListData,
   useMyTicketInfoData,
} from '../model/useMypageData';
import { isMswEnabled } from '@/shared/config/runtime';
import { MypageProfileCard } from './MypageProfileCard';
import { MypageSummaryCard } from './MypageSummaryCard';
import { MypageHistorySection } from './MypageHistorySection';
import { Button } from '@/shared/ui/button';

const MYPAGE_MSW_TICKET_INFO_ERROR_KEY = '__mypage_msw_ticket_info_error__';

export default function MypagePage() {
   const navigate = useNavigate();
   const location = useLocation();
   const initialActiveTab = (location.state as { activeTab?: 'purchase' | 'sale' } | null)?.activeTab || 'purchase';

   const profileQuery = useMyProfileData();
   const ordersQuery = useMyOrdersData();
   const resaleListQuery = useMyResaleListData();
   const ticketInfoQuery = useMyTicketInfoData();

   const profile = profileQuery.data;
   const rawPurchaseItems = ordersQuery.data ?? [];
   const saleItems = resaleListQuery.data ?? [];
   const listedTicketIdSet = new Set(
      saleItems
         .filter((item) => item.saleStatus !== '취소 완료')
         .map((item) => item.ticketId)
         .filter((ticketId): ticketId is string => Boolean(ticketId)),
   );
   const purchaseItems = rawPurchaseItems
      .map((item) => {
         if (!item.ticketIds?.length) {
            return item;
         }

         const remainingEntries = item.ticketIds
            .map((ticketId, index) => ({
               ticketId,
               seat: item.game.seats[index],
            }))
            .filter((entry) => !listedTicketIdSet.has(entry.ticketId));

         if (remainingEntries.length === 0) {
            return null;
         }

         const originalQuantity = Math.max(item.game.quantity, 1);
         const unitPrice = Math.round(item.price / originalQuantity);

         return {
            ...item,
            game: {
               ...item.game,
               quantity: remainingEntries.length,
               seats: remainingEntries.map((entry) => entry.seat).filter(Boolean),
            },
            price: unitPrice * remainingEntries.length,
            ticketIds: remainingEntries.map((entry) => entry.ticketId),
            seatPrices: item.seatPrices?.filter((_, index) => !listedTicketIdSet.has(item.ticketIds?.[index] ?? '')),
            canSell: item.canSell && remainingEntries.length > 0,
         };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
   const [mockTicketInfoError, setMockTicketInfoError] = useState(false);

   useEffect(() => {
      if (!isMswEnabled || typeof window === 'undefined') return;
      setMockTicketInfoError(window.localStorage.getItem(MYPAGE_MSW_TICKET_INFO_ERROR_KEY) === 'true');
   }, []);

   const isPageLoading = profileQuery.isLoading || ordersQuery.isLoading || resaleListQuery.isLoading;
   const historyHasError = ordersQuery.isError || resaleListQuery.isError;
   const totalHeld = ticketInfoQuery.data?.ownedTicketCount ?? 0;
   const onSale = ticketInfoQuery.data?.listingCount ?? 0;
   const soldCount = ticketInfoQuery.data?.soldCount ?? 0;
   const unsettledAmount = ticketInfoQuery.data?.unsettledAmount ?? 0;
   const isSummaryLoading = ticketInfoQuery.isLoading;

   if (isPageLoading) {
      return <div className="py-24 text-center text-body-1-regular text-muted-foreground">마이페이지 정보를 불러오는 중입니다.</div>;
   }

   return (
      <>
         <div className="flex-1 bg-background px-4">
            <div className="mx-auto max-w-300 pt-7.5 lg:pt-12.5 pb-30">
               <h1 className="mb-8 text-title-1-bold text-foreground">MY고티</h1>

               {isMswEnabled && (
                  <div className="mb-4 rounded-[14px] border border-border bg-surface p-4">
                     <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-1">
                           <p className="text-body-1-bold text-foreground">MSW 테스트</p>
                           <p className="text-caption-1-regular text-muted-foreground">
                              켜두면 구매 내역의 QR 확인, 예매 취소에서 티켓 정보 조회를 실패시켜 팝업 예외 상태를 확인할 수 있습니다.
                           </p>
                        </div>
                        <label className="flex items-center gap-2 text-body-2-medium text-foreground">
                           <input
                              type="checkbox"
                              checked={mockTicketInfoError}
                              onChange={(e) => {
                                 const nextValue = e.target.checked;
                                 setMockTicketInfoError(nextValue);
                                 window.localStorage.setItem(MYPAGE_MSW_TICKET_INFO_ERROR_KEY, String(nextValue));
                              }}
                              className="size-4 rounded border border-border-strong"
                           />
                           티켓 정보 조회 실패
                        </label>
                     </div>
                  </div>
               )}

               <div className="flex flex-col gap-4">
                  <MypageProfileCard profile={profile} onEditAccount={() => navigate('/mypage/account')} />
                  <MypageSummaryCard
                     totalHeld={totalHeld}
                     onSale={onSale}
                     soldCount={soldCount}
                     unsettledAmount={unsettledAmount}
                     isLoading={isSummaryLoading}
                     isError={ticketInfoQuery.isError}
                     onRetry={() => {
                        void ticketInfoQuery.refetch();
                     }}
                  />
                  {historyHasError && (
                     <div className="rounded-[14px] border border-border bg-surface px-4 py-5">
                        <p className="text-body-2-regular text-muted-foreground">
                           구매 또는 판매 내역 조회에 실패했습니다. API 응답을 확인해 주세요.
                        </p>
                        <div className="mt-3 flex gap-2">
                           <Button
                              variant="tertiary"
                              onClick={() => {
                                 void ordersQuery.refetch();
                                 void resaleListQuery.refetch();
                              }}
                           >
                              다시 시도
                           </Button>
                        </div>
                     </div>
                  )}
                  <MypageHistorySection
                     purchaseItems={purchaseItems}
                     saleItems={saleItems}
                     initialActiveTab={initialActiveTab}
                     mockTicketInfoError={mockTicketInfoError}
                  />
               </div>
            </div>
         </div>
      </>
   );
}
