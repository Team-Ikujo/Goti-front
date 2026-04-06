// src/pages/mypage/ui/HistoryCard.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryCardDialogs } from './HistoryCardDialogs';
import { DesktopHistoryCardLayout, HistoryCardShell, MobileHistoryCardLayout } from './HistoryCardLayouts';
import {
   isPurchaseHistoryItem,
   type HistoryCardProps,
   type SaleHistoryItem,
} from '../model/historyCard';

export default function HistoryCard(props: HistoryCardProps) {
   const navigate = useNavigate();
   const [expanded, setExpanded] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [noAccountOpen, setNoAccountOpen] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);

   const { mode, item } = props;
   const mockTicketInfoError = props.mockTicketInfoError ?? false;
   const isPurchase = isPurchaseHistoryItem(mode, item);
   const purchaseItem = isPurchase ? item : null;
   const purchaseOrderId = purchaseItem?.rawOrderId;

   const detailRoute = isPurchase ? `/mypage/purchase/${purchaseOrderId ?? item.id}` : `/mypage/sale/${item.id}`;

   const isBooked = purchaseItem?.paymentStatus === '예매 완료' || purchaseItem?.paymentStatus === '부분 처리';
   const showSellBtn = Boolean(purchaseOrderId) && (isBooked || (purchaseItem?.canSell ?? false));
   const showCancelBtn = Boolean(purchaseOrderId) && (isBooked || purchaseItem?.paymentStatus === '입금 대기');
   const showQrBtn = Boolean(purchaseOrderId) && isBooked && item.deliveryType === '모바일 티켓';
   const showDash =
      isPurchase && (purchaseItem?.paymentStatus === '취소/환불' || purchaseItem?.paymentStatus === '관람 완료');
   const canCancelSale = !isPurchase && (item as SaleHistoryItem).canCancel;
   const showSaleDash = !isPurchase && !canCancelSale;

   return (
      <>
         <HistoryCardDialogs
            purchaseItem={purchaseItem}
            resellOpen={resellOpen}
            cancelOpen={cancelOpen}
            noAccountOpen={noAccountOpen}
            qrOpen={qrOpen}
            mockTicketInfoError={mockTicketInfoError}
            onResellCompleteConfirm={props.onResellCompleteConfirm}
            onCloseResell={() => setResellOpen(false)}
            onCloseCancel={() => setCancelOpen(false)}
            onCloseNoAccount={() => setNoAccountOpen(false)}
            onCloseQr={() => setQrOpen(false)}
         />

         <HistoryCardShell item={item} isPurchase={isPurchase} onNavigateDetail={() => navigate(detailRoute)}>
            <DesktopHistoryCardLayout
               item={item}
               expanded={expanded}
               isPurchase={isPurchase}
               showDash={showDash}
               showSaleDash={showSaleDash}
               showSellBtn={showSellBtn}
               showCancelBtn={showCancelBtn}
               showQrBtn={showQrBtn}
               canCancelSale={canCancelSale}
               onToggleExpanded={() => setExpanded(value => !value)}
               onNavigateDetail={() => navigate(detailRoute)}
               onOpenResell={() => setResellOpen(true)}
               onOpenCancel={() => setCancelOpen(true)}
               onOpenQr={() => setQrOpen(true)}
            />
            <MobileHistoryCardLayout
               item={item}
               expanded={expanded}
               isPurchase={isPurchase}
               showDash={showDash}
               showSaleDash={showSaleDash}
               showSellBtn={showSellBtn}
               showCancelBtn={showCancelBtn}
               showQrBtn={showQrBtn}
               canCancelSale={canCancelSale}
               onToggleExpanded={() => setExpanded(value => !value)}
               onNavigateDetail={() => navigate(detailRoute)}
               onOpenResell={() => setResellOpen(true)}
               onOpenCancel={() => setCancelOpen(true)}
               onOpenQr={() => setQrOpen(true)}
            />
         </HistoryCardShell>
      </>
   );
}
