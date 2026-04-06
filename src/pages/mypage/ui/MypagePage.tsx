import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
   useMyProfileData,
   useMyOrdersData,
   useMyResaleListData,
   useMyResaleSummaryData,
   useMyResaleUnsettledAmountData,
} from '../model/useMypageData';
import { PURCHASE_ITEMS, SALE_ITEMS } from '../model/mockData';
import { isMswEnabled } from '@/shared/config/runtime';
import { MY_PROFILE_MOCK } from '@/entities/user/api/memberApi';
import { MypageProfileCard } from './MypageProfileCard';
import { MypageSummaryCard } from './MypageSummaryCard';
import { MypageHistorySection } from './MypageHistorySection';

const MYPAGE_MSW_TICKET_INFO_ERROR_KEY = '__mypage_msw_ticket_info_error__';

export default function MypagePage() {
   const navigate = useNavigate();
   const location = useLocation();
   const initialActiveTab = (location.state as { activeTab?: 'purchase' | 'sale' } | null)?.activeTab || 'purchase';

   const profileQuery = useMyProfileData();
   const ordersQuery = useMyOrdersData();
   const resaleListQuery = useMyResaleListData();
   const resaleSummaryQuery = useMyResaleSummaryData();
   const unsettledAmountQuery = useMyResaleUnsettledAmountData();

   const profile = profileQuery.data ?? MY_PROFILE_MOCK;
   const purchaseItems = ordersQuery.isError ? PURCHASE_ITEMS : (ordersQuery.data ?? []);
   const saleItems = resaleListQuery.isError ? SALE_ITEMS : (resaleListQuery.data ?? []);
   const [mockTicketInfoError, setMockTicketInfoError] = useState(false);

   useEffect(() => {
      if (!isMswEnabled || typeof window === 'undefined') return;
      setMockTicketInfoError(window.localStorage.getItem(MYPAGE_MSW_TICKET_INFO_ERROR_KEY) === 'true');
   }, []);

   const isPageLoading = profileQuery.isLoading || ordersQuery.isLoading || resaleListQuery.isLoading;
   const fallbackOnSale = saleItems.filter((item) => item.saleStatus === '판매 중').length;
   const fallbackSoldCount = saleItems.filter((item) => item.saleStatus === '판매 완료').length;
   const fallbackUnsettledAmount = saleItems
      .filter((item) => item.saleStatus === '정산 대기')
      .reduce((total, item) => total + item.salePrice, 0);
   const totalHeld = purchaseItems.filter((item) => item.paymentStatus === '예매 완료').length;
   const onSale = resaleSummaryQuery.isError ? fallbackOnSale : (resaleSummaryQuery.data?.listingCount ?? 0);
   const soldCount = resaleSummaryQuery.isError ? fallbackSoldCount : (resaleSummaryQuery.data?.soldCount ?? 0);
   const unsettledAmount = unsettledAmountQuery.isError
      ? fallbackUnsettledAmount
      : (unsettledAmountQuery.data?.unsettledAmount ?? 0);
   const isSummaryLoading =
      (!resaleSummaryQuery.isError && resaleSummaryQuery.isLoading) ||
      (!unsettledAmountQuery.isError && unsettledAmountQuery.isLoading);

   if (isPageLoading) {
      return <div className="py-24 text-center text-body-1-regular text-muted-foreground">마이페이지 정보를 불러오는 중입니다.</div>;
   }

   return (
      <>
         <div className="flex-1 bg-background px-4">
            <div className="mx-auto max-w-300 pt-7.5 lg:pt-12.5 pb-30">
               <h1 className="text-[30px] font-bold text-foreground mb-8">MY고티</h1>

               {isMswEnabled && (
                  <div className="mb-4 rounded-[14px] border border-[#d0d6db] bg-[#f7f8f9] p-4">
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
                              className="size-4 rounded border border-[#acb4bb]"
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
                     isError={false}
                     onRetry={() => {
                        void resaleSummaryQuery.refetch();
                        void unsettledAmountQuery.refetch();
                     }}
                  />
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
