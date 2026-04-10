import { useNavigate, useLocation } from 'react-router-dom';
import {
   useMyProfileSummaryData,
   useMyOrdersData,
   useMyResaleListData,
   useMyTicketInfoData,
} from '../model/useMypageData';
import { MypageProfileCard } from './MypageProfileCard';
import { MypageSummaryCard } from './MypageSummaryCard';
import { MypageHistorySection } from './MypageHistorySection';
import { Button } from '@/shared/ui/button';

export default function MypagePage() {
   const navigate = useNavigate();
   const location = useLocation();
   const initialActiveTab = (location.state as { activeTab?: 'purchase' | 'sale' } | null)?.activeTab || 'purchase';

   const profileQuery = useMyProfileSummaryData();
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
                  />
               </div>
            </div>
         </div>
      </>
   );
}
